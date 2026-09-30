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
// FIREBASE FIRESTORE TRACKING ENDPOINTS (Banco de Dados em Tempo Real)
// ============================================================

// Listar todas as pessoas a serem localizadas / rastreadas
app.get('/api/rastreio/sessoes', async (req, res) => {
  try {
    if (!db) {
      return res.json([]);
    }
    const snap = await getDocs(collection(db, 'tracking_sessions'));
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    // Ordenar pelo mais recente
    list.sort((a, b) => new Date(b.criadoEm || 0) - new Date(a.criadoEm || 0));
    res.json(list);
  } catch (err) {
    console.error('[SIRC] Erro ao buscar sessões no Firestore:', err);
    res.json([]);
  }
});

// Buscar status de um token específico (aberto pela pessoa no link)
app.get('/api/rastreio/status/:token', async (req, res) => {
  try {
    if (!db) {
      return res.status(500).json({ error: 'Banco de dados não disponível' });
    }
    const q = query(collection(db, 'tracking_sessions'), where('token', '==', req.params.token));
    const snap = await getDocs(q);
    if (snap.empty) {
      return res.status(404).json({ error: 'Sessão de rastreamento não encontrada ou expirada.' });
    }
    const d = snap.docs[0];
    res.json({ id: d.id, ...d.data() });
  } catch (err) {
    console.error('[SIRC] Erro ao buscar status do token:', err);
    res.status(500).json({ error: 'Erro no servidor' });
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

  try {
    if (!db) throw new Error('Firestore não está conectado');
    const docRef = await addDoc(collection(db, 'tracking_sessions'), sessionData);
    const sessionWithId = { id: docRef.id, ...sessionData };
    res.json({ success: true, session: sessionWithId, token });
  } catch (err) {
    console.error('[SIRC] Erro ao salvar sessão no Firestore:', err);
    res.status(500).json({ error: 'Erro ao salvar no banco de dados Firebase' });
  }
});

// Atualizar localização no Firebase Firestore quando a pessoa clica em "Quero ser localizado"
app.post('/api/rastreio/atualizar', async (req, res) => {
  const { token, lat, lng, precisao, enderecoAproximado, bairro } = req.body || {};
  if (!token || lat == null || lng == null) {
    return res.status(400).json({ error: 'Dados insuficientes de localização (token, lat e lng são obrigatórios).' });
  }

  try {
    if (!db) throw new Error('Firestore não está conectado');
    const q = query(collection(db, 'tracking_sessions'), where('token', '==', token));
    const snap = await getDocs(q);
    if (snap.empty) {
      return res.status(404).json({ error: 'Sessão não encontrada.' });
    }

    const docSnap = snap.docs[0];
    const targetRef = doc(db, 'tracking_sessions', docSnap.id);
    const current = docSnap.data();

    const parsedLat = parseFloat(lat);
    const parsedLng = parseFloat(lng);
    const parsedPrecisao = parseFloat(precisao) || 10;
    const nowIso = new Date().toISOString();

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

    await updateDoc(targetRef, updateData);
    res.json({
      success: true,
      message: 'Localização atualizada e gravada no Firebase Firestore com sucesso.',
      session: { id: docSnap.id, ...current, ...updateData }
    });
  } catch (err) {
    console.error('[SIRC] Erro ao atualizar localização no Firestore:', err);
    res.status(500).json({ error: 'Erro ao salvar localização no banco de dados' });
  }
});

// Emitir Alerta ou SOS do cidadão diretamente para o terminal da Polícia Civil
app.post('/api/rastreio/alerta', async (req, res) => {
  const { token, tipoAlerta, mensagem, lat, lng } = req.body || {};
  if (!token) {
    return res.status(400).json({ error: 'Token é obrigatório para registrar alerta.' });
  }

  try {
    if (!db) throw new Error('Firestore não está conectado');
    const q = query(collection(db, 'tracking_sessions'), where('token', '==', token));
    const snap = await getDocs(q);
    if (snap.empty) {
      return res.status(404).json({ error: 'Sessão de rastreamento não encontrada.' });
    }

    const docSnap = snap.docs[0];
    const targetRef = doc(db, 'tracking_sessions', docSnap.id);
    const current = docSnap.data();

    const nowIso = new Date().toISOString();
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

    await updateDoc(targetRef, updateData);
    res.json({
      success: true,
      message: 'Alerta de emergência gravado no Firebase e transmitido para o mapa da Delegacia.',
      session: { id: docSnap.id, ...current, ...updateData }
    });
  } catch (err) {
    console.error('[SIRC] Erro ao registrar alerta no Firestore:', err);
    res.status(500).json({ error: 'Erro ao registrar alerta no banco de dados' });
  }
});

// Encerrar / Excluir rastreamento no Firebase Firestore
app.delete('/api/rastreio/encerrar/:id', async (req, res) => {
  try {
    if (!db) throw new Error('Firestore não está conectado');
    const targetRef = doc(db, 'tracking_sessions', req.params.id);
    await deleteDoc(targetRef);
    res.json({ success: true, message: 'Rastreamento excluído do Firebase Firestore com sucesso.' });
  } catch (err) {
    console.error('[SIRC] Erro ao excluir do Firestore:', err);
    res.status(500).json({ error: 'Erro ao excluir do banco de dados' });
  }
});

// Limpar todos os registros do banco de dados Firebase
app.post('/api/rastreio/limpar-tudo', async (req, res) => {
  try {
    if (!db) throw new Error('Firestore não está conectado');
    const snap = await getDocs(collection(db, 'tracking_sessions'));
    const deletePromises = snap.docs.map((d) => deleteDoc(doc(db, 'tracking_sessions', d.id)));
    await Promise.all(deletePromises);
    res.json({ success: true, message: 'Todas as localizações foram apagadas do Firebase com sucesso.' });
  } catch (err) {
    console.error('[SIRC] Erro ao limpar sessões no Firestore:', err);
    res.status(500).json({ error: 'Erro ao limpar banco de dados' });
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
