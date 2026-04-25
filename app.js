const STORAGE_KEY = "crm-rafael-hanson-v1";
const REMOTE_SETTINGS_KEY = "crm-remote-sync-v1";
const REMOTE_LEADS_TABLE = "client_leads";
const CLOUD_SNAPSHOT_TABLE = "app_state_snapshots";

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

const DEFAULT_TEMPLATES = buildDefaultTemplates();
let supabaseClient = null;
let cloudSaveTimeout = null;
const cloudState = {
  ready: false,
  loading: false,
  user: null
};
const uiState = {
  selectedOrderId: null,
  orderDetailTab: "overview",
  selectedContractId: null,
  contractFeedback: { type: "", message: "" }
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
  templateResetDefault: document.getElementById("template-reset-default"),
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
  recentOrders: document.getElementById("recent-orders"),
  authLoginBtn: document.getElementById("auth-login-btn"),
  authSignupBtn: document.getElementById("auth-signup-btn"),
  authUserEmail: document.getElementById("auth-user-email"),
  accountMenuWrap: document.getElementById("account-menu-wrap"),
  accountMenuBtn: document.getElementById("account-menu-btn"),
  accountMenuDropdown: document.getElementById("account-menu-dropdown"),
  accountLogoutBtn: document.getElementById("account-logout-btn"),
  authStatus: document.getElementById("auth-status"),
  signupModal: document.getElementById("signup-modal"),
  signupModalForm: document.getElementById("signup-modal-form"),
  signupModalClose: document.getElementById("signup-modal-close"),
  signupUsername: document.getElementById("signup-username"),
  signupPassword: document.getElementById("signup-password"),
  signupPasswordConfirm: document.getElementById("signup-password-confirm"),
  signupModalFeedback: document.getElementById("signup-modal-feedback"),
  loginModal: document.getElementById("login-modal"),
  loginModalForm: document.getElementById("login-modal-form"),
  loginModalClose: document.getElementById("login-modal-close"),
  loginUsername: document.getElementById("login-username"),
  loginPassword: document.getElementById("login-password"),
  loginModalFeedback: document.getElementById("login-modal-feedback")
};

init();

function init() {
  populateEventTypeOptions();
  bindEvents();
  renderRemoteSyncSettings();
  initSupabaseCloud();
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
      templates: { ...buildDefaultTemplates(), ...(parsed.templates || {}) },
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

function saveState(options = {}) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  if (options.syncCloud !== false) {
    queueCloudSave();
  }
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
  elements.templateResetDefault.addEventListener("click", handleTemplateResetDefault);
  elements.financeReceberGroup.addEventListener("change", renderFinanceOverview);
  elements.financeMonth.addEventListener("change", renderFinanceOverview);
  elements.financePagarType.addEventListener("change", renderFinanceOverview);
  elements.financePagarMonth.addEventListener("change", renderFinanceOverview);
  elements.authLoginBtn.addEventListener("click", openLoginModal);
  elements.authSignupBtn.addEventListener("click", openSignupModal);
  elements.accountLogoutBtn.addEventListener("click", handleAuthLogout);
  elements.accountMenuBtn.addEventListener("click", toggleAccountMenu);
  elements.signupModalForm.addEventListener("submit", handleSignupModalSubmit);
  elements.signupModalClose.addEventListener("click", closeSignupModal);
  elements.loginModalForm.addEventListener("submit", handleAuthLogin);
  elements.loginModalClose.addEventListener("click", closeLoginModal);
  document.addEventListener("click", handleGlobalOutsideClick);

  // Compatibilidade com UI antiga: impede redirecionar para "Modelos"
  // e sempre gera contrato automaticamente dentro do pedido.
  document.addEventListener(
    "click",
    (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;

      const explicitButton = target.closest(
        "#create-contract-from-order-btn, #create-contract-btn, #create-order-contract-btn, [data-action='create-contract'], [data-action='create-contract-from-order']"
      );

      const genericButton = target.closest("button, a");
      const genericLabel = (genericButton?.textContent || "").trim().toLowerCase();
      const isLegacyCreateByText = genericButton
        && genericLabel.includes("criar contrato")
        && !!uiState.selectedOrderId
        && !genericButton.closest("#view-modelos");

      if (!explicitButton && !isLegacyCreateByText) return;

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      handleCreateContractFromOrder();
    },
    true
  );
}

function initSupabaseCloud() {
  const settings = loadRemoteSyncSettings();
  const hasSdk = typeof window.supabase !== "undefined" && typeof window.supabase.createClient === "function";
  if (!hasSdk || !settings.supabaseUrl || !settings.supabaseAnonKey) {
    supabaseClient = null;
    cloudState.ready = false;
    cloudState.user = null;
    updateAuthUi();
    return;
  }

  try {
    supabaseClient = window.supabase.createClient(settings.supabaseUrl, settings.supabaseAnonKey);
  } catch {
    supabaseClient = null;
    cloudState.ready = false;
    cloudState.user = null;
    updateAuthUi();
    return;
  }

  cloudState.ready = true;
  updateAuthUi();

  supabaseClient.auth.getSession().then(({ data }) => {
    cloudState.user = data?.session?.user || null;
    updateAuthUi();
    if (cloudState.user) {
      ensureProfile();
      loadStateFromCloud();
    }
  });

  supabaseClient.auth.onAuthStateChange((_event, session) => {
    cloudState.user = session?.user || null;
    updateAuthUi();
    if (cloudState.user) {
      loadStateFromCloud();
      ensureProfile();
    }
  });
}

