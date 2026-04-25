const STORAGE_KEY = "crm-rafael-hanson-v1";
const REMOTE_SETTINGS_KEY = "crm-remote-sync-v1";
const REMOTE_LEADS_TABLE = "client_leads";

const EVENT_DEFINITIONS = {
  casamento: {
    label: "Casamentos",
    description: "Preencha primeiro os dados do evento de casamento.",
    fields: [
      { name: "eventDateTime", label: "Data e hora do casamento", type: "datetime-local" },
      { name: "guestCount", label: "Convidados", type: "number" },
      { name: "brideName", label: "Noiva" },
      { name: "groomName", label: "Noivo" },
      { name: "makingOfLocation", label: "Local do making of" },
      { name: "makingOfTime", label: "Horario do making of", type: "time" },
      { name: "ceremonyLocation", label: "Local da cerimonia" },
      { name: "receptionLocation", label: "Local da recepcao" },
      { name: "city", label: "Cidade" },
      { name: "state", label: "Estado" }
    ]
  },
  formatura: {
    label: "Formaturas",
    description: "Preencha primeiro os dados do evento de formatura.",
    fields: [
      { name: "eventDateTime", label: "Data e hora da formatura", type: "datetime-local" },
      { name: "guestCount", label: "Convidados", type: "number" },
      { name: "makingOfLocation", label: "Local do making of (se contratado)" },
      { name: "graduationLocation", label: "Local do evento" },
      { name: "city", label: "Cidade" },
      { name: "state", label: "Estado" }
    ]
  },
  ensaio: {
    label: "Ensaios",
    description: "Preencha primeiro os dados do ensaio.",
    fields: [
      { name: "eventDateTime", label: "Data e hora do ensaio", type: "datetime-local" },
      { name: "sessionLocation", label: "Local do ensaio" },
      { name: "city", label: "Cidade" },
      { name: "state", label: "Estado" }
    ]
  }
};

const DEFAULT_TEMPLATES = buildEmptyTemplates();
const uiState = {
  selectedOrderId: null,
  orderDetailTab: "overview"
};

const state = loadState();

const elements = {
  pageTitle: document.getElementById("page-title"),
  navLinks: [...document.querySelectorAll(".nav-link")],
  viewTriggers: [...document.querySelectorAll("[data-view-trigger]")],
  views: {
    dashboard: document.getElementById("view-dashboard"),
    clientes: document.getElementById("view-clientes"),
    pedidos: document.getElementById("view-pedidos"),
    modelos: document.getElementById("view-modelos"),
    financeiro: document.getElementById("view-financeiro")
  },
  clienteForm: document.getElementById("cliente-form"),
  clienteReset: document.getElementById("cliente-reset"),
  clientesList: document.getElementById("clientes-list"),
  clientCpfInput: document.getElementById("client-cpf"),
  clientCpfFeedback: document.getElementById("client-cpf-feedback"),
  clientZipInput: document.getElementById("client-zip"),
  clientAddressInput: document.getElementById("client-address"),
  clientDistrictInput: document.getElementById("client-district"),
  clientCityInput: document.getElementById("client-city"),
  remoteFormBaseUrl: document.getElementById("remote-form-base-url"),
  remoteSupabaseUrl: document.getElementById("remote-supabase-url"),
  remoteSupabaseAnonKey: document.getElementById("remote-supabase-anon-key"),
  remoteSaveSettingsBtn: document.getElementById("remote-save-settings-btn"),
  remoteGenerateLinkBtn: document.getElementById("remote-generate-link-btn"),
  remoteSyncBtn: document.getElementById("remote-sync-btn"),
  remoteFormLink: document.getElementById("remote-form-link"),
  remoteSyncFeedback: document.getElementById("remote-sync-feedback"),
  pedidoForm: document.getElementById("pedido-form"),
  pedidoReset: document.getElementById("pedido-reset"),
  pedidoCancel: document.getElementById("pedido-cancel"),
  pedidoFeedback: document.getElementById("pedido-feedback"),
  openOrderFormBtn: document.getElementById("open-order-form-btn"),
  ordersRecentList: document.getElementById("orders-recent-list"),
  orderFormPanel: document.getElementById("order-form-panel"),
  orderDetailPanel: document.getElementById("order-detail-panel"),
  orderDetailTitle: document.getElementById("order-detail-title"),
  orderDetailInfo: document.getElementById("order-detail-info"),
  summaryCardPayments: document.getElementById("summary-card-payments"),
  summaryCardSchedules: document.getElementById("summary-card-schedules"),
  summaryCardContracts: document.getElementById("summary-card-contracts"),
  summaryCardCosts: document.getElementById("summary-card-costs"),
  orderSummaryPayments: document.getElementById("order-summary-payments"),
  orderSummarySchedules: document.getElementById("order-summary-schedules"),
  orderSummaryContracts: document.getElementById("order-summary-contracts"),
  orderSummaryCosts: document.getElementById("order-summary-costs"),
  orderEditBtn: document.getElementById("order-edit-btn"),
  orderDetailCloseBtn: document.getElementById("order-detail-close-btn"),
  eventTypeSelect: document.getElementById("event-type-select"),
  orderTotalValue: document.getElementById("order-total-value"),
  orderEntryValue: document.getElementById("order-entry-value"),
  orderPaymentMethod: document.getElementById("order-payment-method"),
  orderBestPaymentDay: document.getElementById("order-best-payment-day"),
  boletoExtra: document.getElementById("boleto-extra"),
  dynamicFields: document.getElementById("dynamic-fields"),
  dynamicDescription: document.getElementById("dynamic-description"),
  pedidoClientSelect: document.getElementById("pedido-client-select"),
  templateForm: document.getElementById("template-form"),
  templateEventType: document.getElementById("template-event-type"),
  financeReceberGroup: document.getElementById("finance-receber-group"),
  financeMonthWrap: document.getElementById("finance-month-wrap"),
  financeMonth: document.getElementById("finance-month"),
  financeReceberSummary: document.getElementById("finance-receber-summary"),
  financeReceberYearTotal: document.getElementById("finance-receber-year-total"),
  financeReceberList: document.getElementById("finance-receber-list"),
  financePagarType: document.getElementById("finance-pagar-type"),
  financePagarMonth: document.getElementById("finance-pagar-month"),
  financePagarSummary: document.getElementById("finance-pagar-summary"),
  financePagarYearTotal: document.getElementById("finance-pagar-year-total"),
  financePagarList: document.getElementById("finance-pagar-list"),
  totalClientes: document.getElementById("total-clientes"),
  totalPedidos: document.getElementById("total-pedidos"),
  totalContratos: document.getElementById("total-contratos"),
  proximoEvento: document.getElementById("proximo-evento"),
  proximoEventoData: document.getElementById("proximo-evento-data"),
  recentOrders: document.getElementById("recent-orders")
};

init();

