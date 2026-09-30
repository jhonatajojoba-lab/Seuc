
(() => {
let userModalError = "";
let confirmDeleteUserId = null;
let currentDashboardPeriod = "30d";

function initUsuariosPage() {
  const container = document.getElementById("users-table-wrap");
  if (!container) return;

  const currentUser = Store.requireAdmin();
  if (!currentUser) return;

  if (window.Components) Components.initLayout("usuarios");

  const userPlusIconEl = document.getElementById("user-plus-icon");
  if (userPlusIconEl && window.ICONS) {
    userPlusIconEl.innerHTML = ICONS.userPlus;
  }

  renderUsersTable();
  renderRecentActivity();
  initDashboardEvents();
  updateOverviewStats();
  updateDashboardMetrics();

  const btnNewUser = document.getElementById("btn-new-user");
  if (btnNewUser && !btnNewUser._bound) {
    btnNewUser._bound = true;
    btnNewUser.addEventListener("click", openNewUserModal);
  }
}
window.initUsuariosPage = initUsuariosPage;

document.addEventListener("DOMContentLoaded", () => {
  initUsuariosPage();
});

function updateOverviewStats() {
  const stats = Store.computeStats();
  const elTotal = document.getElementById("stat-total");
  if (elTotal) elTotal.textContent = stats.total;

  const elUltimos30 = document.getElementById("stat-ultimos30");
  if (elUltimos30) elUltimos30.textContent = stats.ultimos30;

  const elAcoes = document.getElementById("stat-acoes");
  if (elAcoes) elAcoes.textContent = stats.acoes;

  const elUsuarios = document.getElementById("stat-usuarios");
  if (elUsuarios) elUsuarios.textContent = stats.usuariosAtivos;
}

function initDashboardEvents() {
  const filterBtns = document.querySelectorAll(".ds-filter-btn");
  filterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      filterBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      currentDashboardPeriod = btn.dataset.period || "30d";
      updateDashboardMetrics();
    });
  });
}

function updateDashboardMetrics() {
  updateOverviewStats();
  const users = Store.getUsers();
  const records = Store.getRecords();
  const logs = Store.getLogs();

  const now = Date.now();
  const DAY_MS = 86400000;
  let periodDays = 30;
  if (currentDashboardPeriod === "7d") periodDays = 7;
  if (currentDashboardPeriod === "all") periodDays = 99999;

  const filteredRecords = records.filter((r) => {
    if (periodDays > 1000) return true;
    const time = new Date(r.criadoEm || r.timestamp || now).getTime();
    return now - time <= periodDays * DAY_MS;
  });

  const filteredLogs = logs.filter((l) => {
    if (periodDays > 1000) return true;
    const time = new Date(l.timestamp || now).getTime();
    return now - time <= periodDays * DAY_MS;
  });

  const activeUsers = users.filter((u) => u.status === "Ativo").length;
  const totalUsers = users.length;
  const adminUsers = users.filter((u) => u.perfil === "Administrador").length;
  const servidorUsers = users.filter((u) => u.perfil === "Servidor").length;
  const activeServidores = users.filter((u) => u.perfil === "Servidor" && u.status === "Ativo").length;
  const activeAdmins = users.filter((u) => u.perfil === "Administrador" && u.status === "Ativo").length;

  const elRegistros = document.getElementById("ds-val-registros");
  if (elRegistros) elRegistros.textContent = records.length.toLocaleString("pt-BR");

  const elSubRegistros = document.getElementById("ds-sub-registros");
  if (elSubRegistros) {
    elSubRegistros.textContent = `${filteredRecords.length} no período`;
  }

  const elServidores = document.getElementById("ds-val-servidores");
  if (elServidores) elServidores.textContent = servidorUsers;

  const elSubServidores = document.getElementById("ds-sub-servidores");
  if (elSubServidores) {
    const pctAtivosServidores = servidorUsers > 0 ? Math.round((activeServidores / servidorUsers) * 100) : 0;
    elSubServidores.textContent = `${pctAtivosServidores}% ativos`;
  }

  const elAuditoria = document.getElementById("ds-val-auditoria");
  if (elAuditoria) elAuditoria.textContent = logs.length.toLocaleString("pt-BR");

  const elSubAuditoria = document.getElementById("ds-sub-auditoria");
  if (elSubAuditoria) {
    elSubAuditoria.textContent = `${filteredLogs.length} eventos`;
  }

  const elAdmins = document.getElementById("ds-val-administradores");
  if (elAdmins) elAdmins.textContent = adminUsers;

  const elSubAdmins = document.getElementById("ds-sub-administradores");
  if (elSubAdmins) {
    const pctAtivosAdmins = adminUsers > 0 ? Math.round((activeAdmins / adminUsers) * 100) : 0;
    elSubAdmins.textContent = `${pctAtivosAdmins}% ativos`;
  }

  renderDonutChart(users);
  renderRankingList(filteredLogs.length > 0 ? filteredLogs : logs);
  renderSparklineChart(logs, records, periodDays);
}

