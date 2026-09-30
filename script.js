// ============================================================
// SIRC - Sistema Integrado de Registros Criminais
// Protótipo somente de FRONT-END. Dados simulados em memória.
// ============================================================

const DAY = 1000 * 60 * 60 * 24;

const ICONS = {
  shield: '<svg viewBox="0 0 24 24" class="icon"><path d="M12 2 L20 5 V11 C20 16 16.5 20 12 22 C7.5 20 4 16 4 11 V5 Z"/></svg>',
  search: '<svg viewBox="0 0 24 24" class="icon"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
  plus: '<svg viewBox="0 0 24 24" class="icon"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
  pencil: '<svg viewBox="0 0 24 24" class="icon"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>',
  trash: '<svg viewBox="0 0 24 24" class="icon"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>',
  x: '<svg viewBox="0 0 24 24" class="icon"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
  logIn: '<svg viewBox="0 0 24 24" class="icon"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>',
  logOut: '<svg viewBox="0 0 24 24" class="icon"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>',
  dashboard: '<svg viewBox="0 0 24 24" class="icon"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>',
  fileText: '<svg viewBox="0 0 24 24" class="icon"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/></svg>',
  clipboard: '<svg viewBox="0 0 24 24" class="icon"><rect x="4" y="4" width="16" height="18" rx="2"/><path d="M9 4h6a1 1 0 0 1 1 1v1H8V5a1 1 0 0 1 1-1Z"/><line x1="8" y1="11" x2="16" y2="11"/><line x1="8" y1="15" x2="16" y2="15"/></svg>',
  users: '<svg viewBox="0 0 24 24" class="icon"><circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><circle cx="17" cy="9" r="2.6"/><path d="M15.5 14.2c2.4.4 4.5 2.5 4.5 5.8"/></svg>',
  alert: '<svg viewBox="0 0 24 24" class="icon"><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
  shieldCheck: '<svg viewBox="0 0 24 24" class="icon"><path d="M12 2 L20 5 V11 C20 16 16.5 20 12 22 C7.5 20 4 16 4 11 V5 Z"/><polyline points="9 12 11 14 15 10"/></svg>',
  shieldOff: '<svg viewBox="0 0 24 24" class="icon"><path d="M12 2 L20 5 V11 C20 16 16.5 20 12 22 C7.5 20 4 16 4 11 V5 Z"/><line x1="8" y1="9" x2="16" y2="15"/><line x1="16" y1="9" x2="8" y2="15"/></svg>',
  userPlus: '<svg viewBox="0 0 24 24" class="icon"><circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><line x1="18" y1="8" x2="18" y2="14"/><line x1="15" y1="11" x2="21" y2="11"/></svg>',
  imagePlus: '<svg viewBox="0 0 24 24" class="icon"><rect x="3" y="5" width="14" height="14" rx="2"/><circle cx="8" cy="10" r="1.5"/><path d="M4 17l4-4 3 3 3-4 3 3"/><line x1="19" y1="4" x2="19" y2="10"/><line x1="16" y1="7" x2="22" y2="7"/></svg>',
  clock: '<svg viewBox="0 0 24 24" class="icon"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15.5 14"/></svg>',
};

// ---------- Dados simulados (mock) ----------
const initialSystemUsers = [
  { id: 1, username: "admin", password: "admin123", nome: "Ana Beatriz Ferreira", perfil: "Administrador", status: "Ativo" },
  { id: 2, username: "servidor", password: "servidor123", nome: "Paulo Renato Souza", perfil: "Servidor", status: "Ativo" },
  { id: 3, username: "joao.lima", password: "joao123", nome: "João Carlos Lima", perfil: "Servidor", status: "Inativo" },
];