function init() {
  populateEventTypeOptions();
  bindEvents();
  renderRemoteSyncSettings();
  syncTemplateEditor();
  updateDynamicFields(elements.eventTypeSelect.value || "casamento");
  renderAll();
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    const parsed = JSON.parse(raw);
    return {
      clients: parsed.clients || [],
      orders: parsed.orders || [],
      contractsGenerated: parsed.contractsGenerated || 0,
      templates: { ...buildEmptyTemplates(), ...(parsed.templates || {}) },
      importedRemoteLeadIds: parsed.importedRemoteLeadIds || []
    };
  }

  return {
    clients: [],
    orders: [],
    contractsGenerated: 0,
    templates: { ...DEFAULT_TEMPLATES },
    importedRemoteLeadIds: []
  };
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function bindEvents() {
  elements.navLinks.forEach((button) => {
    button.addEventListener("click", () => showView(button.dataset.view));
  });

  elements.viewTriggers.forEach((button) => {
    button.addEventListener("click", () => showView(button.dataset.viewTrigger));
  });

  elements.eventTypeSelect.addEventListener("change", (event) => {
    updateDynamicFields(event.target.value);
  });

  elements.templateEventType.addEventListener("change", syncTemplateEditor);

  elements.clienteForm.addEventListener("submit", handleClientSubmit);
  elements.clienteReset.addEventListener("click", () => {
    resetForm(elements.clienteForm);
    clearCpfFeedback();
  });
  elements.clientZipInput.addEventListener("blur", handleZipBlur);
  elements.clientZipInput.addEventListener("input", handleZipInputMask);
  elements.clientCpfInput.addEventListener("input", handleCpfInputMaskAndValidate);
  elements.clientCpfInput.addEventListener("blur", validateCpfField);
  elements.remoteSaveSettingsBtn.addEventListener("click", handleRemoteSaveSettings);
  elements.remoteGenerateLinkBtn.addEventListener("click", handleRemoteGenerateFormLink);
  elements.remoteSyncBtn.addEventListener("click", handleRemoteSyncClients);

  elements.pedidoForm.addEventListener("submit", handleOrderSubmit);
  elements.pedidoReset.addEventListener("click", () => {
    resetForm(elements.pedidoForm);
    updateDynamicFields(elements.eventTypeSelect.value || "casamento");
    renderBoletoFields();
  });
  elements.pedidoCancel.addEventListener("click", closeOrderForm);
  elements.openOrderFormBtn.addEventListener("click", openNewOrderForm);
  elements.orderEditBtn.addEventListener("click", () => {
    if (uiState.selectedOrderId) openOrderForEdit(uiState.selectedOrderId);
  });
  elements.orderDetailCloseBtn.addEventListener("click", closeOrderSummary);
  elements.summaryCardPayments.addEventListener("click", () => setOrderDetailTab("payments"));
  elements.summaryCardSchedules.addEventListener("click", () => setOrderDetailTab("schedules"));
  elements.summaryCardContracts.addEventListener("click", () => setOrderDetailTab("contracts"));
  elements.summaryCardCosts.addEventListener("click", () => setOrderDetailTab("costs"));
  elements.orderPaymentMethod.addEventListener("change", renderBoletoFields);
  elements.orderBestPaymentDay.addEventListener("input", handleBestPaymentDayInput);
  elements.orderBestPaymentDay.addEventListener("blur", () => {
    if (elements.orderPaymentMethod.value === "Boleto") renderBoletoFields();
  });
  elements.orderTotalValue.addEventListener("input", updateInstallmentAmountDisplay);
  elements.orderTotalValue.addEventListener("change", updateInstallmentAmountDisplay);
  elements.orderEntryValue.addEventListener("input", updateInstallmentAmountDisplay);
  elements.orderEntryValue.addEventListener("change", updateInstallmentAmountDisplay);

  elements.templateForm.addEventListener("submit", handleTemplateSubmit);
  elements.financeReceberGroup.addEventListener("change", renderFinanceOverview);
  elements.financeMonth.addEventListener("change", renderFinanceOverview);
  elements.financePagarType.addEventListener("change", renderFinanceOverview);
  elements.financePagarMonth.addEventListener("change", renderFinanceOverview);
}

function populateEventTypeOptions() {
  const optionsMarkup = Object.entries(EVENT_DEFINITIONS)
    .map(([value, config]) => `<option value="${value}">${config.label}</option>`)
    .join("");

  elements.eventTypeSelect.innerHTML = optionsMarkup;
  elements.templateEventType.innerHTML = optionsMarkup;
}

function loadRemoteSyncSettings() {
  const raw = localStorage.getItem(REMOTE_SETTINGS_KEY);
  if (!raw) return { formBaseUrl: "", supabaseUrl: "", supabaseAnonKey: "" };
  try {
    const parsed = JSON.parse(raw);
    return {
      formBaseUrl: String(parsed.formBaseUrl || "").trim(),
      supabaseUrl: String(parsed.supabaseUrl || "").trim(),
      supabaseAnonKey: String(parsed.supabaseAnonKey || "").trim()
    };
  } catch {
    return { formBaseUrl: "", supabaseUrl: "", supabaseAnonKey: "" };
  }
}

function saveRemoteSyncSettings(settings) {
  localStorage.setItem(REMOTE_SETTINGS_KEY, JSON.stringify(settings));
}

function renderRemoteSyncSettings() {
  const settings = loadRemoteSyncSettings();
  elements.remoteFormBaseUrl.value = settings.formBaseUrl;
  elements.remoteSupabaseUrl.value = settings.supabaseUrl;
  elements.remoteSupabaseAnonKey.value = settings.supabaseAnonKey;
  elements.remoteFormLink.value = buildRemoteFormLink(settings);
}

function handleRemoteSaveSettings() {
  const settings = {
    formBaseUrl: normalizeFormBaseUrl(elements.remoteFormBaseUrl.value),
    supabaseUrl: normalizeSupabaseUrl(elements.remoteSupabaseUrl.value),
    supabaseAnonKey: String(elements.remoteSupabaseAnonKey.value || "").trim()
  };
  saveRemoteSyncSettings(settings);
  elements.remoteFormBaseUrl.value = settings.formBaseUrl;
  elements.remoteSupabaseUrl.value = settings.supabaseUrl;
  showRemoteSyncFeedback("Conexao salva.", "success");
}

function handleRemoteGenerateFormLink() {
  const settings = {
    formBaseUrl: normalizeFormBaseUrl(elements.remoteFormBaseUrl.value),
    supabaseUrl: normalizeSupabaseUrl(elements.remoteSupabaseUrl.value),
    supabaseAnonKey: String(elements.remoteSupabaseAnonKey.value || "").trim()
  };

  if (!settings.supabaseUrl || !settings.supabaseAnonKey) {
    showRemoteSyncFeedback("Preencha URL e chave anon para gerar o link.", "error");
    return;
  }

  saveRemoteSyncSettings(settings);
  const link = buildRemoteFormLink(settings);
  elements.remoteFormLink.value = link;
  elements.remoteFormLink.select();
  if (!settings.formBaseUrl && window.location.protocol === "file:") {
    showRemoteSyncFeedback("Link gerado localmente. Preencha a URL publica do formulario (GitHub Pages) para gerar link online.", "error");
    return;
  }
  showRemoteSyncFeedback("Link do formulario gerado e selecionado para copia.", "success");
}