function renderDonutChart(users) {
  const ring = document.getElementById("ds-donut-ring");
  const inner = document.getElementById("ds-donut-inner");
  const legend = document.getElementById("ds-donut-legend");
  if (!ring || !inner) return;

  const total = Array.isArray(users) ? users.length : 0;
  if (total === 0) {
    inner.textContent = "0%";
    ring.style.background = "rgba(59, 130, 246, 0.15)";
    if (legend) legend.innerHTML = `<div class="ds-legend-item">Nenhum usuário</div>`;
    return;
  }

  const profileMap = {};
  users.forEach((u) => {
    const p = u.perfil || "Servidor";
    profileMap[p] = (profileMap[p] || 0) + 1;
  });

  const paletteColors = ["#3b82f6", "#818cf8", "#38bdf8", "#60a5fa", "#a7f3d0"];
  const entries = Object.entries(profileMap).sort((a, b) => b[1] - a[1]);

  let currentDeg = 0;
  const gradientStops = [];
  const legendItems = [];

  entries.forEach(([profileName, count], idx) => {
    const pct = Math.round((count / total) * 100);
    const deg = (count / total) * 360;
    const endDeg = currentDeg + deg;
    const color = paletteColors[idx % paletteColors.length];

    gradientStops.push(`${color} ${Math.round(currentDeg)}deg ${Math.round(endDeg)}deg`);
    currentDeg = endDeg;

    legendItems.push(`
      <div class="ds-legend-item">
        <span class="ds-dot" style="background:${color}"></span>
        <span>${Store.escapeHtml(profileName)} (${count} &middot; ${pct}%)</span>
      </div>
    `);
  });

  if (entries.length === 1) {
    ring.style.background = paletteColors[0];
  } else {
    ring.style.background = `conic-gradient(${gradientStops.join(", ")})`;
  }

  const topPct = Math.round((entries[0][1] / total) * 100);
  inner.textContent = `${topPct}%`;
  inner.title = entries.map(([p, c]) => `${p}: ${c} (${Math.round((c / total) * 100)}%)`).join(" / ");

  if (legend) {
    legend.innerHTML = legendItems.join("");
  }
}

function renderRankingList(logList) {
  const container = document.getElementById("ds-ranking-list");
  if (!container) return;

  const counts = {
    "Cadastros": 0,
    "Edições": 0,
    "Acessos": 0,
    "Exclusões": 0,
  };

  logList.forEach((log) => {
    const acao = (log.acao || "").toLowerCase();
    if (acao.includes("cadast") || acao.includes("criação")) counts["Cadastros"]++;
    else if (acao.includes("edição") || acao.includes("altera")) counts["Edições"]++;
    else if (acao.includes("login") || acao.includes("logout") || acao.includes("acesso")) counts["Acessos"]++;
    else if (acao.includes("exclusã") || acao.includes("delete")) counts["Exclusões"]++;
    else counts["Cadastros"]++;
  });

  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);

  container.innerHTML = entries
    .map(
      ([name, val]) => `
      <div class="ds-rank-row">
        <span class="ds-rank-name" title="${name}">${name}</span>
        <span class="ds-rank-val">${val}</span>
      </div>
    `
    )
    .join("");
}

