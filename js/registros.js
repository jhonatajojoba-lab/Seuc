
(() => {
let searchTerm = "";
let recordModal = null;
let recordModalError = "";
let confirmDeleteId = null;

function initRegistrosPage() {
  const container = document.getElementById("records-table-wrap");
  if (!container) return;

  if (window.Components) Components.initLayout("registros");

  const searchIconEl = document.getElementById("search-icon");
  if (searchIconEl && window.ICONS) searchIconEl.innerHTML = ICONS.search;

  const plusIconEl = document.getElementById("plus-icon");
  if (plusIconEl && window.ICONS) plusIconEl.innerHTML = ICONS.plus;

  renderTable();

  const searchInput = document.getElementById("search-input");
  if (searchInput && !searchInput._bound) {
    searchInput._bound = true;
    searchInput.addEventListener("input", (e) => {
      searchTerm = e.target.value.trim().toLowerCase();
      renderTable();
    });
  }

  const btnNew = document.getElementById("btn-new-record");
  if (btnNew && !btnNew._bound) {
    btnNew._bound = true;
    btnNew.addEventListener("click", openNewRecordModal);
  }
}
window.initRegistrosPage = initRegistrosPage;

document.addEventListener("DOMContentLoaded", () => {
  initRegistrosPage();
});

function renderTable() {
  const records = Store.getRecords();
  const filtered = records.filter((r) => {
    if (!searchTerm) return true;
    const nomeMatch = (r.nome || "").toLowerCase().includes(searchTerm);
    const regMatch = (r.numeroRegistro || "").toLowerCase().includes(searchTerm);
    return nomeMatch || regMatch;
  });

  const container = document.getElementById("records-table-wrap");

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <p>Nenhum registro criminal encontrado.</p>
        <p class="muted">Tente outro termo na busca ou cadastre um novo registro.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="card table-card">
      <table>
        <thead>
          <tr>
            <th>Registro</th>
            <th>Número</th>
            <th>Nascimento</th>
            <th>Cadastrado em</th>
            <th class="text-right">Ações</th>
          </tr>
        </thead>
        <tbody>
          ${filtered
            .map(
              (r) => `
            <tr>
              <td>
                <div class="cell-with-avatar">
                  ${Store.avatarMarkup(r.nome, r.foto)}
                  <strong>${Store.escapeHtml(r.nome)}</strong>
                </div>
              </td>
              <td><code>${Store.escapeHtml(r.numeroRegistro)}</code></td>
              <td>${Store.formatDateBR(r.dataNascimento)}</td>
              <td class="muted small nowrap">${Store.formatDateTime(r.criadoEm)}</td>
              <td class="text-right">
                <a href="mapa.html" class="icon-btn" title="Ver no Mapa Policial">
                  ${ICONS.mapPin}
                </a>
                <button class="icon-btn btn-edit-record" data-id="${r.id}" title="Editar registro">
                  ${ICONS.pencil}
                </button>
                <button class="icon-btn icon-btn-danger btn-delete-record" data-id="${r.id}" title="Excluir registro">
                  ${ICONS.trash}
                </button>
              </td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `;

  container.querySelectorAll(".btn-edit-record").forEach((btn) => {
    btn.addEventListener("click", () => openEditRecordModal(Number(btn.dataset.id)));
  });

  container.querySelectorAll(".btn-delete-record").forEach((btn) => {
    btn.addEventListener("click", () => openConfirmDelete(Number(btn.dataset.id)));
  });
}

function closeModal() {
  document.getElementById("modal-root").innerHTML = "";
  recordModal = null;
  recordModalError = "";
  confirmDeleteId = null;
}

function openNewRecordModal() {
  recordModal = {
    nome: "",
    numeroRegistro: "",
    dataNascimento: "",
    observacoes: "",
    foto: null,
  };
  recordModalError = "";
  renderRecordModal();
}

function openEditRecordModal(id) {
  const records = Store.getRecords();
  const found = records.find((r) => r.id === id);
  if (!found) return;

  recordModal = { ...found };
  recordModalError = "";
  renderRecordModal();
}

function renderRecordModal() {
  const form = recordModal;
  const isEdit = !!form.id;
  const modalRoot = document.getElementById("modal-root");

  modalRoot.innerHTML = `
    <div class="modal-overlay">
      <form class="modal" id="record-form">
        <div class="modal-header">
          <h3>${isEdit ? "Editar registro" : "Novo registro"}</h3>
          <button type="button" class="icon-btn" id="btn-close-record-modal">${ICONS.x}</button>
        </div>

        <div class="modal-body">
          <div class="photo-row">
            <div class="photo-preview-wrap" id="photo-preview">
              ${Store.avatarMarkup(form.nome || "?", form.foto)}
            </div>
            <label class="photo-upload-label">
              ${ICONS.imagePlus} Selecionar foto
              <input type="file" accept="image/*" id="photo-input" hidden />
            </label>
            <input type="hidden" name="foto" id="foto-hidden" value="${form.foto ? Store.escapeHtml(form.foto) : ""}" />
          </div>

          <div class="field">
            <label for="reg-nome">Nome completo *</label>
            <input type="text" id="reg-nome" name="nome" value="${Store.escapeHtml(form.nome || "")}" placeholder="Ex.: Nome completo do indivíduo" required />
          </div>

          <div class="field-row">
            <div class="field">
              <label for="reg-numero">Número do registro *</label>
              <input type="text" id="reg-numero" name="numeroRegistro" placeholder="QC-2026-0000" value="${Store.escapeHtml(form.numeroRegistro || "")}" required />
            </div>
            <div class="field">
              <label for="reg-data">Data de nascimento</label>
              <input type="date" id="reg-data" name="dataNascimento" value="${Store.escapeHtml(form.dataNascimento || "")}" />
            </div>
          </div>

          <div class="field-row">
            <div class="field">
              <label for="reg-natureza">Natureza / Infração</label>
              <input type="text" id="reg-natureza" name="natureza" placeholder="Ex.: Receptação, Roubo..." value="${Store.escapeHtml(form.natureza || "")}" />
            </div>
            <div class="field">
              <label for="reg-bairro">Bairro em Caxias-MA</label>
              <input type="text" id="reg-bairro" name="bairro" placeholder="Ex.: Centro, Volta Redonda..." value="${Store.escapeHtml(form.bairro || "")}" />
            </div>
          </div>

          <div class="field">
            <label for="reg-endereco">Endereço / Local da Abordagem</label>
            <input type="text" id="reg-endereco" name="endereco" placeholder="Ex.: Praça Cândido Mendes, Centro..." value="${Store.escapeHtml(form.endereco || "")}" />
          </div>

          <div class="field">
            <label for="reg-obs">Observações</label>
            <textarea id="reg-obs" name="observacoes" rows="2" placeholder="Informações complementares, reincidências, etc.">${Store.escapeHtml(form.observacoes || "")}</textarea>
          </div>

          ${
            recordModalError
              ? `<div class="form-error">${ICONS.alert}<span>${Store.escapeHtml(recordModalError)}</span></div>`
              : ""
          }
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-ghost" id="btn-cancel-record">Cancelar</button>
          <button type="submit" class="btn btn-primary">Salvar</button>
        </div>
      </form>
    </div>
  `;

  document.getElementById("btn-close-record-modal").addEventListener("click", closeModal);
  document.getElementById("btn-cancel-record").addEventListener("click", closeModal);

  document.getElementById("photo-input").addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      document.getElementById("foto-hidden").value = reader.result;
      document.getElementById("photo-preview").innerHTML = `<img class="avatar" src="${reader.result}" alt="Foto selecionada" />`;
    };
    reader.readAsDataURL(file);
  });

  document.getElementById("record-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const nome = (fd.get("nome") || "").toString().trim();
    const numeroRegistro = (fd.get("numeroRegistro") || "").toString().trim();
    const dataNascimento = (fd.get("dataNascimento") || "").toString();
    const natureza = (fd.get("natureza") || "").toString().trim();
    const bairro = (fd.get("bairro") || "").toString().trim();
    const endereco = (fd.get("endereco") || "").toString().trim();
    const observacoes = (fd.get("observacoes") || "").toString();
    const foto = (fd.get("foto") || "").toString() || null;

    if (!nome || !numeroRegistro) {
      recordModalError = "Preencha ao menos o nome completo e o número do registro.";
      recordModal = { ...recordModal, nome, numeroRegistro, dataNascimento, natureza, bairro, endereco, observacoes, foto };
      renderRecordModal();
      return;
    }

    if (recordModal.id) {
      Store.updateRecord(recordModal.id, { nome, numeroRegistro, dataNascimento, natureza, bairro, endereco, observacoes, foto });
      Store.addLog("Edição de registro", `Registro ${numeroRegistro} (${nome}) foi atualizado.`);
    } else {
      Store.addRecord({
        id: Store.uid(),
        nome,
        numeroRegistro,
        dataNascimento,
        natureza: natureza || "Registro Policial",
        categoria: "patrimonial",
        bairro: bairro || "Caxias",
        endereco: endereco || `${bairro || "Caxias"}, Caxias - MA`,
        lat: -4.8588 + (Math.random() - 0.5) * 0.02,
        lng: -43.3561 + (Math.random() - 0.5) * 0.02,
        observacoes,
        foto,
        criadoEm: new Date().toISOString(),
      });
      Store.addLog("Cadastro de registro", `Registro ${numeroRegistro} (${nome}) foi criado.`);
    }

    closeModal();
    renderTable();
  });
}