async function handleRemoteSyncClients() {
  const settings = {
    formBaseUrl: normalizeFormBaseUrl(elements.remoteFormBaseUrl.value),
    supabaseUrl: normalizeSupabaseUrl(elements.remoteSupabaseUrl.value),
    supabaseAnonKey: String(elements.remoteSupabaseAnonKey.value || "").trim()
  };

  if (!settings.supabaseUrl || !settings.supabaseAnonKey) {
    showRemoteSyncFeedback("Preencha URL e chave anon antes de sincronizar.", "error");
    return;
  }

  saveRemoteSyncSettings(settings);
  showRemoteSyncFeedback("Sincronizando clientes online...", "info");
  elements.remoteSyncBtn.disabled = true;

  try {
    const endpoint = `${settings.supabaseUrl}/rest/v1/${REMOTE_LEADS_TABLE}?select=id,created_at,first_name,last_name,email,phone,cpf,address,zip,district,city&order=created_at.asc`;
    let response;
    try {
      response = await fetch(endpoint, {
        method: "GET",
        headers: {
          apikey: settings.supabaseAnonKey,
          Authorization: `Bearer ${settings.supabaseAnonKey}`
        }
      });
    } catch {
      const fallbackUrl = `${endpoint}&apikey=${encodeURIComponent(settings.supabaseAnonKey)}`;
      response = await fetch(fallbackUrl, {
        method: "GET"
      });
    }

    if (!response.ok) {
      throw new Error(`Erro ${response.status}`);
    }

    const leads = await response.json();
    let importedCount = 0;

    leads.forEach((lead) => {
      const leadId = String(lead.id || "").trim();
      if (!leadId) return;
      if (state.importedRemoteLeadIds.includes(leadId)) return;

      const clientFromLead = mapLeadToClient(lead);
      const existing = findExistingClientFromLead(clientFromLead);
      if (existing) {
        existing.remoteLeadId = leadId;
      } else {
        clientFromLead.id = createId("cli");
        clientFromLead.remoteLeadId = leadId;
        state.clients.push(clientFromLead);
      }

      state.importedRemoteLeadIds.push(leadId);
      importedCount += 1;
    });

    saveState();
    renderAll();

    showRemoteSyncFeedback(
      importedCount > 0
        ? `${importedCount} cliente(s) novo(s) importado(s).`
        : "Nenhum cliente novo para importar.",
      "success"
    );
  } catch (error) {
    const localHint = window.location.protocol === "file:"
      ? " Abra o CRM por http://localhost (nao por file://) para sincronizar."
      : "";
    showRemoteSyncFeedback(`Falha na sincronizacao: ${error.message}.${localHint}`, "error");
  } finally {
    elements.remoteSyncBtn.disabled = false;
  }
}

function mapLeadToClient(lead) {
  return {
    firstName: String(lead.first_name || "").trim(),
    lastName: String(lead.last_name || "").trim(),
    email: String(lead.email || "").trim(),
    phone: String(lead.phone || "").trim(),
    cpf: String(lead.cpf || "").trim(),
    address: String(lead.address || "").trim(),
    zip: String(lead.zip || "").trim(),
    district: String(lead.district || "").trim(),
    city: String(lead.city || "").trim()
  };
}

function findExistingClientFromLead(clientCandidate) {
  return state.clients.find((client) => {
    const sameCpf = clientCandidate.cpf && client.cpf === clientCandidate.cpf;
    const sameEmail = clientCandidate.email && client.email && client.email.toLowerCase() === clientCandidate.email.toLowerCase();
    return sameCpf || sameEmail;
  });
}

function normalizeSupabaseUrl(rawValue) {
  return String(rawValue || "").trim().replace(/\/+$/, "");
}

function normalizeFormBaseUrl(rawValue) {
  return String(rawValue || "").trim().replace(/\/+$/, "");
}

function buildRemoteFormLink(settings) {
  const pageUrl = settings.formBaseUrl
    ? new URL(settings.formBaseUrl)
    : new URL("cliente-intake.html", window.location.href);
  if (settings.supabaseUrl) pageUrl.searchParams.set("supabaseUrl", settings.supabaseUrl);
  if (settings.supabaseAnonKey) pageUrl.searchParams.set("supabaseAnonKey", settings.supabaseAnonKey);
  return pageUrl.toString();
}

function showRemoteSyncFeedback(message, type) {
  elements.remoteSyncFeedback.textContent = message;
  elements.remoteSyncFeedback.classList.remove("hidden", "feedback-success", "feedback-error", "feedback-info");
  if (type === "success") elements.remoteSyncFeedback.classList.add("feedback-success");
  if (type === "error") elements.remoteSyncFeedback.classList.add("feedback-error");
  if (type === "info") elements.remoteSyncFeedback.classList.add("feedback-info");
}

function showView(viewName) {
  Object.entries(elements.views).forEach(([key, view]) => {
    view.classList.toggle("active", key === viewName);
  });

  elements.navLinks.forEach((button) => {
    button.classList.toggle("active", button.dataset.view === viewName);
  });

  const titles = {
    dashboard: "Dashboard",
    clientes: "Clientes",
    pedidos: "Pedidos",
    modelos: "Contratos",
    financeiro: "Financeiro"
  };
  elements.pageTitle.textContent = titles[viewName];

  if (viewName === "pedidos") {
    closeOrderForm();
    hidePedidoFeedback();
  }
}

function updateDynamicFields(eventType, order = null) {
  const definition = EVENT_DEFINITIONS[eventType];
  elements.dynamicDescription.textContent = definition.description;
  elements.dynamicFields.innerHTML = definition.fields
    .map((field) => {
      const value = order?.extraFields?.[field.name] || "";
      const type = field.type || "text";
      return `
        <label>
          ${field.label}
          <input name="extra__${field.name}" type="${type}" value="${escapeAttribute(value)}">
        </label>
      `;
    })
    .join("");
}

function handleClientSubmit(event) {
  event.preventDefault();
  if (!validateCpfField()) return;

  const formData = new FormData(event.currentTarget);
  const client = Object.fromEntries(formData.entries());
  client.id = client.id || createId("cli");
  upsert(state.clients, client);
  saveState();
  resetForm(elements.clienteForm);
  clearCpfFeedback();
  renderAll();
  showView("clientes");
}

function handleOrderSubmit(event) {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
  const order = Object.fromEntries(formData.entries());
  const isEdit = Boolean(order.id);
  order.id = order.id || createId("ord");
  order.createdAt = order.createdAt || new Date().toISOString();
  order.extraFields = collectDynamicFields(formData);
  order.boletoSchedule = collectBoletoSchedule(formData);
  upsert(state.orders, order);
  saveState();
  resetForm(elements.pedidoForm);
  updateDynamicFields(elements.eventTypeSelect.value || "casamento");
  renderBoletoFields();
  renderAll();
  showView("pedidos");
  showPedidoFeedback(isEdit ? "Pedido atualizado com sucesso." : "Pedido salvo com sucesso.");
}

function handleTemplateSubmit(event) {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
  const eventType = formData.get("eventType");
  state.templates[eventType] = {
    title: formData.get("title"),
    body: formData.get("body")
  };
  saveState();
}

function syncTemplateEditor() {
  const eventType = elements.templateEventType.value || "casamento";
  const template = state.templates[eventType] || { title: "", body: "" };
  elements.templateForm.eventType.value = eventType;
  elements.templateForm.title.value = template.title;
  elements.templateForm.body.value = template.body;
}

function collectDynamicFields(formData) {
  const extraFields = {};
  for (const [key, value] of formData.entries()) {
    if (key.startsWith("extra__")) {
      extraFields[key.replace("extra__", "")] = value;
    }
  }
  return extraFields;
}

function renderAll() {
  renderClientOptions();
  renderClientsList();
  renderOrdersRecentList();
  renderOrderDetailPanel();
  renderDashboard();
  renderFinanceOverview();
  syncTemplateEditor();
  renderBoletoFields();
}

