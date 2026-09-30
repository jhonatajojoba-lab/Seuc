import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where
} from 'firebase/firestore';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

app.use(express.json());

// Initialize Firebase Firestore Database
let db = null;
let firebaseConfig = null;

try {
  const configFile = path.join(__dirname, 'firebase-applet-config.json');
  if (fs.existsSync(configFile)) {
    const raw = fs.readFileSync(configFile, 'utf8');
    firebaseConfig = JSON.parse(raw);
    const firebaseApp = initializeApp(firebaseConfig);
    db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId || '(default)');
    console.log(`[SIRC] Firebase Firestore conectado com sucesso (Projeto: ${firebaseConfig.projectId})`);
  }
} catch (err) {
  console.error('[SIRC] Erro ao conectar ao Firebase Firestore:', err);
}

// Serve static assets with no-cache headers to guarantee instant updates
app.use(express.static(__dirname, {
  etag: false,
  lastModified: false,
  setHeaders: (res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
}));

// Configuration endpoint for Google Maps API
app.get('/api/maps-config', (req, res) => {
  res.json({
    apiKey: process.env.MAPS_API_KEY || process.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyAJtYOZygVaQnLy3A29MBFGVKzTCRZQnTE'
  });
});

// Endpoint to provide Firebase client config
app.get('/api/firebase-config', (req, res) => {
  if (firebaseConfig) {
    return res.json(firebaseConfig);
  }
  res.status(404).json({ error: 'Configuração Firebase não encontrada' });
});

// ============================================================
// FIREBASE FIRESTORE TRACKING ENDPOINTS (Com Cache Resiliente em Memória)
// ============================================================

// Cache em memória para garantir 100% de disponibilidade mesmo durante deploy ou latência do Firebase
const memorySessions = new Map();

// Helper para salvar e mesclar sessões
function saveToMemory(session) {
  memorySessions.set(session.token, { ...session });
}

// Listar todas as pessoas a serem localizadas / rastreadas
app.get('/api/rastreio/sessoes', async (req, res) => {
  try {
    let firestoreList = [];
    if (db) {
      try {
        const snap = await getDocs(collection(db, 'tracking_sessions'));
        firestoreList = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        // Sincronizar para o cache em memória
        firestoreList.forEach((s) => {
          if (s.token) saveToMemory(s);
        });
      } catch (fbErr) {
        console.warn('[SIRC] Aviso ao ler do Firestore, servindo do cache local:', fbErr.message);
      }
    }

    // Mesclar com sessões do cache em memória que ainda não estejam na lista
    const mergedMap = new Map();
    firestoreList.forEach((item) => mergedMap.set(item.token || item.id, item));
    memorySessions.forEach((item, token) => {
      if (!mergedMap.has(token)) {
        mergedMap.set(token, item);
      } else {
        // Se a versão em memória for mais recente, priorizar
        const existing = mergedMap.get(token);
        if (new Date(item.ultimaAtualizacao || item.criadoEm || 0) > new Date(existing.ultimaAtualizacao || existing.criadoEm || 0)) {
          mergedMap.set(token, { ...existing, ...item });
        }
      }
    });

    const list = Array.from(mergedMap.values());
    list.sort((a, b) => new Date(b.criadoEm || 0) - new Date(a.criadoEm || 0));
    res.json(list);
  } catch (err) {
    console.error('[SIRC] Erro ao buscar sessões:', err);
    res.json(Array.from(memorySessions.values()));
  }
});

// Buscar status de um token específico (aberto pela pessoa no link)
app.get('/api/rastreio/status/:token', async (req, res) => {
  const token = req.params.token;
  try {
    // 1. Verificar se está no cache em memória
    if (memorySessions.has(token)) {
      const cached = memorySessions.get(token);
      return res.json({ id: cached.id || cached.token, ...cached });
    }

    // 2. Se não estiver em memória, buscar no Firestore
    if (db) {
      const q = query(collection(db, 'tracking_sessions'), where('token', '==', token));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const d = snap.docs[0];
        const data = { id: d.id, ...d.data() };
        saveToMemory(data);
        return res.json(data);
      }
    }

    return res.status(404).json({ error: 'Sessão de rastreamento não encontrada ou expirada.' });
  } catch (err) {
    console.error('[SIRC] Erro ao buscar status do token:', err);
    if (memorySessions.has(token)) {
      return res.json(memorySessions.get(token));
    }
    res.status(500).json({ error: 'Erro no servidor ao buscar status' });
  }
});

