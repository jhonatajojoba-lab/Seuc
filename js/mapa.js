// Source: Google Maps Platform Code Assist
// ============================================================
// SIRC — Módulo de Localização de Pessoas & Firebase Firestore
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

  // Constantes de Caxias - Maranhão
  const CAXIAS_COORDINATES = { lat: -4.8588, lng: -43.3561 };
  const USAGE_ATTRIBUTION_ID = "gmp_mcp_codeassist_v1_aistudio";

  // Unidades Regionais do Maranhão (as 5 principais cidades da PCMA)
  const REGIONAL_CITIES = [
    { id: "caxias", nome: "Caxias - MA", cargo: "Delegacia Regional SIRC", papel: "Sede Operacional Integrada", coords: { lat: -4.8588, lng: -43.3561 }, zoom: 14 },
    { id: "saoluis", nome: "São Luís - MA", cargo: "Comando Geral da PCMA", papel: "Centro Integrado de Inteligência", coords: { lat: -2.5307, lng: -44.3068 }, zoom: 13 },
    { id: "imperatriz", nome: "Imperatriz - MA", cargo: "10ª Delegacia Regional", papel: "Unidade de Segurança do Sul", coords: { lat: -5.5266, lng: -47.4746 }, zoom: 13 },
    { id: "timon", nome: "Timon - MA", cargo: "18ª Delegacia Regional", papel: "Comando Integrado Leste", coords: { lat: -5.0939, lng: -42.8367 }, zoom: 14 },
    { id: "ribamar", nome: "São José de Ribamar - MA", cargo: "Delegacia Especial Integrada", papel: "Região Metropolitana da Ilha", coords: { lat: -2.5622, lng: -44.0544 }, zoom: 14 },
  ];

  let googleMap = null;
  let currentInfoWindow = null;
  let markersRegistry = [];
  let allTrackingSessions = [];
  let activeFilter = "all";
  let streetViewPano = null;
  let lastKnownSignalTimestamps = {};
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
    const mapRoot = document.getElementById("google-map-root");
    if (!mapRoot) return;

    if (window.Components) Components.initLayout("mapa");

    // Inserir ícones
    if (window.ICONS) {
      const headerIcon = document.getElementById("header-map-icon");
      if (headerIcon) headerIcon.innerHTML = ICONS.map;

      const centerIcon = document.getElementById("center-icon");
      if (centerIcon) centerIcon.innerHTML = ICONS.crosshair;

      const listIcon = document.getElementById("sidebar-list-icon");
      if (listIcon) listIcon.innerHTML = ICONS.layers;
    }

    setupEventListeners();
    await loadAndInitGoogleMaps();
    renderRegionalCities();

    // Sincronização automática contínua com o Firebase Firestore a cada 3.5 segundos
    if (mapaSyncInterval) clearInterval(mapaSyncInterval);
    mapaSyncInterval = setInterval(syncTrackingFromFirebase, 3500);
  }
  window.initMapaPage = initMapaPage;

  document.addEventListener("DOMContentLoaded", async () => {
    initMapaPage();
  });