function renderClientOptions() {
  const options = ['<option value="">Selecione um cliente</option>']
    .concat(
      state.clients.map((client) => `<option value="${client.id}">${client.firstName} ${client.lastName}</option>`)
    )
    .join("");
  elements.pedidoClientSelect.innerHTML = options;
}

function renderClientsList() {
  if (!state.clients.length) {
    elements.clientesList.className = "stack-list empty-state";
    elements.clientesList.textContent = "Nenhum cliente cadastrado ainda.";
    return;
  }

  elements.clientesList.className = "stack-list";
  elements.clientesList.innerHTML = state.clients
    .map((client) => `
      <article class="stack-item">
        <div class="stack-item-header">
          <div>
            <h4>${client.firstName} ${client.lastName}</h4>
            <div class="meta">
              <span>${client.email || "Sem email"}</span>
              <span>${client.phone || "Sem telefone"}</span>
            </div>
          </div>
        </div>
        <div class="stack-item-actions">
          <button class="mini-button" data-action="edit-client" data-id="${client.id}">Editar</button>
          <button class="ghost-button" data-action="new-order-for-client" data-id="${client.id}">Novo pedido</button>
          <button class="danger-button" data-action="delete-client" data-id="${client.id}">Excluir</button>
        </div>
      </article>
    `)
    .join("");

  attachClientActions();
}

function attachClientActions() {
  elements.clientesList.querySelectorAll("[data-action]").forEach((button) => {
    button.addEventListener("click", () => {
      const { action, id } = button.dataset;
      if (action === "edit-client") {
        const client = findById(state.clients, id);
        populateForm(elements.clienteForm, client);
      }
      if (action === "new-order-for-client") {
        showView("pedidos");
        openNewOrderForm();
        elements.pedidoClientSelect.value = id;
      }
      if (action === "delete-client") {
        state.clients = state.clients.filter((client) => client.id !== id);
        state.orders = state.orders.filter((order) => order.clientId !== id);
        saveState();
        renderAll();
      }
    });
  });
}

function renderOrdersRecentList() {
  if (!state.orders.length) {
    elements.ordersRecentList.className = "stack-list empty-state";
    elements.ordersRecentList.textContent = "Nenhum pedido cadastrado ainda.";
    return;
  }

  elements.ordersRecentList.className = "stack-list";
  elements.ordersRecentList.innerHTML = state.orders
    .slice()
    .reverse()
    .slice(0, 8)
    .map((order) => {
      const client = findById(state.clients, order.clientId);
      return `
        <article class="stack-item">
          <div class="stack-item-header">
            <div>
              <h4>${order.eventName || "Pedido sem nome"}</h4>
              <div class="meta">
                <span>${getEventLabel(order.eventType)}</span>
                <span>${client ? `${client.firstName} ${client.lastName}` : "Sem cliente"}</span>
                <span>${formatCurrency(order.totalValue || 0)}</span>
              </div>
            </div>
          </div>
          <div class="stack-item-actions">
            <button class="mini-button" type="button" data-action="open-order-summary" data-id="${order.id}">Abrir</button>
            <button class="danger-button" type="button" data-action="delete-order" data-id="${order.id}">Excluir</button>
          </div>
        </article>
      `;
    })
    .join("");

  elements.ordersRecentList.querySelectorAll("[data-action]").forEach((button) => {
    button.addEventListener("click", () => {
      const { action, id } = button.dataset;
      if (action === "open-order-summary") {
        openOrderSummary(id);
      }
      if (action === "delete-order") {
        state.orders = state.orders.filter((order) => order.id !== id);
        if (uiState.selectedOrderId === id) {
          uiState.selectedOrderId = null;
        }
        saveState();
        renderAll();
        showPedidoFeedback("Pedido excluido.");
      }
    });
  });
}

function renderOrderDetailPanel() {
  const order = uiState.selectedOrderId ? findById(state.orders, uiState.selectedOrderId) : null;
  if (!order) {
    elements.orderDetailPanel.classList.add("hidden");
    return;
  }

  const client = findById(state.clients, order.clientId);
  const total = parseCurrencyInput(order.totalValue);
  const entry = parseCurrencyInput(order.entryValue);
  const remaining = Math.max(total - Math.min(entry, total), 0);
  const paymentCount = order.paymentMethod === "Boleto"
    ? (order.boletoSchedule?.length || Number(order.boletoInstallments || 0) || 1)
    : (order.paymentMethod ? 1 : 0);
  const scheduleCount = getOrderDateValue(order) ? 1 : 0;
  const contractCount = Number(order.contractCount || 0);
  const costsCount = Array.isArray(order.costs) ? order.costs.length : 0;

  elements.orderDetailPanel.classList.remove("hidden");
  elements.orderDetailTitle.textContent = `Resumo - ${order.eventName || "Pedido sem nome"}`;
  elements.orderSummaryPayments.textContent = String(paymentCount);
  elements.orderSummarySchedules.textContent = String(scheduleCount);
  elements.orderSummaryContracts.textContent = String(contractCount);
  elements.orderSummaryCosts.textContent = String(costsCount);
  renderOrderDetailTabContent(order, client, { total, entry, remaining, paymentCount });
}

function renderDashboard() {
  elements.totalClientes.textContent = state.clients.length;
  elements.totalPedidos.textContent = state.orders.length;
  elements.totalContratos.textContent = state.contractsGenerated;

  const upcoming = state.orders
    .map((order) => ({ order, dateValue: getOrderDateValue(order) }))
    .filter((item) => item.dateValue)
    .sort((a, b) => new Date(a.dateValue) - new Date(b.dateValue))[0];

  if (upcoming) {
    elements.proximoEvento.textContent = upcoming.order.eventName;
    elements.proximoEventoData.textContent = `${getEventLabel(upcoming.order.eventType)} em ${formatDateTime(upcoming.dateValue)}`;
  } else {
    elements.proximoEvento.textContent = "Sem agenda";
    elements.proximoEventoData.textContent = "Cadastre um pedido para ver aqui";
  }

  if (!state.orders.length) {
    elements.recentOrders.className = "list-table empty-state";
    elements.recentOrders.textContent = "Nenhum pedido cadastrado ainda.";
  } else {
    elements.recentOrders.className = "list-table";
    elements.recentOrders.innerHTML = state.orders
      .slice()
      .reverse()
      .slice(0, 5)
      .map((order) => {
        const client = findById(state.clients, order.clientId);
        return `
          <article class="recent-order">
            <h4>${order.eventName}</h4>
            <div class="pill-row">
              <span class="pill">${getEventLabel(order.eventType)}</span>
              <span class="pill">${client ? `${client.firstName} ${client.lastName}` : "Sem cliente"}</span>
              <span class="pill">${formatCurrency(order.totalValue)}</span>
            </div>
          </article>
        `;
      })
      .join("");
  }
}

async function handleZipBlur() {
  const digits = (elements.clientZipInput.value || "").replace(/\D/g, "");
  if (digits.length !== 8) return;

  try {
    const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
    if (!response.ok) return;

    const data = await response.json();
    if (data.erro) return;

    if (data.logradouro) elements.clientAddressInput.value = data.logradouro;
    if (data.bairro) elements.clientDistrictInput.value = data.bairro;
    if (data.localidade) elements.clientCityInput.value = data.localidade;
  } catch {
    // Se estiver offline ou a API falhar, mantemos preenchimento manual.
  }
}

