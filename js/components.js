// ============================================================
// SIRC — Componentes de Interface & Layout
// Menu lateral restrito exatamente às funções solicitadas:
// Visão Geral, Registros, Auditoria, Chats, Usuários e Configurações
// ============================================================

window.Components = {
  initLayout(activePageKey) {
    const user = Store.requireAuth();
    if (!user) return;

    this.renderSidebar(activePageKey, user);
    this.initInstantRouter();
  },

  renderSidebar(activePageKey, user) {
    const sidebarEl = document.getElementById("app-sidebar");
    if (!sidebarEl) return;

    const navItems = [
      { key: "dashboard", label: "Visão Geral", icon: "dashboard", href: "dashboard.html" },
      { key: "registros", label: "Registros", icon: "fileText", href: "registros.html" },
      { key: "mapa", label: "Localizador", icon: "mapPin", href: "mapa.html" },
      { key: "auditoria", label: "Auditoria", icon: "clipboardCheck", href: "auditoria.html" },
      { key: "chats", label: "Chats", icon: "messageSquare", href: "chats.html" },
      { key: "usuarios", label: "Usuários", icon: "users", href: "usuarios.html" },
      { key: "configuracoes", label: "Configurações", icon: "settings", href: "#configuracoes" },
    ];

    // Ícones fieis com proporção e formato idênticos ao layout da Polícia Civil
    const iconsMap = {
      dashboard: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/></svg>`,
      fileText: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`,
      mapPin: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`,
      clipboardCheck: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/><line x1="9" y1="11" x2="15" y2="11"/><line x1="9" y1="15" x2="15" y2="15"/></svg>`,
      messageSquare: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
      users: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
      settings: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
      logOut: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>`
    };

    sidebarEl.className = "sidebar";
    sidebarEl.innerHTML = `
      <div class="sidebar-brand">
        <div class="brand-row" style="display:flex; align-items:center; gap:12px;">
          <div class="brand-logo-wrap" style="width:42px; height:42px; display:flex; align-items:center; justify-content:center;">
            <img src="logo/CC7FE128-476B-49EC-89EF-4E84B0430993.png" alt="Polícia Civil" class="brand-logo-img" style="width:38px; height:auto;" />
          </div>
          <div>
            <h1 class="brand-name" style="font-size:20px; font-weight:800; color:#ffffff; margin:0; line-height:1.1;">SIRC</h1>
            <p class="brand-sub" style="font-size:11px; color:#fab005; margin:2px 0 0 0; font-weight:500;">Polícia Civil do Maranhão</p>
          </div>
        </div>
      </div>

      <nav class="sidebar-nav" style="padding-top: 16px;">
        ${navItems
          .map(
            (item) => `
          <a href="${item.href}" class="nav-item ${activePageKey === item.key ? "active" : ""}" data-nav-key="${item.key}">
            ${iconsMap[item.icon] || ""}
            <span>${item.label}</span>
          </a>
        `
          )
          .join("")}
      </nav>

      <div class="sidebar-footer" style="padding: 14px 12px; border-top: 1px solid rgba(255,255,255,0.06);">
        <div class="sidebar-user" style="display:flex; align-items:center; gap:10px; margin-bottom:10px;">
          <div style="width:36px; height:36px; border-radius:50%; background: #2c2514; border: 1.5px solid #fab005; color: #fab005; font-weight:700; font-size:13px; display:flex; align-items:center; justify-content:center; flex-shrink:0;">
            AF
          </div>
          <div style="flex:1; min-width:0;">
            <p class="user-name" style="font-size:13px; font-weight:700; color:#ffffff; margin:0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">Ana Ferreira</p>
            <p class="user-role" style="font-size:10.5px; color:#868e96; margin:0; text-transform:uppercase; letter-spacing:0.5px;">ADMINISTRADOR</p>
          </div>
        </div>
        <button class="nav-item" id="btn-logout" type="button" style="width:100%; border:none; background:none; cursor:pointer; color:#868e96; display:flex; align-items:center; gap:10px; padding:8px 12px; border-radius:8px;">
          ${iconsMap.logOut}
          <span>Sair</span>
        </button>
      </div>
    `;

    // Ação do botão de Logout
    document.getElementById("btn-logout")?.addEventListener("click", () => {
      Store.logout();
    });

    // Ação do item Configurações
    sidebarEl.querySelector('[data-nav-key="configuracoes"]')?.addEventListener("click", (e) => {
      e.preventDefault();
      this.openSettingsModal();
    });
  },

  closeSettingsModal() {
    const modal = document.getElementById("modal-settings-dialog");
    if (modal) {
      modal.remove();
    }
    document.querySelectorAll(".modal-overlay").forEach((el) => {
      if (el.querySelector("#btn-save-settings") || el.id === "modal-settings-dialog") {
        el.remove();
      }
    });
  },

  saveSettingsModal() {
    const notifEl = document.getElementById("setting-notificacoes");
    const temaEl = document.getElementById("setting-tema");
    const unidadeEl = document.getElementById("setting-unidade");

    const updated = {
      notificacoes: notifEl ? notifEl.checked : true,
      temaEscuro: temaEl ? temaEl.checked : true,
      criptografia: true,
      unidade: unidadeEl ? unidadeEl.value : "1ª Delegacia Regional de Polícia Civil — Caxias / MA"
    };

    if (window.Store && Store.saveSettings) {
      Store.saveSettings(updated);
    }
    if (temaEl) {
      document.body.classList.toggle("light-mode", !temaEl.checked);
    }
    if (window.Store && Store.toast) {
      Store.toast("Preferências salvas com sucesso!", "success");
    }
    this.closeSettingsModal();
  },

  openSettingsModal() {
    this.closeSettingsModal();

    const settings = window.Store && Store.getSettings ? Store.getSettings() : {
      notificacoes: true,
      temaEscuro: true,
      criptografia: true,
      unidade: "1ª Delegacia Regional de Polícia Civil — Caxias / MA"
    };

    const modal = document.createElement("div");
    modal.id = "modal-settings-dialog";
    modal.className = "modal-overlay";
    modal.innerHTML = `
      <div class="modal-card" style="max-width: 520px; width: 90%;">
        <div class="modal-header">
          <div style="display:flex; align-items:center; gap:10px;">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#fab005" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            <h3 style="margin:0; font-size:16px; font-weight:700; color:#fff;">Configurações do Sistema</h3>
          </div>
          <button type="button" class="btn-icon" id="btn-close-settings-modal" onclick="Components.closeSettingsModal()" style="background:none; border:none; color:#adb5bd; cursor:pointer; font-size:18px;">✕</button>
        </div>
        <div class="modal-body" style="padding: 20px 24px; display:flex; flex-direction:column; gap:16px;">
          <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); border-radius:10px; padding:14px;">
            <label for="setting-unidade" style="margin:0 0 6px 0; font-size:13px; color:#fff; display:block; font-weight:600;">Unidade Policial</label>
            <select id="setting-unidade" style="width:100%; padding:8px 12px; background:#0b1324; border:1px solid rgba(59,130,246,0.3); border-radius:8px; color:#e2e8f0; font-size:12.5px; outline:none; cursor:pointer;">
              <option value="1ª Delegacia Regional de Polícia Civil — Caxias / MA" ${settings.unidade?.includes("Regional") ? "selected" : ""}>1ª Delegacia Regional de Polícia Civil — Caxias / MA</option>
              <option value="Delegacia do 1º Distrito Policial — Caxias / MA" ${settings.unidade?.includes("1º Distrito") ? "selected" : ""}>Delegacia do 1º Distrito Policial — Caxias / MA</option>
              <option value="Delegacia Especial da Mulher (DEM) — Caxias / MA" ${settings.unidade?.includes("Mulher") ? "selected" : ""}>Delegacia Especial da Mulher (DEM) — Caxias / MA</option>
              <option value="DHPP — Delegacia de Homicídios — Caxias / MA" ${settings.unidade?.includes("Homicídios") || settings.unidade?.includes("DHPP") ? "selected" : ""}>DHPP — Delegacia de Homicídios e Proteção à Pessoa — Caxias / MA</option>
            </select>
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center; padding:10px 0; border-bottom:1px solid rgba(255,255,255,0.06);">
            <div>
              <strong style="font-size:13px; color:#fff; display:block;">Notificações Sonoras e Visuais</strong>
              <span style="font-size:11.5px; color:#94a3b8;">Alertas instantâneos para novas ocorrências e despachos</span>
            </div>
            <input type="checkbox" id="setting-notificacoes" ${settings.notificacoes !== false ? "checked" : ""} style="accent-color:#2563eb; width:18px; height:18px; cursor:pointer;" />
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center; padding:10px 0; border-bottom:1px solid rgba(255,255,255,0.06);">
            <div>
              <strong style="font-size:13px; color:#fff; display:block;">Criptografia e Registro em Auditoria</strong>
              <span style="font-size:11.5px; color:#94a3b8;">Gravação automática de logs com carimbo de tempo seguro</span>
            </div>
            <input type="checkbox" checked disabled style="accent-color:#2563eb; width:18px; height:18px; cursor:not-allowed; opacity:0.75;" />
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center; padding:10px 0;">
            <div>
              <strong style="font-size:13px; color:#fff; display:block;">Tema Tático Operacional</strong>
              <span style="font-size:11.5px; color:#94a3b8;">Modo escuro de alto contraste otimizado para operações</span>
            </div>
            <input type="checkbox" id="setting-tema" ${settings.temaEscuro !== false ? "checked" : ""} style="accent-color:#2563eb; width:18px; height:18px; cursor:pointer;" />
          </div>
        </div>
        <div class="modal-footer" style="padding:14px 24px; border-top:1px solid rgba(255,255,255,0.06); display:flex; justify-content:flex-end; gap:10px;">
          <button type="button" class="btn btn-secondary" id="btn-cancel-settings" onclick="Components.closeSettingsModal()">Fechar</button>
          <button type="button" class="btn btn-primary" id="btn-save-settings" onclick="Components.saveSettingsModal()">Salvar Preferências</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        window.removeEventListener("keydown", onKeyDown);
        this.closeSettingsModal();
      }
    };
    window.addEventListener("keydown", onKeyDown);

    modal.addEventListener("click", (e) => {
      if (e.target === modal) this.closeSettingsModal();
    });
  },

  initInstantRouter() {
    if (this._routerInitialized) return;
    this._routerInitialized = true;

    if (!window._pageCache) {
      window._pageCache = new Map();
    }

    const pagesToPrefetch = [
      "dashboard.html",
      "registros.html",
      "mapa.html",
      "auditoria.html",
      "chats.html",
      "usuarios.html"
    ];

    const prefetch = async (url) => {
      if (!url || window._pageCache.has(url)) return;
      try {
        const res = await fetch(url);
        if (res.ok) {
          const text = await res.text();
          window._pageCache.set(url, text);
          const simpleName = url.replace(".html", "");
          window._pageCache.set(simpleName, text);
        }
      } catch (e) {}
    };

    // Pre-cache current page in memory
    const curPath = window.location.pathname.split("/").pop() || "dashboard.html";
    if (document.documentElement) {
      window._pageCache.set(curPath, document.documentElement.outerHTML);
    }

    // Prefetch all internal pages immediately
    pagesToPrefetch.forEach(prefetch);

    // Global click interceptor for instant 0ms SPA transitions
    document.addEventListener("click", (e) => {
      const link = e.target.closest("a");
      if (!link) return;

      if (link.getAttribute("data-nav-key") === "configuracoes") {
        e.preventDefault();
        this.openSettingsModal();
        return;
      }

      const href = link.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("http://") || href.startsWith("https://") || href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("javascript:")) {
        return;
      }

      const clean = href.split("?")[0].split("#")[0];
      const validPages = ["dashboard.html", "registros.html", "mapa.html", "auditoria.html", "chats.html", "usuarios.html", "dashboard", "registros", "mapa", "auditoria", "chats", "usuarios"];
      if (!validPages.includes(clean)) return;

      e.preventDefault();
      this.navigateTo(href);
    });

    // Prefetch on hover/pointerover for zero-delay response
    document.addEventListener("pointerover", (e) => {
      const link = e.target.closest("a");
      if (!link) return;
      const href = link.getAttribute("href");
      if (href && !href.startsWith("#") && !href.startsWith("http")) {
        prefetch(href);
      }
    });

    // Support browser back/forward buttons
    window.addEventListener("popstate", () => {
      const path = window.location.pathname.split("/").pop() || "dashboard.html";
      this.navigateTo(path, false);
    });
  },

  async navigateTo(url, pushState = true) {
    if (!url) return;
    const cleanUrl = url.split("?")[0].split("#")[0];
    const pageName = cleanUrl.split("/").pop() || "dashboard.html";

    // Determine target module
    let targetKey = "dashboard";
    if (pageName.includes("registros")) targetKey = "registros";
    else if (pageName.includes("mapa")) targetKey = "mapa";
    else if (pageName.includes("auditoria")) targetKey = "auditoria";
    else if (pageName.includes("chats")) targetKey = "chats";
    else if (pageName.includes("usuarios")) targetKey = "usuarios";

    // 1. Instant feedback: highlight the sidebar item immediately (0ms)
    document.querySelectorAll(".sidebar-nav .nav-item").forEach((item) => {
      const itemKey = item.getAttribute("data-nav-key");
      item.classList.toggle("active", itemKey === targetKey);
    });

    if (pushState) {
      window.history.pushState({ page: targetKey, url }, "", url);
    }

    // 2. Retrieve HTML from memory or fetch
    let html = window._pageCache?.get(url) || window._pageCache?.get(cleanUrl) || window._pageCache?.get(pageName);
    if (!html) {
      try {
        const res = await fetch(url);
        html = await res.text();
        if (window._pageCache) {
          window._pageCache.set(url, html);
          window._pageCache.set(pageName, html);
        }
      } catch (err) {
        window.location.href = url;
        return;
      }
    }

    // 3. Parse target DOM
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    if (doc.title) {
      document.title = doc.title;
    }

    // Inject any new stylesheets into document head
    const styleLinks = doc.querySelectorAll('link[rel="stylesheet"]');
    styleLinks.forEach((link) => {
      const href = link.getAttribute("href");
      if (href && !document.querySelector(`link[href="${href}"]`)) {
        const newLink = document.createElement("link");
        newLink.rel = "stylesheet";
        newLink.href = href;
        document.head.appendChild(newLink);
      }
    });

    // Replace <main> instantaneously
    const newMain = doc.querySelector("main");
    const currentMain = document.querySelector("main");
    if (newMain && currentMain) {
      currentMain.className = newMain.className;
      currentMain.innerHTML = newMain.innerHTML;
      currentMain.scrollTop = 0;
    }

    // Clear modal-root
    const currentModalRoot = document.getElementById("modal-root");
    if (currentModalRoot) {
      currentModalRoot.innerHTML = "";
    }

    // Page-specific script mapping and execution
    const targetScriptMap = {
      registros: { file: "js/registros.js", init: "initRegistrosPage" },
      dashboard: { file: "js/dashboard.js", init: "initDashboardPage" },
      auditoria: { file: "js/auditoria.js", init: "initAuditoriaPage" },
      chats: { file: "js/chats.js", init: "initChatsPage" },
      usuarios: { file: "js/usuarios.js", init: "initUsuariosPage" },
      mapa: { file: "js/mapa.js", init: "initMapaPage" }
    };

    const targetConfig = targetScriptMap[targetKey];
    if (targetConfig) {
      if (typeof window[targetConfig.init] === "function") {
        window[targetConfig.init]();
      } else {
        const existing = document.querySelector(`script[data-page-module="${targetKey}"]`);
        if (!existing) {
          const scriptEl = document.createElement("script");
          scriptEl.src = `${targetConfig.file}?v=${Date.now()}`;
          scriptEl.setAttribute("data-page-module", targetKey);
          scriptEl.onload = () => {
            if (typeof window[targetConfig.init] === "function") {
              window[targetConfig.init]();
            }
          };
          document.body.appendChild(scriptEl);
        }
      }
    }

    window.scrollTo(0, 0);
  }
};