// Criar nova pessoa a ser localizada e salvar no Firebase Firestore
app.post('/api/rastreio/gerar', async (req, res) => {
  const { nome, tipo, telefone, motivo, registroRef } = req.body || {};
  if (!nome || !nome.trim()) {
    return res.status(400).json({ error: 'Nome do indivíduo a ser localizado é obrigatório.' });
  }

  const token = 'loc-' + Math.random().toString(36).substring(2, 10) + '-' + Date.now().toString(36);
  const sessionData = {
    token,
    nome: nome.trim(),
    tipo: tipo || 'Pessoa a Localizar / Intimação',
    motivo: motivo ? motivo.trim() : 'Localização Operacional da Polícia Civil',
    telefone: telefone ? telefone.trim() : '',
    registroRef: registroRef || 'SIRC-' + Math.floor(1000 + Math.random() * 9000),
    ativo: true,
    localizado: false,
    lat: null,
    lng: null,
    precisao: null,
    bairro: '',
    enderecoAproximado: 'Aguardando autorização de localização no dispositivo do cidadão...',
    criadoEm: new Date().toISOString(),
    ultimaAtualizacao: null,
    historico: []
  };

  // Salvar imediatamente no cache resiliente
  saveToMemory({ id: token, ...sessionData });

  let firestoreId = token;

  // Gravar no Firestore
  if (db) {
    try {
      const docRef = await addDoc(collection(db, 'tracking_sessions'), sessionData);
      firestoreId = docRef.id;
      sessionData.id = firestoreId;
      saveToMemory(sessionData);
      console.log(`[SIRC] Sessão criada com sucesso no Firestore (ID: ${firestoreId}, Token: ${token})`);
    } catch (fbErr) {
      console.warn('[SIRC] Aviso: Não foi possível gravar no Firestore de imediato, mantido no cache seguro:', fbErr.message);
    }
  }

  const sessionWithId = { id: firestoreId, ...sessionData };
  res.json({
    success: true,
    message: 'Link de rastreamento gerado com sucesso.',
    session: sessionWithId,
    token
  });
});

// Atualizar localização no Firebase Firestore quando a pessoa clica em "Quero ser localizado"
app.post('/api/rastreio/atualizar', async (req, res) => {
  const { token, lat, lng, precisao, enderecoAproximado, bairro } = req.body || {};
  if (!token || lat == null || lng == null) {
    return res.status(400).json({ error: 'Dados insuficientes de localização (token, lat e lng são obrigatórios).' });
  }

  try {
    const parsedLat = parseFloat(lat);
    const parsedLng = parseFloat(lng);
    const parsedPrecisao = parseFloat(precisao) || 10;
    const nowIso = new Date().toISOString();

    // Obter dados atuais do cache ou Firestore
    let current = memorySessions.get(token) || {};
    const hist = current.historico || [];
    hist.push({
      lat: parsedLat,
      lng: parsedLng,
      precisao: parsedPrecisao,
      timestamp: nowIso
    });
    if (hist.length > 50) hist.shift();

    const updateData = {
      localizado: true,
      lat: parsedLat,
      lng: parsedLng,
      precisao: parsedPrecisao,
      bairro: bairro || current.bairro || 'Caxias - MA',
      enderecoAproximado: enderecoAproximado || `GPS (${parsedLat.toFixed(5)}, ${parsedLng.toFixed(5)})`,
      ultimaAtualizacao: nowIso,
      historico: hist
    };

    // Atualizar no cache em memória
    const updatedSession = { ...current, ...updateData };
    saveToMemory(updatedSession);

    // Atualizar no Firestore
    if (db) {
      try {
        const q = query(collection(db, 'tracking_sessions'), where('token', '==', token));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const docSnap = snap.docs[0];
          const targetRef = doc(db, 'tracking_sessions', docSnap.id);
          await updateDoc(targetRef, updateData);
        } else {
          // Criar se não existia no Firestore
          const newDoc = await addDoc(collection(db, 'tracking_sessions'), updatedSession);
          updatedSession.id = newDoc.id;
          saveToMemory(updatedSession);
        }
      } catch (fbErr) {
        console.warn('[SIRC] Aviso ao atualizar Firestore, mantido em memória:', fbErr.message);
      }
    }

    res.json({
      success: true,
      message: 'Localização atualizada e gravada com sucesso.',
      session: updatedSession
    });
  } catch (err) {
    console.error('[SIRC] Erro ao atualizar localização:', err);
    res.status(500).json({ error: 'Erro ao processar localização' });
  }
});