function handleZipInputMask() {
  const digits = elements.clientZipInput.value.replace(/\D/g, "").slice(0, 8);
  elements.clientZipInput.value = digits.length > 5
    ? `${digits.slice(0, 5)}-${digits.slice(5)}`
    : digits;
}

function handleCpfInputMaskAndValidate() {
  const digits = elements.clientCpfInput.value.replace(/\D/g, "").slice(0, 11);
  const masked = digits
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1-$2");
  elements.clientCpfInput.value = masked;
  validateCpfField({ quietWhenIncomplete: true });
}

function validateCpfField(options = {}) {
  const { quietWhenIncomplete = false } = options;
  const raw = elements.clientCpfInput.value || "";
  const digits = raw.replace(/\D/g, "");

  if (!digits.length) {
    elements.clientCpfInput.setCustomValidity("");
    clearCpfFeedback();
    return true;
  }

  if (digits.length < 11) {
    elements.clientCpfInput.setCustomValidity("CPF incompleto.");
    if (quietWhenIncomplete) {
      clearCpfFeedback();
    } else {
      showCpfFeedback("CPF incompleto.", "error");
    }
    return false;
  }

  if (!isValidCPF(digits)) {
    elements.clientCpfInput.setCustomValidity("CPF invalido.");
    showCpfFeedback("CPF invalido. Confira o numero informado.", "error");
    return false;
  }

  elements.clientCpfInput.setCustomValidity("");
  showCpfFeedback("CPF valido.", "success");
  return true;
}

function isValidCPF(cpfDigits) {
  if (!/^\d{11}$/.test(cpfDigits)) return false;
  if (/^(\d)\1{10}$/.test(cpfDigits)) return false;

  const computeCheckDigit = (baseDigits, factorStart) => {
    let sum = 0;
    for (let i = 0; i < baseDigits.length; i += 1) {
      sum += Number(baseDigits[i]) * (factorStart - i);
    }
    const remainder = (sum * 10) % 11;
    return remainder === 10 ? 0 : remainder;
  };

  const firstNine = cpfDigits.slice(0, 9);
  const firstCheck = computeCheckDigit(firstNine, 10);
  if (firstCheck !== Number(cpfDigits[9])) return false;

  const firstTen = cpfDigits.slice(0, 10);
  const secondCheck = computeCheckDigit(firstTen, 11);
  return secondCheck === Number(cpfDigits[10]);
}

function showCpfFeedback(message, type) {
  elements.clientCpfFeedback.textContent = message;
  elements.clientCpfFeedback.className = `field-feedback ${type}`;
}

function clearCpfFeedback() {
  elements.clientCpfFeedback.textContent = "";
  elements.clientCpfFeedback.className = "field-feedback";
}

function seedExampleData() {
  if (state.clients.length || state.orders.length) return;

  const client = {
    id: createId("cli"),
    firstName: "Maraisa",
    lastName: "Menegatti",
    email: "maraisamenegatti@gmail.com",
    phone: "(55) 99999-9999",
    birthday: "",
    rg: "10999888",
    cpf: "000.000.000-00",
    address: "Rua da Comunidade, 120",
    zip: "99999-000",
    district: "Centro"
  };

  const order = {
    id: createId("ord"),
    clientId: client.id,
    createdAt: new Date().toISOString(),
    eventType: "casamento",
    eventName: "Wedding Mara e Roberto",
    issueDate: "2026-04-23",
    totalValue: "5800",
    paymentMethod: "PIX",
    bestPaymentDay: "Todo dia 10",
    guestCount: "130",
    items: "Pre wedding (local) + Wedding day (local)",
    notes: "Prazo maximo de entrega conforme contrato e cronograma de edicao.",
    extraFields: {
      brideName: "Maraisa Menegatti",
      groomName: "Roberto da Rosa Silva",
      eventDate: "2026-11-29",
      ceremonyTime: "18:30",
      makingOfLocation: "Igreja da comunidade",
      dinnerLocation: "Salao da comunidade Santo Antonio",
      ceremonyLocation: "Igreja da comunidade",
      city: "Erval Grande",
      state: "RS",
      guestCount: "130"
    }
  };

  state.clients.push(client);
  state.orders.push(order);
  saveState();
  renderAll();
}

function renderFinanceOverview() {
  const currentYear = new Date().getFullYear();
  const viewMode = elements.financeReceberGroup.value;
  const selectedMonth = elements.financeMonth.value || getCurrentMonthKey();
  if (!elements.financeMonth.value) {
    elements.financeMonth.value = selectedMonth;
  }
  elements.financeMonthWrap.classList.toggle("hidden", viewMode !== "mes");

  const receivables = buildReceivablesFromOrders();
  const receivablesYearTotal = receivables
    .filter((item) => item.dueDate.startsWith(String(currentYear)))
    .reduce((sum, item) => sum + item.amount, 0);
  elements.financeReceberYearTotal.textContent = `Total do ano (${currentYear}): ${formatCurrency(receivablesYearTotal)}`;

  if (viewMode === "mes") {
    const monthItems = receivables.filter((item) => item.dueDate.startsWith(selectedMonth));
    const monthTotal = monthItems.reduce((sum, item) => sum + item.amount, 0);
    elements.financeReceberSummary.textContent = `No mes ${formatMonthLabel(selectedMonth)} entra ${formatCurrency(monthTotal)}.`;

    if (!monthItems.length) {
      elements.financeReceberList.className = "stack-list empty-state";
      elements.financeReceberList.textContent = "Nenhum recebimento neste mes.";
    } else {
      elements.financeReceberList.className = "stack-list";
      elements.financeReceberList.innerHTML = monthItems
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
        .map((item) => `
          <article class="stack-item">
            <h4>${item.eventName}</h4>
            <div class="meta">
              <span>${item.typeLabel}</span>
              <span>${formatDate(item.dueDate)}</span>
              <span>${formatCurrency(item.amount)}</span>
            </div>
          </article>
        `)
        .join("");
    }
  } else {
    const grouped = groupReceivablesByEvent(receivables);
    const total = receivables.reduce((sum, item) => sum + item.amount, 0);
    elements.financeReceberSummary.textContent = `Total a receber em todos os eventos: ${formatCurrency(total)}.`;

    if (!grouped.length) {
      elements.financeReceberList.className = "stack-list empty-state";
      elements.financeReceberList.textContent = "Nenhum evento com recebimento.";
    } else {
      elements.financeReceberList.className = "stack-list";
      elements.financeReceberList.innerHTML = grouped
        .map((eventGroup) => `
          <article class="stack-item">
            <h4>${eventGroup.eventName}</h4>
            <div class="meta">
              <span>${eventGroup.typeLabel}</span>
              <span>${eventGroup.count} recebimento(s)</span>
              <span>${formatCurrency(eventGroup.total)}</span>
            </div>
          </article>
        `)
        .join("");
    }
  }

  const payables = buildPayablesFromOrders();
  const payablesYearTotal = payables
    .filter((item) => item.dueDate.startsWith(String(currentYear)))
    .reduce((sum, item) => sum + item.amount, 0);
  elements.financePagarYearTotal.textContent = `Total do ano (${currentYear}): ${formatCurrency(payablesYearTotal)}`;

  const selectedPayableType = elements.financePagarType.value || "todos";
  const selectedPayableMonth = elements.financePagarMonth.value || getCurrentMonthKey();
  if (!elements.financePagarMonth.value) {
    elements.financePagarMonth.value = selectedPayableMonth;
  }

  const filteredPayables = payables.filter((item) => {
    const typeMatches = selectedPayableType === "todos" || item.type === selectedPayableType;
    const monthMatches = item.dueDate.startsWith(selectedPayableMonth);
    return typeMatches && monthMatches;
  });

  const payablesTotal = filteredPayables.reduce((sum, item) => sum + item.amount, 0);
  elements.financePagarSummary.textContent = `Total filtrado de contas a pagar: ${formatCurrency(payablesTotal)}.`;
  if (!filteredPayables.length) {
    elements.financePagarList.className = "stack-list empty-state";
    elements.financePagarList.textContent = "Nenhuma despesa encontrada para esse filtro.";
  } else {
    elements.financePagarList.className = "stack-list";
    elements.financePagarList.innerHTML = filteredPayables
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
      .map((item) => `
        <article class="stack-item">
          <h4>${item.eventName}</h4>
          <div class="meta">
            <span>${item.type}</span>
            <span>${formatDate(item.dueDate)}</span>
            <span>${formatCurrency(item.amount)}</span>
          </div>
        </article>
      `)
      .join("");
  }
}