async function handleAuthLogin(event) {
  event?.preventDefault?.();
  if (!supabaseClient) {
    updateAuthStatus("Configure URL/chave do Supabase para entrar.", "error");
    showLoginModalFeedback("Configure URL/chave do Supabase para entrar.", "error");
    return;
  }
  const loginInput = String(elements.loginUsername.value || "").trim();
  const password = String(elements.loginPassword.value || "").trim();
  const email = loginInput.includes("@") ? loginInput : usernameToEmail(loginInput);
  if (!loginInput || !password) {
    updateAuthStatus("Informe usuario/e-mail e senha.", "error");
    showLoginModalFeedback("Informe usuario/e-mail e senha.", "error");
    return;
  }
  const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
  if (error) {
    updateAuthStatus(`Erro ao entrar: ${error.message}`, "error");
    showLoginModalFeedback(`Erro ao entrar: ${error.message}`, "error");
    return;
  }
  updateAuthStatus("Login realizado. Sincronizando dados da nuvem...", "success");
  showLoginModalFeedback("Login realizado com sucesso.", "success");
  hideAccountMenu();
  setTimeout(() => {
    closeLoginModal();
  }, 250);
}

async function handleAuthSignup() {
  openSignupModal();
}

function openSignupModal() {
  elements.signupModal.classList.remove("hidden");
  elements.signupUsername.focus();
  showSignupModalFeedback("", "info", true);
}

function closeSignupModal() {
  elements.signupModal.classList.add("hidden");
  elements.signupModalForm.reset();
  showSignupModalFeedback("", "info", true);
}

function openLoginModal() {
  elements.loginModal.classList.remove("hidden");
  elements.loginUsername.focus();
  showLoginModalFeedback("", "info", true);
}

function closeLoginModal() {
  elements.loginModal.classList.add("hidden");
  elements.loginModalForm.reset();
  showLoginModalFeedback("", "info", true);
}

function showLoginModalFeedback(message, type = "info", hide = false) {
  if (hide || !message) {
    elements.loginModalFeedback.textContent = "";
    elements.loginModalFeedback.classList.add("hidden");
    elements.loginModalFeedback.classList.remove("feedback-success", "feedback-error", "feedback-info");
    return;
  }
  elements.loginModalFeedback.textContent = message;
  elements.loginModalFeedback.classList.remove("hidden", "feedback-success", "feedback-error", "feedback-info");
  if (type === "success") elements.loginModalFeedback.classList.add("feedback-success");
  if (type === "error") elements.loginModalFeedback.classList.add("feedback-error");
  if (type === "info") elements.loginModalFeedback.classList.add("feedback-info");
}

function toggleAccountMenu(event) {
  event.stopPropagation();
  const isHidden = elements.accountMenuDropdown.classList.contains("hidden");
  elements.accountMenuDropdown.classList.toggle("hidden", !isHidden);
}

function hideAccountMenu() {
  elements.accountMenuDropdown.classList.add("hidden");
}

function handleGlobalOutsideClick(event) {
  if (!elements.accountMenuWrap.contains(event.target)) {
    hideAccountMenu();
  }
}

function usernameToEmail(usernameRaw) {
  const username = String(usernameRaw || "").trim().toLowerCase();
  if (username.includes("@")) return username;
  const normalized = username
    .replace(/[^a-z0-9._-]/g, ".")
    .replace(/\.+/g, ".")
    .replace(/^\.|\.$/g, "");
  return `${normalized || "usuario"}@crm.local`;
}

function showSignupModalFeedback(message, type = "info", hide = false) {
  if (hide || !message) {
    elements.signupModalFeedback.textContent = "";
    elements.signupModalFeedback.classList.add("hidden");
    elements.signupModalFeedback.classList.remove("feedback-success", "feedback-error", "feedback-info");
    return;
  }
  elements.signupModalFeedback.textContent = message;
  elements.signupModalFeedback.classList.remove("hidden", "feedback-success", "feedback-error", "feedback-info");
  if (type === "success") elements.signupModalFeedback.classList.add("feedback-success");
  if (type === "error") elements.signupModalFeedback.classList.add("feedback-error");
  if (type === "info") elements.signupModalFeedback.classList.add("feedback-info");
}

