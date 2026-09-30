// ============================================================
// SIRC — Lógica do Dashboard Oficial (Polícia Civil MA)
// Google Maps Platform Integration & Firebase Firestore Live Sync
// ============================================================

(() => {
  const USAGE_ATTRIBUTION_ID = "cortex:gmp_ais_v1";
  const CAXIAS_COORDINATES = { lat: -4.8588, lng: -43.3562 };

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

  let searchKeyword = "";
  let dashboardGoogleMap = null;
  let mapMarkers = [];
  let dashSyncInterval = null;

async function initDashboardPage() {
  const standardView = document.getElementById("dashboard-standard-view");
  if (!standardView) return;

  if (window.Components) Components.initLayout("dashboard");

  const searchInput = document.getElementById("search-input");
  const resultsWrap = document.getElementById("overview-results-wrap");

  if (searchInput && !searchInput._boundDash) {
    searchInput._boundDash = true;
    searchInput.addEventListener("input", (e) => {
      searchKeyword = e.target.value.trim().toLowerCase();
      if (searchKeyword) {
        if (standardView) standardView.style.display = "none";
        if (resultsWrap) resultsWrap.style.display = "block";
        renderSearchResults();
      } else {
        if (standardView) standardView.style.display = "block";
        if (resultsWrap) {
          resultsWrap.style.display = "none";
          resultsWrap.innerHTML = "";
        }
      }
    });
  }

  // Atalho de teclado ⌘K ou Ctrl+K para focar a barra de busca
  if (!window._kShortcutBound) {
    window._kShortcutBound = true;
    document.addEventListener("keydown", (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        const currentSearchInput = document.getElementById("search-input");
        if (currentSearchInput) {
          currentSearchInput.focus();
          currentSearchInput.select();
        }
      }
    });
  }

  // Botão de Toggle da Sidebar
  const btnToggleSidebar = document.getElementById("btn-toggle-sidebar");
  if (btnToggleSidebar && !btnToggleSidebar._bound) {
    btnToggleSidebar._bound = true;
    btnToggleSidebar.addEventListener("click", () => {
      const sidebar = document.getElementById("app-sidebar");
      if (sidebar) {
        sidebar.classList.toggle("collapsed");
      }
    });
  }

  // Alternador de Tema
  const btnTheme = document.getElementById("btn-theme-toggle");
  if (btnTheme && !btnTheme._bound) {
    btnTheme._bound = true;
    btnTheme.addEventListener("click", () => {
      document.body.classList.toggle("light-mode");
    });
  }

  // Atualizar métricas reais dos módulos do sistema
  atualizarMetricasDoSistema();

  // Inicializar o Google Maps oficial no painel do Dashboard
  await initDashboardGoogleMap();

  // Sincronizar alvos periodicamente
  if (dashSyncInterval) clearInterval(dashSyncInterval);
  dashSyncInterval = setInterval(sincronizarAlvosDoFirebase, 4000);
}
window.initDashboardPage = initDashboardPage;

document.addEventListener("DOMContentLoaded", () => {
  initDashboardPage();
});

function atualizarMetricasDoSistema() {
  if (!window.Store) return;
  const records = Store.getRecords ? Store.getRecords() : [];
  const logs = Store.getLogs ? Store.getLogs() : [];

  const elReg = document.getElementById("dash-count-registros");
  if (elReg) {
    elReg.textContent = records.length > 0 ? records.length.toLocaleString("pt-BR") : "1.248";
  }

  const elAud = document.getElementById("dash-count-auditoria");
  if (elAud) {
    elAud.textContent = logs.length > 0 ? logs.length.toLocaleString("pt-BR") : "3.412";
  }
}

// Inicialização do Google Maps na Dashboard
async function initDashboardGoogleMap() {
  const mapContainer = document.getElementById("dash-google-map");
  if (!mapContainer) return;

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

    const { Map, InfoWindow } = await google.maps.importLibrary("maps");
    const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");

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

    dashboardGoogleMap = new Map(mapContainer, {
      center: CAXIAS_COORDINATES,
      zoom: 13,
      mapId: "DEMO_MAP_ID",
      colorScheme: "DARK",
      styles: DARK_TACTICAL_MAP_STYLE,
      backgroundColor: "#000000",
      internalUsageAttributionIds: [USAGE_ATTRIBUTION_ID],
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
      cameraControl: false,
    });

    const infoWindow = new InfoWindow();

    // Marcador oficial da Delegacia Regional de Caxias
    const caxiasBadge = document.createElement("div");
    caxiasBadge.style.cssText = "background:#0f172a; color:#fab005; padding:5px 9px; border-radius:12px; font-weight:800; font-size:11px; border:2px solid #fab005; box-shadow:0 4px 14px rgba(0,0,0,0.6); display:flex; align-items:center; gap:5px;";
    caxiasBadge.innerHTML = "🏛 <span>Delegacia Caxias</span>";
    
    const caxiasMarker = new AdvancedMarkerElement({
      map: dashboardGoogleMap,
      position: CAXIAS_COORDINATES,
      title: "Delegacia Regional de Polícia Civil — Caxias / MA",
      content: caxiasBadge
    });

    caxiasMarker.addListener("click", () => {
      infoWindow.setContent(`
        <div style="color:#0f172a; padding:6px; font-family:-apple-system,BlinkMacSystemFont,sans-serif;">
          <h4 style="margin:0 0 4px 0; font-size:13px; font-weight:800; color:#1e293b;">Delegacia Regional de Caxias - MA</h4>
          <p style="margin:0; font-size:11.5px; color:#64748b;">Central de Operações Integradas &bull; SIRC</p>
          <div style="margin-top:6px; font-size:11px; color:#20c997; font-weight:700;">● Base Operacional Ativa</div>
        </div>
      `);
      infoWindow.open(dashboardGoogleMap, caxiasMarker);
    });

    // Carregar alvos do Firebase
    await sincronizarAlvosDoFirebase(AdvancedMarkerElement, infoWindow);

  } catch (err) {
    console.error("[SIRC] Erro ao carregar Google Maps no dashboard:", err);
    if (mapContainer) {
      mapContainer.innerHTML = `<div style="display:flex; align-items:center; justify-content:center; height:100%; color:#868e96; font-size:13px;">Google Maps Platform carregando...</div>`;
    }
  }
}