function buildReceivablesFromOrders() {
  const receivables = [];
  state.orders.forEach((order) => {
    const total = parseCurrencyInput(order.totalValue);
    const entryRaw = parseCurrencyInput(order.entryValue);
    const entry = Math.min(entryRaw, total);
    const remaining = Math.max(total - entry, 0);
    const fallbackDate = pickOrderFallbackDate(order);

    if (entry > 0) {
      receivables.push({
        orderId: order.id,
        eventName: order.eventName || "Pedido sem nome",
        typeLabel: getEventLabel(order.eventType),
        dueDate: fallbackDate,
        amount: entry,
        type: "entrada",
        typeLabelDetail: "Entrada"
      });
    }

    if (order.paymentMethod === "Boleto" && Array.isArray(order.boletoSchedule) && order.boletoSchedule.length) {
      order.boletoSchedule.forEach((inst) => {
        if (!inst.dueDate) return;
        receivables.push({
          orderId: order.id,
          eventName: order.eventName || "Pedido sem nome",
          typeLabel: getEventLabel(order.eventType),
          dueDate: inst.dueDate,
          amount: Number(inst.amount || 0),
          type: "boleto",
          typeLabelDetail: `Boleto ${inst.installment}`
        });
      });
    } else if (remaining > 0) {
      receivables.push({
        orderId: order.id,
        eventName: order.eventName || "Pedido sem nome",
        typeLabel: getEventLabel(order.eventType),
        dueDate: fallbackDate,
        amount: remaining,
        type: "saldo",
        typeLabelDetail: "Saldo"
      });
    }
  });
  return receivables;
}

function groupReceivablesByEvent(receivables) {
  const map = new Map();
  receivables.forEach((item) => {
    const key = item.orderId;
    const existing = map.get(key) || {
      eventName: item.eventName,
      typeLabel: item.typeLabel,
      total: 0,
      count: 0
    };
    existing.total += item.amount;
    existing.count += 1;
    map.set(key, existing);
  });
  return [...map.values()].sort((a, b) => b.total - a.total);
}

function buildPayablesFromOrders() {
  const payables = [];
  state.orders.forEach((order) => {
    const costs = Array.isArray(order.costs) ? order.costs : [];
    costs.forEach((cost) => {
      if (!cost.dueDate) return;
      payables.push({
        orderId: order.id,
        eventName: order.eventName || "Pedido sem nome",
        type: cost.type || "Custo",
        amount: Number(cost.value || 0),
        dueDate: cost.dueDate
      });
    });
  });
  return payables;
}

function pickOrderFallbackDate(order) {
  const orderDate = getOrderDateValue(order);
  if (orderDate) return toIsoDate(new Date(orderDate));
  if (order.createdAt) return toIsoDate(new Date(order.createdAt));
  return toIsoDate(new Date());
}

function getCurrentMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function formatMonthLabel(monthKey) {
  const [year, month] = monthKey.split("-").map(Number);
  if (!year || !month) return monthKey;
  const date = new Date(year, month - 1, 1);
  return date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

function openNewOrderForm() {
  resetForm(elements.pedidoForm);
  elements.orderFormPanel.classList.remove("hidden");
  elements.pedidoForm.elements.id.value = "";
  elements.orderEntryValue.value = "0";
  updateDynamicFields(elements.eventTypeSelect.value || "casamento");
  renderBoletoFields();
  hidePedidoFeedback();
}

function closeOrderForm() {
  elements.orderFormPanel.classList.add("hidden");
}

function openOrderForEdit(orderId) {
  const order = findById(state.orders, orderId);
  if (!order) return;

  elements.orderFormPanel.classList.remove("hidden");
  hidePedidoFeedback();
  populateForm(elements.pedidoForm, order);
  elements.eventTypeSelect.value = order.eventType || elements.eventTypeSelect.value;
  updateDynamicFields(elements.eventTypeSelect.value, order);
  if (order.entryValue !== undefined) {
    elements.orderEntryValue.value = order.entryValue || "0";
  }
  renderBoletoFields();
}

function openOrderSummary(orderId) {
  uiState.selectedOrderId = orderId;
  uiState.orderDetailTab = "overview";
  renderOrderDetailPanel();
}

function closeOrderSummary() {
  uiState.selectedOrderId = null;
  uiState.orderDetailTab = "overview";
  renderOrderDetailPanel();
}

function setOrderDetailTab(tabName) {
  uiState.orderDetailTab = tabName;
  renderOrderDetailPanel();
}

function renderOrderDetailTabContent(order, client, metrics) {
  const scheduleCount = getOrderDateValue(order) ? 1 : 0;
  const nextBoleto = order.boletoSchedule?.find((item) => item.dueDate) || null;
  const activeTab = uiState.orderDetailTab || "overview";

  elements.summaryCardPayments.classList.toggle("active", activeTab === "payments");
  elements.summaryCardSchedules.classList.toggle("active", activeTab === "schedules");
  elements.summaryCardContracts.classList.toggle("active", activeTab === "contracts");
  elements.summaryCardCosts.classList.toggle("active", activeTab === "costs");

  if (activeTab === "overview") {
    const extra = order.extraFields || {};
    const definition = EVENT_DEFINITIONS[order.eventType];
    const eventFieldsMarkup = (definition?.fields || [])
      .map((field) => {
        const rawValue = extra[field.name];
        return `<p><strong>${field.label}:</strong> ${formatDynamicFieldValue(rawValue, field.type)}</p>`;
      })
      .join("");

    elements.orderDetailInfo.innerHTML = `
      <div class="order-detail-grid">
        <div>
          <h4>Resumo do evento</h4>
          <p><strong>Cliente:</strong> ${client ? `${client.firstName} ${client.lastName}` : "Sem cliente"}</p>
          <p><strong>Tipo:</strong> ${getEventLabel(order.eventType)}</p>
          <p><strong>Evento:</strong> ${order.eventName || "-"}</p>
          ${eventFieldsMarkup}
        </div>
      </div>
    `;
    return;
  }

  if (activeTab === "payments") {
    const boletoLines = order.boletoSchedule?.length
      ? order.boletoSchedule
          .filter((item) => item.dueDate)
          .map((item) => `<p><strong>Boleto ${item.installment}:</strong> ${formatDate(item.dueDate)} - ${formatCurrency(item.amount || 0)}</p>`)
          .join("")
      : "<p>Sem parcelas de boleto cadastradas.</p>";

    elements.orderDetailInfo.innerHTML = `
      <div class="order-detail-grid">
        <div>
          <h4>Resumo financeiro</h4>
          <p><strong>Total:</strong> ${formatCurrency(metrics.total)}</p>
          <p><strong>Entrada:</strong> ${formatCurrency(metrics.entry)}</p>
          <p><strong>Saldo:</strong> ${formatCurrency(metrics.remaining)}</p>
          <p><strong>Metodo:</strong> ${order.paymentMethod || "-"}</p>
          <p><strong>Melhor dia:</strong> ${order.bestPaymentDay || "-"}</p>
          <p><strong>Parcelas:</strong> ${metrics.paymentCount}</p>
        </div>
        <div>
          <h4>Parcelas</h4>
          ${boletoLines}
        </div>
      </div>
    `;
    return;
  }

  if (activeTab === "schedules") {
    elements.orderDetailInfo.innerHTML = `
      <div class="order-detail-grid">
        <div>
          <h4>Agendamento do evento</h4>
          <p><strong>Cliente:</strong> ${client ? `${client.firstName} ${client.lastName}` : "Sem cliente"}</p>
          <p><strong>Evento:</strong> ${order.eventName || "-"}</p>
          <p><strong>Tipo:</strong> ${getEventLabel(order.eventType)}</p>
          <p><strong>Data/Hora:</strong> ${formatDateTime(getOrderDateValue(order)) || "-"}</p>
          <p><strong>Status:</strong> ${scheduleCount ? "Agendado" : "Sem data definida"}</p>
        </div>
      </div>
    `;
    return;
  }

  if (activeTab === "costs") {
    const costs = Array.isArray(order.costs) ? order.costs : [];
    const costsTotal = costs.reduce((sum, item) => sum + Number(item.value || 0), 0);
    const costsListMarkup = costs.length
      ? costs
          .map((item) => `
            <div class="cost-row">
              <p><strong>${item.type}:</strong> ${formatCurrency(item.value)} (${item.dueDate ? formatDate(item.dueDate) : "sem vencimento"})</p>
              <button class="danger-button" type="button" data-action="delete-cost" data-cost-id="${item.id}">Excluir</button>
            </div>
          `)
          .join("")
      : "<p>Nenhum custo cadastrado neste pedido.</p>";

    elements.orderDetailInfo.innerHTML = `
      <div class="order-detail-grid">
        <div>
          <h4>Criar custo</h4>
          <label>
            Tipo de custo
            <select id="order-cost-type">
              <option value="Combustivel">Combustivel</option>
              <option value="Alimentacao">Alimentacao</option>
              <option value="Hospedagem">Hospedagem</option>
              <option value="Albuns">Albuns</option>
              <option value="Encadernados">Encadernados</option>
            </select>
          </label>
          <label>
            Valor
            <div class="money-input">
              <span>R$</span>
              <input id="order-cost-value" type="number" min="0" step="0.01">
            </div>
          </label>
          <label>
            Data de vencimento (opcional)
            <input id="order-cost-due-date" type="date">
          </label>
          <div class="form-actions">
            <button class="primary-button" type="button" id="order-cost-add-btn">Criar custo</button>
          </div>
        </div>
        <div>
          <h4>Custos do pedido</h4>
          <p><strong>Total:</strong> ${formatCurrency(costsTotal)}</p>
          ${costsListMarkup}
        </div>
      </div>
    `;

    const addCostButton = document.getElementById("order-cost-add-btn");
    const costType = document.getElementById("order-cost-type");
    const costValue = document.getElementById("order-cost-value");
    const costDueDate = document.getElementById("order-cost-due-date");
    if (addCostButton && costType && costValue && costDueDate) {
      addCostButton.addEventListener("click", () => {
        const value = Number(costValue.value || 0);
        if (value <= 0) return;
        addCostToOrder(order.id, {
          type: costType.value,
          value,
          dueDate: costDueDate.value || "",
          createdAt: toIsoDate(new Date())
        });
      });
    }

    elements.orderDetailInfo.querySelectorAll('[data-action="delete-cost"]').forEach((button) => {
      button.addEventListener("click", () => {
        const costId = button.dataset.costId;
        if (!costId) return;
        removeCostFromOrder(order.id, costId);
      });
    });
    return;
  }

  elements.orderDetailInfo.innerHTML = `
    <div class="order-detail-grid">
      <div>
        <h4>Contratos</h4>
        <p><strong>Quantidade:</strong> ${order.contractCount || 0}</p>
        <p>Crie o contrato a partir do modelo para este tipo de evento.</p>
      </div>
      <div>
        <button class="primary-button" type="button" id="create-contract-from-order-btn">Criar contrato</button>
      </div>
    </div>
  `;

  const createContractButton = document.getElementById("create-contract-from-order-btn");
  if (createContractButton) {
    createContractButton.addEventListener("click", () => {
      elements.templateEventType.value = order.eventType || "casamento";
      syncTemplateEditor();
      showView("modelos");
    });
  }
}

function showPedidoFeedback(message) {
  elements.pedidoFeedback.textContent = message;
  elements.pedidoFeedback.classList.remove("hidden");
}

function hidePedidoFeedback() {
  elements.pedidoFeedback.textContent = "";
  elements.pedidoFeedback.classList.add("hidden");
}

function addCostToOrder(orderId, costData) {
  const order = findById(state.orders, orderId);
  if (!order) return;
  if (!Array.isArray(order.costs)) order.costs = [];
  order.costs.push({
    id: createId("cost"),
    ...costData
  });
  saveState();
  renderAll();
  uiState.selectedOrderId = orderId;
  uiState.orderDetailTab = "costs";
  renderOrderDetailPanel();
}

function removeCostFromOrder(orderId, costId) {
  const order = findById(state.orders, orderId);
  if (!order || !Array.isArray(order.costs)) return;
  order.costs = order.costs.filter((cost) => cost.id !== costId);
  saveState();
  renderAll();
  uiState.selectedOrderId = orderId;
  uiState.orderDetailTab = "costs";
  renderOrderDetailPanel();
}

function populateForm(form, data) {
  Object.entries(data).forEach(([key, value]) => {
    const field = form.elements.namedItem(key);
    if (field) field.value = value || "";
  });
}

function resetForm(form) {
  form.reset();
  const hiddenId = form.querySelector('input[type="hidden"][name="id"]');
  if (hiddenId) hiddenId.value = "";
}

function upsert(collection, item) {
  const index = collection.findIndex((entry) => entry.id === item.id);
  if (index >= 0) {
    collection[index] = item;
  } else {
    collection.push(item);
  }
}

function findById(collection, id) {
  return collection.find((item) => item.id === id);
}

function replaceVariables(template, variables) {
  return template
    .replace(/\{\{(.*?)\}\}/g, (_, key) => variables[key.trim()] || "")
    .replace(/\[(.*?)\]/g, (_, key) => variables[key.trim()] || "");
}

function buildEmptyTemplates() {
  const templates = {};
  Object.keys(EVENT_DEFINITIONS).forEach((eventType) => {
    templates[eventType] = { title: "", body: "" };
  });
  return templates;
}

function getEventLabel(eventType) {
  return EVENT_DEFINITIONS[eventType]?.label || eventType || "Evento";
}

function getOrderDateValue(order) {
  const extra = order?.extraFields || {};
  return extra.eventDateTime || extra.eventDate || "";
}

function renderBoletoFields() {
  const method = elements.orderPaymentMethod.value;
  if (method !== "Boleto") {
    elements.boletoExtra.innerHTML = "";
    return;
  }

  const currentInstallments = Number(elements.pedidoForm.elements.boletoInstallments?.value || 1);
  const bestDay = getBestPaymentDay();
  const firstDueDate = suggestFirstDueDate(bestDay);

  const selectedInstallments = currentInstallments > 0 ? currentInstallments : 1;
  const installmentsOptions = Array.from({ length: 12 }, (_, i) => i + 1)
    .map((count) => `<option value="${count}" ${count === selectedInstallments ? "selected" : ""}>${count}x</option>`)
    .join("");

  const generatedDates = buildBoletoDueDates(firstDueDate, selectedInstallments, bestDay);
  const totalValue = parseCurrencyInput(elements.orderTotalValue.value);
  const entryValueRaw = parseCurrencyInput(elements.orderEntryValue.value);
  const entryValue = Math.min(entryValueRaw, totalValue);
  const remainingAmount = Math.max(totalValue - entryValue, 0);
  const installmentAmount = selectedInstallments > 0 ? remainingAmount / selectedInstallments : 0;
  const listItems = generatedDates.map((isoDate, index) => `
    <div class="boleto-schedule-item">
      <span>Boleto ${index + 1} - ${formatDate(isoDate)}</span>
      <span>R$ ${formatMoneyNumber(installmentAmount)}</span>
    </div>
  `).join("");
  const scheduleMarkup = bestDay
    ? `<div class="boleto-schedule-list">${listItems}</div>`
    : `<div class="hint-box">Informe o melhor dia para pagamento (1 a 31) para gerar os vencimentos.</div>`;

  elements.boletoExtra.innerHTML = `
    <div class="boleto-config">
      <label>
        Quantas vezes (boletos)
        <select name="boletoInstallments" id="boleto-installments">${installmentsOptions}</select>
      </label>
      <label>
        Saldo restante
        <div class="money-input">
          <span>R$</span>
          <input id="boleto-remaining-amount" type="text" readonly>
        </div>
      </label>
      <label>
        Valor de cada boleto
        <div class="money-input">
          <span>R$</span>
          <input id="boleto-installment-amount" type="text" readonly>
        </div>
      </label>
    </div>
    ${scheduleMarkup}
  `;

  const installmentsSelect = document.getElementById("boleto-installments");
  installmentsSelect.addEventListener("change", renderBoletoFields);

  updateInstallmentAmountDisplay();
}

function collectBoletoSchedule(formData) {
  if (formData.get("paymentMethod") !== "Boleto") return [];
  const installments = Number(formData.get("boletoInstallments") || 0);
  const bestDay = Number(formData.get("bestPaymentDay") || 0);
  const preferredDay = bestDay >= 1 && bestDay <= 31 ? bestDay : null;
  const firstDueDate = suggestFirstDueDate(preferredDay);
  const dueDates = buildBoletoDueDates(firstDueDate, installments, preferredDay);

  const totalValue = parseCurrencyInput(formData.get("totalValue"));
  const entryValueRaw = parseCurrencyInput(formData.get("entryValue"));
  const entryValue = Math.min(entryValueRaw, totalValue);
  const remainingAmount = Math.max(totalValue - entryValue, 0);
  const installmentAmount = installments > 0 ? remainingAmount / installments : 0;

  return dueDates.map((dueDate, index) => ({
    installment: index + 1,
    dueDate,
    amount: installmentAmount
  }));
}

function updateInstallmentAmountDisplay() {
  if (elements.orderPaymentMethod.value !== "Boleto") return;
  const amountField = document.getElementById("boleto-installment-amount");
  const remainingField = document.getElementById("boleto-remaining-amount");
  if (!amountField) return;

  const installments = Number(elements.pedidoForm.elements.boletoInstallments?.value || 1);
  const totalValue = parseCurrencyInput(elements.orderTotalValue.value);
  const entryValueRaw = parseCurrencyInput(elements.orderEntryValue.value);
  const entryValue = Math.min(entryValueRaw, totalValue);
  const remainingAmount = Math.max(totalValue - entryValue, 0);
  const installmentAmount = installments > 0 ? remainingAmount / installments : 0;

  if (remainingField) remainingField.value = formatMoneyNumber(remainingAmount);
  amountField.value = formatMoneyNumber(installmentAmount);
}

function handleBestPaymentDayInput() {
  const onlyDigits = elements.orderBestPaymentDay.value.replace(/\D/g, "").slice(0, 2);
  elements.orderBestPaymentDay.value = onlyDigits;
}

function getBestPaymentDay() {
  const day = Number((elements.orderBestPaymentDay.value || "").trim());
  if (Number.isNaN(day) || day < 1 || day > 31) return null;
  return day;
}

function suggestFirstDueDate(bestDay) {
  if (!bestDay) return "";
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();
  const clampedCurrentMonthDay = Math.min(bestDay, daysInCurrentMonth);
  const candidate = new Date(year, month, clampedCurrentMonthDay);

  if (candidate >= new Date(year, month, today.getDate())) {
    return toIsoDate(candidate);
  }

  const nextMonthDate = new Date(year, month + 1, 1);
  const daysInNextMonth = new Date(nextMonthDate.getFullYear(), nextMonthDate.getMonth() + 1, 0).getDate();
  const clampedNextDay = Math.min(bestDay, daysInNextMonth);
  return toIsoDate(new Date(nextMonthDate.getFullYear(), nextMonthDate.getMonth(), clampedNextDay));
}

function buildBoletoDueDates(firstDueDate, installments, preferredDay) {
  if (!firstDueDate) return Array.from({ length: installments }, () => "");

  const firstDate = new Date(`${firstDueDate}T00:00:00`);
  if (Number.isNaN(firstDate.getTime())) return Array.from({ length: installments }, () => "");

  const anchorDay = preferredDay || firstDate.getDate();
  return Array.from({ length: installments }, (_, index) => {
    const targetMonthDate = new Date(firstDate.getFullYear(), firstDate.getMonth() + index, 1);
    const daysInTargetMonth = new Date(targetMonthDate.getFullYear(), targetMonthDate.getMonth() + 1, 0).getDate();
    const targetDay = Math.min(anchorDay, daysInTargetMonth);
    return toIsoDate(new Date(targetMonthDate.getFullYear(), targetMonthDate.getMonth(), targetDay));
  });
}

function toIsoDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseCurrencyInput(rawValue) {
  const value = String(rawValue || "").trim();
  if (!value) return 0;
  const normalized = value.includes(",")
    ? value.replace(/\./g, "").replace(",", ".")
    : value;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatMoneyNumber(value) {
  return Number(value || 0).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function createId(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function formatCurrency(value) {
  const number = Number(value || 0);
  return number.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(value) {
  if (!value) return "";
  const date = new Date(`${value}T00:00:00`);
  return date.toLocaleDateString("pt-BR");
}

function formatDateTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function formatDynamicFieldValue(value, type) {
  if (value === undefined || value === null || value === "") return "-";
  if (type === "datetime-local") return formatDateTime(value) || "-";
  if (type === "date") return formatDate(value) || "-";
  return String(value);
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttribute(value) {
  return escapeHtml(value).replace(/'/g, "&#39;");
}