// Emitir Alerta ou SOS do cidadão diretamente para o terminal da Polícia Civil
app.post('/api/rastreio/alerta', async (req, res) => {
  const { token, tipoAlerta, mensagem, lat, lng } = req.body || {};
  if (!token) {
    return res.status(400).json({ error: 'Token é obrigatório para registrar alerta.' });
  }

  try {
    const nowIso = new Date().toISOString();
    let current = memorySessions.get(token) || {};

    const updateData = {
      alertaAtivo: true,
      tipoAlerta: tipoAlerta || 'SOS Emergência',
      mensagemAlerta: mensagem ? mensagem.trim() : 'Alerta de socorro emitido pelo cidadão.',
      dataAlerta: nowIso,
      tipo: 'Alerta de Urgência / Mandado',
      ultimaAtualizacao: nowIso
    };

    if (lat != null && lng != null) {
      updateData.lat = parseFloat(lat);
      updateData.lng = parseFloat(lng);
      updateData.localizado = true;
    }

    const updatedSession = { ...current, ...updateData };
    saveToMemory(updatedSession);

    if (db) {
      try {
        const q = query(collection(db, 'tracking_sessions'), where('token', '==', token));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const docSnap = snap.docs[0];
          const targetRef = doc(db, 'tracking_sessions', docSnap.id);
          await updateDoc(targetRef, updateData);
        }
      } catch (fbErr) {
        console.warn('[SIRC] Aviso ao atualizar alerta no Firestore, mantido em memória:', fbErr.message);
      }
    }

    res.json({
      success: true,
      message: 'Alerta de emergência notificado ao mapa da Delegacia.',
      session: updatedSession
    });
  } catch (err) {
    console.error('[SIRC] Erro ao registrar alerta:', err);
    res.status(500).json({ error: 'Erro ao processar alerta' });
  }
});

// Encerrar / Excluir rastreamento no Firebase Firestore e no cache
app.delete('/api/rastreio/encerrar/:id', async (req, res) => {
  const id = req.params.id;
  try {
    // Remover do cache em memória
    for (const [token, sess] of memorySessions.entries()) {
      if (sess.id === id || token === id) {
        memorySessions.delete(token);
      }
    }

    if (db) {
      try {
        const targetRef = doc(db, 'tracking_sessions', id);
        await deleteDoc(targetRef);
      } catch (fbErr) {
        console.warn('[SIRC] Aviso ao excluir do Firestore:', fbErr.message);
      }
    }
    res.json({ success: true, message: 'Rastreamento excluído com sucesso.' });
  } catch (err) {
    console.error('[SIRC] Erro ao excluir sessão:', err);
    res.status(500).json({ error: 'Erro ao excluir sessão' });
  }
});

// Limpar todos os registros do banco de dados Firebase e cache
app.post('/api/rastreio/limpar-tudo', async (req, res) => {
  try {
    memorySessions.clear();
    if (db) {
      try {
        const snap = await getDocs(collection(db, 'tracking_sessions'));
        const deletePromises = snap.docs.map((d) => deleteDoc(doc(db, 'tracking_sessions', d.id)));
        await Promise.all(deletePromises);
      } catch (fbErr) {
        console.warn('[SIRC] Aviso ao limpar Firestore:', fbErr.message);
      }
    }
    res.json({ success: true, message: 'Todas as localizações foram apagadas com sucesso.' });
  } catch (err) {
    console.error('[SIRC] Erro ao limpar sessões:', err);
    res.status(500).json({ error: 'Erro ao limpar dados' });
  }
});

// Route handlers for clean paths
app.get('/localizar', (req, res) => res.sendFile(path.join(__dirname, 'localizar.html')));
app.get('/rastreio', (req, res) => res.sendFile(path.join(__dirname, 'localizar.html')));
app.get('/dashboard', (req, res) => res.sendFile(path.join(__dirname, 'dashboard.html')));
app.get('/mapa', (req, res) => res.sendFile(path.join(__dirname, 'mapa.html')));
app.get('/registros', (req, res) => res.sendFile(path.join(__dirname, 'registros.html')));
app.get('/auditoria', (req, res) => res.sendFile(path.join(__dirname, 'auditoria.html')));
app.get('/usuarios', (req, res) => res.sendFile(path.join(__dirname, 'usuarios.html')));
app.get('/chats', (req, res) => res.sendFile(path.join(__dirname, 'chats.html')));

// Default fallback to index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, HOST, () => {
  console.log(`[SIRC] Servidor ativo em http://${HOST}:${PORT}`);
});