const initialRecords = [
  { id: 1, nome: "Bruno Cardoso Farias", numeroRegistro: "QC-2026-0091", dataNascimento: "1994-03-12", observacoes: "Sem intercorrências registradas.", foto: null, criadoEm: new Date(Date.now() - 12 * DAY) },
  { id: 2, nome: "Camila Duarte Nogueira", numeroRegistro: "QC-2026-0102", dataNascimento: "1989-11-02", observacoes: "Reincidência registrada em 2024.", foto: null, criadoEm: new Date(Date.now() - 9 * DAY) },
  { id: 3, nome: "Rafael Antunes Souza", numeroRegistro: "QC-2026-0117", dataNascimento: "2001-07-25", observacoes: "Aguardando atualização cadastral.", foto: null, criadoEm: new Date(Date.now() - 5 * DAY) },
  { id: 4, nome: "Juliana Prado Meireles", numeroRegistro: "QC-2026-0134", dataNascimento: "1997-01-30", observacoes: "Sem intercorrências registradas.", foto: null, criadoEm: new Date(Date.now() - 2 * DAY) },
];

function buildInitialLogs() {
  return [
    { id: "l1", timestamp: new Date(Date.now() - 12 * DAY), usuario: "Ana Beatriz Ferreira", acao: "Cadastro de registro", detalhe: "Registro QC-2026-0091 (Bruno Cardoso Farias) foi criado." },
    { id: "l2", timestamp: new Date(Date.now() - 9 * DAY), usuario: "Paulo Renato Souza", acao: "Cadastro de registro", detalhe: "Registro QC-2026-0102 (Camila Duarte Nogueira) foi criado." },
    { id: "l3", timestamp: new Date(Date.now() - 6 * DAY), usuario: "Ana Beatriz Ferreira", acao: "Edição de registro", detalhe: "Registro QC-2026-0102 (Camila Duarte Nogueira) foi atualizado." },
    { id: "l4", timestamp: new Date(Date.now() - 5 * DAY), usuario: "Paulo Renato Souza", acao: "Cadastro de registro", detalhe: "Registro QC-2026-0117 (Rafael Antunes Souza) foi criado." },
    { id: "l5", timestamp: new Date(Date.now() - 2 * DAY), usuario: "Ana Beatriz Ferreira", acao: "Cadastro de registro", detalhe: "Registro QC-2026-0134 (Juliana Prado Meireles) foi criado." },
  ];
}

// ---------- Estado da aplicação ----------
const state = {
  currentUser: null,
  loginError: "",
  page: "dashboard",
  records: initialRecords.map((r) => ({ ...r })),
  logs: buildInitialLogs(),
  systemUsers: initialSystemUsers.map((u) => ({ ...u })),
  searchTerm: "",
  recordModal: null,
  recordModalError: "",
  confirmDeleteId: null,
  userModalError: "",
};

// ---------- Utilitários ----------
function uid() {
  return Date.now() + Math.floor(Math.random() * 1000);
}