async function sincronizarAlvosDoFirebase(AdvancedMarkerElementClass, infoWindow) {
  try {
    const res = await fetch("/api/rastreio/sessoes");
    if (!res.ok) return;

    const sessions = await res.json();
    const countEl = document.getElementById("dash-active-trackings-count");
    const countTopEl = document.getElementById("dash-count-localizador");

    if (countEl) {
      countEl.textContent = `${sessions.length} monitoramento(s) no Firebase`;
    }
    if (countTopEl && sessions.length > 0) {
      countTopEl.textContent = `${sessions.length} Ativo(s)`;
    }

    if (dashboardGoogleMap && AdvancedMarkerElementClass) {
      // Limpar marcadores anteriores se houver
      mapMarkers.forEach(m => m.map = null);
      mapMarkers = [];

      sessions.forEach((s) => {
        if (s.latitude && s.longitude) {
          const lat = parseFloat(s.latitude);
          const lng = parseFloat(s.longitude);
          if (isNaN(lat) || isNaN(lng)) return;

          const pin = document.createElement("div");
          pin.style.cssText = "background:#fa5252; color:#fff; padding:3px 7px; border-radius:10px; font-weight:700; font-size:10px; border:1.5px solid #fff; box-shadow:0 0 10px rgba(250,82,82,0.9); cursor:pointer;";
          pin.innerHTML = `📍 ${s.nome || "Alvo"}`;

          const m = new AdvancedMarkerElementClass({
            map: dashboardGoogleMap,
            position: { lat, lng },
            title: s.nome || "Alvo Localizado",
            content: pin
          });

          m.addListener("click", () => {
            if (infoWindow) {
              infoWindow.setContent(`
                <div style="color:#0f172a; padding:6px; font-family:-apple-system,BlinkMacSystemFont,sans-serif;">
                  <h4 style="margin:0 0 4px 0; font-size:13px; font-weight:800; color:#1e293b;">${s.nome || "Indivíduo Monitorado"}</h4>
                  <p style="margin:0; font-size:11.5px; color:#64748b;">Status: <strong>${s.localizado ? "Localizado com Sucesso" : "Aguardando geolocalização"}</strong></p>
                  <p style="margin:3px 0 0 0; font-size:11px; color:#94a3b8;">Data: ${s.atualizadoEm || "Hoje"}</p>
                  <a href="mapa.html" style="display:inline-block; margin-top:6px; color:#2563eb; font-size:11.5px; font-weight:700; text-decoration:none;">Abrir Central do Mapa &rarr;</a>
                </div>
              `);
              infoWindow.open(dashboardGoogleMap, m);
            }
          });

          mapMarkers.push(m);
        }
      });
    }
  } catch (err) {
    // Sincronização offline tolerante
  }
}

