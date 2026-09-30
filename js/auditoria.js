
(() => {
function initAuditoriaPage() {
  const container = document.getElementById("logs-table-wrap");
  if (!container) return;

  if (window.Components) Components.initLayout("auditoria");
  renderLogsTable();
}
window.initAuditoriaPage = initAuditoriaPage;

document.addEventListener("DOMContentLoaded", () => {
  initAuditoriaPage();
});

function renderLogsTable() {
  const logs = Store.getLogs();
  const container = document.getElementById("logs-table-wrap");

  if (logs.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <p>Nenhum registro de auditoria disponível.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="card table-card">
      <table class="log-table">
        <thead>
          <tr>
            <th>Data / Hora</th>
            <th>Usuário</th>
            <th>Ação</th>
            <th>Detalhes</th>
          </tr>
        </thead>
        <tbody>
          ${logs
            .map((log) => {
              const iconKey = Store.actionIconKey(log.acao);
              const iconSvg = window.ICONS && ICONS[iconKey] ? ICONS[iconKey] : "";

              return `
              <tr>
                <td class="muted small nowrap">${Store.formatDateTime(log.timestamp)}</td>
                <td><strong>${Store.escapeHtml(log.usuario)}</strong></td>
                <td>
                  <div class="log-action-cell">
                    ${iconSvg}
                    <span>${Store.escapeHtml(log.acao)}</span>
                  </div>
                </td>
                <td class="muted">${Store.escapeHtml(log.detalhe)}</td>
              </tr>
            `;
            })
            .join("")}
        </tbody>
      </table>
    </div>
  `;
}
})();