function escapeHtml(str) {
  return String(str == null ? "" : str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatDateTime(date) {
  return new Date(date).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

function formatDateBR(yyyyMmDd) {
  if (!yyyyMmDd) return "—";
  return new Date(yyyyMmDd + "T00:00").toLocaleDateString("pt-BR");
}

function initials(nome) {
  return nome.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase();
}

function avatarMarkup(nome, foto) {
  if (foto) return `<img class="avatar" src="${escapeHtml(foto)}" alt="${escapeHtml(nome)}" />`;
  return `<div class="avatar avatar-initials">${initials(nome)}</div>`;
}

function actionIconKey(acao) {
  if (acao.includes("Cadastro")) return "plus";
  if (acao.includes("Edição")) return "pencil";
  if (acao.includes("Exclusão")) return "trash";
  if (acao.includes("Login")) return "logIn";
  if (acao.includes("Logout")) return "logOut";
  if (acao.toLowerCase().includes("usuário")) return "users";
  return "clock";
}

function statusBadge(status) {
  const ativo = status === "Ativo";
  return `<span class="badge ${ativo ? "badge-success" : "badge-neutral"}">${status}</span>`;
}

function addLog(acao, detalhe) {
  state.logs.unshift({
    id: `l-${uid()}`,
    timestamp: new Date(),
    usuario: state.currentUser ? state.currentUser.nome : "Sistema",
    acao,
    detalhe,
  });
}

function computeStats() {
  return {
    total: state.records.length,
    ultimos30: state.records.filter((r) => Date.now() - new Date(r.criadoEm).getTime() <= 30 * DAY).length,
    acoes: state.logs.length,
    usuariosAtivos: state.systemUsers.filter((u) => u.status === "Ativo").length,
  };
}

// ============================================================
// RENDER PRINCIPAL
// ============================================================

function render() {
  const root = document.getElementById("app");
  if (!state.currentUser) {
    root.innerHTML = loginTemplate();
    attachLoginEvents();
    return;
  }
  if (state.page === "usuarios" && state.currentUser.perfil !== "Administrador") {
    state.page = "dashboard";
  }
  root.innerHTML = shellTemplate();
  attachShellEvents();
  renderPageContent();
}

// ---------- LOGIN ----------
function loginTemplate() {
  return `
    <div class="login-screen">
      <div class="login-box">
        <div class="login-brand">
          <div class="login-shield">${ICONS.shield}</div>
          <h1>SIRC</h1>
          <p class="login-sub">Sistema Integrado de Registros Criminais</p>
          <p class="login-sub-2">Delegacia de Polícia Civil de Caxias-MA</p>
        </div>
        <form class="login-form" id="login-form">
          <div class="field">
            <label>Usuário</label>
            <input type="text" name="username" placeholder="ex.: admin" autocomplete="username" />
          </div>
          <div class="field">
            <label>Senha</label>
            <input type="password" name="password" placeholder="********" autocomplete="current-password" />
          </div>
          ${state.loginError ? `<div class="form-error">${ICONS.alert}<span>${escapeHtml(state.loginError)}</span></div>` : ""}
          <button type="submit" class="btn btn-primary btn-block">${ICONS.logIn} Entrar</button>
          <div class="login-hint">
            Acesso de demonstração<br />
            Administrador: admin / admin123<br />
            Servidor: servidor / servidor123
          </div>
        </form>
      </div>
    </div>
  `;
}

function attachLoginEvents() {
  document.getElementById("login-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const username = (fd.get("username") || "").toString().trim();
    const password = (fd.get("password") || "").toString();
    const found = state.systemUsers.find((u) => u.username === username && u.password === password);
    if (!found) {
      state.loginError = "Usuário ou senha inválidos.";
      render();
      return;
    }
    if (found.status === "Inativo") {
      state.loginError = "Usuário inativo. Contate o administrador.";
      render();
      return;
    }
    state.currentUser = found;
    state.loginError = "";
    state.page = "dashboard";
    addLog("Login", `${found.nome} acessou o sistema.`);
    render();
  });
}

// ---------- SHELL (sidebar + main) ----------
function shellTemplate() {
  const navItems = [
    { key: "dashboard", label: "Visão Geral", icon: "dashboard" },
    { key: "registros", label: "Registros", icon: "fileText" },
    { key: "logs", label: "Auditoria", icon: "clipboard" },
  ];
  if (state.currentUser.perfil === "Administrador") {
    navItems.push({ key: "usuarios", label: "Usuários", icon: "users" });
  }
  const titles = {
    dashboard: ["Visão Geral", "Resumo das atividades e indicadores do sistema."],
    registros: ["Registros de Qualificação Criminal", "Cadastre, edite e consulte os registros da delegacia."],
    logs: ["Auditoria", "Histórico cronológico de todas as operações realizadas no sistema."],
    usuarios: ["Usuários", "Gerencie o acesso dos servidores ao sistema."],
  };
  const [title, subtitle] = titles[state.page];

  return `
    <div class="app-shell">
      <aside class="sidebar">
        <div class="sidebar-brand">
          <div class="brand-row">${ICONS.shield}<span class="brand-name">SIRC</span></div>
          <p class="brand-sub">Delegacia de Caxias-MA</p>
        </div>
        <nav class="sidebar-nav">
          ${navItems
            .map(
              (item) => `
            <button class="nav-item ${state.page === item.key ? "active" : ""}" data-page="${item.key}">
              ${ICONS[item.icon]} ${item.label}
            </button>
          `
            )
            .join("")}
        </nav>
        <div class="sidebar-footer">
          <div class="sidebar-user">
            ${avatarMarkup(state.currentUser.nome, null)}
            <div>
              <p class="user-name">${escapeHtml(state.currentUser.nome)}</p>
              <p class="user-role">${escapeHtml(state.currentUser.perfil)}</p>
            </div>
          </div>
          <button class="nav-item" id="btn-logout">${ICONS.logOut} Sair</button>
        </div>
      </aside>
      <main class="main">
        <div class="banner">${ICONS.alert} Protótipo somente de front-end: os dados são simulados e não persistem após atualizar a página.</div>
        <div class="page-container">
          <div class="page-header">
            <h2>${title}</h2>
            <p>${subtitle}</p>
          </div>
          <div id="page-content"></div>
        </div>
      </main>
    </div>
    <div id="modal-root"></div>
  `;
}

function attachShellEvents() {
  document.querySelectorAll(".nav-item[data-page]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.page = btn.dataset.page;
      state.searchTerm = "";
      render();
    });
  });
  document.getElementById("btn-logout").addEventListener("click", () => {
    addLog("Logout", `${state.currentUser.nome} encerrou a sessão.`);
    state.currentUser = null;
    render();
  });
}