function renderSparklineChart(logs, records, periodDays) {
  const container = document.getElementById("ds-sparkline-wrap");
  if (!container) return;

  const now = new Date();
  const DAY_MS = 86400000;
  const numBuckets = 7;
  const bucketData = [];

  const effectiveDays = periodDays > 365 ? 30 : periodDays;
  const stepMs = (effectiveDays / numBuckets) * DAY_MS;

  for (let i = 0; i < numBuckets; i++) {
    const bucketEnd = new Date(now.getTime() - (numBuckets - 1 - i) * stepMs);
    const bucketStart = new Date(bucketEnd.getTime() - stepMs);

    const startTime = bucketStart.getTime();
    const endTime = bucketEnd.getTime();

    const logsCount = logs.filter((l) => {
      const t = new Date(l.timestamp).getTime();
      return t >= startTime && t < endTime;
    }).length;

    const recordsCount = records.filter((r) => {
      const t = new Date(r.criadoEm || r.timestamp || now.getTime()).getTime();
      return t >= startTime && t < endTime;
    }).length;

    const totalCount = logsCount + recordsCount;
    const dateLabel = bucketEnd.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });

    bucketData.push({
      dateLabel,
      count: totalCount,
    });
  }

  const counts = bucketData.map((b) => b.count);
  const minVal = 0; 
  const maxVal = Math.max(...counts, 1); 

  const svgWidth = 180;
  const svgHeight = 85;
  const paddingTop = 15;
  const paddingBottom = 20;
  const usableHeight = svgHeight - paddingTop - paddingBottom;

  const coords = counts.map((val, idx) => {
    const x = Math.round(10 + (idx / (numBuckets - 1)) * (svgWidth - 20));
    const normY = (val - minVal) / (maxVal - minVal);
    const y = Math.round(svgHeight - paddingBottom - normY * usableHeight);
    return { x, y, count: val, label: bucketData[idx].dateLabel };
  });

  const pathD = coords.reduce((acc, pt, idx) => {
    return idx === 0 ? `M ${pt.x},${pt.y}` : `${acc} L ${pt.x},${pt.y}`;
  }, "");

  const areaD = `${pathD} L ${coords[coords.length - 1].x},${svgHeight - paddingBottom} L ${coords[0].x},${svgHeight - paddingBottom} Z`;

  const maxPt = coords.reduce((prev, curr) => (curr.count >= prev.count ? curr : prev), coords[0]);
  const firstLabel = bucketData[0].dateLabel;
  const lastLabel = bucketData[bucketData.length - 1].dateLabel;
  const totalPeriodCount = counts.reduce((a, b) => a + b, 0);

  container.innerHTML = `
    <div class="ds-sparkline-meta">
      <span class="ds-sparkline-count"><strong>${totalPeriodCount}</strong> ações reais</span>
      <span class="ds-sparkline-range">${firstLabel} – ${lastLabel}</span>
    </div>
    <div class="ds-sparkline-grid">
      <span></span>
      <span></span>
      <span></span>
    </div>
    <svg viewBox="0 0 180 85" class="ds-sparkline-svg" preserveAspectRatio="none">
      <defs>
        <linearGradient id="dsBlueGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#3b82f6" stop-opacity="0.45" />
          <stop offset="100%" stop-color="#3b82f6" stop-opacity="0.0" />
        </linearGradient>
        <filter id="dsBlueGlow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="0" stdDeviation="3" flood-color="#3b82f6" flood-opacity="0.85" />
        </filter>
      </defs>
      <path d="${areaD}" fill="url(#dsBlueGrad)" />
      <path d="${pathD}" fill="none" stroke="#3b82f6" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" filter="url(#dsBlueGlow)" />
      ${coords
        .map(
          (pt) => `
        <circle cx="${pt.x}" cy="${pt.y}" r="${pt === maxPt && pt.count > 0 ? "4" : "2.5"}" fill="${pt === maxPt && pt.count > 0 ? "#60a5fa" : "#3b82f6"}" />
      `
        )
        .join("")}
    </svg>
    <div class="ds-sparkline-footer-dates">
      <span>${firstLabel}</span>
      <span>${bucketData[Math.floor(numBuckets / 2)].dateLabel}</span>
      <span>${lastLabel}</span>
    </div>
  `;
}