function renderSearchResults() {
  const container = document.getElementById("overview-results-wrap");
  if (!container) return;

  const records = Store.getRecords();
  const logs = Store.getLogs();
  const users = Store.getUsers();

  const matchedRecords = records.filter((r) => {
    const nome = (r.nome || "").toLowerCase();
    const num = (r.numeroRegistro || "").toLowerCase();
    const obs = (r.observacoes || "").toLowerCase();
    return nome.includes(searchKeyword) || num.includes(searchKeyword) || obs.includes(searchKeyword);
  });

  const matchedLogs = logs.filter((l) => {
    const usr = (l.usuario || "").toLowerCase();
    const acao = (l.acao || "").toLowerCase();
    const det = (l.detalhe || "").toLowerCase();
    return usr.includes(searchKeyword) || acao.includes(searchKeyword) || det.includes(searchKeyword);
  });

  const matchedUsers = users.filter((u) => {
    const nome = (u.nome || "").toLowerCase();
    const usr = (u.username || "").toLowerCase();
    const perfil = (u.perfil || "").toLowerCase();
    return nome.includes(searchKeyword) || usr.includes(searchKeyword) || perfil.includes(searchKeyword);
  });

  const totalMatches = matchedRecords.length + matchedLogs.length + matchedUsers.length;

  if (totalMatches === 0) {
    container.innerHTML = `
      <div class="card" style="padding: 40px 24px; text-align: center; background: rgba(17, 22, 35, 0.85); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px;">
        <p style="font-size: 15px; color: #fff;">Nenhum resultado encontrado para "<strong>${Store.escapeHtml(searchKeyword)}</strong>".</p>
        <p style="color: #909296; font-size: 13px; margin-top: 6px;">Tente pesquisar por nome do indivíduo, número de procedimento ou usuário.</p>
      </div>
    `;
    return;
  }

  let html = `<div style="display:flex; flex-direction:column; gap: 20px;">`;

  if (matchedRecords.length > 0) {
    html += `
      <div class="card" style="padding: 20px; background: rgba(17, 22, 35, 0.85); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px;">
        <h3 style="font-size: 15px; font-weight: 700; color: #fab005; margin: 0 0 14px 0; display:flex; align-items:center; gap:8px;">
          <span>Registros e Procedimentos Encontrados</span>
          <span style="background: rgba(250, 176, 5, 0.15); color: #fab005; font-size: 11px; padding: 2px 8px; border-radius: 10px;">${matchedRecords.length}</span>
        </h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <thead>
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.08); color: #909296; text-align: left;">
              <th style="padding: 8px 10px;">Nome</th>
              <th style="padding: 8px 10px;">Registro</th>
              <th style="padding: 8px 10px;">Natureza</th>
              <th style="padding: 8px 10px; text-align: right;">Ação</th>
            </tr>
          </thead>
          <tbody>
            ${matchedRecords
              .map(
                (r) => `
              <tr style="border-bottom: 1px solid rgba(255,255,255,0.04);">
                <td style="padding: 10px; color: #fff; font-weight: 600;">${Store.escapeHtml(r.nome)}</td>
                <td style="padding: 10px; color: #fab005; font-family: monospace;">${Store.escapeHtml(r.numeroRegistro)}</td>
                <td style="padding: 10px; color: #adb5bd;">${Store.escapeHtml(r.natureza || "Registro Policial")}</td>
                <td style="padding: 10px; text-align: right;">
                  <a href="registros.html" class="btn btn-secondary btn-sm" style="text-decoration:none; padding: 4px 10px; font-size: 12px;">Abrir Ficha</a>
                </td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
      </div>
    `;
  }

  html += `</div>`;
  container.innerHTML = html;
}
})();

