
(() => {
const DAY = 1000 * 60 * 60 * 24;

const initialSystemUsers = [
  {
    id: 1,
    username: "admin",
    password: "admin@sirc",
    nome: "Administrador",
    perfil: "Administrador",
    status: "Ativo",
  },
];

const initialRecords = [];
const initialPoliceUnits = [];

function buildInitialLogs() {
  return [];
}

function buildInitialChats() {
  return [];
}

const STORAGE_KEYS = {
  USERS: "sirc_users",
  RECORDS: "sirc_records",
  LOGS: "sirc_logs",
  CURRENT_USER: "sirc_current_user",
  CHATS: "sirc_chats",
};

window.Store = {
  reset() {
    Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
    this.init();
    console.info("[SIRC] Dados resetados. Sistema iniciado com estado limpo.");
  },

  init() {
    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(initialSystemUsers));
    }
    if (!localStorage.getItem(STORAGE_KEYS.RECORDS)) {
      localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(initialRecords));
    }
    if (!localStorage.getItem(STORAGE_KEYS.LOGS)) {
      localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(buildInitialLogs()));
    }
    if (!localStorage.getItem(STORAGE_KEYS.CHATS)) {
      localStorage.setItem(STORAGE_KEYS.CHATS, JSON.stringify(buildInitialChats()));
    }
  },

  getSettings() {
    try {
      return JSON.parse(localStorage.getItem("sirc_settings")) || {
        notificacoes: true,
        temaEscuro: true,
        criptografia: true
      };
    } catch {
      return { notificacoes: true, temaEscuro: true, criptografia: true };
    }
  },
  saveSettings(settings) {
    localStorage.setItem("sirc_settings", JSON.stringify(settings));
  },

  toast(message, type = "success") {
    let container = document.getElementById("sirc-toast-container");
    if (!container) {
      container = document.createElement("div");
      container.id = "sirc-toast-container";
      container.style.cssText = "position:fixed; bottom:28px; right:28px; z-index:99999; display:flex; flex-direction:column; gap:10px; pointer-events:none;";
      document.body.appendChild(container);
    }

    const toast = document.createElement("div");
    toast.style.cssText = "pointer-events:auto; display:flex; align-items:center; gap:10px; padding:12px 20px; border-radius:12px; font-size:13.5px; font-weight:600; font-family:-apple-system,BlinkMacSystemFont,sans-serif; color:#ffffff; background:#0f172a; border:1px solid " + (type === "success" ? "#20c997" : "#2563eb") + "; box-shadow:0 12px 36px rgba(0,0,0,0.6); backdrop-filter:blur(16px); transform:translateY(12px); opacity:0; transition:all 0.25s cubic-bezier(0.16,1,0.3,1);";
    
    const iconSvg = type === "success" 
      ? '<span style="color:#20c997; font-size:16px; font-weight:bold;">✓</span>' 
      : '<span style="color:#38bdf8; font-size:16px;">ℹ</span>';
    
    toast.innerHTML = `${iconSvg}<span>${Store.escapeHtml(message)}</span>`;
    container.appendChild(toast);

    requestAnimationFrame(() => {
      toast.style.transform = "translateY(0)";
      toast.style.opacity = "1";
    });

    setTimeout(() => {
      toast.style.transform = "translateY(10px)";
      toast.style.opacity = "0";
      setTimeout(() => toast.remove(), 250);
    }, 3200);
  },

  getChats() {
    this.init();
    try {
      let chats = JSON.parse(localStorage.getItem(STORAGE_KEYS.CHATS)) || [];
      chats = chats.filter((c) => c.id !== "ia_sirc" && c.type !== "ai" && c.id !== "direct_paulo");

      chats.forEach((c) => {
        if (c.messages) {
          c.messages = c.messages.filter(
            (m) => m.username !== "servidor" && m.sender !== "Paulo Renato Souza" && m.username !== "sirc_ai"
          );
        }
      });

      return chats;
    } catch {
      return [];
    }
  },
  saveChats(chats) {
    localStorage.setItem(STORAGE_KEYS.CHATS, JSON.stringify(chats));
  },
  getChatById(chatId) {
    const chats = this.getChats();
    return chats.find((c) => c.id === chatId) || null;
  },
  addChatMessage(chatId, text) {
    const chats = this.getChats();
    const chat = chats.find((c) => c.id === chatId);
    if (!chat) return null;

    const currentUser = this.getCurrentUser() || { nome: "Sistema", username: "sistema", perfil: "Servidor" };
    const newMsg = {
      id: `m-${this.uid()}`,
      sender: currentUser.nome,
      username: currentUser.username,
      perfil: currentUser.perfil,
      text,
      timestamp: new Date().toISOString(),
    };

    chat.messages.push(newMsg);
    this.saveChats(chats);

    return newMsg;
  },
  deleteChat(chatId) {
    const chats = this.getChats();
    const chat = chats.find((c) => c.id === chatId);
    const filtered = chats.filter((c) => c.id !== chatId);
    this.saveChats(filtered);
    return chat;
  },

  getUsers() {
    this.init();
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS)) || [];
    } catch {
      return initialSystemUsers;
    }
  },
  saveUsers(users) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  },
  addUser(user) {
    const users = this.getUsers();
    users.push(user);
    this.saveUsers(users);
  },
  toggleUserStatus(id) {
    const users = this.getUsers();
    const user = users.find((u) => u.id === id);
    if (!user) return null;
    user.status = user.status === "Ativo" ? "Inativo" : "Ativo";
    this.saveUsers(users);
    return user;
  },

  getRecords() {
    this.init();
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.RECORDS)) || [];
    } catch {
      return initialRecords;
    }
  },
  saveRecords(records) {
    localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(records));
  },
  addRecord(record) {
    const records = this.getRecords();
    records.unshift(record);
    this.saveRecords(records);
  },
  updateRecord(id, updatedFields) {
    const records = this.getRecords();
    const idx = records.findIndex((r) => r.id === id);
    if (idx !== -1) {
      records[idx] = { ...records[idx], ...updatedFields };
      this.saveRecords(records);
      return records[idx];
    }
    return null;
  },
  deleteRecord(id) {
    const records = this.getRecords();
    const found = records.find((r) => r.id === id);
    const filtered = records.filter((r) => r.id !== id);
    this.saveRecords(filtered);
    return found;
  },

  getLogs() {
    this.init();
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.LOGS)) || [];
    } catch {
      return [];
    }
  },
  saveLogs(logs) {
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs));
  },
  addLog(acao, detalhe) {
    const logs = this.getLogs();
    const currentUser = this.getCurrentUser();
    logs.unshift({
      id: `l-${this.uid()}`,
      timestamp: new Date().toISOString(),
      usuario: currentUser ? currentUser.nome : "Sistema",
      acao,
      detalhe,
    });
    this.saveLogs(logs);
  },

  getCurrentUser() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.CURRENT_USER)) || null;
    } catch {
      return null;
    }
  },
  setCurrentUser(user) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
  },
  logout() {
    const user = this.getCurrentUser();
    if (user) {
      this.addLog("Logout", `${user.nome} encerrou a sessão.`);
    }
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    window.location.href = "index.html";
  },
  requireAuth() {
    const user = this.getCurrentUser();
    if (!user) {
      window.location.href = "index.html";
      return null;
    }
    return user;
  },
  requireAdmin() {
    const user = this.requireAuth();
    if (user && user.perfil !== "Administrador") {
      window.location.href = "dashboard.html";
      return null;
    }
    return user;
  },

  getPoliceUnits() {
    return initialPoliceUnits;
  },

  getMapPoints() {
    const records = this.getRecords();
    const units = this.getPoliceUnits();

    const recordPoints = records
      .filter((r) => r.lat && r.lng)
      .map((r) => ({
        id: `rec-${r.id}`,
        recordId: r.id,
        tipo: "ocorrencia",
        categoria: r.categoria || "patrimonial",
        titulo: r.nome,
        subtitulo: r.numeroRegistro,
        natureza: r.natureza || "Registro Policial",
        endereco: r.endereco || "Caxias - MA",
        bairro: r.bairro || "Caxias",
        lat: Number(r.lat),
        lng: Number(r.lng),
        data: r.criadoEm,
        foto: r.foto,
        observacoes: r.observacoes,
      }));

    const unitPoints = units.map((u) => ({
      id: u.id,
      tipo: "delegacia",
      categoria: "delegacia",
      titulo: u.nome,
      subtitulo: u.descricao,
      natureza: "Unidade da Polícia Civil",
      endereco: u.endereco,
      bairro: u.bairro,
      telefone: u.telefone,
      plantao: u.plantao,
      lat: Number(u.lat),
      lng: Number(u.lng),
      data: null,
      foto: null,
    }));

    return [...unitPoints, ...recordPoints];
  },

  computeStats() {
    const records = this.getRecords();
    const logs = this.getLogs();
    const users = this.getUsers();
    const now = Date.now();
    return {
      total: records.length,
      ultimos30: records.filter((r) => now - new Date(r.criadoEm).getTime() <= 30 * DAY).length,
      acoes: logs.length,
      usuariosAtivos: users.filter((u) => u.status === "Ativo").length,
    };
  },

  uid() {
    return Date.now() + Math.floor(Math.random() * 1000);
  },
  escapeHtml(str) {
    return String(str == null ? "" : str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  },
  formatDateTime(date) {
    if (!date) return "—";
    return new Date(date).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
  },
  formatDateBR(yyyyMmDd) {
    if (!yyyyMmDd) return "—";
    return new Date(yyyyMmDd + "T00:00").toLocaleDateString("pt-BR");
  },
  initials(nome) {
    if (!nome) return "?";
    return nome
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0])
      .join("")
      .toUpperCase();
  },
  avatarMarkup(nome, foto) {
    if (foto) {
      return `<img class="avatar" src="${this.escapeHtml(foto)}" alt="${this.escapeHtml(nome)}" />`;
    }
    return `<div class="avatar avatar-initials">${this.initials(nome)}</div>`;
  },
  statusBadge(status) {
    const ativo = status === "Ativo";
    return `<span class="badge ${ativo ? "badge-success" : "badge-neutral"}">${this.escapeHtml(status)}</span>`;
  },
  actionIconKey(acao) {
    if (acao.includes("Cadastro")) return "plus";
    if (acao.includes("Edição")) return "pencil";
    if (acao.includes("Exclusão")) return "trash";
    if (acao.includes("Login")) return "logIn";
    if (acao.includes("Logout")) return "logOut";
    if (acao.toLowerCase().includes("usuário")) return "users";
    return "clock";
  },
};

// Inicializa dados no localStorage na carga do script
window.Store.init();
})();

