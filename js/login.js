document.addEventListener("DOMContentLoaded", () => {
  // Se usuário já estiver autenticado, redireciona ao painel
  if (window.Store && Store.getCurrentUser()) {
    window.location.href = "dashboard.html";
    return;
  }

  // ============================================================
  // GERENCIAMENTO DA INTRODUÇÃO EXATA SIRC (COREOGRAFIA SUAVE)
  // - 1ª Parada: Logo grandona recuando para o meio (escala menor)
  // - 2ª Parada: Logo deslizando com amortecimento à esquerda
  // - Revelação sequencial letra por letra: "s", "i", "r", "c"
  // - Ponto amarelo no final
  // - Fade-out suave para o login
  // ============================================================
  const introOverlay = document.getElementById("site-intro-overlay");
  const btnSkip = document.getElementById("btn-skip-intro");

  let introFinished = false;

  const playTacticalChime = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(540, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1080, ctx.currentTime + 0.16);

      gain.gain.setValueAtTime(0.025, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.24);
    } catch {
      // Ignora erro se áudio não for permitido antes de clique
    }
  };

  const endIntro = () => {
    if (introFinished) return;
    introFinished = true;

    if (introOverlay) {
      introOverlay.classList.add("intro-hidden");
      setTimeout(() => {
        introOverlay.style.display = "none";
        const usernameInput = document.getElementById("username");
        if (usernameInput) usernameInput.focus();
      }, 880);
    }
  };

  if (introOverlay) {
    // Efeito sonoro suave quando o ponto amarelo finaliza o nome
    setTimeout(() => {
      if (!introFinished) playTacticalChime();
    }, 2680);

    // Tempo total da coreografia completa com margem para apreciação do frame final (~3.8s)
    const introTimeout = setTimeout(() => {
      endIntro();
    }, 3850);

    // Pular com teclado (ESC, Espaço, Enter)
    window.addEventListener("keydown", (e) => {
      if (!introFinished && (e.key === "Escape" || e.key === " " || e.key === "Enter")) {
        clearTimeout(introTimeout);
        endIntro();
      }
    });
  }

  // ============================================================
  // FORMULÁRIO DE LOGIN & INTERAÇÕES
  // ============================================================
  const form = document.getElementById("login-form");
  const usernameInput = document.getElementById("username");
  const passwordInput = document.getElementById("password");
  const togglePassBtn = document.getElementById("toggle-password");
  const eyeIcon = document.getElementById("eye-icon");
  const errorBox = document.getElementById("login-error");

  const modalForgot = document.getElementById("modal-forgot");
  const btnForgot = document.getElementById("btn-forgot");
  const btnCloseForgot = document.getElementById("btn-close-forgot");
  const btnOkForgot = document.getElementById("btn-ok-forgot");
  const btnAutofillDemo = document.getElementById("btn-autofill-demo");

  // Alternar visualização da senha
  if (togglePassBtn && passwordInput && eyeIcon) {
    let isPasswordVisible = false;
    togglePassBtn.addEventListener("click", () => {
      isPasswordVisible = !isPasswordVisible;
      passwordInput.type = isPasswordVisible ? "text" : "password";

      if (isPasswordVisible) {
        eyeIcon.innerHTML = `
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
          <line x1="1" y1="1" x2="23" y2="23"/>
        `;
      } else {
        eyeIcon.innerHTML = `
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
          <circle cx="12" cy="12" r="3"/>
        `;
      }
    });
  }

  // Modal de Recuperação de Acesso
  const openForgotModal = () => {
    if (modalForgot) modalForgot.style.display = "flex";
  };
  const closeForgotModal = () => {
    if (modalForgot) modalForgot.style.display = "none";
  };

  if (btnForgot) btnForgot.addEventListener("click", openForgotModal);
  if (btnCloseForgot) btnCloseForgot.addEventListener("click", closeForgotModal);
  if (btnOkForgot) btnOkForgot.addEventListener("click", closeForgotModal);

  if (modalForgot) {
    modalForgot.addEventListener("click", (e) => {
      if (e.target === modalForgot) closeForgotModal();
    });
  }

  if (btnAutofillDemo) {
    btnAutofillDemo.addEventListener("click", () => {
      if (usernameInput) usernameInput.value = "admin";
      if (passwordInput) passwordInput.value = "admin@sirc";
      closeForgotModal();
      if (errorBox) errorBox.style.display = "none";
      const btnLogin = document.getElementById("btn-login");
      if (btnLogin) btnLogin.focus();
    });
  }

  const triggerCapsuleShake = () => {
    const capsules = document.querySelectorAll(".input-capsule");
    capsules.forEach((capsule) => {
      capsule.classList.remove("shake");
      // Forçar reflow para reiniciar a animação caso executada novamente
      void capsule.offsetWidth;
      capsule.classList.add("shake");
      setTimeout(() => {
        capsule.classList.remove("shake");
      }, 500);
    });

    if (passwordInput) {
      passwordInput.focus();
      passwordInput.select();
    }
  };

  // Remover a classe de shake e alerta quando o usuário começar a corrigir os dados
  document.querySelectorAll(".input-capsule input").forEach((input) => {
    input.addEventListener("input", () => {
      input.closest(".input-capsule")?.classList.remove("shake");
      if (errorBox) errorBox.style.display = "none";
    });
  });

  // Envio do formulário de Login
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (errorBox) {
        errorBox.style.display = "none";
        errorBox.innerHTML = "";
      }

      const username = (usernameInput ? usernameInput.value : "").trim();
      const password = (passwordInput ? passwordInput.value : "");

      if (!username || !password) {
        triggerCapsuleShake();
        showError("Por favor, informe seu usuário e senha.");
        return;
      }

      if (!window.Store) {
        triggerCapsuleShake();
        showError("Erro ao inicializar o banco de dados local.");
        return;
      }

      const users = Store.getUsers();
      const found = users.find((u) => u.username === username && u.password === password);

      if (!found) {
        triggerCapsuleShake();
        showError("Usuário ou senha inválidos.");
        return;
      }

      if (found.status === "Inativo") {
        triggerCapsuleShake();
        showError("Acesso inativo. Contate o administrador do sistema.");
        return;
      }

      Store.setCurrentUser(found);
      Store.addLog("Login", `${found.nome} acessou o sistema.`);
      window.location.href = "dashboard.html";
    });
  }

  function showError(msg) {
    if (!errorBox) return;
    const alertIconSvg = `
      <svg viewBox="0 0 24 24" style="width:16px;height:16px;flex-shrink:0;" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
    `;
    const escaped = window.Store && Store.escapeHtml ? Store.escapeHtml(msg) : msg;
    errorBox.innerHTML = `${alertIconSvg} <span>${escaped}</span>`;
    errorBox.style.display = "flex";
  }
});
