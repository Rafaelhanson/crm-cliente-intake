const params = new URLSearchParams(window.location.search);
const supabaseUrl = String(params.get("supabaseUrl") || "").trim().replace(/\/+$/, "");
const supabaseAnonKey = String(params.get("supabaseAnonKey") || "").trim();
const leadsTable = "client_leads";

const form = document.getElementById("intake-form");
const feedback = document.getElementById("intake-feedback");
const cpfInput = document.getElementById("intake-cpf");
const zipInput = document.getElementById("intake-zip");
const addressInput = document.getElementById("intake-address");
const districtInput = document.getElementById("intake-district");
const cityInput = document.getElementById("intake-city");

cpfInput.addEventListener("input", () => {
  const digits = cpfInput.value.replace(/\D/g, "").slice(0, 11);
  cpfInput.value = digits
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1-$2");
});

zipInput.addEventListener("input", () => {
  const digits = zipInput.value.replace(/\D/g, "").slice(0, 8);
  zipInput.value = digits.length > 5
    ? `${digits.slice(0, 5)}-${digits.slice(5)}`
    : digits;
});

zipInput.addEventListener("blur", async () => {
  const digits = zipInput.value.replace(/\D/g, "");
  if (digits.length !== 8) return;
  try {
    const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
    if (!response.ok) return;
    const data = await response.json();
    if (data.erro) return;
    if (data.logradouro) addressInput.value = data.logradouro;
    if (data.bairro) districtInput.value = data.bairro;
    if (data.localidade) cityInput.value = data.localidade;
  } catch {
    // Mantem preenchimento manual em caso de falha da API.
  }
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!supabaseUrl || !supabaseAnonKey) {
    showFeedback("Link invalido: configuracao do formulario nao encontrada.", "err");
    return;
  }

  const formData = new FormData(form);
  const payload = {
    first_name: String(formData.get("first_name") || "").trim(),
    last_name: String(formData.get("last_name") || "").trim(),
    email: String(formData.get("email") || "").trim(),
    phone: String(formData.get("phone") || "").trim(),
    cpf: String(formData.get("cpf") || "").trim(),
    address: String(formData.get("address") || "").trim(),
    zip: String(formData.get("zip") || "").trim(),
    district: String(formData.get("district") || "").trim(),
    city: String(formData.get("city") || "").trim()
  };

  if (!payload.first_name || !payload.last_name) {
    showFeedback("Preencha nome e sobrenome.", "err");
    return;
  }

  showFeedback("Enviando cadastro...", "");

  try {
    const endpoint = `${supabaseUrl}/rest/v1/${leadsTable}`;
    let response;
    try {
      response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${supabaseAnonKey}`,
          Prefer: "return=representation"
        },
        body: JSON.stringify(payload)
      });
    } catch {
      const fallbackEndpoint = `${endpoint}?apikey=${encodeURIComponent(supabaseAnonKey)}`;
      response = await fetch(fallbackEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
    }

    if (!response.ok) {
      throw new Error(`Erro ${response.status}`);
    }

    form.reset();
    showFeedback("Cadastro enviado com sucesso.", "ok");
  } catch (error) {
    showFeedback(`Nao foi possivel enviar agora (${error.message}).`, "err");
  }
});

function showFeedback(message, type) {
  feedback.textContent = message;
  feedback.classList.remove("ok", "err");
  if (type) feedback.classList.add(type);
}