function renderPageContent() {
  const el = document.getElementById("page-content");
  switch (state.page) {
    case "dashboard":
      el.innerHTML = dashboardTemplate();
      break;
    case "registros":
      el.innerHTML = registrosTemplate();
      attachRegistrosEvents();
      break;
    case "logs":
      el.innerHTML = logsTemplate();
      break;
    case "usuarios":
      el.innerHTML = usuariosTemplate();
      attachUsuariosEvents();
      break;
  }
}

// ---------- DASHBOARD ----------
function dashboardTemplate() {
  const stats = computeStats();
  const recent = state.logs.slice(0, 6);
  return `
    <div class="stats-grid">
      <div class="stat-card"><p class="stat-label">Total de registros</p><p class="stat-value">${stats.total}</p></div>
      <div class="stat-card"><p class="stat-label">Cadastros (30 dias)</p><p class="stat-value">${stats.ultimos30}</p></div>
      <div class="stat-card"><p class="stat-label">Ações registradas</p><p class="stat-value">${stats.acoes}</p></div>
      <div class="stat-card"><p class="stat-label">Usuários ativos</p><p class="stat-value">${stats.usuariosAtivos}</p></div>
    </div>
    <h3 class="section-title">Atividade recente</h3>
    <div class="card divide">
      ${recent
        .map(
          (log) => `
        <div class="activity-row">
          <div class="activity-icon">${ICONS[actionIconKey(log.acao)]}</div>
          <div>
            <p class="activity-text">${escapeHtml(log.detalhe)}</p>
            <p class="activity-meta">${escapeHtml(log.usuario)} &middot; ${formatDateTime(log.timestamp)}</p>
          </div>
        </div>
      `
        )
        .join("")}
    </div>
  `;
}

// ---------- REGISTROS ----------
function registrosTemplate() {
  return `
    <div class="toolbar">
      <div class="search-wrap">
        ${ICONS.search}
        <input type="text" id="search-input" placeholder="Buscar por nome ou número do registro" value="${escapeHtml(state.searchTerm)}" />
      </div>
      <button class="btn btn-primary" id="btn-new-record">${ICONS.plus} Novo registro</button>
    </div>
    <div id="records-table-wrap">${recordsTableMarkup()}</div>
  `;
}