async function handleSignupModalSubmit(event) {
  event.preventDefault();
  if (!supabaseClient) {
    showSignupModalFeedback("Primeiro configure URL e chave do Supabase.", "error");
    return;
  }

  const username = String(elements.signupUsername.value || "").trim();
  const password = String(elements.signupPassword.value || "").trim();
  const passwordConfirm = String(elements.signupPasswordConfirm.value || "").trim();

  if (!username || !password || !passwordConfirm) {
    showSignupModalFeedback("Preencha todos os campos.", "error");
    return;
  }
  if (password !== passwordConfirm) {
    showSignupModalFeedback("A confirmacao de senha nao confere.", "error");
    return;
  }
  if (password.length < 6) {
    showSignupModalFeedback("Use uma senha com pelo menos 6 caracteres.", "error");
    return;
  }

  const email = usernameToEmail(username);
  showSignupModalFeedback("Criando conta...", "info");

  const { error: signupError } = await supabaseClient.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: username }
    }
  });

  if (signupError) {
    showSignupModalFeedback(`Erro ao criar conta: ${signupError.message}`, "error");
    return;
  }

  const { error: signinError } = await supabaseClient.auth.signInWithPassword({ email, password });
  if (signinError) {
    showSignupModalFeedback(
      "Conta criada. Se seu projeto exigir confirmacao de email, confirme no email antes de entrar.",
      "info"
    );
    updateAuthStatus("Conta criada. Aguarde confirmacao de email (se exigido).", "info");
    return;
  }

  elements.loginUsername.value = "";
  elements.loginPassword.value = "";
  updateAuthStatus("Conta criada e login realizado. Bem-vindo ao CRM.", "success");
  showSignupModalFeedback("Conta criada com sucesso!", "success");
  setTimeout(() => {
    closeSignupModal();
  }, 400);
}

async function handleAuthLogout() {
  if (!supabaseClient) return;
  await supabaseClient.auth.signOut();
  hideAccountMenu();
  updateAuthStatus("Voce saiu da conta. Modo local ativo.", "info");
}

function updateAuthUi() {
  const connected = !!supabaseClient && cloudState.ready;
  const user = cloudState.user;

  elements.authLoginBtn.classList.toggle("hidden", !!user);
  elements.authSignupBtn.classList.toggle("hidden", !!user);
  elements.authUserEmail.classList.toggle("hidden", !user);
  elements.accountMenuWrap.classList.toggle("hidden", !user);

  if (user) {
    elements.authUserEmail.textContent = user.email || "Conta conectada";
  } else {
    elements.authUserEmail.textContent = "";
    hideAccountMenu();
  }

  if (!connected) {
    updateAuthStatus("Modo local (sem conexao cloud).", "info");
    return;
  }
  if (user) {
    updateAuthStatus(`Online: ${user.email || "usuario conectado"}`, "success");
    return;
  }
  updateAuthStatus("Cloud pronta. Faca login para salvar no banco.", "info");
}

function updateAuthStatus(message, type = "info") {
  if (!elements.authStatus) return;
  elements.authStatus.textContent = message;
  elements.authStatus.classList.remove("ok", "err");
  if (type === "success") elements.authStatus.classList.add("ok");
  if (type === "error") elements.authStatus.classList.add("err");
}

async function ensureProfile() {
  if (!supabaseClient || !cloudState.user) return;
  const payload = {
    id: cloudState.user.id,
    full_name: cloudState.user.user_metadata?.full_name || cloudState.user.email || "Usuario CRM"
  };
  await supabaseClient.from("profiles").upsert(payload, { onConflict: "id" });
}

function queueCloudSave() {
  if (!supabaseClient || !cloudState.user || cloudState.loading) return;
  if (cloudSaveTimeout) clearTimeout(cloudSaveTimeout);
  cloudSaveTimeout = setTimeout(() => {
    saveStateToCloud();
  }, 450);
}

async function saveStateToCloud() {
  if (!supabaseClient || !cloudState.user || cloudState.loading) return;
  const snapshot = {
    owner_id: cloudState.user.id,
    app_state: {
      clients: state.clients || [],
      orders: state.orders || [],
      contractsGenerated: state.contractsGenerated || 0,
      templates: state.templates || {},
      importedRemoteLeadIds: state.importedRemoteLeadIds || []
    }
  };
  const { error } = await supabaseClient.from(CLOUD_SNAPSHOT_TABLE).upsert(snapshot, { onConflict: "owner_id" });
  if (error) {
    updateAuthStatus(`Falha ao salvar na nuvem: ${error.message}`, "error");
    return;
  }
  updateAuthStatus("Dados salvos na nuvem.", "success");
}