function renderUsersTable() {
  const users = Store.getUsers();
  const currentUser = Store.getCurrentUser();
  const container = document.getElementById("users-table-wrap");

  container.innerHTML = `
    <div class="card table-card">
      <table>
        <thead>
          <tr>
            <th>Usuário</th>
            <th>Acesso (Login)</th>
            <th>Perfil</th>
            <th>Status</th>
            <th class="text-right">Ações</th>
          </tr>
        </thead>
        <tbody>
          ${users
            .map((u) => {
              const isSelf = currentUser && u.id === currentUser.id;
              const isAtivo = u.status === "Ativo";
              const toggleIcon = isAtivo ? ICONS.shieldOff : ICONS.shieldCheck;
              const toggleLabel = isAtivo ? "Desativar" : "Ativar";

              return `
              <tr>
                <td>
                  <div class="cell-with-avatar">
                    ${Store.avatarMarkup(u.nome, null)}
                    <strong>${Store.escapeHtml(u.nome)}</strong>
                  </div>
                </td>
                <td><code>${Store.escapeHtml(u.username)}</code></td>
                <td class="muted">${Store.escapeHtml(u.perfil)}</td>
                <td>${Store.statusBadge(u.status)}</td>
                <td class="text-right" style="display:flex;align-items:center;justify-content:flex-end;gap:6px;">
                  <button
                    type="button"
                    class="btn btn-sm btn-toggle-user"
                    data-id="${u.id}"
                    ${isSelf ? 'disabled title="Você não pode alterar seu próprio status"' : ""}
                  >
                    ${toggleIcon} ${toggleLabel}
                  </button>
                  <button
                    type="button"
                    class="icon-btn icon-btn-danger btn-delete-user"
                    data-id="${u.id}"
                    data-nome="${Store.escapeHtml(u.nome)}"
                    title="Excluir usuário"
                    ${isSelf ? 'disabled style="opacity:0.3;cursor:not-allowed;"' : ""}
                  >
                    ${ICONS.trash}
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

  container.querySelectorAll(".btn-toggle-user").forEach((btn) => {
    if (btn.disabled) return;
    btn.addEventListener("click", () => {
      const id = Number(btn.dataset.id);
      const updatedUser = Store.toggleUserStatus(id);
      if (updatedUser) {
        Store.addLog(
          "Alteração de status de usuário",
          `${updatedUser.nome} teve o status alterado para ${updatedUser.status}.`
        );
      }
      renderUsersTable();
      renderRecentActivity();
      updateDashboardMetrics();
    });
  });

  container.querySelectorAll(".btn-delete-user").forEach((btn) => {
    if (btn.disabled) return;
    btn.addEventListener("click", () => {
      openConfirmDeleteUser(Number(btn.dataset.id), btn.dataset.nome);
    });
  });
}

function renderRecentActivity() {
  const recentLogs = Store.getLogs();
  const container = document.getElementById("recent-activity-list");
  if (!container) return;

  if (recentLogs.length === 0) {
    container.innerHTML = `
      <div style="padding: 24px; text-align: center; color: var(--slate-500);">
        Nenhuma atividade registrada ainda.
      </div>
    `;
    return;
  }

  container.innerHTML = recentLogs
    .map((log) => {
      const iconKey = Store.actionIconKey(log.acao);
      const iconSvg = window.ICONS && ICONS[iconKey] ? ICONS[iconKey] : "";
      return `
      <div class="activity-row">
        <div class="activity-icon">${iconSvg}</div>
        <div>
          <p class="activity-text">${Store.escapeHtml(log.detalhe)}</p>
          <p class="activity-meta">
            <strong>${Store.escapeHtml(log.usuario)}</strong> &middot; ${Store.formatDateTime(log.timestamp)}
          </p>
        </div>
      </div>
    `;
    })
    .join("");
}

function closeUserModal() {
  document.getElementById("modal-root").innerHTML = "";
  userModalError = "";
  confirmDeleteUserId = null;
}

