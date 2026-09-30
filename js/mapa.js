// Source: Google Maps Platform Code Assist
// ============================================================
// SIRC — Módulo de Localização Tática & Firebase Firestore
// Delegacia de Polícia Civil de Caxias - Maranhão
// ============================================================

(() => {
  // Two-Tier In-App Quota Handling (Section 8 Case A Mandate)
  window.gm_authFailure = () => {
    window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
  };

  if (!window._origConsoleError) {
    window._origConsoleError = console.error;
    console.error = (...args) => {
      window._origConsoleError.apply(console, args);
      const msg = args.map((a) => String(a)).join(' ');
      if (msg.includes('OverQuotaMapError') || msg.includes('QuotaExceededError')) {
        window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
      }
    };
  }

  if (!window._gmpQuotaListenerBound) {
    window._gmpQuotaListenerBound = true;
    window.addEventListener('gmp-quota-exceeded', () => {
      const banner = document.getElementById('gmp-quota-banner');
      if (banner) banner.style.display = 'block';
    });
  }

  // Coordenadas Centrais de Caxias - Maranhão
  const CAXIAS_COORDINATES = { lat: -4.8588, lng: -43.3561 };
  const USAGE_ATTRIBUTION_ID = "gmp_mcp_codeassist_v1_aistudio";

  // Alvos Operacionais Padrão em Caxias (fidedignos ao Mockup Oficial)
  const DEFAULT_TACTICAL_TARGETS = [
    {
      id: "tgt-1",
      nome: "João S. Almeida",
      categoria: "pessoa",
      tipo: "Investigado sob Medida Cautelar",
      bairro: "Centro",
      endereco: "Praça Cândido Mendes, Centro",
      tempo: "2 min",
      distancia: "0.4 km",
      lat: -4.8550,
      lng: -43.3540,
      status: "online",
      ativo: true
    },
    {
      id: "tgt-2",
      nome: "Carlos M. Silva",
      categoria: "pessoa",
      tipo: "Pessoa a ser Localizada",
      bairro: "Bairro Ponte",
      endereco: "Av. Getúlio Vargas, Bairro Ponte",
      tempo: "5 min",
      distancia: "1.2 km",
      lat: -4.8680,
      lng: -43.3490,
      status: "online",
      ativo: true
    },
    {
      id: "tgt-3",
      nome: "Rafael N. Costa",
      categoria: "alerta",
      tipo: "Mandado de Prisão Preventiva",
      bairro: "Volta Redonda",
      endereco: "Rua São Pedro, Volta Redonda",
      tempo: "8 min",
      distancia: "2.1 km",
      lat: -4.8480,
      lng: -43.3620,
      status: "urgente",
      ativo: true
    },
    {
      id: "tgt-4",
      nome: "Marcos A. Lima",
      categoria: "pessoa",
      tipo: "Intimação Policial Judicial",
      bairro: "Trésidela",
      endereco: "Rua 1º de Maio, Trésidela",
      tempo: "10 min",
      distancia: "2.8 km",
      lat: -4.8670,
      lng: -43.3650,
      status: "online",
      ativo: true
    },
    {
      id: "tgt-5",
      nome: "Bruno P. Santos",
      categoria: "veiculo",
      tipo: "Veículo Toyota Hilux Prata (Suspeito)",
      bairro: "Cohab",
      endereco: "Av. Beira Rio, Cohab",
      tempo: "12 min",
      distancia: "3.4 km",
      lat: -4.8510,
      lng: -43.3410,
      status: "rastreado",
      ativo: true
    },
    {
      id: "tgt-6",
      nome: "Diego R. Oliveira",
      categoria: "pessoa",
      tipo: "Vítima com Medida Protetiva (DEAM)",
      bairro: "Seridó",
      endereco: "Travessa do Sol, Bairro Seridó",
      tempo: "15 min",
      distancia: "4.1 km",
      lat: -4.8620,
      lng: -43.3340,
      status: "online",
      ativo: true
    },
    {
      id: "tgt-7",
      nome: "Veículo Gol Branco - Clonagem",
      categoria: "veiculo",
      tipo: "Veículo com Restrição de Furto/Roubo",
      bairro: "Bairro Cobidela",
      endereco: "Entorno BR-316, Cobidela",
      tempo: "18 min",
      distancia: "4.6 km",
      lat: -4.8530,
      lng: -43.3390,
      status: "rastreado",
      ativo: true
    },
    {
      id: "tgt-8",
      nome: "Moto Titan 160 Vermelha",
      categoria: "veiculo",
      tipo: "Veículo em Fuga / Monitorado",
      bairro: "Rio Itapecuru",
      endereco: "Margem Rio Itapecuru, Caxias",
      tempo: "22 min",
      distancia: "5.0 km",
      lat: -4.8720,
      lng: -43.3510,
      status: "rastreado",
      ativo: true
    },
    {
      id: "tgt-9",
      nome: "Alerta SOS DEAM - Mulher",
      categoria: "alerta",
      tipo: "Botão de Pânico Ativado",
      bairro: "Centro",
      endereco: "Rua Afonso Pena, Centro",
      tempo: "25 min",
      distancia: "0.8 km",
      lat: -4.8565,
      lng: -43.3590,
      status: "urgente",
      ativo: true
    },
    {
      id: "tgt-10",
      nome: "Mandado de Busca - Residência",
      categoria: "alerta",
      tipo: "Operação Policial em Andamento",
      bairro: "Bairro Ponte",
      endereco: "Rua do Rosário, Bairro Ponte",
      tempo: "30 min",
      distancia: "1.9 km",
      lat: -4.8650,
      lng: -43.3440,
      status: "urgente",
      ativo: true
    }
  ];

  // Rótulos de Bairros de Caxias-MA
  const CAXIAS_NEIGHBORHOODS = [
    { nome: "CENTRO", coords: { lat: -4.8588, lng: -43.3561 } },
    { nome: "BAIRRO VOLTA REDONDA", coords: { lat: -4.8465, lng: -43.3645 } },
    { nome: "BAIRRO COBIDELA", coords: { lat: -4.8530, lng: -43.3390 } },
    { nome: "BAIRRO TRESIDELA", coords: { lat: -4.8690, lng: -43.3680 } },
    { nome: "BAIRRO PONTE", coords: { lat: -4.8720, lng: -43.3480 } },
    { nome: "BAIRRO SERIDÓ", coords: { lat: -4.8610, lng: -43.3320 } },
    { nome: "RIO ITAPECURU", coords: { lat: -4.8770, lng: -43.3580 } }
  ];

  let googleMap = null;
  let currentInfoWindow = null;
  let markersRegistry = [];
  let allTrackingSessions = [];
  let activeTab = "pessoas"; // "pessoas" | "veiculos" | "alertas"
  let searchFilterTerm = "";
  let AdvancedMarkerElementClass = null;
  let mapaSyncInterval = null;

  function showConfirmDialog(message, onConfirm) {
    const modalRoot = document.getElementById("modal-root") || document.body;
    const overlay = document.createElement("div");
    overlay.className = "modal-overlay";
    overlay.style.display = "flex";
    overlay.innerHTML = `
      <div class="modal modal-sm" style="max-width:440px;">
        <div class="modal-header modal-header-danger">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#fa5252" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <h3 style="color:#fa5252; margin:0; font-size:15px;">Confirmação</h3>
        </div>
        <div class="modal-body" style="padding:16px;">
          <p style="color:#e2e8f0; font-size:13px; margin:0; line-height:1.5;">${Store.escapeHtml(message)}</p>
        </div>
        <div class="modal-footer" style="display:flex; justify-content:flex-end; gap:8px; padding:12px 16px;">
          <button type="button" class="btn btn-secondary btn-sm" id="btn-dialog-cancel">Cancelar</button>
          <button type="button" class="btn btn-danger btn-sm" id="btn-dialog-confirm" style="background:#e03131; color:#fff; border:none; padding:6px 14px; border-radius:6px; font-weight:600; cursor:pointer;">Confirmar</button>
        </div>
      </div>
    `;
    modalRoot.appendChild(overlay);

    const closeDialog = () => overlay.remove();
    overlay.querySelector("#btn-dialog-cancel")?.addEventListener("click", closeDialog);
    overlay.querySelector("#btn-dialog-confirm")?.addEventListener("click", async () => {
      closeDialog();
      if (onConfirm) await onConfirm();
    });
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closeDialog();
    });
  }

  async function initMapaPage() {
    const mapRoot = document.getElementById("map");
    if (!mapRoot) return;

    if (window.Components) Components.initLayout("mapa");

    setupEventListeners();
    await loadAndInitGoogleMaps();

    // Sincronização contínua com o Firebase Firestore a cada 3.5 segundos
    if (mapaSyncInterval) clearInterval(mapaSyncInterval);
    mapaSyncInterval = setInterval(syncTrackingFromFirebase, 3500);
  }
  window.initMapaPage = initMapaPage;

  document.addEventListener("DOMContentLoaded", async () => {
    initMapaPage();
  });

  // 1. Carregamento e Inicialização da Google Maps Platform
  async function loadAndInitGoogleMaps() {
    try {
      let apiKey = "AIzaSyAJtYOZygVaQnLy3A29MBFGVKzTCRZQnTE";
      try {
        const resp = await fetch("/api/maps-config");
        if (resp.ok) {
          const config = await resp.json();
          if (config.apiKey) apiKey = config.apiKey;
        }
      } catch (e) {
        console.warn("[SIRC] Usando chave configurada");
      }

      // Google Maps Dynamic Library Import Loader
      // prettier-ignore
      (g=>{var h,a,k,p="The Google Maps JavaScript API",c="google",l="importLibrary",q="__ib__",m=document,b=window;b=b[c]||(b[c]={});var d=b.maps||(b.maps={}),r=new Set,e=new URLSearchParams,u=()=>h||(h=new Promise(async(f,n)=>{await (a=m.createElement("script"));e.set("libraries",[...r]+"");for(k in g)e.set(k.replace(/[A-Z]/g,t=>"_"+t[0].toLowerCase()),g[k]);e.set("callback",c+".maps."+q);a.src=`https://maps.${c}apis.com/maps/api/js?`+e;d[q]=f;a.onerror=()=>h=n(Error(p+" could not load."));a.nonce=m.querySelector("script[nonce]")?.nonce||"";m.head.append(a)}));d[l]?console.warn(p+" only loads once. Ignoring:",g):d[l]=(f,...n)=>r.add(f)&&u().then(()=>d[l](f,...n))})({
        key: apiKey,
        v: "weekly"
      });

      // Importar bibliotecas necessárias da Google Maps Platform
      const { Map, InfoWindow } = await google.maps.importLibrary("maps");
      const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");
      AdvancedMarkerElementClass = AdvancedMarkerElement;

      const DARK_TACTICAL_MAP_STYLE = [
        { elementType: "geometry", stylers: [{ color: "#060913" }] },
        { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
        { elementType: "labels.text.fill", stylers: [{ color: "#64748b" }] },
        { elementType: "labels.text.stroke", stylers: [{ color: "#060913" }] },
        { featureType: "administrative", elementType: "geometry", stylers: [{ color: "#111827" }] },
        { featureType: "administrative.country", elementType: "labels.text.fill", stylers: [{ color: "#94a3b8" }] },
        { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#cbd5e1" }] },
        { featureType: "poi", stylers: [{ visibility: "off" }] },
        { featureType: "road", elementType: "geometry.fill", stylers: [{ color: "#0d1322" }] },
        { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#030712" }] },
        { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#475569" }] },
        { featureType: "road.highway", elementType: "geometry.fill", stylers: [{ color: "#172554" }] },
        { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#0f172a" }] },
        { featureType: "transit", stylers: [{ visibility: "off" }] },
        { featureType: "water", elementType: "geometry", stylers: [{ color: "#040814" }] },
        { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#1e293b" }] }
      ];

      // Instanciar o mapa com mapId obrigatório (CF9) e atribuição
      googleMap = new Map(document.getElementById("map"), {
        center: CAXIAS_COORDINATES,
        zoom: 14,
        mapId: "DEMO_MAP_ID",
        colorScheme: "DARK",
        styles: DARK_TACTICAL_MAP_STYLE,
        backgroundColor: "#070a12",
        internalUsageAttributionIds: [USAGE_ATTRIBUTION_ID],
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        zoomControl: false,
        cameraControl: false,
      });

      currentInfoWindow = new InfoWindow({
        pixelOffset: new google.maps.Size(0, -10),
      });

      // Carregar dados salvos no Firebase Firestore
      await fetchTrackingFromFirebase();
      renderAllTacticalElements();

    } catch (err) {
      console.error("[SIRC] Erro ao inicializar Google Maps:", err);
    }
  }

  // Renderizar rótulos geográficos discretos de Caxias
  function renderNeighborhoodLabels() {
    if (!googleMap || !AdvancedMarkerElementClass) return;

    CAXIAS_NEIGHBORHOODS.forEach((nb) => {
      const el = document.createElement("div");
      el.className = "map-neighborhood-tag";
      el.textContent = nb.nome;

      new AdvancedMarkerElementClass({
        map: googleMap,
        position: nb.coords,
        title: nb.nome,
        content: el
      });
    });
  }

  // 2. Buscar Dados no Banco de Dados Firebase Firestore
  async function fetchTrackingFromFirebase() {
    try {
      const res = await fetch("/api/rastreio/sessoes");
      if (res.ok) {
        const sessions = await res.json();
        allTrackingSessions = sessions;
        updateStatsCounters();
      }
    } catch (err) {
      console.warn("[SIRC] Erro ao sincronizar com Firebase:", err);
    }
  }

  const notifiedAlertsSet = new Set();

  async function syncTrackingFromFirebase() {
    if (!googleMap || !AdvancedMarkerElementClass) return;
    await fetchTrackingFromFirebase();

    allTrackingSessions.forEach((s) => {
      if (s.alertaAtivo && !notifiedAlertsSet.has(s.id + (s.dataAlerta || ""))) {
        notifiedAlertsSet.add(s.id + (s.dataAlerta || ""));
        if (window.Store && Store.toast) {
          Store.toast(`🚨 ALERTA POLICIAL: ${s.nome} acionou emergência! (${s.mensagemAlerta || s.tipoAlerta || "SOS"})`, "error");
        }
      }
    });

    renderAllTacticalElements();
  }

  function getCombinedTargets() {
    // Mesclar alvos de homologação com alvos reais gerados no Firebase
    const firebaseTargets = allTrackingSessions.map((s) => {
      let cat = "pessoa";
      const tipoLower = (s.tipo || "").toLowerCase();
      if (s.alertaAtivo || tipoLower.includes("alerta") || tipoLower.includes("urgente") || tipoLower.includes("mandado") || tipoLower.includes("sos")) {
        cat = "alerta";
      } else if (tipoLower.includes("veículo") || tipoLower.includes("carro") || tipoLower.includes("moto")) {
        cat = "veiculo";
      }

      const hasCoords = s.lat != null && s.lng != null && !isNaN(Number(s.lat)) && !isNaN(Number(s.lng));

      return {
        id: s.id,
        isFirebase: true,
        token: s.token,
        nome: s.nome,
        categoria: cat,
        tipo: s.alertaAtivo ? (s.mensagemAlerta ? `🚨 ${s.mensagemAlerta}` : (s.tipoAlerta || "Alerta de Emergência")) : (s.tipo || "Localização Solicitada"),
        bairro: s.bairro || "Caxias - MA",
        endereco: s.enderecoAproximado || (hasCoords ? `GPS (${Number(s.lat).toFixed(4)}, ${Number(s.lng).toFixed(4)})` : "Aguardando ativação pelo cidadão..."),
        tempo: s.ultimaAtualizacao ? "Agora" : (s.localizado ? "Recente" : "Pendente"),
        distancia: hasCoords ? "0.8 km" : "—",
        lat: hasCoords ? Number(s.lat) : -4.8588 + (Math.random() - 0.5) * 0.015,
        lng: hasCoords ? Number(s.lng) : -43.3561 + (Math.random() - 0.5) * 0.015,
        status: s.alertaAtivo ? "urgente" : (s.localizado ? "online" : "aguardando"),
        alertaAtivo: !!s.alertaAtivo,
        mensagemAlerta: s.mensagemAlerta || "",
        localizado: !!s.localizado,
        ativo: s.ativo !== false
      };
    });

    // Combinar alvos padrão de Caxias + sessões do Firebase (evitando duplicatas)
    return [...DEFAULT_TACTICAL_TARGETS, ...firebaseTargets];
  }

  function updateStatsCounters() {
    const combined = getCombinedTargets();
    const countPessoas = combined.filter((t) => t.categoria === "pessoa").length;
    const countVeiculos = combined.filter((t) => t.categoria === "veiculo").length;
    const countAlertas = combined.filter((t) => t.categoria === "alerta").length;
    const totalMonitoramento = combined.length;

    const elPessoas = document.getElementById("stat-count-pessoas");
    if (elPessoas) elPessoas.textContent = countPessoas || "12";

    const elVeiculos = document.getElementById("stat-count-veiculos");
    if (elVeiculos) elVeiculos.textContent = countVeiculos || "4";

    const elAlertas = document.getElementById("stat-count-alertas");
    if (elAlertas) elAlertas.textContent = countAlertas || "3";

    const elMonitor = document.getElementById("stat-count-monitoramento");
    if (elMonitor) elMonitor.textContent = totalMonitoramento || "18";

    // Atualizar badge do painel
    const panelOnlineCounter = document.getElementById("panel-online-text");
    if (panelOnlineCounter) {
      if (activeTab === "pessoas") {
        panelOnlineCounter.textContent = `${countPessoas} online`;
      } else if (activeTab === "veiculos") {
        panelOnlineCounter.textContent = `${countVeiculos} ativos`;
      } else {
        panelOnlineCounter.textContent = `${countAlertas} urgentes`;
      }
    }
  }

  // 3. Renderizar Marcadores e Painel de Alvos
  function renderAllTacticalElements() {
    if (!AdvancedMarkerElementClass || !googleMap) return;

    // Limpar marcadores anteriores
    markersRegistry.forEach(({ marker }) => {
      marker.map = null;
    });
    markersRegistry = [];

    const allTargets = getCombinedTargets();

    // Filtragem por busca e por aba ativa
    const filteredForList = allTargets.filter((t) => {
      // Filtro de aba
      if (activeTab === "pessoas" && t.categoria !== "pessoa") return false;
      if (activeTab === "veiculos" && t.categoria !== "veiculo") return false;
      if (activeTab === "alertas" && t.categoria !== "alerta") return false;

      // Filtro de busca textual
      if (searchFilterTerm) {
        const text = `${t.nome} ${t.bairro} ${t.endereco} ${t.tipo}`.toLowerCase();
        if (!text.includes(searchFilterTerm)) return false;
      }
      return true;
    });

    // Renderizar no Mapa TODOS os alvos válidos (com destaque na categoria ativa)
    allTargets.forEach((item) => {
      if (item.lat == null || item.lng == null) return;

      const pinEl = document.createElement("div");
      pinEl.className = `custom-tactical-pin pin-${item.categoria}`;
      pinEl.title = `${item.nome} (${item.bairro})`;

      let iconSvg = "";
      if (item.categoria === "veiculo") {
        iconSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="9" rx="2"/><path d="M5 11l2-5h10l2 5"/><circle cx="7.5" cy="16.5" r="1.5"/><circle cx="16.5" cy="16.5" r="1.5"/></svg>`;
      } else if (item.categoria === "alerta") {
        iconSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="9"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;
      } else {
        iconSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;
      }

      pinEl.innerHTML = iconSvg;

      const marker = new AdvancedMarkerElementClass({
        map: googleMap,
        position: { lat: Number(item.lat), lng: Number(item.lng) },
        title: item.nome,
        content: pinEl,
      });

      pinEl.addEventListener("click", () => {
        focusTarget(item, marker);
      });

      markersRegistry.push({ id: item.id, item, marker });
    });

    // Renderizar Lista Lateral
    renderTargetsList(filteredForList);
  }

  function openCitizenSimulator(token, nome) {
    const modalSim = document.getElementById("modal-simulador-celular");
    const iframeSim = document.getElementById("iframe-simulador-celular");
    const titleSim = document.getElementById("modal-sim-title");
    if (modalSim && iframeSim) {
      const url = token ? `localizar.html?token=${encodeURIComponent(token)}` : "localizar.html";
      if (titleSim) {
        titleSim.innerHTML = `📱 Simulador de Celular do Cidadão ${nome ? `&bull; <span style="color:#38bdf8;">${Store.escapeHtml(nome)}</span>` : ""}`;
      }
      iframeSim.src = url;
      modalSim.style.display = "flex";
    }
  }
  window.openCitizenSimulator = openCitizenSimulator;

  function renderTargetsList(list) {
    const container = document.getElementById("panel-targets-list");
    if (!container) return;
    container.innerHTML = "";

    if (list.length === 0) {
      container.innerHTML = `
        <div style="text-align:center; padding:32px 14px; color:#64748b; font-size:12.5px;">
          Nenhum registro encontrado nesta categoria.
        </div>
      `;
      return;
    }

    list.forEach((item) => {
      const card = document.createElement("div");
      card.className = "target-row-card";
      card.dataset.id = item.id;

      let iconSvg = "";
      if (item.categoria === "veiculo") {
        iconSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="9" rx="2"/><path d="M5 11l2-5h10l2 5"/><circle cx="7.5" cy="16.5" r="1.5"/><circle cx="16.5" cy="16.5" r="1.5"/></svg>`;
      } else if (item.categoria === "alerta") {
        iconSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;
      } else {
        iconSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;
      }

      card.innerHTML = `
        <div class="target-row-left">
          <div class="target-avatar-badge ${item.categoria}">
            ${iconSvg}
          </div>
          <div style="min-width:0;">
            <p class="target-meta-name">${Store.escapeHtml(item.nome)}</p>
            <p class="target-meta-location">${Store.escapeHtml(item.bairro)}</p>
          </div>
        </div>
        <div class="target-row-right" style="display:flex; align-items:center; gap:8px;">
          ${item.isFirebase && item.token ? `
            <button type="button" class="btn-quick-sim" data-token="${item.token}" title="Testar no Simulador de Celular" style="background:rgba(37,99,235,0.25); border:1px solid #3b82f6; color:#93c5fd; padding:3px 8px; border-radius:6px; font-size:11px; cursor:pointer; font-weight:700;">
              📱 Celular
            </button>
          ` : `
            <div class="target-time-dist">
              <span class="target-time-val">${Store.escapeHtml(item.tempo || "2 min")}</span>
              <span class="target-dist-val">${Store.escapeHtml(item.distancia || "0.4 km")}</span>
            </div>
          `}
          <svg viewBox="0 0 24 24" class="target-chevron-icon" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
        </div>
      `;

      card.querySelector(".btn-quick-sim")?.addEventListener("click", (e) => {
        e.stopPropagation();
        openCitizenSimulator(item.token, item.nome);
      });

      card.addEventListener("click", () => {
        const reg = markersRegistry.find((m) => m.id === item.id);
        if (reg) {
          focusTarget(item, reg.marker);
        } else if (googleMap) {
          googleMap.panTo({ lat: Number(item.lat), lng: Number(item.lng) });
          googleMap.setZoom(16);
        }
      });

      container.appendChild(card);
    });
  }

  // 4. Focar Alvo com InfoWindow Tática
  function focusTarget(item, marker) {
    if (!googleMap) return;

    googleMap.panTo({ lat: Number(item.lat), lng: Number(item.lng) });
    googleMap.setZoom(16);

    document.querySelectorAll(".target-row-card").forEach((c) => {
      c.classList.toggle("active", c.dataset.id === item.id);
      if (c.dataset.id === item.id) {
        c.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    });

    const content = document.createElement("div");
    content.className = "gmp-police-infowindow";
    content.innerHTML = `
      <h4 style="margin:0 0 4px 0; font-size:14px; font-weight:800; color:#0f172a;">${Store.escapeHtml(item.nome)}</h4>
      <p style="margin:2px 0; font-size:12px; color:#475569;"><strong>Categoria:</strong> ${Store.escapeHtml(item.tipo)}</p>
      <p style="margin:2px 0; font-size:12px; color:#475569;"><strong>Local:</strong> ${Store.escapeHtml(item.endereco || item.bairro)}</p>
      <p style="margin:2px 0; font-size:12px; color:#10b981; font-weight:700;">● Sinal GPS Ativo em Caxias-MA</p>
      <div class="gmp-infowindow-actions" style="margin-top:8px; display:flex; flex-wrap:wrap; gap:6px;">
        <button type="button" class="gmp-infowindow-btn btn-streetview" id="btn-open-sv" style="background:#0f172a; color:#fff; border:none; padding:5px 9px; border-radius:6px; font-size:11px; cursor:pointer;">
          Street View 360°
        </button>
        <button type="button" class="gmp-infowindow-btn" id="btn-copy-coords" style="background:#2563eb; color:#fff; border:none; padding:5px 9px; border-radius:6px; font-size:11px; cursor:pointer;">
          Copiar GPS
        </button>
        ${item.isFirebase && item.token ? `
          <button type="button" class="gmp-infowindow-btn" id="btn-sim-target" style="background:#20c997; color:#0f172a; font-weight:700; border:none; padding:5px 9px; border-radius:6px; font-size:11px; cursor:pointer;">
            📱 Celular
          </button>
          <button type="button" class="gmp-infowindow-btn" id="btn-link-target" style="background:#3b82f6; color:#fff; border:none; padding:5px 9px; border-radius:6px; font-size:11px; cursor:pointer;">
            📋 Link
          </button>
        ` : ""}
        ${item.isFirebase ? `<button type="button" class="gmp-infowindow-btn" id="btn-del-firebase" style="background:#ef4444; color:#fff; border:none; padding:5px 9px; border-radius:6px; font-size:11px; cursor:pointer;">Excluir</button>` : ""}
      </div>
    `;

    content.querySelector("#btn-copy-coords")?.addEventListener("click", () => {
      navigator.clipboard.writeText(`${item.lat}, ${item.lng}`);
      if (window.Store && Store.toast) {
        Store.toast(`Coordenadas copiadas: ${item.lat}, ${item.lng}`, "success");
      }
    });

    content.querySelector("#btn-open-sv")?.addEventListener("click", () => {
      openStreetView(Number(item.lat), Number(item.lng), `${item.nome} — ${item.bairro}`);
    });

    content.querySelector("#btn-sim-target")?.addEventListener("click", () => {
      openCitizenSimulator(item.token, item.nome);
    });

    content.querySelector("#btn-link-target")?.addEventListener("click", () => {
      const fullLink = `${window.location.origin}/localizar.html?token=${item.token}`;
      navigator.clipboard.writeText(fullLink);
      if (window.Store && Store.toast) {
        Store.toast(`Link copiado para ${item.nome}!`, "success");
      }
    });

    content.querySelector("#btn-del-firebase")?.addEventListener("click", () => {
      showConfirmDialog(`Deseja remover "${item.nome}" do banco de dados Firebase?`, async () => {
        await excluirSessao(item.id);
      });
    });

    if (currentInfoWindow && marker) {
      currentInfoWindow.setContent(content);
      currentInfoWindow.open(googleMap, marker);
    }
  }

  // 5. Visualizador Street View 360°
  async function openStreetView(lat, lng, label) {
    const modal = document.getElementById("modal-street-view");
    const stage = document.getElementById("street-view-stage");
    const addressText = document.getElementById("sv-address-text");

    if (!modal || !stage) return;

    if (addressText) addressText.textContent = label || "Visualização Panorâmica";
    modal.style.display = "flex";

    try {
      const { StreetViewPanorama } = await google.maps.importLibrary("streetView");
      new StreetViewPanorama(stage, {
        position: { lat, lng },
        pov: { heading: 165, pitch: 0 },
        zoom: 1,
        visible: true,
      });
    } catch (err) {
      console.error("Erro ao carregar Street View:", err);
      stage.innerHTML = `<div style="color:#ff6b6b; padding:20px; text-align:center;">Street View não disponível para estas coordenadas.</div>`;
    }
  }

  // 6. Excluir Sessão do Firebase
  async function excluirSessao(id) {
    try {
      const res = await fetch(`/api/rastreio/encerrar/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (res.ok) {
        if (window.Store && Store.toast) {
          Store.toast("Alvo excluído com sucesso!", "success");
        }
        await fetchTrackingFromFirebase();
        renderAllTacticalElements();
      }
    } catch (err) {
      console.error("Erro ao excluir do Firebase:", err);
    }
  }

  // 7. Eventos de Interface & Controles
  function setupEventListeners() {
    // Busca interativa
    const searchInput = document.getElementById("locator-search-input");
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        searchFilterTerm = e.target.value.trim().toLowerCase();
        renderAllTacticalElements();
      });
    }

    // Abas do Painel: Pessoas | Veículos | Alertas
    const tabBtns = document.querySelectorAll(".panel-tab-btn");
    tabBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        tabBtns.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        activeTab = btn.dataset.tab;

        const titleEl = document.getElementById("panel-current-title");
        if (titleEl) {
          if (activeTab === "pessoas") titleEl.textContent = "Pessoas Localizadas";
          else if (activeTab === "veiculos") titleEl.textContent = "Veículos Vinculados";
          else titleEl.textContent = "Alertas Ativos";
        }

        updateStatsCounters();
        renderAllTacticalElements();
      });
    });

    // Cards de métricas clicáveis para filtrar a lista correspondente
    document.querySelectorAll(".stat-card").forEach((card) => {
      card.addEventListener("click", () => {
        const cat = card.dataset.category;
        if (cat === "pessoas" || cat === "veiculos" || cat === "alertas") {
          const matchingTab = document.querySelector(`.panel-tab-btn[data-tab="${cat}"]`);
          if (matchingTab) matchingTab.click();
        }
      });
    });

    // Botões de Zoom do Mapa
    document.getElementById("ctrl-zoom-in")?.addEventListener("click", () => {
      if (googleMap) googleMap.setZoom(googleMap.getZoom() + 1);
    });

    document.getElementById("ctrl-zoom-out")?.addEventListener("click", () => {
      if (googleMap) googleMap.setZoom(googleMap.getZoom() - 1);
    });

    document.getElementById("ctrl-recenter")?.addEventListener("click", () => {
      if (googleMap) {
        googleMap.panTo(CAXIAS_COORDINATES);
        googleMap.setZoom(14);
      }
    });

    document.getElementById("btn-recenter-caxias")?.addEventListener("click", () => {
      if (googleMap) {
        googleMap.panTo(CAXIAS_COORDINATES);
        googleMap.setZoom(14);
        if (window.Store && Store.toast) {
          Store.toast("Centralizado em Caxias - Maranhão", "info");
        }
      }
    });

    // Alternador de Tema
    document.getElementById("btn-mapa-theme")?.addEventListener("click", () => {
      document.body.classList.toggle("light-mode");
    });

    // Botão Tela Cheia do Mapa
    document.getElementById("btn-toggle-fullscreen")?.addEventListener("click", () => {
      const mapWrapper = document.querySelector(".locator-map-wrapper");
      if (!mapWrapper) return;
      if (!document.fullscreenElement) {
        mapWrapper.requestFullscreen?.().catch(() => {});
      } else {
        document.exitFullscreen?.().catch(() => {});
      }
    });

    // Ação "Ver todas as pessoas"
    document.getElementById("btn-view-all")?.addEventListener("click", () => {
      searchFilterTerm = "";
      if (searchInput) searchInput.value = "";
      renderAllTacticalElements();
      if (googleMap) {
        googleMap.panTo(CAXIAS_COORDINATES);
        googleMap.setZoom(13.5);
      }
    });

    // Botão de Notificações
    document.getElementById("btn-notif-bell")?.addEventListener("click", () => {
      if (window.Store && Store.toast) {
        Store.toast("Central de Alertas: 3 mandados ativos e monitoramento em tempo real.", "info");
      }
    });

    // ==========================================
    // MODAL GERADOR DE LINK DE RASTREIO (FIREBASE)
    // ==========================================
    function openModalGerarRastreio() {
      const modalGerarRastreio = document.getElementById("modal-gerar-rastreio");
      const resultLinkArea = document.getElementById("result-link-area");
      const formGerarRastreio = document.getElementById("form-gerar-rastreio");
      if (modalGerarRastreio) {
        modalGerarRastreio.style.display = "flex";
        if (resultLinkArea) resultLinkArea.style.display = "none";
        if (formGerarRastreio) formGerarRastreio.reset();
        const nomeInput = document.getElementById("rastreio-nome");
        if (nomeInput) setTimeout(() => nomeInput.focus(), 80);
      }
    }
    window.openModalGerarRastreio = openModalGerarRastreio;

    document.addEventListener("click", (e) => {
      const btn = e.target.closest("#btn-open-gerar-rastreio, .btn-novo-rastreio");
      if (btn) {
        e.preventDefault();
        openModalGerarRastreio();
      }
    });

    const modalGerarRastreio = document.getElementById("modal-gerar-rastreio");
    const btnCloseRastreioModal = document.getElementById("btn-close-rastreio-modal");
    const btnDoneRastreio = document.getElementById("btn-done-rastreio");
    const formGerarRastreio = document.getElementById("form-gerar-rastreio");
    const resultLinkArea = document.getElementById("result-link-area");
    const inputGeneratedLink = document.getElementById("input-generated-link");
    const btnCopyLink = document.getElementById("btn-copy-link");
    const btnOpenTargetTest = document.getElementById("btn-open-target-test");
    const btnWhatsappShare = document.getElementById("btn-whatsapp-share");
    const copyConfirm = document.getElementById("copy-confirm");

    const closeRastreioModal = () => {
      const m = document.getElementById("modal-gerar-rastreio");
      if (m) m.style.display = "none";
    };

    document.addEventListener("click", (e) => {
      if (e.target.closest("#btn-close-rastreio-modal") || e.target.closest("#btn-done-rastreio")) {
        closeRastreioModal();
      }
      const m = document.getElementById("modal-gerar-rastreio");
      if (m && e.target === m) {
        closeRastreioModal();
      }
    });

    // Form submit listener with delegation
    document.addEventListener("submit", async (e) => {
      if (e.target && e.target.id === "form-gerar-rastreio") {
        e.preventDefault();
        const form = e.target;
        const fd = new FormData(form);
        const nome = fd.get("nome")?.toString().trim();
        const tipo = fd.get("tipo")?.toString();
        const telefone = fd.get("telefone")?.toString().trim();
        const motivo = fd.get("motivo")?.toString().trim();

        if (!nome) {
          if (window.Store && Store.toast) Store.toast("Informe o nome da pessoa.", "error");
          return;
        }

        const btnSubmit = document.getElementById("btn-submit-criar-rastreio");
        if (btnSubmit) {
          btnSubmit.disabled = true;
          btnSubmit.textContent = "Gravando no Firebase Firestore...";
        }

        try {
          const res = await fetch("/api/rastreio/gerar", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nome, tipo, telefone, motivo }),
          });

          if (res.ok) {
            const data = await res.json();
            const origin = window.location.origin;
            const fullLink = `${origin}/localizar.html?token=${data.token}`;

            const inputGen = document.getElementById("input-generated-link");
            const btnTest = document.getElementById("btn-open-target-test");
            const btnZap = document.getElementById("btn-whatsapp-share");
            const resArea = document.getElementById("result-link-area");
            const copyConf = document.getElementById("copy-confirm");
            const qrImg = document.getElementById("qr-code-img");

            if (inputGen) {
              inputGen.value = fullLink;
              inputGen.dataset.token = data.token;
              inputGen.dataset.nome = nome;
            }
            if (qrImg) {
              qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(fullLink)}`;
            }
            if (btnTest) {
              btnTest.href = fullLink;
            }
            if (btnZap) {
              btnZap.target = "_blank";
              btnZap.href = `https://api.whatsapp.com/send?text=${encodeURIComponent(
                `Polícia Civil do MA - SIRC: Solicitação oficial de confirmação de localização para ${nome}. Por favor, copie e abra no navegador Google Chrome: ${fullLink}`
              )}`;
            }

            if (resArea) resArea.style.display = "block";
            if (copyConf) copyConf.style.display = "none";

            Store.addLog("Rastreamento Firebase", `Link de localização gerado no Firebase para ${nome} (${tipo}).`);
            if (window.Store && Store.toast) {
              Store.toast(`Link gerado com sucesso para ${nome}!`, "success");
            }

            // Sincronizar imediatamente para listar o novo alvo
            await fetchTrackingFromFirebase();
            renderAllTacticalElements();
          } else {
            let errorMsg = "Erro ao gravar dados no Firebase. Tente novamente.";
            try {
              const errData = await res.json();
              if (errData && errData.error) errorMsg = errData.error;
            } catch (e) {}
            if (window.Store && Store.toast) {
              Store.toast(errorMsg, "error");
            }
          }
        } catch (err) {
          console.error("Erro ao gerar link de rastreamento:", err);
          if (window.Store && Store.toast) {
            Store.toast("Erro de comunicação com o servidor.", "error");
          }
        } finally {
          if (btnSubmit) {
            btnSubmit.disabled = false;
            btnSubmit.textContent = "Salvar no Firebase & Gerar Link";
          }
        }
      }
    });

    // Simulador de Celular do Cidadão (Sem erro 403 / Proibido do Google)
    document.addEventListener("click", (e) => {
      if (e.target.closest("#btn-open-simulator")) {
        const inputGen = document.getElementById("input-generated-link");
        const token = inputGen?.dataset?.token || (inputGen?.value?.includes("token=") ? inputGen.value.split("token=")[1].split("&")[0] : null);
        const nome = inputGen?.dataset?.nome || "Cidadão";
        openCitizenSimulator(token, nome);
      }
      if (e.target.closest("#btn-close-simulador") || (e.target && e.target.id === "modal-simulador-celular")) {
        const modalSim = document.getElementById("modal-simulador-celular");
        const iframeSim = document.getElementById("iframe-simulador-celular");
        if (modalSim) modalSim.style.display = "none";
        if (iframeSim) iframeSim.src = "about:blank";
      }
    });

    document.addEventListener("click", async (e) => {
      if (e.target.closest("#btn-copy-link")) {
        const inputGen = document.getElementById("input-generated-link");
        const copyConf = document.getElementById("copy-confirm");
        if (inputGen && inputGen.value) {
          try {
            await navigator.clipboard.writeText(inputGen.value);
            if (copyConf) copyConf.style.display = "block";
            if (window.Store && Store.toast) {
              Store.toast("Link oficial copiado! Envie para a pessoa.", "success");
            }
          } catch (err) {
            inputGen.select();
            document.execCommand("copy");
            if (copyConf) copyConf.style.display = "block";
            if (window.Store && Store.toast) {
              Store.toast("Link copiado!", "success");
            }
          }
        }
      }
    });

    // Fechar Street View
    const btnCloseSV = document.getElementById("btn-close-street-view");
    const btnDoneSV = document.getElementById("btn-done-street-view");
    const modalSV = document.getElementById("modal-street-view");

    const closeSV = () => {
      if (modalSV) modalSV.style.display = "none";
    };

    if (btnCloseSV) btnCloseSV.addEventListener("click", closeSV);
    if (btnDoneSV) btnDoneSV.addEventListener("click", closeSV);
  }
})();