async function loadStateFromCloud() {
  if (!supabaseClient || !cloudState.user) return;
  cloudState.loading = true;
  const { data, error } = await supabaseClient
    .from(CLOUD_SNAPSHOT_TABLE)
    .select("app_state")
    .eq("owner_id", cloudState.user.id)
    .maybeSingle();
  cloudState.loading = false;

  if (error && error.code !== "PGRST116") {
    updateAuthStatus(`Falha ao carregar nuvem: ${error.message}`, "error");
    return;
  }

  if (!data?.app_state) {
    updateAuthStatus("Conta conectada. Sem dados cloud ainda (usando local).", "info");
    queueCloudSave();
    return;
  }

  const parsed = normalizeAppState(data.app_state);
  state.clients = parsed.clients;
  state.orders = parsed.orders;
  state.contractsGenerated = parsed.contractsGenerated;
  state.templates = parsed.templates;
  state.importedRemoteLeadIds = parsed.importedRemoteLeadIds;
  saveState({ syncCloud: false });
  renderAll();
  updateAuthStatus("Dados carregados da nuvem.", "success");
}

function normalizeAppState(raw) {
  const parsed = raw || {};
  return {
    clients: Array.isArray(parsed.clients) ? parsed.clients : [],
    orders: Array.isArray(parsed.orders) ? parsed.orders : [],
    contractsGenerated: Number(parsed.contractsGenerated || 0),
    templates: { ...buildDefaultTemplates(), ...(parsed.templates || {}) },
    importedRemoteLeadIds: Array.isArray(parsed.importedRemoteLeadIds) ? parsed.importedRemoteLeadIds : []
  };
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
  initSupabaseCloud();
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
    let response = await fetch(endpoint, {
      method: "GET",
      headers: buildSupabaseHeaders(settings.supabaseAnonKey)
    });

    if (!response.ok) {
      const fallbackUrl = `${endpoint}&apikey=${encodeURIComponent(settings.supabaseAnonKey)}`;
      response = await fetch(fallbackUrl, { method: "GET" });
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
  const trimmed = String(rawValue || "").trim();
  if (!trimmed) return "";
  const withoutTrailing = trimmed.replace(/\/+$/, "");
  return withoutTrailing.replace(/\/rest\/v1$/i, "");
}

function normalizeFormBaseUrl(rawValue) {
  return String(rawValue || "").trim().replace(/\/+$/, "");
}

function buildSupabaseHeaders(apiKey) {
  const cleaned = String(apiKey || "").trim();
  const headers = { apikey: cleaned };
  if (cleaned.startsWith("sb_publishable_")) {
    return headers;
  }
  headers.Authorization = `Bearer ${cleaned}`;
  return headers;
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
  const submitted = Object.fromEntries(formData.entries());
  const previousOrder = submitted.id ? findById(state.orders, submitted.id) : null;
  const order = previousOrder ? { ...previousOrder, ...submitted } : submitted;
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

function handleTemplateResetDefault() {
  const eventType = elements.templateEventType.value || "casamento";
  const fallback = DEFAULT_TEMPLATES[eventType] || { title: "", body: "" };
  state.templates[eventType] = { ...fallback };
  saveState();
  syncTemplateEditor();
}

function getOrderMetrics(order) {
  const total = parseCurrencyInput(order.totalValue);
  const entry = parseCurrencyInput(order.entryValue);
  const remaining = Math.max(total - Math.min(entry, total), 0);
  const paymentCount = order.paymentMethod === "Boleto"
    ? (order.boletoSchedule?.length || Number(order.boletoInstallments || 0) || 1)
    : (order.paymentMethod ? 1 : 0);
  return { total, entry, remaining, paymentCount };
}

function handleCreateContractFromOrder() {
  const order = uiState.selectedOrderId ? findById(state.orders, uiState.selectedOrderId) : null;
  if (!order) return;
  const client = findById(state.clients, order.clientId);
  const metrics = getOrderMetrics(order);
  const generatedContract = createContractFromOrder(order, client, metrics);
  if (generatedContract) {
    uiState.selectedContractId = generatedContract.id;
    uiState.orderDetailTab = "contracts";
    setContractFeedback("Contrato gerado com sucesso. Pode revisar e editar antes de exportar.", "success");
    renderAll();
    uiState.selectedOrderId = order.id;
    renderOrderDetailPanel();
  }
}

function syncTemplateEditor() {
  const eventType = elements.templateEventType.value || "casamento";
  const template = getTemplateForEvent(eventType);
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
  const contractCount = getOrderContracts(order).length;
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
  elements.totalContratos.textContent = String(getTotalContractsCount());

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
  uiState.selectedContractId = null;
  clearContractFeedback();
  renderOrderDetailPanel();
}

function closeOrderSummary() {
  uiState.selectedOrderId = null;
  uiState.orderDetailTab = "overview";
  uiState.selectedContractId = null;
  clearContractFeedback();
  renderOrderDetailPanel();
}

function setOrderDetailTab(tabName) {
  uiState.orderDetailTab = tabName;
  if (tabName !== "contracts") {
    clearContractFeedback();
  }
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

  const contracts = getOrderContracts(order);
  const activeContract = getActiveContract(order);
  const contractsListMarkup = contracts.length
    ? contracts
        .slice()
        .reverse()
        .map((contract) => `
          <article class="stack-item ${activeContract && activeContract.id === contract.id ? "contract-item-active" : ""}">
            <div class="stack-item-header">
              <div>
                <h4>${escapeHtml(contract.title || "Contrato sem titulo")}</h4>
                <div class="meta">
                  <span>${formatDateTime(contract.updatedAt || contract.createdAt || "") || "Sem data"}</span>
                </div>
              </div>
            </div>
            <div class="stack-item-actions">
              <button class="mini-button" type="button" data-action="contract-select" data-contract-id="${contract.id}">Editar</button>
              <button class="ghost-button" type="button" data-action="contract-export" data-contract-id="${contract.id}">Exportar PDF</button>
              <button class="danger-button" type="button" data-action="contract-delete" data-contract-id="${contract.id}">Excluir</button>
            </div>
          </article>
        `)
        .join("")
    : '<p class="helper-text">Nenhum contrato gerado para este pedido ainda.</p>';

  const editorMarkup = activeContract
    ? `
      <label>
        Titulo do contrato
        <input id="contract-editor-title" value="${escapeAttribute(activeContract.title || "")}">
      </label>
      <label>
        Corpo do contrato
        <textarea id="contract-editor-body" rows="18">${escapeHtml(activeContract.body || "")}</textarea>
      </label>
      <div class="form-actions">
        <button class="primary-button" type="button" id="contract-save-btn">Salvar alteracoes</button>
        <button class="secondary-button" type="button" id="contract-export-active-btn">Exportar PDF</button>
      </div>
    `
    : `
      <div class="hint-box subtle-box">
        Gere um contrato novo ou escolha um existente para editar manualmente antes de exportar.
      </div>
    `;

  const feedbackClass = uiState.contractFeedback.type ? `feedback-${uiState.contractFeedback.type}` : "";
  const feedbackMarkup = uiState.contractFeedback.message
    ? `<p class="${feedbackClass}">${escapeHtml(uiState.contractFeedback.message)}</p>`
    : "";

  elements.orderDetailInfo.innerHTML = `
    <div class="contract-manager">
      <section class="panel">
        <div class="panel-header">
          <h4>Contratos do pedido</h4>
          <span class="helper-text">${contracts.length} contrato(s)</span>
        </div>
        <div class="form-actions">
          <button class="primary-button" type="button" id="create-contract-from-order-btn">Gerar contrato automatico</button>
          <button class="secondary-button" type="button" id="open-contract-model-btn">Editar modelo base</button>
        </div>
        ${feedbackMarkup}
        <div class="stack-list">${contractsListMarkup}</div>
      </section>

      <section class="panel">
        <div class="panel-header">
          <h4>Editor do contrato</h4>
          <span class="helper-text">Ajuste clausulas antes de exportar</span>
        </div>
        ${editorMarkup}
      </section>
    </div>
  `;

  const createContractButton = document.getElementById("create-contract-from-order-btn");
  if (createContractButton) {
    createContractButton.addEventListener("click", () => {
      const generatedContract = createContractFromOrder(order, client, metrics);
      if (generatedContract) {
        uiState.selectedContractId = generatedContract.id;
        setContractFeedback("Contrato gerado com sucesso. Pode revisar e editar antes de exportar.", "success");
      }
      renderAll();
      uiState.selectedOrderId = order.id;
      uiState.orderDetailTab = "contracts";
      renderOrderDetailPanel();
    });
  }

  const openModelButton = document.getElementById("open-contract-model-btn");
  if (openModelButton) {
    openModelButton.addEventListener("click", () => {
      elements.templateEventType.value = order.eventType || "casamento";
      syncTemplateEditor();
      showView("modelos");
    });
  }

  elements.orderDetailInfo.querySelectorAll("[data-action='contract-select']").forEach((button) => {
    button.addEventListener("click", () => {
      uiState.selectedContractId = button.dataset.contractId || null;
      clearContractFeedback();
      renderOrderDetailPanel();
    });
  });

  elements.orderDetailInfo.querySelectorAll("[data-action='contract-export']").forEach((button) => {
    button.addEventListener("click", () => {
      const contractId = button.dataset.contractId;
      const contract = contracts.find((item) => item.id === contractId);
      if (!contract) return;
      const exported = exportContractToPdf(contract);
      setContractFeedback(exported ? "Janela de impressao/PDF aberta." : "Nao foi possivel abrir o PDF. Verifique bloqueio de pop-up.", exported ? "info" : "error");
      renderOrderDetailPanel();
    });
  });

  elements.orderDetailInfo.querySelectorAll("[data-action='contract-delete']").forEach((button) => {
    button.addEventListener("click", () => {
      const contractId = button.dataset.contractId;
      if (!contractId) return;
      deleteOrderContract(order.id, contractId);
      if (uiState.selectedContractId === contractId) {
        uiState.selectedContractId = null;
      }
      setContractFeedback("Contrato excluido.", "info");
      renderAll();
      uiState.selectedOrderId = order.id;
      uiState.orderDetailTab = "contracts";
      renderOrderDetailPanel();
    });
  });

  const saveContractButton = document.getElementById("contract-save-btn");
  if (saveContractButton && activeContract) {
    saveContractButton.addEventListener("click", () => {
      const titleInput = document.getElementById("contract-editor-title");
      const bodyInput = document.getElementById("contract-editor-body");
      if (!titleInput || !bodyInput) return;
      updateOrderContract(order.id, activeContract.id, {
        title: titleInput.value.trim() || "Contrato sem titulo",
        body: bodyInput.value
      });
      setContractFeedback("Contrato atualizado.", "success");
      renderAll();
      uiState.selectedOrderId = order.id;
      uiState.orderDetailTab = "contracts";
      uiState.selectedContractId = activeContract.id;
      renderOrderDetailPanel();
    });
  }

  const exportActiveButton = document.getElementById("contract-export-active-btn");
  if (exportActiveButton && activeContract) {
    exportActiveButton.addEventListener("click", () => {
      const titleInput = document.getElementById("contract-editor-title");
      const bodyInput = document.getElementById("contract-editor-body");
      if (!titleInput || !bodyInput) return;
      updateOrderContract(order.id, activeContract.id, {
        title: titleInput.value.trim() || "Contrato sem titulo",
        body: bodyInput.value
      });
      const updatedContract = getOrderContracts(order).find((item) => item.id === activeContract.id);
      const exported = updatedContract ? exportContractToPdf(updatedContract) : false;
      setContractFeedback(exported ? "Janela de impressao/PDF aberta." : "Nao foi possivel abrir o PDF. Verifique bloqueio de pop-up.", exported ? "info" : "error");
      renderAll();
      uiState.selectedOrderId = order.id;
      uiState.orderDetailTab = "contracts";
      uiState.selectedContractId = activeContract.id;
      renderOrderDetailPanel();
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

function setContractFeedback(message, type = "info") {
  uiState.contractFeedback = { message, type };
}

function clearContractFeedback() {
  uiState.contractFeedback = { message: "", type: "" };
}

function getOrderContracts(order) {
  if (!order) return [];
  if (!Array.isArray(order.contracts)) order.contracts = [];
  order.contractCount = order.contracts.length;
  return order.contracts;
}

function getTotalContractsCount() {
  return state.orders.reduce((sum, order) => sum + getOrderContracts(order).length, 0);
}

function getActiveContract(order) {
  const contracts = getOrderContracts(order);
  if (!contracts.length) return null;
  const preferred = uiState.selectedContractId
    ? contracts.find((item) => item.id === uiState.selectedContractId)
    : null;
  return preferred || contracts[contracts.length - 1];
}

function createContractFromOrder(order, client, metrics) {
  const template = getTemplateForEvent(order.eventType);
  const fallbackBody = buildFallbackContractBody(order, client, metrics);
  const variables = buildContractVariables(order, client, metrics);
  const rawTitle = template.title || `Contrato - ${order.eventName || getEventLabel(order.eventType)}`;
  const rawBody = template.body || fallbackBody;

  const contract = {
    id: createId("ctr"),
    title: normalizeContractText(replaceVariables(rawTitle, variables)) || "Contrato sem titulo",
    body: normalizeContractText(replaceVariables(rawBody, variables)),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const contracts = getOrderContracts(order);
  contracts.push(contract);
  order.contractCount = contracts.length;
  state.contractsGenerated = getTotalContractsCount();
  saveState();
  return contract;
}

function updateOrderContract(orderId, contractId, updates) {
  const order = findById(state.orders, orderId);
  if (!order) return;
  const contracts = getOrderContracts(order);
  const index = contracts.findIndex((item) => item.id === contractId);
  if (index < 0) return;
  contracts[index] = {
    ...contracts[index],
    ...updates,
    title: normalizeContractText(updates.title || contracts[index].title || "Contrato sem titulo"),
    body: normalizeContractText(updates.body || contracts[index].body || ""),
    updatedAt: new Date().toISOString()
  };
  order.contractCount = contracts.length;
  state.contractsGenerated = getTotalContractsCount();
  saveState();
}

function deleteOrderContract(orderId, contractId) {
  const order = findById(state.orders, orderId);
  if (!order) return;
  const contracts = getOrderContracts(order);
  order.contracts = contracts.filter((item) => item.id !== contractId);
  order.contractCount = order.contracts.length;
  state.contractsGenerated = getTotalContractsCount();
  saveState();
}

function buildFallbackContractBody(order, client, metrics) {
  const eventDateTime = getOrderDateValue(order);
  const extra = order.extraFields || {};
  return [
    `CONTRATANTE: ${client ? `${client.firstName} ${client.lastName}` : "-"}`,
    `CPF: ${client?.cpf || "-"}`,
    "",
    `EVENTO: ${order.eventName || "-"}`,
    `TIPO: ${getEventLabel(order.eventType)}`,
    `DATA: ${formatDateTime(eventDateTime) || "-"}`,
    `LOCAL: ${extra.receptionLocation || extra.ceremonyLocation || extra.graduationLocation || extra.sessionLocation || "-"}`,
    "",
    `VALOR TOTAL: ${formatCurrency(metrics.total)}`,
    `ENTRADA: ${formatCurrency(metrics.entry)}`,
    `SALDO: ${formatCurrency(metrics.remaining)}`,
    `PAGAMENTO: ${order.paymentMethod || "-"}`,
    "",
    "ITENS CONTRATADOS:",
    order.items || "-"
  ].join("\n");
}

function buildContractVariables(order, client, metrics) {
  const extra = order.extraFields || {};
  const fullName = client ? `${client.firstName || ""} ${client.lastName || ""}`.trim() : "";
  const eventDateTimeRaw = extra.eventDateTime || extra.eventDate || "";
  const [eventDateIso, eventTimeIso] = splitDateAndTime(eventDateTimeRaw);
  const clientAddress = [client?.address, client?.district, client?.city].filter(Boolean).join(", ");
  const boletoText = Array.isArray(order.boletoSchedule) && order.boletoSchedule.length
    ? order.boletoSchedule
        .filter((item) => item.dueDate)
        .map((item) => `Boleto ${item.installment}: ${formatDate(item.dueDate)} - ${formatCurrency(item.amount || 0)}`)
        .join("\n")
    : "";

  const paymentSummary = [
    `Metodo: ${order.paymentMethod || "-"}`,
    `Total: ${formatCurrency(metrics.total)}`,
    `Entrada: ${formatCurrency(metrics.entry)}`,
    `Saldo: ${formatCurrency(metrics.remaining)}`,
    boletoText
  ].filter(Boolean).join("\n");

  const values = {
    cliente_nome: fullName,
    cliente_email: client?.email || "",
    cliente_fone: client?.phone || "",
    tipo_evento: getEventLabel(order.eventType),
    nome_evento: order.eventName || "",
    data_evento: formatDate(eventDateIso) || "",
    valor_total: formatCurrency(metrics.total),
    metodo_pagamento: order.paymentMethod || "",
    customer_name: fullName,
    customer_email: client?.email || "",
    customer_mobile: client?.phone || "",
    customer_address: clientAddress,
    customer_zipcode: client?.zip || "",
    customer_doc1: "",
    customer_doc2: client?.cpf || "",
    event_name: order.eventName || "",
    event_date: formatDate(eventDateIso) || "",
    event_time: eventTimeIso || extra.ceremonyTime || "",
    event_place: extra.receptionLocation || extra.ceremonyLocation || extra.graduationLocation || extra.sessionLocation || "",
    event_guests: extra.guestCount || order.guestCount || "",
    order_memo: order.notes || "",
    order_items: order.items || "",
    order_total_amount: formatCurrency(metrics.total),
    order_pay_sched: paymentSummary,
    current_date: new Date().toLocaleDateString("pt-BR"),
    company_signature: "Rafael Hanson Photography",
    contractor1_signature: fullName,
    city: extra.city || client?.city || "",
    state: extra.state || "",
    brideName: extra.brideName || "",
    groomName: extra.groomName || "",
    makingOfLocation: extra.makingOfLocation || "",
    makingOfTime: extra.makingOfTime || "",
    ceremonyLocation: extra.ceremonyLocation || "",
    receptionLocation: extra.receptionLocation || "",
    graduationLocation: extra.graduationLocation || "",
    sessionLocation: extra.sessionLocation || "",
    guestCount: extra.guestCount || order.guestCount || "",
    bestPaymentDay: order.bestPaymentDay || ""
  };

  Object.entries(extra).forEach(([key, value]) => {
    values[key] = value || "";
  });

  return values;
}

function splitDateAndTime(rawValue) {
  if (!rawValue) return ["", ""];
  if (rawValue.includes("T")) {
    const [datePart, timePart] = rawValue.split("T");
    return [datePart || "", (timePart || "").slice(0, 5)];
  }
  return [rawValue, ""];
}

function normalizeContractText(text) {
  return String(text || "")
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function exportContractToPdf(contract) {
  const popup = window.open("", "_blank", "noopener,noreferrer");
  if (!popup) return false;

  const title = escapeHtml(contract.title || "Contrato");
  const body = escapeHtml(contract.body || "").replace(/\n/g, "<br>");
  popup.document.write(`
    <!DOCTYPE html>
    <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <title>${title}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.55;
            margin: 36px;
            color: #111;
          }
          h1 {
            font-size: 22px;
            margin-bottom: 18px;
          }
          .contract-text {
            white-space: normal;
            font-size: 14px;
          }
          @media print {
            body { margin: 18mm; }
          }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        <div class="contract-text">${body}</div>
      </body>
    </html>
  `);
  popup.document.close();
  popup.focus();
  setTimeout(() => popup.print(), 150);
  return true;
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
  const replaced = template
    .replace(/\{\{(.*?)\}\}/g, (_, key) => variables[key.trim()] || "")
    .replace(/\[(.*?)\]/g, (_, key) => variables[key.trim()] || "");

  // RG nao e mais usado no contrato: removemos qualquer trecho relacionado.
  return replaced
    .replace(/portador\(a\)\s+da\s+carteira\s+de\s+identidade\s*n[ºo]\s*[^,;\n]*,?\s*/gi, "")
    .replace(/\bRG\b\s*[:nºo#-]*\s*[^,;\n.]*/gi, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+,/g, ",")
    .replace(/,\s*,/g, ",")
    .replace(/\(\s*\)/g, "")
    .trim();
}

function buildDefaultTemplates() {
  return {
    casamento: {
      title: "Contrato de Prestacao de Servicos Fotografico - Casamento",
      body: [
        "CONTRATO DE PRODUCAO FOTOGRAFICA",
        "",
        "EVENTO: [event_name]",
        "DATA: [event_date]",
        "",
        "Pelo presente instrumento particular de contrato de prestacao de servicos fotograficos, de um lado denominado CONTRATANTE: [customer_name], residente e domiciliado em [customer_address], [customer_zipcode], CPF [customer_doc2], telefone [customer_mobile].",
        "De outro lado CONTRATADO: Rafael Hanson Photography.",
        "",
        "DADOS DO EVENTO",
        "Local principal do evento: [event_place]",
        "Horario principal: [event_time]",
        "Numero de convidados: [event_guests]",
        "",
        "- Data e horario: {{eventDateTime}}",
        "- Noiva: {{brideName}}",
        "- Noivo: {{groomName}}",
        "- Local do making of: {{makingOfLocation}}",
        "- Horario do making of: {{makingOfTime}}",
        "- Local da cerimonia: {{ceremonyLocation}}",
        "- Local da recepcao: {{receptionLocation}}",
        "- Cidade/Estado: {{city}} / {{state}}",
        "- Convidados: [event_guests]",
        "",
        "1. OBJETO",
        "Cobertura fotografica do evento contratado, com entrega conforme pacote.",
        "",
        "2. ITENS CONTRATADOS",
        "[order_items]",
        "",
        "3. VALORES E PAGAMENTO",
        "- Valor total: [order_total_amount]",
        "- Metodo: {{metodo_pagamento}}",
        "- Forma de pagamento: [order_pay_sched]",
        "",
        "4. OBSERVACOES",
        "[order_memo]",
        "",
        "Erechim, [current_date].",
        "",
        "[company_signature]",
        "[contractor1_signature]"
      ].join("\n")
    },
    formatura: {
      title: "Contrato de Prestacao de Servicos Fotografico - Formatura",
      body: [
        "EVENTO: [event_name]",
        "DATA: [event_date]",
        "",
        "CONTRATANTE: [customer_name], CPF [customer_doc2], telefone [customer_mobile].",
        "CONTRATADO: Rafael Hanson Photography.",
        "",
        "DADOS DO EVENTO",
        "- Data e horario: {{eventDateTime}}",
        "- Local: {{graduationLocation}}",
        "- Making of: {{makingOfLocation}}",
        "- Cidade/Estado: {{city}} / {{state}}",
        "- Convidados: [event_guests]",
        "",
        "ITENS CONTRATADOS",
        "[order_items]",
        "",
        "VALORES E PAGAMENTO",
        "- Valor total: [order_total_amount]",
        "- Forma de pagamento: [order_pay_sched]",
        "",
        "Observacoes",
        "[order_memo]",
        "",
        "Erechim, [current_date]",
        "",
        "[company_signature]",
        "[contractor1_signature]"
      ].join("\n")
    },
    ensaio: {
      title: "Contrato de Prestacao de Servicos Fotografico - Ensaio",
      body: [
        "EVENTO: [event_name]",
        "DATA: [event_date]",
        "",
        "CONTRATANTE: [customer_name], CPF [customer_doc2], telefone [customer_mobile].",
        "CONTRATADO: Rafael Hanson Photography.",
        "",
        "DADOS DO ENSAIO",
        "- Data e horario: {{eventDateTime}}",
        "- Local: {{sessionLocation}}",
        "- Cidade/Estado: {{city}} / {{state}}",
        "",
        "ITENS CONTRATADOS",
        "[order_items]",
        "",
        "VALORES E PAGAMENTO",
        "- Valor total: [order_total_amount]",
        "- Forma de pagamento: [order_pay_sched]",
        "",
        "Observacoes",
        "[order_memo]",
        "",
        "Erechim, [current_date]",
        "",
        "[company_signature]",
        "[contractor1_signature]"
      ].join("\n")
    }
  };
}

function getTemplateForEvent(eventType) {
  const fallback = DEFAULT_TEMPLATES[eventType] || { title: "", body: "" };
  const current = state.templates[eventType] || {};
  return {
    title: String(current.title || "").trim() ? current.title : fallback.title,
    body: String(current.body || "").trim() ? current.body : fallback.body
  };
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