function openConfirmDeleteUser(id, nome) {
  confirmDeleteUserId = id;
  const modalRoot = document.getElementById("modal-root");

  modalRoot.innerHTML = `
    <div class="modal-overlay">
      <div class="modal modal-sm">
        <div class="modal-header modal-header-danger">
          ${ICONS.alert}
          <h3>Excluir usuário</h3>
        </div>
        <div class="modal-body">
          <p>Tem certeza que deseja excluir o usuário <strong>${Store.escapeHtml(nome)}</strong>?</p>
          <p style="margin-top: 8px; color: var(--red-400); font-size: 12px;">
            Esta ação é irreversível. O usuário perderá acesso imediatamente.
          </p>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-ghost" id="btn-cancel-delete-user">Cancelar</button>
          <button type="button" class="btn btn-danger" id="btn-confirm-delete-user">Sim, excluir</button>
        </div>
      </div>
    </div>
  `;

  document.getElementById("btn-cancel-delete-user").addEventListener("click", closeUserModal);
  document.getElementById("btn-confirm-delete-user").addEventListener("click", () => {
    const users = Store.getUsers();
    const found = users.find((u) => u.id === confirmDeleteUserId);
    if (found) {
      Store.saveUsers(users.filter((u) => u.id !== confirmDeleteUserId));
      Store.addLog("Exclusão de usuário", `Usuário ${found.nome} (${found.username}) foi excluído.`);
    }
    closeUserModal();
    renderUsersTable();
    renderRecentActivity();
    updateDashboardMetrics();
  });
}

function openNewUserModal() {
  userModalError = "";
  renderUserModal();
}

function renderUserModal() {
  const modalRoot = document.getElementById("modal-root");

  modalRoot.innerHTML = `
    <div class="modal-overlay">
      <form class="modal modal-sm" id="user-form">
        <div class="modal-header">
          <h3>Novo usuário</h3>
          <button type="button" class="icon-btn" id="btn-close-user-modal">${ICONS.x}</button>
        </div>

        <div class="modal-body">
          <div class="field">
            <label for="u-nome">Nome completo *</label>
            <input type="text" id="u-nome" name="nome" placeholder="Ex.: Maria de Oliveira" required />
          </div>

          <div class="field">
            <label for="u-username">Usuário de login *</label>
            <input type="text" id="u-username" name="username" placeholder="ex.: maria.oliveira" required />
          </div>

          <div class="field">
            <label for="u-password">Senha de acesso *</label>
            <input type="password" id="u-password" name="password" placeholder="********" required />
          </div>

          <div class="field">
            <label for="u-perfil">Perfil</label>
            <select id="u-perfil" name="perfil">
              <option value="Servidor">Servidor</option>
              <option value="Administrador">Administrador</option>
            </select>
          </div>

          ${
            userModalError
              ? `<div class="form-error">${ICONS.alert}<span>${Store.escapeHtml(userModalError)}</span></div>`
              : ""
          }
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-ghost" id="btn-cancel-user">Cancelar</button>
          <button type="submit" class="btn btn-primary">Salvar usuário</button>
        </div>
      </form>
    </div>
  `;

  document.getElementById("btn-close-user-modal").addEventListener("click", closeUserModal);
  document.getElementById("btn-cancel-user").addEventListener("click", closeUserModal);

  document.getElementById("user-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const nome = (fd.get("nome") || "").toString().trim();
    const username = (fd.get("username") || "").toString().trim().toLowerCase();
    const password = (fd.get("password") || "").toString().trim();
    const perfil = (fd.get("perfil") || "Servidor").toString();

    if (!nome || !username || !password) {
      userModalError = "Preencha todos os campos obrigatórios.";
      renderUserModal();
      return;
    }

    const users = Store.getUsers();
    if (users.some((u) => u.username.toLowerCase() === username)) {
      userModalError = "Já existe um usuário com este login de acesso.";
      renderUserModal();
      return;
    }

    const newUser = {
      id: Store.uid(),
      nome,
      username,
      password,
      perfil,
      status: "Ativo",
    };

    Store.addUser(newUser);
    Store.addLog("Criação de usuário", `Usuário ${nome} (${username}) foi criado com perfil ${perfil}.`);

    closeUserModal();
    renderUsersTable();
    renderRecentActivity();
    updateDashboardMetrics();
  });
}
})();