// 1. Carregamento e Inicialização da Google Maps Platform
async function loadAndInitGoogleMaps() {
  const statusEl = document.getElementById("map-status-text");

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
    const { PlaceAutocompleteElement } = await google.maps.importLibrary("places");
    AdvancedMarkerElementClass = AdvancedMarkerElement;

    const DARK_TACTICAL_MAP_STYLE = [
      { elementType: "geometry", stylers: [{ color: "#000000" }] },
      { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
      { elementType: "labels.text.fill", stylers: [{ color: "#718096" }] },
      { elementType: "labels.text.stroke", stylers: [{ color: "#000000" }] },
      { featureType: "administrative", elementType: "geometry", stylers: [{ color: "#1a202c" }] },
      { featureType: "administrative.country", elementType: "labels.text.fill", stylers: [{ color: "#a0aec0" }] },
      { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#cbd5e0" }] },
      { featureType: "poi", stylers: [{ visibility: "off" }] },
      { featureType: "road", elementType: "geometry.fill", stylers: [{ color: "#111827" }] },
      { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#000000" }] },
      { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#94a3b8" }] },
      { featureType: "road.highway", elementType: "geometry.fill", stylers: [{ color: "#1e293b" }] },
      { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#000000" }] },
      { featureType: "transit", stylers: [{ visibility: "off" }] },
      { featureType: "water", elementType: "geometry", stylers: [{ color: "#000000" }] },
      { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#4a5568" }] }
    ];

    // Instanciar o mapa com mapId obrigatório (CF9) e atribuição
    googleMap = new Map(document.getElementById("map"), {
      center: CAXIAS_COORDINATES,
      zoom: 14,
      mapId: "DEMO_MAP_ID",
      colorScheme: "DARK",
      styles: DARK_TACTICAL_MAP_STYLE,
      backgroundColor: "#000000",
      internalUsageAttributionIds: [USAGE_ATTRIBUTION_ID],
      mapTypeControl: true,
      streetViewControl: true,
      fullscreenControl: true,
      cameraControl: true,
    });

    currentInfoWindow = new InfoWindow({
      pixelOffset: new google.maps.Size(0, -10),
    });

    // Carregar dados salvos no Firebase
    await fetchTrackingFromFirebase();
    renderMarkers();

    // Inicializar o PlaceAutocompleteElement da Google Maps Platform
    initPlacesAutocomplete(PlaceAutocompleteElement);

    // Eventos do mapa
    googleMap.addListener("click", (e) => {
      if (currentInfoWindow) currentInfoWindow.close();
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      document.getElementById("coords-display").innerText = `Lat: ${lat.toFixed(6)} | Lng: ${lng.toFixed(6)} (Caxias-MA)`;
    });

    if (statusEl) {
      statusEl.textContent = "Firebase Firestore conectado & Google Maps Operacional";
    }
  } catch (err) {
    console.error("[SIRC] Erro ao inicializar:", err);
    if (statusEl) {
      statusEl.textContent = "Falha ao carregar mapa (verifique conexão ou cota)";
    }
  }
}

// 2. Autocomplete de Lugares (Places API New)
function initPlacesAutocomplete(PlaceAutocompleteElement) {
  const container = document.getElementById("gmp-autocomplete-host");
  if (!container || !PlaceAutocompleteElement) return;

  try {
    const autocomplete = new PlaceAutocompleteElement();
    container.innerHTML = "";
    container.appendChild(autocomplete);

    const onSelect = async ({ placePrediction }) => {
      if (!placePrediction) return;
      try {
        const place = placePrediction.toPlace();
        await place.fetchFields({
          fields: ["displayName", "formattedAddress", "location"],
        });

        if (place.location && googleMap) {
          googleMap.panTo(place.location);
          googleMap.setZoom(16);
          document.getElementById("coords-display").innerText = 
            `Local: ${place.displayName || "Pesquisado"} | ${place.location.lat().toFixed(6)}, ${place.location.lng().toFixed(6)}`;
        }
      } catch (err) {
        console.error("Erro no processamento do local:", err);
      }
    };

    autocomplete.addEventListener("gmp-select", onSelect);
    autocomplete.addEventListener("gmp-placeselect", onSelect);
  } catch (e) {
    console.warn("PlaceAutocompleteElement indisponível:", e);
  }
}

// 3. Buscar Dados no Banco de Dados Firebase Firestore
async function fetchTrackingFromFirebase() {
  try {
    const res = await fetch("/api/rastreio/sessoes");
    if (res.ok) {
      const sessions = await res.json();
      allTrackingSessions = sessions;

      // Verificar se houve nova localização transmitida para disparar toast
      sessions.forEach((s) => {
        if (s.localizado && s.ultimaAtualizacao && s.lat && s.lng) {
          const prev = lastKnownSignalTimestamps[s.id];
          if (!prev) {
            lastKnownSignalTimestamps[s.id] = s.ultimaAtualizacao;
          } else if (new Date(s.ultimaAtualizacao) > new Date(prev)) {
            lastKnownSignalTimestamps[s.id] = s.ultimaAtualizacao;
            showLiveSignalToast(s.nome, s.lat, s.lng, s.bairro || "Caxias-MA");
          }
        }
      });

      updateCounters();
    }
  } catch (err) {
    console.warn("[SIRC] Erro ao sincronizar com Firebase:", err);
  }
}

async function syncTrackingFromFirebase() {
  if (!googleMap || !AdvancedMarkerElementClass) return;
  await fetchTrackingFromFirebase();
  renderMarkers();
}

function updateCounters() {
  const localizados = allTrackingSessions.filter((s) => s.localizado && s.lat && s.lng);
  const pendentes = allTrackingSessions.filter((s) => !s.localizado);

  const statRastreio = document.getElementById("stat-rastreio-count");
  if (statRastreio) statRastreio.textContent = localizados.length;

  const statPending = document.getElementById("stat-pending-count");
  if (statPending) statPending.textContent = pendentes.length;
}

// 4. Renderizar Marcadores com AdvancedMarkerElement
function renderMarkers() {
  if (!AdvancedMarkerElementClass) return;

  // Limpar marcadores anteriores
  markersRegistry.forEach(({ marker }) => {
    marker.map = null;
  });
  markersRegistry = [];

  const filtered = allTrackingSessions.filter((item) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "localizado") return item.localizado && item.lat && item.lng;
    if (activeFilter === "pendente") return !item.localizado;
    return true;
  });

  const listContainer = document.getElementById("map-points-list");
  if (listContainer) listContainer.innerHTML = "";

  const visibleCountEl = document.getElementById("visible-points-count");
  if (visibleCountEl) visibleCountEl.textContent = filtered.length;

  if (filtered.length === 0) {
    if (listContainer) {
      listContainer.innerHTML = `
        <div style="text-align:center; padding:36px 16px; color:#94a3b8; font-size:13px;">
          <div style="font-size:32px; margin-bottom:10px;">🛰️</div>
          <p style="margin:0 0 6px 0; color:#fff; font-weight:800; font-size:14px;">Nenhum alvo ativo no momento</p>
          <p style="color:#64748b; font-size:12px; margin:0 0 16px 0; line-height:1.4;">Cadastre um alvo para gerar o link de rastreamento GPS oficial da Polícia Civil.</p>
          <button type="button" class="btn-tactical-primary" onclick="document.getElementById('btn-open-gerar-rastreio')?.click()" style="margin:0 auto;">
            + Novo Rastreamento
          </button>
        </div>
      `;
    }
    return;
  }

  filtered.forEach((item) => {
    const isLocated = item.localizado && item.lat && item.lng;

    // Se a pessoa já clicou em "Quero ser localizado", renderiza no Google Maps
    if (isLocated && googleMap) {
      const pinEl = document.createElement("div");
      pinEl.className = "custom-police-pin rastreio";
      pinEl.title = `${item.nome} (${item.tipo})`;

      const innerEl = document.createElement("div");
      innerEl.className = "custom-police-pin-inner";
      innerEl.innerHTML = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3" fill="currentColor"/></svg>`;
      pinEl.appendChild(innerEl);

      const marker = new AdvancedMarkerElementClass({
        map: googleMap,
        position: { lat: Number(item.lat), lng: Number(item.lng) },
        title: item.nome,
        content: pinEl,
      });

      pinEl.addEventListener("click", () => {
        focusPerson(item, marker);
      });

      markersRegistry.push({ id: item.id, item, marker });
    }

    // Renderizar item na lista lateral
    if (listContainer) {
      const card = document.createElement("div");
      card.className = "map-item-card";
      card.dataset.id = item.id;

      card.innerHTML = `
        <div class="map-item-header">
          <div class="target-radar-avatar ${isLocated ? "active-gps" : ""}">
            ${isLocated ? "🟢" : "⏳"}
          </div>
          <div style="flex:1; min-width:0;">
            <p class="map-item-title">${Store.escapeHtml(item.nome)}</p>
            <p class="map-item-natureza">
              ${isLocated 
                ? `<span style="color:#20c997; font-weight:700;">SINAL GPS ONLINE</span>` 
                : `<span style="color:#fab005; font-weight:700;">Aguardando Acesso</span>`}
            </p>
          </div>
          <button type="button" class="btn-tactical-ghost btn-delete-target" title="Excluir do Firebase" style="padding:4px 8px; font-size:11px;" data-id="${item.id}">
            ✕
          </button>
        </div>
        <div class="map-item-location">
          <span>${isLocated ? `📍 ${Store.escapeHtml(item.bairro || "Caxias")} &bull; Precisão &plusmn;${Math.round(item.precisao || 10)}m` : "🔗 Link gerado &bull; aguardando permissão do cidadão"}</span>
        </div>
        <div style="margin-top:8px; display:flex; gap:6px; justify-content:flex-end;">
          ${isLocated ? `<button type="button" class="city-locate-btn btn-focus-target" style="padding:4px 10px;">Focar Alvo &rarr;</button>` : `<button type="button" class="city-locate-btn btn-copy-target-link" style="padding:4px 10px;">Copiar Link</button>`}
        </div>
      `;

      card.addEventListener("click", (e) => {
        if (e.target.closest(".btn-delete-target")) return;
        if (e.target.closest(".btn-copy-target-link")) {
          e.stopPropagation();
          const origin = window.location.origin;
          const fullLink = `${origin}/localizar.html?token=${item.token}`;
          navigator.clipboard.writeText(fullLink);
          if (window.Store && Store.toast) {
            Store.toast("Link copiado para a área de transferência!", "success");
          }
          return;
        }
        const reg = markersRegistry.find((m) => m.id === item.id);
        if (reg) {
          focusPerson(item, reg.marker);
        } else {
          openPendingDetailsModal(item);
        }
      });

      card.querySelector(".btn-delete-target")?.addEventListener("click", (e) => {
        e.stopPropagation();
        showConfirmDialog(`Excluir permanentemente o rastreamento de "${item.nome}" do banco Firebase?`, async () => {
          await excluirSessao(item.id);
        });
      });

      listContainer.appendChild(card);
    }
  });
}

// Renderização das Unidades Regionais do Maranhão (as 5 cidades)
function renderRegionalCities() {
  const container = document.getElementById("regional-cities-container");
  if (!container) return;
  container.innerHTML = "";

  REGIONAL_CITIES.forEach((city) => {
    const card = document.createElement("div");
    card.className = "regional-city-card";
    card.innerHTML = `
      <div class="city-card-left">
        <div class="city-card-pin">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
        </div>
        <div>
          <h4 class="city-card-name">${city.nome}</h4>
          <p class="city-card-role">${city.cargo}</p>
        </div>
      </div>
      <button type="button" class="city-locate-btn">Localizar &rarr;</button>
    `;

    card.addEventListener("click", () => {
      if (googleMap) {
        googleMap.panTo(city.coords);
        googleMap.setZoom(city.zoom);
        const coordsEl = document.getElementById("coords-display");
        if (coordsEl) {
          coordsEl.innerText = `Lat: ${city.coords.lat.toFixed(6)} | Lng: ${city.coords.lng.toFixed(6)} (${city.nome})`;
        }
      }
    });

    container.appendChild(card);
  });
}

// 5. Foco em Pessoa com InfoWindow
function focusPerson(item, marker) {
  if (!googleMap) return;

  googleMap.panTo({ lat: Number(item.lat), lng: Number(item.lng) });
  googleMap.setZoom(16);

  document.querySelectorAll(".map-item-card").forEach((c) => {
    c.classList.toggle("active", c.dataset.id === item.id);
    if (c.dataset.id === item.id) {
      c.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  });

  document.getElementById("coords-display").innerText = 
    `Alvo: ${item.nome} | Lat: ${Number(item.lat).toFixed(6)} | Lng: ${Number(item.lng).toFixed(6)}`;

  const content = document.createElement("div");
  content.className = "gmp-police-infowindow";
  content.innerHTML = `
    <span class="badge-tag" style="background:rgba(32, 201, 151, 0.2); color:#099268; border:1px solid #20c997; font-weight:700;">
      🟢 LOCALIZADO VIA GPS (FIREBASE)
    </span>
    <h4>${Store.escapeHtml(item.nome)}</h4>
    <p><strong>Categoria:</strong> ${Store.escapeHtml(item.tipo)}</p>
    <p><strong>Motivo:</strong> ${Store.escapeHtml(item.motivo || "Acompanhamento")}</p>
    <p><strong>Local:</strong> ${Store.escapeHtml(item.enderecoAproximado || "Caxias - MA")}</p>
    <p><strong>Precisão GPS:</strong> &plusmn;${Math.round(item.precisao || 10)} metros</p>
    <p><strong>Último Sinal:</strong> ${item.ultimaAtualizacao ? new Date(item.ultimaAtualizacao).toLocaleTimeString('pt-BR') : 'Tempo Real'}</p>
    ${item.telefone ? `<p><strong>WhatsApp/Tel:</strong> ${Store.escapeHtml(item.telefone)}</p>` : ""}
    <div class="gmp-infowindow-actions">
      <button type="button" class="gmp-infowindow-btn btn-streetview" id="btn-open-sv">
        Street View 360°
      </button>
      <button type="button" class="gmp-infowindow-btn" id="btn-copy-coords">
        Copiar GPS
      </button>
    </div>
  `;

  content.querySelector("#btn-copy-coords")?.addEventListener("click", () => {
    navigator.clipboard.writeText(`${item.lat}, ${item.lng}`);
    if (window.Store && Store.toast) {
      Store.toast(`Coordenadas copiadas: ${item.lat}, ${item.lng}`, "success");
    }
  });

  content.querySelector("#btn-open-sv")?.addEventListener("click", () => {
    openStreetView(Number(item.lat), Number(item.lng), `${item.nome} — ${item.enderecoAproximado || "Caxias - MA"}`);
  });

  currentInfoWindow.setContent(content);
  currentInfoWindow.open(googleMap, marker);
}

function openPendingDetailsModal(item) {
  const origin = window.location.origin;
  const link = `${origin}/localizar.html?token=${item.token}`;
  if (window.Store && Store.toast) {
    Store.toast(`Alvo: ${item.nome} (Aguardando acesso ao link)`, "info");
  }
}

// 6. Visualizador Street View 360°
async function openStreetView(lat, lng, label) {
  const modal = document.getElementById("modal-street-view");
  const stage = document.getElementById("street-view-stage");
  const addressText = document.getElementById("sv-address-text");

  if (!modal || !stage) return;

  if (addressText) addressText.textContent = label || "Visualização Panorâmica";
  modal.style.display = "flex";

  try {
    const { StreetViewPanorama } = await google.maps.importLibrary("streetView");
    streetViewPano = new StreetViewPanorama(stage, {
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

// 7. Alerta de Novo Sinal Recebido
function showLiveSignalToast(nome, lat, lng, bairro) {
  const container = document.getElementById("toast-container");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = "live-signal-toast";
  toast.innerHTML = `
    <div class="toast-radar-icon">
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z"/><circle cx="12" cy="12" r="3" fill="currentColor"/></svg>
    </div>
    <div style="flex:1;">
      <h4 style="margin:0 0 2px 0; font-size:13.5px; color:#20c997; font-weight:700;">🎯 NOVO SINAL RECEBIDO!</h4>
      <p style="margin:0; font-size:12px; color:#e9ecef;">
        <strong>${Store.escapeHtml(nome)}</strong> clicou em <em>"Quero ser localizado"</em> e apareceu no mapa!
      </p>
    </div>
    <button type="button" class="btn btn-sm btn-primary" style="padding:4px 8px; font-size:11px;" id="toast-focus-btn">Ver</button>
  `;

  toast.querySelector("#toast-focus-btn").addEventListener("click", () => {
    if (googleMap) {
      googleMap.panTo({ lat: Number(lat), lng: Number(lng) });
      googleMap.setZoom(16);
    }
    toast.remove();
  });

  container.appendChild(toast);
  setTimeout(() => toast.remove(), 7000);
}

// 8. Excluir Sessão do Firebase
async function excluirSessao(id) {
  try {
    const res = await fetch(`/api/rastreio/encerrar/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    if (res.ok) {
      await fetchTrackingFromFirebase();
      renderMarkers();
    }
  } catch (err) {
    console.error("Erro ao excluir do Firebase:", err);
  }
}

// 9. Configuração de Eventos de Interface
function setupEventListeners() {
  // Filtros
  const filterPills = document.querySelectorAll("#filter-pills-wrap .btn-map-filter");
  filterPills.forEach((btn) => {
    btn.addEventListener("click", () => {
      filterPills.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      activeFilter = btn.dataset.filter;
      renderMarkers();
    });
  });

  // Botão Centralizar Caxias-MA
  const btnCenter = document.getElementById("btn-center-caxias");
  if (btnCenter) {
    btnCenter.addEventListener("click", () => {
      if (googleMap) {
        googleMap.panTo(CAXIAS_COORDINATES);
        googleMap.setZoom(14);
      }
    });
  }

  // Abas do Painel Lateral (Alvos vs Unidades/Cidades)
  const tabAlvosBtn = document.getElementById("tab-alvos-btn");
  const tabCidadesBtn = document.getElementById("tab-cidades-btn");
  const viewAlvos = document.getElementById("view-alvos-list");
  const viewCidades = document.getElementById("view-cidades-list");

  if (tabAlvosBtn && tabCidadesBtn) {
    tabAlvosBtn.addEventListener("click", () => {
      tabAlvosBtn.classList.add("active");
      tabCidadesBtn.classList.remove("active");
      if (viewAlvos) viewAlvos.style.display = "flex";
      if (viewCidades) viewCidades.style.display = "none";
    });

    tabCidadesBtn.addEventListener("click", () => {
      tabCidadesBtn.classList.add("active");
      tabAlvosBtn.classList.remove("active");
      if (viewAlvos) viewAlvos.style.display = "none";
      if (viewCidades) {
        viewCidades.style.display = "flex";
        renderRegionalCities();
      }
    });
  }

  // Chips de acesso rápido às 5 Cidades Regionais
  document.querySelectorAll(".city-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      document.querySelectorAll(".city-chip").forEach((c) => c.classList.remove("active"));
      chip.classList.add("active");
      const cityId = chip.dataset.city;
      const targetCity = REGIONAL_CITIES.find((c) => c.id === cityId);
      if (targetCity && googleMap) {
        googleMap.panTo(targetCity.coords);
        googleMap.setZoom(targetCity.zoom);
        const coordsEl = document.getElementById("coords-display");
        if (coordsEl) {
          coordsEl.innerText = `Lat: ${targetCity.coords.lat.toFixed(6)} | Lng: ${targetCity.coords.lng.toFixed(6)} (${targetCity.nome})`;
        }
      }
    });
  });

  // Botão Limpar Banco
  const btnLimpar = document.getElementById("btn-limpar-tudo");
  if (btnLimpar) {
    btnLimpar.addEventListener("click", () => {
      showConfirmDialog("Deseja realmente apagar TODOS os alvos e localizações do banco de dados Firebase?", async () => {
        try {
          const res = await fetch("/api/rastreio/limpar-tudo", { method: "POST" });
          if (res.ok) {
            if (window.Store && Store.toast) {
              Store.toast("Banco de dados Firebase limpo com sucesso!", "success");
            }
            await fetchTrackingFromFirebase();
            renderMarkers();
          }
        } catch (err) {
          if (window.Store && Store.toast) {
            Store.toast("Erro ao limpar banco de dados.", "error");
          }
        }
      });
    });
  }

  // ==========================================
  // MODAL GERADOR DE LINK DE RASTREIO (FIREBASE)
  // ==========================================
  const btnOpenGerarRastreio = document.getElementById("btn-open-gerar-rastreio");
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

  if (btnOpenGerarRastreio && modalGerarRastreio) {
    btnOpenGerarRastreio.addEventListener("click", () => {
      modalGerarRastreio.style.display = "flex";
      if (resultLinkArea) resultLinkArea.style.display = "none";
      if (formGerarRastreio) formGerarRastreio.reset();
    });
  }

  const closeRastreioModal = () => {
    if (modalGerarRastreio) modalGerarRastreio.style.display = "none";
  };

  if (btnCloseRastreioModal) btnCloseRastreioModal.addEventListener("click", closeRastreioModal);
  if (btnDoneRastreio) btnDoneRastreio.addEventListener("click", closeRastreioModal);

  if (formGerarRastreio) {
    formGerarRastreio.addEventListener("submit", async (e) => {
      e.preventDefault();
      const fd = new FormData(formGerarRastreio);
      const nome = fd.get("nome")?.toString().trim();
      const tipo = fd.get("tipo")?.toString();
      const telefone = fd.get("telefone")?.toString().trim();
      const motivo = fd.get("motivo")?.toString().trim();

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

          inputGeneratedLink.value = fullLink;
          btnOpenTargetTest.href = fullLink;
          btnWhatsappShare.href = `https://api.whatsapp.com/send?text=${encodeURIComponent(
            `Polícia Civil do MA - SIRC: Solicitação oficial de confirmação de localização para ${nome}. Por favor, acesse o link seguro e clique em "Quero ser localizado": ${fullLink}`
          )}`;

          resultLinkArea.style.display = "block";
          if (copyConfirm) copyConfirm.style.display = "none";

          Store.addLog("Rastreamento Firebase", `Link de localização gerado no Firebase para ${nome} (${tipo}).`);

          // Sincronizar imediatamente para listar o novo alvo
          await fetchTrackingFromFirebase();
          renderMarkers();
        } else {
          if (window.Store && Store.toast) {
            Store.toast("Erro ao gravar dados no Firebase. Tente novamente.", "error");
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
    });
  }

  if (btnCopyLink && inputGeneratedLink) {
    btnCopyLink.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(inputGeneratedLink.value);
        if (copyConfirm) copyConfirm.style.display = "block";
      } catch (err) {
        inputGeneratedLink.select();
        document.execCommand("copy");
        if (copyConfirm) copyConfirm.style.display = "block";
      }
    });
  }

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