function recordsTableMarkup() {
  const term = state.searchTerm.trim().toLowerCase();
  const filtered = state.records.filter(
    (r) => !term || r.nome.toLowerCase().includes(term) || r.numeroRegistro.toLowerCase().includes(term)
  );
  if (filtered.length === 0) {
    return `
      <div class="empty-state">
        <p>Nenhum registro encontrado para essa busca.</p>
        <p class="muted">Tente outro termo ou cadastre um novo registro.</p>
      </div>
    `;
  }
  return `
    <div class="card table-card">
      <table>
        <thead>
          <tr><th>Registro</th><th>Número</th><th>Nascimento</th><th>Cadastrado em</th><th class="text-right">Ações</th></tr>
        </thead>
        <tbody>
          ${filtered
            .map(
              (r) => `
            <tr>
              <td><div class="cell-with-avatar">${avatarMarkup(r.nome, r.foto)}<span>${escapeHtml(r.nome)}</span></div></td>
              <td>${escapeHtml(r.numeroRegistro)}</td>
              <td>${formatDateBR(r.dataNascimento)}</td>
              <td class="muted small nowrap">${formatDateTime(r.criadoEm)}</td>
              <td class="text-right">
                <button class="icon-btn btn-edit-record" data-id="${r.id}" title="Editar">${ICONS.pencil}</button>
                <button class="icon-btn icon-btn-danger btn-delete-record" data-id="${r.id}" title="Excluir">${ICONS.trash}</button>
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

function attachRegistrosEvents() {
  document.getElementById("search-input").addEventListener("input", (e) => {
    state.searchTerm = e.target.value;
    document.getElementById("records-table-wrap").innerHTML = recordsTableMarkup();
    attachRecordRowEvents();
  });
  document.getElementById("btn-new-record").addEventListener("click", openNewRecordModal);
  attachRecordRowEvents();
}

function attachRecordRowEvents() {
  document.querySelectorAll(".btn-edit-record").forEach((btn) => {
    btn.addEventListener("click", () => openEditRecordModal(Number(btn.dataset.id)));
  });
  document.querySelectorAll(".btn-delete-record").forEach((btn) => {
    btn.addEventListener("click", () => openConfirmDelete(Number(btn.dataset.id)));
  });
}

// ---------- AUDITORIA ----------
function logsTemplate() {
  return `
    <div class="card table-card">
      <table>
        <thead>
          <tr><th>Data/Hora</th><th>Usuário</th><th>Ação</th><th>Detalhe</th></tr>
        </thead>
        <tbody>
          ${state.logs
            .map(
              (log) => `
            <tr>
              <td class="muted small nowrap">${formatDateTime(log.timestamp)}</td>
              <td>${escapeHtml(log.usuario)}</td>
              <td>${escapeHtml(log.acao)}</td>
              <td class="muted">${escapeHtml(log.detalhe)}</td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `;
}

// ---------- USUÁRIOS ----------
function usuariosTemplate() {
  return `
    <div class="toolbar toolbar-end">
      <button class="btn btn-primary" id="btn-new-user">${ICONS.userPlus} Novo usuário</button>
    </div>
    <div class="card table-card">
      <table>
        <thead>
          <tr><th>Usuário</th><th>Acesso</th><th>Perfil</th><th>Status</th><th class="text-right">Ações</th></tr>
        </thead>
        <tbody>
          ${state.systemUsers
            .map((u) => {
              const isSelf = u.id === state.currentUser.id;
              return `
            <tr>
              <td><div class="cell-with-avatar">${avatarMarkup(u.nome, null)}<span>${escapeHtml(u.nome)}</span></div></td>
              <td class="muted">${escapeHtml(u.username)}</td>
              <td class="muted">${escapeHtml(u.perfil)}</td>
              <td>${statusBadge(u.status)}</td>
              <td class="text-right">
                <button class="btn btn-sm btn-toggle-user" data-id="${u.id}" ${isSelf ? 'disabled title="Você não pode alterar seu próprio status"' : ""}>
                  ${u.status === "Ativo" ? ICONS.shieldOff : ICONS.shieldCheck} ${u.status === "Ativo" ? "Desativar" : "Ativar"}
                </button>
              </td>
            </tr>
          `;
            })
            .join("")}
        </tbody>
      </table>
    </div>
  `;
}

function attachUsuariosEvents() {
  document.getElementById("btn-new-user").addEventListener("click", openNewUserModal);
  document.querySelectorAll(".btn-toggle-user").forEach((btn) => {
    if (btn.disabled) return;
    btn.addEventListener("click", () => toggleUserStatus(Number(btn.dataset.id)));
  });
}

function toggleUserStatus(id) {
  if (id === state.currentUser.id) return;
  const u = state.systemUsers.find((u) => u.id === id);
  u.status = u.status === "Ativo" ? "Inativo" : "Ativo";
  addLog("Alteração de status de usuário", `${u.nome} teve o status alterado para ${u.status}.`);
  render();
}

// ============================================================
// MODAIS
// ============================================================

function closeModal() {
  document.getElementById("modal-root").innerHTML = "";
}

// ---- Modal: novo/editar registro ----
function openNewRecordModal() {
  state.recordModal = { nome: "", numeroRegistro: "", dataNascimento: "", observacoes: "", foto: null };
  state.recordModalError = "";
  renderRecordModal();
}

function openEditRecordModal(id) {
  const r = state.records.find((r) => r.id === id);
  state.recordModal = { ...r };
  state.recordModalError = "";
  renderRecordModal();
}

function renderRecordModal() {
  const form = state.recordModal;
  const isEdit = !!form.id;
  document.getElementById("modal-root").innerHTML = `
    <div class="modal-overlay">
      <form class="modal" id="record-form">
        <div class="modal-header">
          <h3>${isEdit ? "Editar registro" : "Novo registro"}</h3>
          <button type="button" class="icon-btn" id="btn-close-record-modal">${ICONS.x}</button>
        </div>
        <div class="modal-body">
          <div class="photo-row">
            <div id="photo-preview">${avatarMarkup(form.nome || "?", form.foto)}</div>
            <label class="photo-upload-label">
              ${ICONS.imagePlus} Adicionar foto
              <input type="file" accept="image/*" id="photo-input" hidden />
            </label>
            <input type="hidden" name="foto" id="foto-hidden" value="${form.foto ? escapeHtml(form.foto) : ""}" />
          </div>
          <div class="field">
            <label>Nome completo</label>
            <input type="text" name="nome" value="${escapeHtml(form.nome || "")}" />
          </div>
          <div class="field-row">
            <div class="field">
              <label>Número do registro</label>
              <input type="text" name="numeroRegistro" placeholder="QC-2026-0000" value="${escapeHtml(form.numeroRegistro || "")}" />
            </div>
            <div class="field">
              <label>Data de nascimento</label>
              <input type="date" name="dataNascimento" value="${escapeHtml(form.dataNascimento || "")}" />
            </div>
          </div>
          <div class="field">
            <label>Observações</label>
            <textarea name="observacoes" rows="3">${escapeHtml(form.observacoes || "")}</textarea>
          </div>
          ${state.recordModalError ? `<div class="form-error">${ICONS.alert}<span>${escapeHtml(state.recordModalError)}</span></div>` : ""}
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-ghost" id="btn-cancel-record">Cancelar</button>
          <button type="submit" class="btn btn-primary">Salvar</button>
        </div>
      </form>
    </div>
  `;
  attachRecordModalEvents();
}

function attachRecordModalEvents() {
  document.getElementById("btn-close-record-modal").addEventListener("click", () => {
    state.recordModal = null;
    closeModal();
  });
  document.getElementById("btn-cancel-record").addEventListener("click", () => {
    state.recordModal = null;
    closeModal();
  });
  document.getElementById("photo-input").addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      document.getElementById("foto-hidden").value = reader.result;
      document.getElementById("photo-preview").innerHTML = `<img class="avatar" src="${reader.result}" alt="foto" />`;
    };
    reader.readAsDataURL(file);
  });
  document.getElementById("record-form").addEventListener("submit", handleRecordFormSubmit);
}

function handleRecordFormSubmit(e) {
  e.preventDefault();
  const fd = new FormData(e.target);
  const nome = (fd.get("nome") || "").toString().trim();
  const numeroRegistro = (fd.get("numeroRegistro") || "").toString().trim();
  const dataNascimento = (fd.get("dataNascimento") || "").toString();
  const observacoes = (fd.get("observacoes") || "").toString();
  const foto = (fd.get("foto") || "").toString() || null;

  if (!nome || !numeroRegistro) {
    state.recordModalError = "Preencha ao menos nome e número do registro.";
    state.recordModal = { ...state.recordModal, nome, numeroRegistro, dataNascimento, observacoes, foto };
    renderRecordModal();
    return;
  }

  if (state.recordModal.id) {
    const idx = state.records.findIndex((r) => r.id === state.recordModal.id);
    state.records[idx] = { ...state.records[idx], nome, numeroRegistro, dataNascimento, observacoes, foto };
    addLog("Edição de registro", `Registro ${numeroRegistro} (${nome}) foi atualizado.`);
  } else {
    state.records.unshift({ id: uid(), nome, numeroRegistro, dataNascimento, observacoes, foto, criadoEm: new Date() });
    addLog("Cadastro de registro", `Registro ${numeroRegistro} (${nome}) foi criado.`);
  }
  state.recordModal = null;
  closeModal();
  render();
}

// ---- Modal: confirmar exclusão ----
function openConfirmDelete(id) {
  state.confirmDeleteId = id;
  const record = state.records.find((r) => r.id === id);
  document.getElementById("modal-root").innerHTML = `
    <div class="modal-overlay">
      <div class="modal modal-sm">
        <div class="modal-header modal-header-danger">
          ${ICONS.alert}
          <h3>Excluir registro</h3>
        </div>
        <div class="modal-body">
          <p>Tem certeza que deseja excluir o registro de <strong>${escapeHtml(record.nome)}</strong>? Esta ação será registrada na auditoria e não pode ser desfeita.</p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" id="btn-cancel-delete">Cancelar</button>
          <button class="btn btn-danger" id="btn-confirm-delete">Excluir</button>
        </div>
      </div>
    </div>
  `;
  document.getElementById("btn-cancel-delete").addEventListener("click", () => {
    state.confirmDeleteId = null;
    closeModal();
  });
  document.getElementById("btn-confirm-delete").addEventListener("click", deleteRecordConfirmed);
}

function deleteRecordConfirmed() {
  const record = state.records.find((r) => r.id === state.confirmDeleteId);
  state.records = state.records.filter((r) => r.id !== state.confirmDeleteId);
  addLog("Exclusão de registro", `Registro ${record.numeroRegistro} (${record.nome}) foi excluído.`);
  state.confirmDeleteId = null;
  closeModal();
  render();
}

// ---- Modal: novo usuário ----
function openNewUserModal() {
  state.userModalError = "";
  renderUserModal();
}

function renderUserModal() {
  document.getElementById("modal-root").innerHTML = `
    <div class="modal-overlay">
      <form class="modal modal-sm" id="user-form">
        <div class="modal-header">
          <h3>Novo usuário</h3>
          <button type="button" class="icon-btn" id="btn-close-user-modal">${ICONS.x}</button>
        </div>
        <div class="modal-body">
          <div class="field"><label>Nome completo</label><input type="text" name="nome" /></div>
          <div class="field"><label>Usuário de acesso</label><input type="text" name="username" /></div>
          <div class="field"><label>Senha</label><input type="password" name="password" /></div>
          <div class="field">
            <label>Perfil</label>
            <select name="perfil">
              <option value="Servidor">Servidor</option>
              <option value="Administrador">Administrador</option>
            </select>
          </div>
          ${state.userModalError ? `<div class="form-error">${ICONS.alert}<span>${escapeHtml(state.userModalError)}</span></div>` : ""}
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-ghost" id="btn-cancel-user">Cancelar</button>
          <button type="submit" class="btn btn-primary">Salvar</button>
        </div>
      </form>
    </div>
  `;
  document.getElementById("btn-close-user-modal").addEventListener("click", closeModal);
  document.getElementById("btn-cancel-user").addEventListener("click", closeModal);
  document.getElementById("user-form").addEventListener("submit", handleUserFormSubmit);
}

function handleUserFormSubmit(e) {
  e.preventDefault();
  const fd = new FormData(e.target);
  const nome = (fd.get("nome") || "").toString().trim();
  const username = (fd.get("username") || "").toString().trim();
  const password = (fd.get("password") || "").toString().trim();
  const perfil = (fd.get("perfil") || "Servidor").toString();

  if (!nome || !username || !password) {
    state.userModalError = "Preencha todos os campos.";
    renderUserModal();
    return;
  }
  if (state.systemUsers.some((u) => u.username === username)) {
    state.userModalError = "Já existe um usuário com esse nome de acesso.";
    renderUserModal();
    return;
  }
  const newUser = { id: uid(), nome, username, password, perfil, status: "Ativo" };
  state.systemUsers.push(newUser);
  addLog("Criação de usuário", `Usuário ${nome} (${username}) foi criado com perfil ${perfil}.`);
  closeModal();
  render();
}

// ============================================================
// INICIALIZAÇÃO
// ============================================================
document.addEventListener("DOMContentLoaded", render);