function openConfirmDelete(id) {
  confirmDeleteId = id;
  const records = Store.getRecords();
  const record = records.find((r) => r.id === id);
  if (!record) return;

  const modalRoot = document.getElementById("modal-root");
  modalRoot.innerHTML = `
    <div class="modal-overlay">
      <div class="modal modal-sm">
        <div class="modal-header modal-header-danger">
          ${ICONS.alert}
          <h3>Excluir registro</h3>
        </div>
        <div class="modal-body">
          <p>
            Tem certeza que deseja excluir o registro de <strong>${Store.escapeHtml(record.nome)}</strong> (<code>${Store.escapeHtml(record.numeroRegistro)}</code>)?
          </p>
          <p style="margin-top: 8px; color: var(--red-700); font-size: 12px;">
            Esta ação será registrada na auditoria e não poderá ser desfeita.
          </p>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-ghost" id="btn-cancel-delete">Cancelar</button>
          <button type="button" class="btn btn-danger" id="btn-confirm-delete">Sim, excluir</button>
        </div>
      </div>
    </div>
  `;

  document.getElementById("btn-cancel-delete").addEventListener("click", closeModal);
  document.getElementById("btn-confirm-delete").addEventListener("click", () => {
    const deleted = Store.deleteRecord(confirmDeleteId);
    if (deleted) {
      Store.addLog("Exclusão de registro", `Registro ${deleted.numeroRegistro} (${deleted.nome}) foi excluído.`);
    }
    closeModal();
    renderTable();
  });
}
})();
