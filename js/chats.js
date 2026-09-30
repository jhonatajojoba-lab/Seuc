
(() => {
let activeChatId = null;
let channelSearchKeyword = "";

function initChatsPage() {
  const channelListEl = document.getElementById("chat-channels-list");
  if (!channelListEl) return;

  if (window.Components) Components.initLayout("chats");

  const newChatIconEl = document.getElementById("new-chat-icon");
  if (newChatIconEl && window.ICONS) {
    newChatIconEl.innerHTML = ICONS.plus;
  }

  const sendIconEl = document.getElementById("btn-send-icon");
  if (sendIconEl && window.ICONS) {
    sendIconEl.innerHTML = ICONS.send;
  }

  const attachIconEl = document.getElementById("btn-attach-icon");
  if (attachIconEl && window.ICONS) {
    attachIconEl.innerHTML = ICONS.paperclip;
  }

  const searchIconEl = document.getElementById("chats-search-icon");
  if (searchIconEl && window.ICONS) {
    searchIconEl.innerHTML = ICONS.search;
  }

  const deleteChatIconEl = document.getElementById("delete-chat-icon");
  if (deleteChatIconEl && window.ICONS) {
    deleteChatIconEl.innerHTML = ICONS.trash;
  }

  const btnNewChat = document.getElementById("btn-new-chat");
  if (btnNewChat && !btnNewChat._bound) {
    btnNewChat._bound = true;
    btnNewChat.addEventListener("click", openNewChatModal);
  }

  const btnDeleteChat = document.getElementById("btn-delete-chat");
  if (btnDeleteChat && !btnDeleteChat._bound) {
    btnDeleteChat._bound = true;
    btnDeleteChat.addEventListener("click", () => {
      if (activeChatId) {
        openConfirmDeleteChatModal(activeChatId);
      }
    });
  }

  const searchInput = document.getElementById("chats-search-input");
  if (searchInput && !searchInput._bound) {
    searchInput._bound = true;
    searchInput.addEventListener("input", (e) => {
      channelSearchKeyword = e.target.value.trim().toLowerCase();
      renderChatChannelsList();
    });
  }

  const chatForm = document.getElementById("chat-input-form");
  if (chatForm && !chatForm._bound) {
    chatForm._bound = true;
    chatForm.addEventListener("submit", handleSendMessage);
  }

  document.querySelectorAll(".chat-tag-pill").forEach((pill) => {
    if (!pill._bound) {
      pill._bound = true;
      pill.addEventListener("click", () => {
        const msgInput = document.getElementById("chat-message-input");
        if (msgInput) {
          msgInput.value = (msgInput.value ? msgInput.value + " " : "") + pill.dataset.tag;
          msgInput.focus();
        }
      });
    }
  });

  const chats = Store.getChats();
  if (chats.length > 0 && !activeChatId) {
    activeChatId = chats[0].id;
  }

  renderChatChannelsList();
  renderActiveChat();
}
window.initChatsPage = initChatsPage;

document.addEventListener("DOMContentLoaded", () => {
  initChatsPage();
});

function openNewChatModal() {
  const modalRoot = document.getElementById("modal-root");
  if (!modalRoot) return;

  const users = Store.getUsers();
  const currentUser = Store.getCurrentUser();
  const otherUsers = users.filter((u) => !currentUser || u.id !== currentUser.id);

  let bodyContent = "";

  if (otherUsers.length === 0) {
    const isAdmin = currentUser && currentUser.perfil === "Administrador";
    bodyContent = `
      <div style="text-align: center; padding: 20px 10px;">
        <div style="width: 48px; height: 48px; border-radius: 50%; background: rgba(59, 130, 246, 0.15); color: var(--blue-300); display: flex; align-items: center; justify-content: center; margin: 0 auto 14px;">
          ${ICONS.users}
        </div>
        <p style="color: var(--white); font-weight: 600; margin-bottom: 6px;">Nenhum outro servidor cadastrado</p>
        <p style="color: var(--slate-400); font-size: 12px; margin-bottom: 20px; line-height: 1.6;">
          No momento você é o único usuário no sistema. Para iniciar uma conversa com outro operador, cadastre novos servidores na gestão de Usuários.
        </p>
        ${
          isAdmin
            ? `<a href="usuarios.html" class="btn btn-primary" style="display: inline-flex;">Ir para Gestão de Usuários</a>`
            : `<button type="button" class="btn btn-ghost" id="btn-close-no-users">Fechar</button>`
        }
      </div>
    `;
  } else {
    bodyContent = `
      <p style="font-size: 12px; color: var(--slate-400); margin-bottom: 16px;">
        Selecione um servidor cadastrado para iniciar uma conversa direta:
      </p>
      <div style="display: flex; flex-direction: column; gap: 10px; max-height: 320px; overflow-y: auto;">
        ${otherUsers
          .map(
            (u) => `
          <div class="user-select-row" style="display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; background: rgba(11, 17, 32, 0.7); border: 1px solid rgba(59, 130, 246, 0.2); border-radius: 12px;">
            <div class="cell-with-avatar">
              ${Store.avatarMarkup(u.nome, null)}
              <div>
                <strong style="color: var(--white); font-size: 13px; display: block;">${Store.escapeHtml(u.nome)}</strong>
                <span style="font-size: 11px; color: var(--slate-400);"><code>${Store.escapeHtml(u.username)}</code> &middot; ${Store.escapeHtml(u.perfil)}</span>
              </div>
            </div>
            <button type="button" class="btn btn-sm btn-primary btn-start-chat" data-id="${u.id}" data-nome="${Store.escapeHtml(u.nome)}" data-perfil="${Store.escapeHtml(u.perfil)}">
              Conversar
            </button>
          </div>
        `
          )
          .join("")}
      </div>
    `;
  }

  modalRoot.innerHTML = `
    <div class="modal-overlay">
      <div class="modal modal-sm">
        <div class="modal-header">
          <h3>Iniciar conversa</h3>
          <button type="button" class="icon-btn" id="btn-close-chat-modal">${ICONS.x}</button>
        </div>
        <div class="modal-body">
          ${bodyContent}
        </div>
      </div>
    </div>
  `;

  const btnClose = document.getElementById("btn-close-chat-modal");
  if (btnClose) btnClose.addEventListener("click", closeModal);

  const btnCloseNoUsers = document.getElementById("btn-close-no-users");
  if (btnCloseNoUsers) btnCloseNoUsers.addEventListener("click", closeModal);

  modalRoot.querySelectorAll(".btn-start-chat").forEach((btn) => {
    btn.addEventListener("click", () => {
      const userId = Number(btn.dataset.id);
      const userName = btn.dataset.nome;
      const userPerfil = btn.dataset.perfil;
      startChatWithUser(userId, userName, userPerfil);
      closeModal();
    });
  });
}

function closeModal() {
  const modalRoot = document.getElementById("modal-root");
  if (modalRoot) modalRoot.innerHTML = "";
}

function openConfirmDeleteChatModal(chatId) {
  if (!chatId) return;
  const modalRoot = document.getElementById("modal-root");
  if (!modalRoot) return;

  const chat = Store.getChatById(chatId);
  const chatName = chat ? chat.name : "esta conversa";

  modalRoot.innerHTML = `
    <div class="modal-overlay">
      <div class="modal modal-sm">
        <div class="modal-header modal-header-danger">
          ${ICONS.alert}
          <h3>Apagar conversa</h3>
        </div>
        <div class="modal-body">
          <p>Tem certeza que deseja apagar a conversa <strong>${Store.escapeHtml(chatName)}</strong>?</p>
          <p style="margin-top: 8px; color: var(--red-400); font-size: 12px;">
            Esta ação excluirá o histórico de mensagens deste chat localmente.
          </p>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-ghost" id="btn-cancel-delete-chat">Cancelar</button>
          <button type="button" class="btn btn-danger" id="btn-confirm-delete-chat">Sim, apagar</button>
        </div>
      </div>
    </div>
  `;

  document.getElementById("btn-cancel-delete-chat").addEventListener("click", closeModal);
  document.getElementById("btn-confirm-delete-chat").addEventListener("click", () => {
    Store.deleteChat(chatId);
    closeModal();

    const remainingChats = Store.getChats();
    activeChatId = remainingChats.length > 0 ? remainingChats[0].id : null;

    renderChatChannelsList();
    renderActiveChat();
  });
}

function startChatWithUser(userId, userName, userPerfil) {
  const chatId = `user_${userId}`;
  const chats = Store.getChats();
  let chat = chats.find((c) => c.id === chatId);

  if (!chat) {
    chat = {
      id: chatId,
      name: userName,
      type: "direct",
      badge: userPerfil,
      icon: "users",
      description: `Conversa direta com ${userName} (${userPerfil})`,
      messages: [],
    };
    chats.unshift(chat);
    Store.saveChats(chats);
  }

  activeChatId = chatId;
  renderChatChannelsList();
  renderActiveChat();
}

function renderChatChannelsList() {
  const container = document.getElementById("chats-list-container");
  if (!container) return;

  const chats = Store.getChats();

  const filteredChats = chats.filter((c) => {
    if (!channelSearchKeyword) return true;
    const name = (c.name || "").toLowerCase();
    const desc = (c.description || "").toLowerCase();
    return name.includes(channelSearchKeyword) || desc.includes(channelSearchKeyword);
  });

  if (filteredChats.length === 0) {
    container.innerHTML = `
      <div class="chats-sidebar-empty" style="padding: 32px 16px; text-align: center;">
        <p style="color: var(--slate-400); font-size: 13px; margin-bottom: 14px;">
          Nenhuma conversa aberta no momento.
        </p>
        <button class="btn btn-sm btn-primary" id="btn-sidebar-new-chat" type="button" style="margin: 0 auto; display: inline-flex;">
          ${ICONS.plus} Nova conversa
        </button>
      </div>
    `;

    const btnSidebarNew = document.getElementById("btn-sidebar-new-chat");
    if (btnSidebarNew) {
      btnSidebarNew.addEventListener("click", openNewChatModal);
    }
    return;
  }

  container.innerHTML = filteredChats
    .map((chat) => {
      const isActive = chat.id === activeChatId;
      const iconKey = chat.icon || "messageSquare";
      const iconSvg = window.ICONS && ICONS[iconKey] ? ICONS[iconKey] : ICONS.messageSquare;
      const lastMsg = chat.messages && chat.messages.length > 0 ? chat.messages[chat.messages.length - 1] : null;
      const lastText = lastMsg ? lastMsg.text : "Sem mensagens";
      const lastTime = lastMsg ? formatChatTime(lastMsg.timestamp) : "";

      return `
      <div class="chat-item ${isActive ? "active" : ""}" data-id="${chat.id}">
        <div class="chat-item-icon-wrap">
          ${iconSvg}
        </div>
        <div class="chat-item-info">
          <div class="chat-item-top">
            <span class="chat-item-name" title="${Store.escapeHtml(chat.name)}">${Store.escapeHtml(chat.name)}</span>
            <span class="chat-item-time">${lastTime}</span>
          </div>
          <div class="chat-item-preview">${Store.escapeHtml(lastText)}</div>
        </div>
      </div>
    `;
    })
    .join("");

  container.querySelectorAll(".chat-item").forEach((item) => {
    item.addEventListener("click", () => {
      activeChatId = item.dataset.id;
      renderChatChannelsList();
      renderActiveChat();
    });
  });
}

function renderActiveChat() {
  const chatMessagesWrap = document.getElementById("chat-messages-wrap");
  const chatActiveHeader = document.querySelector(".chat-active-header");
  const chatInputContainer = document.querySelector(".chat-input-container");

  if (!activeChatId) {
    renderMainEmptyState();
    return;
  }

  const chat = Store.getChatById(activeChatId);
  if (!chat) {
    renderMainEmptyState();
    return;
  }

  if (chatActiveHeader) chatActiveHeader.style.display = "flex";
  if (chatInputContainer) chatInputContainer.style.display = "flex";

  const headerName = document.getElementById("chat-active-name");
  const headerSub = document.getElementById("chat-active-sub");
  const headerIcon = document.getElementById("chat-active-icon-wrap");

  if (headerName) headerName.textContent = chat.name;
  if (headerSub) headerSub.textContent = chat.description || "Canal de comunicação policial";
  if (headerIcon) {
    const iconKey = chat.icon || "messageSquare";
    headerIcon.innerHTML = window.ICONS && ICONS[iconKey] ? ICONS[iconKey] : ICONS.messageSquare;
  }

  renderMessagesList(chat.messages || []);
}

function renderMainEmptyState() {
  const chatActiveHeader = document.querySelector(".chat-active-header");
  const chatInputContainer = document.querySelector(".chat-input-container");
  const chatMessagesWrap = document.getElementById("chat-messages-wrap");

  if (chatActiveHeader) chatActiveHeader.style.display = "none";
  if (chatInputContainer) chatInputContainer.style.display = "none";

  if (chatMessagesWrap) {
    chatMessagesWrap.innerHTML = `
      <div class="chats-main-empty" style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; text-align: center; padding: 40px 20px;">
        <div style="width: 64px; height: 64px; border-radius: 20px; background: rgba(37, 99, 235, 0.15); border: 1px solid rgba(59, 130, 246, 0.3); color: var(--blue-300); display: flex; align-items: center; justify-content: center; margin-bottom: 16px; box-shadow: 0 0 30px rgba(37, 99, 235, 0.2);">
          ${ICONS.messageSquare}
        </div>
        <h3 style="color: var(--white); font-size: 18px; margin-bottom: 8px;">Central de Comunicação</h3>
        <p style="color: var(--slate-400); font-size: 13px; max-width: 360px; margin-bottom: 24px; line-height: 1.6;">
          Selecione uma conversa ao lado ou inicie uma nova conversa para se comunicar com os servidores da delegacia.
        </p>
        <button class="btn btn-primary" id="btn-main-empty-new-chat" type="button">
          ${ICONS.plus} Iniciar nova conversa
        </button>
      </div>
    `;

    const btnMainEmpty = document.getElementById("btn-main-empty-new-chat");
    if (btnMainEmpty) {
      btnMainEmpty.addEventListener("click", openNewChatModal);
    }
  }
}

function renderMessagesList(messages) {
  const container = document.getElementById("chat-messages-wrap");
  if (!container) return;

  const currentUser = Store.getCurrentUser();

  if (!messages || messages.length === 0) {
    container.innerHTML = `
      <div style="padding: 60px 20px; text-align: center; color: var(--slate-500); font-size: 13px;">
        Nenhuma mensagem nesta conversa ainda.<br />Digite abaixo para enviar uma mensagem.
      </div>
    `;
    return;
  }

  container.innerHTML = messages
    .map((msg) => {
      const isSelf = currentUser && msg.username === currentUser.username;
      const timeFormatted = formatChatTime(msg.timestamp);

      const badgeMarkup = msg.perfil
        ? `<span class="badge badge-neutral" style="font-size: 9px; padding: 1px 6px;">${Store.escapeHtml(msg.perfil)}</span>`
        : "";

      return `
      <div class="chat-msg-row ${isSelf ? "self" : ""}">
        <div class="chat-msg-avatar">
          ${Store.avatarMarkup(msg.sender, null)}
        </div>
        <div class="chat-msg-content">
          <div class="chat-msg-meta">
            <span class="chat-msg-sender">${Store.escapeHtml(msg.sender)}</span>
            ${badgeMarkup}
            <span class="chat-msg-time">&middot; ${timeFormatted}</span>
          </div>
          <div class="chat-msg-bubble">
            ${Store.escapeHtml(msg.text)}
          </div>
        </div>
      </div>
    `;
    })
    .join("");

  container.scrollTop = container.scrollHeight;
}

function handleSendMessage(e) {
  e.preventDefault();
  const input = document.getElementById("chat-message-input");
  if (!input || !activeChatId) return;

  const text = input.value.trim();
  if (!text) return;

  input.value = "";

  Store.addChatMessage(activeChatId, text);
  renderChatChannelsList();
  renderActiveChat();
}

function formatChatTime(isoString) {
  if (!isoString) return "";
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}
})();

