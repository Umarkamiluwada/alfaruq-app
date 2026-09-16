/* ===========================================================
   ALFARUQ DATA SERVICES — app.js
   Hash-based router so the Android back button works normally
   (it moves through real browser history instead of always
   jumping to Home).
   =========================================================== */

const SUPABASE_URL = "https://vcexczhmvtawldjgldob.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZjZXhjemhtdnRhd2xkamdsZG9iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc1MjA1NjAsImV4cCI6MjEwMzA5NjU2MH0.ilTnx56SiL9QZxZ4xx07-ElT44NTbvBc607vzzo-iGY";

const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ---- Edit these to your own ALFARUQ contact details ----
const SUPPORT_PHONE = "09077049048";
const SUPPORT_EMAIL = "support@alfaruqdata.com";
const SUPPORT_WHATSAPP = "2349077049048";
// ----------------------------------------------------------

const state = {
  session: null,
  profile: null,
  wallet: { balance: 0 },
  transactions: [],
  services: {},
  balanceHidden: localStorage.getItem("alfaruq_balance_hidden") === "1",
};

const app = document.getElementById("app");
const modalRoot = document.getElementById("modal-root");
const toastRoot = document.getElementById("toast-root");

/* ---------------- helpers ---------------- */

function naira(n) {
  return "₦" + Number(n || 0).toLocaleString("en-NG", { minimumFractionDigits: 2 });
}

function toast(msg, ms = 2600) {
  toastRoot.innerHTML = `<div class="toast">${msg}</div>`;
  clearTimeout(toast._t);
  toast._t = setTimeout(() => (toastRoot.innerHTML = ""), ms);
}

function toggleBalance() {
  state.balanceHidden = !state.balanceHidden;
  localStorage.setItem("alfaruq_balance_hidden", state.balanceHidden ? "1" : "0");
  const el = document.getElementById("balance-value");
  const eye = document.getElementById("balance-eye");
  if (el) el.textContent = state.balanceHidden ? "₦ ••••••" : naira(state.wallet.balance);
  if (eye) eye.textContent = state.balanceHidden ? "🙈" : "👁️";
}

function closeModal() {
  modalRoot.innerHTML = "";
}

function go(hash) {
  location.hash = hash;
}

function goBack() {
  // Real browser history back — this is what makes the Android
  // back button (and this in-app back arrow) return to whatever
  // screen the user actually came from, instead of forcing Home.
  history.back();
}

async function callFunction(name, body) {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/${name}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${state.session?.access_token || SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify(body || {}),
  });
  let data;
  try { data = await res.json(); } catch { data = { status: false, message: "Bad response from server" }; }
  if (!res.ok && data.status === undefined) data.status = false;
  return data;
}

function topBar(title, opts = {}) {
  return `
    <div class="topbar">
      ${opts.noBack ? '<div class="spacer"></div>' : `<div class="back-btn" onclick="goBack()">←</div>`}
      <h1>${title}</h1>
      <div class="spacer"></div>
    </div>`;
}

function bottomNav(active) {
  const items = [
    ["home", "🏠", "Home", "#/home"],
    ["transactions", "🧾", "Transactions", "#/transactions"],
    ["support", "🎧", "Support", "#/support"],
    ["account", "👤", "Account", "#/account"],
  ];
  return `
    <div class="bottom-nav">
      ${items.map(([key, icon, label, href]) => `
        <div class="nav-item ${active === key ? "active" : ""}" onclick="go('${href}')">
          <div class="ic">${icon}</div><div>${label}</div>
        </div>`).join("")}
    </div>
    <div class="fab-whatsapp" onclick="window.open('https://wa.me/${SUPPORT_WHATSAPP}','_blank')">💬</div>`;
}

/* ---------------- data loading ---------------- */

async function refreshWallet() {
  if (!state.session) return;
  const { data } = await sb.from("wallets").select("balance").eq("user_id", state.session.user.id).maybeSingle();
  state.wallet.balance = data?.balance || 0;
}

async function refreshProfile() {
  if (!state.session) return;
  const { data } = await sb.from("profiles").select("*").eq("id", state.session.user.id).maybeSingle();
  state.profile = data;
}

async function refreshTransactions() {
  if (!state.session) return;
  const { data } = await sb
    .from("transactions")
    .select("*")
    .eq("user_id", state.session.user.id)
    .order("created_at", { ascending: false })
    .limit(100);
  state.transactions = data || [];
}

/* ---------------- router ---------------- */

async function route() {
  const hash = location.hash || "#/home";
  const [, path, param] = hash.match(/^#\/([^/]+)\/?(.*)$/) || [null, "home", ""];

  if (!state.session && !["login", "signup"].includes(path)) {
    return go("#/login");
  }
  if (state.session && ["login", "signup"].includes(path)) {
    return go("#/home");
  }

  if (state.session && path !== "login" && path !== "signup") {
    if (!state.profile) await refreshProfile();
    if (state.profile?.is_suspended) return renderSuspended();
  }

  switch (path) {
    case "login": return renderLogin();
    case "signup": return renderSignup();
    case "home": return renderHome();
    case "transactions": return renderTransactions();
    case "support": return renderSupport();
    case "account": return renderAccount();
    case "service": return renderServiceForm(param);
    case "withdraw": return renderWithdraw();
    case "topup": return renderTopup();
    case "airtime-cash": return renderAirtimeCash();
    case "nin": return renderIdentityChoice("nin");
    case "nin-form": return renderIdentityForm("nin", param);
    case "bvn": return renderIdentityChoice("bvn");
    case "bvn-form": return renderIdentityForm("bvn", param);
    case "admin": return renderAdmin();
    case "flight": return renderTravelSearch("flight");
    case "hotel": return renderTravelSearch("hotel");
    case "receipt": return renderReceiptScreen(param);
    default: return renderHome();
  }
}

window.addEventListener("hashchange", route);

/* ---------------- auth ---------------- */

async function initAuth() {
  const { data } = await sb.auth.getSession();
  state.session = data.session;
  sb.auth.onAuthStateChange((_event, session) => {
    state.session = session;
  });
  await route();
  checkPendingTopup();
}

function renderLogin() {
  app.innerHTML = `
    <div class="center-pad">
      <img src="./icon-192.png" alt="ALFARUQ" style="width:72px;height:72px;border-radius:18px;margin:0 auto 16px;display:block;" />
      <h2 style="margin:0 0 4px;">Welcome back</h2>
      <p style="color:var(--text-muted);font-size:13px;margin:0 0 20px;">Log in to your ALFARUQ wallet</p>
    </div>
    <form id="login-form">
      <div class="form-group"><label>Email</label><input type="email" id="li-email" required /></div>
      <div class="form-group"><label>Password</label><input type="password" id="li-password" required /></div>
      <div id="login-error" class="error-text"></div>
      <div class="form-group"><button class="btn btn-primary btn-block" type="submit">Log In</button></div>
    </form>
    <div class="muted-link">No account? <a href="#/signup">Sign up</a></div>
  `;
  document.getElementById("login-form").onsubmit = async (e) => {
    e.preventDefault();
    const email = document.getElementById("li-email").value.trim();
    const password = document.getElementById("li-password").value;
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error) { document.getElementById("login-error").textContent = error.message; return; }
    state.session = data.session;
    go("#/home");
  };
}

function renderSignup() {
  app.innerHTML = `
    <div class="center-pad">
      <img src="./icon-192.png" alt="ALFARUQ" style="width:72px;height:72px;border-radius:18px;margin:0 auto 16px;display:block;" />
      <h2 style="margin:0 0 4px;">Create account</h2>
      <p style="color:var(--text-muted);font-size:13px;margin:0 0 20px;">Join ALFARUQ DATA SERVICES</p>
    </div>
    <form id="signup-form">
      <div class="form-group"><label>Full name</label><input type="text" id="su-name" required /></div>
      <div class="form-group"><label>Phone number</label><input type="tel" id="su-phone" required /></div>
      <div class="form-group"><label>Email</label><input type="email" id="su-email" required /></div>
      <div class="form-group"><label>Password</label><input type="password" id="su-password" minlength="6" required /></div>
      <div id="signup-error" class="error-text"></div>
      <div class="form-group"><button class="btn btn-primary btn-block" type="submit">Sign Up</button></div>
    </form>
    <div class="muted-link">Already have an account? <a href="#/login">Log in</a></div>
  `;
  document.getElementById("signup-form").onsubmit = async (e) => {
    e.preventDefault();
    const full_name = document.getElementById("su-name").value.trim();
    const phone = document.getElementById("su-phone").value.trim();
    const email = document.getElementById("su-email").value.trim();
    const password = document.getElementById("su-password").value;
    const { data, error } = await sb.auth.signUp({ email, password, options: { data: { full_name, phone } } });
    if (error) { document.getElementById("signup-error").textContent = error.message; return; }
    if (data.user) {
      await sb.from("profiles").upsert({ id: data.user.id, full_name, phone });
      await sb.from("wallets").upsert({ user_id: data.user.id, balance: 0 });
    }
    if (data.session) { state.session = data.session; go("#/home"); }
    else { toast("Check your email to confirm your account, then log in."); go("#/login"); }
  };
}

async function logout() {
  await sb.auth.signOut();
  state.session = null;
  state.profile = null;
  go("#/login");
}

function renderSuspended() {
  app.innerHTML = `
    <div class="center-pad">
      <div style="font-size:48px;margin-bottom:12px;">🚫</div>
      <h2 style="margin:0 0 8px;">Account Suspended</h2>
      <p style="color:var(--text-muted);font-size:14px;">Your account has been suspended. Please contact support for help.</p>
      <div class="form-group" style="margin-top:20px;"><button class="btn btn-outline-dark btn-block" onclick="window.open('https://wa.me/${SUPPORT_WHATSAPP}')">Contact Support</button></div>
      <div class="form-group"><button class="btn btn-block" style="background:#FCEAEA;color:var(--danger);" onclick="logout()">Logout</button></div>
    </div>`;
}

/* ---------------- home ---------------- */

const SERVICE_TILES = [
  ["airtime", "📞", "Airtime"],
  ["data", "📶", "Data"],
  ["education", "🎓", "Education"],
  ["electricity", "💡", "Electricity"],
  ["tv", "📺", "TV Cable"],
];

async function renderHome() {
  app.innerHTML = `<div class="center-pad">Loading…</div>`;
  await Promise.all([refreshWallet(), refreshProfile()]);
  const name = state.profile?.full_name?.split(" ")[0] || "there";
  const hour = new Date().getHours();
  const greet = hour < 12 ? "Morning" : hour < 17 ? "Afternoon" : "Night";

  app.innerHTML = `
    <div class="greeting">
      <div class="who">
        <div class="avatar">${name[0]?.toUpperCase() || "U"}</div>
        <div>
          <div class="sub">${greet}! 👋</div>
          <div class="name">${name}</div>
        </div>
      </div>
      <div class="bell">🔔</div>
    </div>

    <div class="wallet-card">
      <div class="row">
        <div class="label">🪪 Total Wallet Balance</div>
        <div style="cursor:pointer;" onclick="toggleBalance()" id="balance-eye">${state.balanceHidden ? "🙈" : "👁️"}</div>
      </div>
      <div class="balance" id="balance-value">${state.balanceHidden ? "₦ ••••••" : naira(state.wallet.balance)}</div>
      <hr/>
      <div class="row">
        <div class="bonus">Bonus: ₦0.00</div>
        <div class="actions">
          <button class="btn btn-outline" onclick="go('#/withdraw')">Withdraw</button>
          <button class="btn btn-gold" onclick="go('#/topup')">+ Top Up</button>
        </div>
      </div>
    </div>

    <div class="section-title">Quick Services</div>
    <div class="grid3">
      ${SERVICE_TILES.map(([key, icon, label]) => `
        <div class="service-tile" onclick="go('#/service/${key}')">
          <div class="ic">${icon}</div><span>${label}</span>
        </div>`).join("")}
      <div class="service-tile" onclick="go('#/nin')"><div class="ic">🛡️</div><span>NIN</span></div>
      <div class="service-tile" onclick="go('#/bvn')"><div class="ic">🛡️</div><span>BVN</span></div>
      <div class="service-tile" onclick="go('#/airtime-cash')"><div class="ic">💱</div><span>Airtime2Cash</span></div>
      <div class="service-tile" onclick="go('#/flight')"><div class="ic">✈️</div><span>Flight</span></div>
      <div class="service-tile" onclick="go('#/hotel')"><div class="ic">🏨</div><span>Hotel</span></div>
      ${state.profile?.is_admin ? `<div class="service-tile" onclick="go('#/admin')"><div class="ic">⚙️</div><span>Admin</span></div>` : ""}
    </div>

    <div style="height:20px"></div>
    ${bottomNav("home")}
  `;
}

/* ---------------- transactions + receipt ---------------- */

const TX_LABELS = {
  data_purchase: "Data Purchase", airtime_purchase: "Airtime Purchase",
  tv_subscription: "TV Subscription", electricity_purchase: "Electricity Token",
  education_purchase: "Education PIN", withdrawal: "Wallet Withdrawal",
  airtime_to_cash: "Airtime to Cash", nin_lookup: "NIN Lookup", bvn_lookup: "BVN Lookup",
  flight_booking: "Flight Booking", hotel_booking: "Hotel Booking",
  referral_bonus: "Referral Bonus", wallet_funding: "Wallet Funding",
  admin_credit: "Wallet Credited by Admin", admin_debit: "Wallet Debited by Admin",
};

async function renderTransactions() {
  app.innerHTML = topBar("Transaction History", { noBack: true }) + `<div class="center-pad">Loading…</div>`;
  await refreshTransactions();
  const list = state.transactions;

  app.innerHTML = topBar("Transaction History", { noBack: true }) + (
    list.length === 0
      ? `<div class="empty-state"><div class="ic">🧾</div><h3>No Transactions Yet</h3>
         <p>Your utility and VTU transaction history will appear here.</p></div>`
      : `<div class="card" style="padding:0;">
          ${list.map((t) => `
            <div class="list-item" onclick="go('#/receipt/${t.id}')">
              <div>
                <div class="l-title">${TX_LABELS[t.type] || t.type}</div>
                <div class="l-sub">${new Date(t.created_at).toLocaleString("en-NG")}</div>
              </div>
              <div style="text-align:right">
                <div class="l-amount ${["referral_bonus","airtime_to_cash","wallet_funding","admin_credit"].includes(t.type) ? "amount-in" : "amount-out"}">
                  ${["referral_bonus","airtime_to_cash","wallet_funding","admin_credit"].includes(t.type) ? "+" : "-"}${naira(t.amount)}
                </div>
                <span class="badge ${t.status === "success" || t.status === "completed" ? "badge-success" : t.status === "failed" ? "badge-failed" : "badge-pending"}">${t.status}</span>
              </div>
            </div>`).join("")}
        </div>`
  ) + bottomNav("transactions");
}

async function renderReceiptScreen(id) {
  if (!state.transactions.length) await refreshTransactions();
  const t = state.transactions.find((x) => String(x.id) === String(id));
  if (!t) { go("#/transactions"); return; }

  app.innerHTML = topBar("Receipt") + `
    <div class="receipt-header">
      <div class="stamp">${t.status === "success" || t.status === "completed" ? "✓" : t.status === "failed" ? "✕" : "⏳"}</div>
      <div class="amt">${naira(t.amount)}</div>
      <div class="badge ${t.status === "success" || t.status === "completed" ? "badge-success" : t.status === "failed" ? "badge-failed" : "badge-pending"}" style="margin-top:8px;">${t.status}</div>
    </div>
    <div class="card">
      <div class="receipt-row"><div class="k">Transaction Type</div><div>${TX_LABELS[t.type] || t.type}</div></div>
      <div class="receipt-row"><div class="k">Reference</div><div>TXN-${String(t.id).padStart(6, "0")}</div></div>
      <div class="receipt-row"><div class="k">Date</div><div>${new Date(t.created_at).toLocaleString("en-NG")}</div></div>
      ${t.meta?.network ? `<div class="receipt-row"><div class="k">Network</div><div>${t.meta.network}</div></div>` : ""}
      ${t.meta?.phone_number ? `<div class="receipt-row"><div class="k">Phone</div><div>${t.meta.phone_number}</div></div>` : ""}
      ${t.meta?.plan ? `<div class="receipt-row"><div class="k">Plan</div><div>${t.meta.plan}</div></div>` : ""}
    </div>
    <div class="form-group">
      <button class="btn btn-outline-dark btn-block" onclick="window.print()">Share / Print Receipt</button>
    </div>
  `;
}

/* ---------------- support ---------------- */

function renderSupport() {
  app.innerHTML = topBar("Customer Support", { noBack: true }) + `
    <div class="card">
      <div style="display:flex;gap:12px;align-items:center;">
        <div class="avatar" style="background:var(--primary);color:#fff;">🎧</div>
        <div>
          <div style="font-weight:600;">How can we help?</div>
          <div style="font-size:12px;color:var(--text-muted);">Our support team is available to assist you 24/7.</div>
        </div>
      </div>
    </div>
    <div class="section-title">Contact Channels</div>
    <div class="card" style="padding:0;">
      <div class="list-item" onclick="window.open('tel:${SUPPORT_PHONE}')">
        <div><div class="l-title">📞 Phone Number</div><div class="l-sub">${SUPPORT_PHONE}</div></div><div>›</div>
      </div>
      <div class="list-item" onclick="window.open('mailto:${SUPPORT_EMAIL}')">
        <div><div class="l-title">✉️ Email</div><div class="l-sub">${SUPPORT_EMAIL}</div></div><div>›</div>
      </div>
      <div class="list-item" onclick="window.open('https://wa.me/${SUPPORT_WHATSAPP}')">
        <div><div class="l-title">💬 WhatsApp</div><div class="l-sub">Chat with us</div></div><div>›</div>
      </div>
    </div>
    ${bottomNav("support")}
  `;
}

/* ---------------- account ---------------- */

function renderAccount() {
  const p = state.profile;
  app.innerHTML = topBar("Account & Settings", { noBack: true }) + `
    <div class="wallet-card" style="background:var(--primary-dark);">
      <div style="font-weight:600;font-size:16px;">${p?.full_name || ""}</div>
      <div style="font-size:13px;color:var(--primary-light);margin:2px 0 10px;">${state.session?.user?.email || ""}</div>
      <span class="badge" style="background:rgba(255,255,255,0.15);color:#fff;">${p?.phone || ""}</span>
    </div>

    <div class="section-title">Account</div>
    <div class="card" style="padding:0;">
      <div class="list-item"><div class="l-title">👤 Manage Account</div><div>›</div></div>
      <div class="list-item" onclick="go('#/support')"><div class="l-title">🎧 Customer Care</div><div>›</div></div>
      <div class="list-item"><div class="l-title">🎁 Refer to Earn</div><div>Share</div></div>
    </div>

    <div class="section-title">Identity Services</div>
    <div class="card" style="padding:0;">
      <div class="list-item" onclick="go('#/nin')"><div class="l-title">🛡️ NIN Details</div><div>›</div></div>
      <div class="list-item" onclick="go('#/bvn')"><div class="l-title">🛡️ BVN Details</div><div>›</div></div>
    </div>

    <div class="section-title">Preferences &amp; Legal</div>
    <div class="card" style="padding:0;">
      <div class="list-item"><div class="l-title">🎨 Appearances</div><div>›</div></div>
      <div class="list-item"><div class="l-title">⭐ Rate Us</div><div>›</div></div>
      <div class="list-item"><div class="l-title">🛡️ Privacy Policy</div><div>›</div></div>
      <div class="list-item"><div class="l-title">📄 Terms &amp; Conditions</div><div>›</div></div>
    </div>

    <div class="form-group" style="margin-top:16px;">
      <button class="btn btn-block" style="background:#FCEAEA;color:var(--danger);" onclick="logout()">Logout</button>
    </div>
    ${bottomNav("account")}
  `;
}

/* ---------------- VTU service purchase (airtime/data/tv/electricity/education) ---------------- */
/* Field names confirmed against VTUGATE's public docs (vtugate.com):
   airtime: {network, phone, amount}. Data/TV/Electricity/Education use the
   same network/provider/disco string pattern. Static lists below match
   VTUGATE's actual supported networks/providers/discos/exam-bodies. */

const SERVICE_TITLES = { airtime: "Buy Airtime", data: "Buy Data", tv: "TV Subscription", electricity: "Electricity Bill", education: "Education PIN" };
const NETWORK_LIST = ["MTN", "AIRTEL", "GLO", "9MOBILE"];
const TV_PROVIDERS = [["dstv", "DStv"], ["gotv", "GOtv"], ["startimes", "Startimes"], ["showmax", "Showmax"]];
const DISCOS = [
  ["ibedc", "IBEDC — Ibadan"], ["ekedc", "EKEDC — Eko"], ["ikedc", "IKEDC — Ikeja"], ["aedc", "AEDC — Abuja"],
  ["phed", "PHED — Port Harcourt"], ["kaedco", "KAEDCO — Kaduna"], ["jed", "JED — Jos"], ["kedco", "KEDCO — Kano"],
  ["eedc", "EEDC — Enugu"], ["yedc", "YEDC — Yola"], ["bedc", "BEDC — Benin"], ["aple", "APLE"],
];
const EXAM_TYPES = [["waec", "WAEC"], ["neco", "NECO"], ["jamb", "JAMB"], ["nabteb", "NABTEB"]];

function pick(obj, keys, fallback) {
  for (const k of keys) if (obj && obj[k] !== undefined && obj[k] !== null && obj[k] !== "") return obj[k];
  return fallback;
}
function extractList(res) {
  const d = res?.data ?? res?.plans ?? res?.variations ?? res;
  return Array.isArray(d) ? d : Object.values(d || {}).find(Array.isArray) || [];
}
async function getMarkup(serviceType) {
  const { data } = await sb.from("admin_settings").select("value").eq("key", `${serviceType}_markup_percent`).maybeSingle();
  return Number(data?.value ?? 0);
}
function optionsHtml(list) {
  return list.map(([value, label]) => `<option value="${value}">${label}</option>`).join("");
}

async function renderServiceForm(type) {
  if (!SERVICE_TITLES[type]) { go("#/home"); return; }
  const markupPct = await getMarkup(type);

  const providerField = type === "tv"
    ? `<div class="form-group"><label>Cable Provider</label><select id="svc-provider">${optionsHtml(TV_PROVIDERS)}</select></div>`
    : type === "electricity"
    ? `<div class="form-group"><label>Disco (Electricity Provider)</label><select id="svc-provider">${optionsHtml(DISCOS)}</select></div>`
    : type === "education"
    ? `<div class="form-group"><label>Exam Type</label><select id="svc-provider">${optionsHtml(EXAM_TYPES)}</select></div>`
    : `<div class="form-group"><label>Network</label><select id="svc-provider">${optionsHtml(NETWORK_LIST.map((n) => [n, n]))}</select></div>`;

  app.innerHTML = topBar(SERVICE_TITLES[type]) + `
    <form id="svc-form">
      ${providerField}
      ${type === "tv" ? `
        <div class="form-group"><label>Smart Card / IUC Number</label><input type="text" id="svc-smartcard" required /></div>
        <div class="form-group"><label>Phone Number</label><input type="tel" id="svc-phone" required /></div>
        <div class="form-group"><button type="button" class="btn btn-outline-dark btn-block" id="svc-verify-btn">Verify Smart Card</button></div>
        <div id="svc-verify-result"></div>
      ` : type === "electricity" ? `
        <div class="form-group"><label>Meter Number</label><input type="text" id="svc-meter" required /></div>
        <div class="form-group"><label>Meter Type</label><select id="svc-meter-type"><option value="prepaid">Prepaid</option><option value="postpaid">Postpaid</option></select></div>
        <div class="form-group"><label>Phone Number</label><input type="tel" id="svc-phone" required /></div>
        <div class="form-group"><button type="button" class="btn btn-outline-dark btn-block" id="svc-verify-btn">Verify Meter</button></div>
        <div id="svc-verify-result"></div>
      ` : `
        <div class="form-group"><label>Phone Number</label><input type="tel" id="svc-phone" required /></div>
      `}
      ${type === "airtime" ? `<div class="form-group"><label>Amount (₦)</label><input type="number" id="svc-amount" min="50" required /></div>` : ""}
      <div id="svc-plan-area">${type === "data" || type === "education" ? `<div class="center-pad">Loading plans…</div>` : ""}</div>
      <div id="svc-error" class="error-text"></div>
      <div class="form-group"><button class="btn btn-primary btn-block" type="submit" ${type === "tv" || type === "electricity" ? "disabled" : ""}>Continue</button></div>
    </form>
  `;

  const submitBtn = document.querySelector("#svc-form button[type=submit]");
  let educationPrice = 0;

  async function loadDataPlans() {
    const network = document.getElementById("svc-provider").value;
    const res = await callFunction("vtugate-data-plans", { network });
    const plans = extractList(res);
    document.getElementById("svc-plan-area").innerHTML = `
      <div class="form-group">
        <label>Data Plan</label>
        <select id="svc-plan">
          ${plans.length ? plans.map((p, i) => {
            const amt = Number(pick(p, ["amount", "price", "variation_amount", "data_amount"], 0));
            const name = pick(p, ["name", "plan_name", "data_plan", "variation_name"], `Plan ${i + 1}`);
            const category = pick(p, ["plan_type", "category", "type"], "");
            const code = pick(p, ["plan_code", "code", "variation_code", "id"], "");
            const sell = Math.ceil(amt * (1 + markupPct / 100));
            return `<option value="${code}" data-amount="${amt}" data-name="${name}">${category ? `[${category}] ` : ""}${name} — ${naira(sell)}</option>`;
          }).join("") : `<option value="">No plans returned — VTUGATE_API_KEY may be missing or this network has no active plans</option>`}
        </select>
      </div>`;
  }

  async function loadEducationPrice() {
    const service = document.getElementById("svc-provider").value;
    const res = await callFunction("vtugate-education-price", { service_id: service });
    const priceData = res?.data ?? res;
    educationPrice = Number(pick(priceData, ["amount", "price"], 0));
    const sell = Math.ceil(educationPrice * (1 + markupPct / 100));
    document.getElementById("svc-plan-area").innerHTML = `
      <div class="form-group"><label>Price per PIN</label><input type="text" value="${naira(sell)}" readonly /></div>
      <div class="form-group"><label>Quantity</label><input type="number" id="svc-qty" value="1" min="1" required /></div>`;
  }

  if (type === "data") { await loadDataPlans(); document.getElementById("svc-provider").onchange = loadDataPlans; }
  if (type === "education") { await loadEducationPrice(); document.getElementById("svc-provider").onchange = loadEducationPrice; }

  const verifyBtn = document.getElementById("svc-verify-btn");
  if (verifyBtn) {
    verifyBtn.onclick = async () => {
      const provider = document.getElementById("svc-provider").value;
      verifyBtn.disabled = true; verifyBtn.textContent = "Verifying…";
      let res;
      if (type === "tv") {
        res = await callFunction("vtugate-verify-cabletv", { provider, smartcard_number: document.getElementById("svc-smartcard").value, phone: document.getElementById("svc-phone").value });
      } else {
        res = await callFunction("vtugate-verify-electricity", { disco: provider, meter_no: document.getElementById("svc-meter").value, meter_type: document.getElementById("svc-meter-type").value });
      }
      verifyBtn.disabled = false; verifyBtn.textContent = type === "tv" ? "Verify Smart Card" : "Verify Meter";

      if (!res.status && !res.data) {
        document.getElementById("svc-verify-result").innerHTML = `<div class="error-text">${res.message || "Verification failed"}</div>`;
        return;
      }
      const customerName = pick(res.data || res, ["customer_name", "name", "Customer_Name"], "Verified");
      document.getElementById("svc-verify-result").innerHTML = `<div class="card">✅ ${customerName}</div>`;
      submitBtn.disabled = false;

      if (type === "tv") {
        const plansRaw = pick(res.data || res, ["plans", "packages", "variations"], []);
        if (Array.isArray(plansRaw) && plansRaw.length) {
          document.getElementById("svc-plan-area").innerHTML = `
            <div class="form-group"><label>Bouquet / Plan</label>
              <select id="svc-plan">
                ${plansRaw.map((p) => {
                  const amt = Number(pick(p, ["amount", "price"], 0));
                  const name = pick(p, ["name", "plan_name"], "Plan");
                  const code = pick(p, ["plan_code", "code"], "");
                  const sell = Math.ceil(amt * (1 + markupPct / 100));
                  return `<option value="${code}" data-amount="${amt}" data-name="${name}">${name} — ${naira(sell)}</option>`;
                }).join("")}
              </select></div>`;
        } else {
          document.getElementById("svc-plan-area").innerHTML = `
            <p style="padding:0 16px;font-size:12px;color:var(--text-muted);">Bouquet list wasn't in the verify response — enter it manually:</p>
            <div class="form-group"><label>Plan Code</label><input type="text" id="svc-plan-code" required /></div>
            <div class="form-group"><label>Plan Name</label><input type="text" id="svc-plan-label" required /></div>
            <div class="form-group"><label>Amount (₦, provider price)</label><input type="number" id="svc-plan-amount" required /></div>`;
        }
      } else {
        document.getElementById("svc-plan-area").innerHTML = `<div class="form-group"><label>Amount to Recharge (₦)</label><input type="number" id="svc-amount" min="500" required /></div>`;
      }
    };
  }

  document.getElementById("svc-form").onsubmit = async (e) => {
    e.preventDefault();
    const pin = prompt("Enter your 4-digit wallet PIN:");
    if (!pin) return;
    const provider = document.getElementById("svc-provider").value;
    let body = { pin };
    let fnName = "";

    if (type === "airtime") {
      fnName = "vtugate-secure-buy-airtime";
      body.network = provider; body.phone = document.getElementById("svc-phone").value;
      body.provider_amount = document.getElementById("svc-amount").value;
    } else if (type === "data") {
      fnName = "vtugate-secure-buy-data";
      const sel = document.getElementById("svc-plan")?.selectedOptions?.[0];
      body.network = provider; body.phone = document.getElementById("svc-phone").value;
      body.plan_code = sel?.value; body.plan_name = sel?.dataset.name; body.provider_amount = sel?.dataset.amount;
    } else if (type === "education") {
      fnName = "vtugate-secure-buy-education";
      body.service_id = provider; body.phone = document.getElementById("svc-phone")?.value || "N/A";
      body.quantity = document.getElementById("svc-qty").value;
      body.product_code = provider;
      body.amount = Math.ceil(educationPrice * Number(body.quantity) * (1 + markupPct / 100));
    } else if (type === "tv") {
      fnName = "vtugate-secure-buy-cabletv-";
      const sel = document.getElementById("svc-plan");
      body.provider = provider; body.phone = document.getElementById("svc-phone").value;
      body.smartcard_number = document.getElementById("svc-smartcard").value;
      if (sel) { const o = sel.selectedOptions[0]; body.plan_code = o.value; body.plan_name = o.dataset.name; body.provider_amount = o.dataset.amount; }
      else { body.plan_code = document.getElementById("svc-plan-code").value; body.plan_name = document.getElementById("svc-plan-label").value; body.provider_amount = document.getElementById("svc-plan-amount").value; }
    } else if (type === "electricity") {
      fnName = "vtugate-secure-buy-electricity";
      body.disco = provider; body.meter_no = document.getElementById("svc-meter").value;
      body.meter_type = document.getElementById("svc-meter-type").value;
      body.phone = document.getElementById("svc-phone").value;
      body.provider_amount = document.getElementById("svc-amount").value;
    }

    submitBtn.disabled = true; submitBtn.textContent = "Processing…";
    const result = await callFunction(fnName, body);
    submitBtn.disabled = false; submitBtn.textContent = "Continue";

    if (!result.status) { document.getElementById("svc-error").textContent = result.message || "Transaction failed"; return; }
    toast("Successful! ✅");
    await refreshWallet();
    go("#/transactions");
  };
}

/* ---------------- top up wallet (Paystack) ---------------- */

function renderTopup() {
  app.innerHTML = topBar("Fund Wallet") + `
    <form id="topup-form">
      <div class="form-group"><label>Amount (₦)</label><input type="number" id="topup-amount" min="100" required /></div>
      <div id="topup-error" class="error-text"></div>
      <div class="form-group"><button class="btn btn-primary btn-block" type="submit">Continue to Payment</button></div>
    </form>
    <p style="padding:0 16px;color:var(--text-muted);font-size:12px;">You'll be taken to a secure Paystack checkout page. Come back to the app after paying and your balance updates automatically.</p>
  `;

  document.getElementById("topup-form").onsubmit = async (e) => {
    e.preventDefault();
    const amount = document.getElementById("topup-amount").value;
    const btn = e.target.querySelector("button[type=submit]");
    btn.disabled = true; btn.textContent = "Preparing…";
    const res = await callFunction("paystack-payment", { amount, email: state.session.user.email });
    btn.disabled = false; btn.textContent = "Continue to Payment";

    if (!res.success || !res.authorization_url) {
      document.getElementById("topup-error").textContent = res.message || "Could not start payment";
      return;
    }
    // Remember the reference so we can verify + credit the wallet the
    // moment the person comes back to the app.
    localStorage.setItem("alfaruq_pending_reference", res.reference);
    window.open(res.authorization_url, "_blank");
    toast("Complete your payment in the new tab, then come back here.");
  };
}

async function checkPendingTopup() {
  const reference = localStorage.getItem("alfaruq_pending_reference");
  if (!reference || !state.session) return;
  const res = await callFunction("paystack-verify-payment", { reference });
  if (res.status) {
    localStorage.removeItem("alfaruq_pending_reference");
    await refreshWallet();
    toast(`Wallet funded! New balance: ${naira(res.new_balance)} ✅`);
    if (location.hash === "#/home") renderHome();
  }
}

// Re-check whenever the person returns to the app (e.g. from the Paystack tab).
document.addEventListener("visibilitychange", () => { if (!document.hidden) checkPendingTopup(); });

/* ---------------- withdraw to bank ---------------- */

const NIGERIA_BANKS = [
  ["044", "Access Bank"], ["063", "Access Bank (Diamond)"], ["023", "Citibank"], ["050", "Ecobank"],
  ["084", "Enterprise Bank"], ["070", "Fidelity Bank"], ["011", "First Bank of Nigeria"], ["214", "FCMB"],
  ["058", "GTBank"], ["030", "Heritage Bank"], ["082", "Keystone Bank"], ["50211", "Kuda Bank"],
  ["076", "Polaris Bank"], ["101", "Providus Bank"], ["221", "Stanbic IBTC"], ["068", "Standard Chartered"],
  ["232", "Sterling Bank"], ["100", "Suntrust Bank"], ["032", "Union Bank"], ["033", "UBA"],
  ["215", "Unity Bank"], ["035", "Wema Bank"], ["057", "Zenith Bank"],
  ["999992", "OPay"], ["999991", "PalmPay"], ["50515", "Moniepoint MFB"],
];

function renderWithdraw() {
  app.innerHTML = topBar("Withdraw to Bank") + `
    <form id="wd-form">
      <div class="form-group">
        <label>Bank</label>
        <select id="wd-bank-code" required>
          <option value="">Select your bank</option>
          ${NIGERIA_BANKS.map(([code, name]) => `<option value="${code}" data-name="${name}">${name}</option>`).join("")}
        </select>
      </div>
      <div class="form-group"><label>Account Number</label><input type="text" id="wd-acct" maxlength="10" required /></div>
      <div class="form-group"><label>Account Name</label><input type="text" id="wd-name" placeholder="Fills in automatically" readonly /></div>
      <div id="wd-resolve-status" style="padding:0 16px 10px;font-size:12px;color:var(--text-muted);"></div>
      <div class="form-group"><label>Amount (₦)</label><input type="number" id="wd-amount" min="100" required /></div>
      <div class="form-group"><label>Wallet PIN</label><input type="password" id="wd-pin" maxlength="4" required /></div>
      <div id="wd-error" class="error-text"></div>
      <div class="form-group"><button class="btn btn-primary btn-block" type="submit">Withdraw</button></div>
    </form>
  `;

  async function tryResolve() {
    const account_number = document.getElementById("wd-acct").value;
    const bank_code = document.getElementById("wd-bank-code").value;
    if (!bank_code || account_number.length !== 10) return;
    document.getElementById("wd-resolve-status").textContent = "Resolving account name…";
    const result = await callFunction("paystack-resolve-account", { account_number, bank_code });
    if (result.status && result.account_name) {
      document.getElementById("wd-name").value = result.account_name;
      document.getElementById("wd-resolve-status").textContent = "";
    } else {
      document.getElementById("wd-name").value = "";
      document.getElementById("wd-resolve-status").textContent = result.message || "Could not resolve account name";
    }
  }
  // Auto-resolves the moment both the bank is picked and a full 10-digit
  // account number is entered — no separate button to tap.
  document.getElementById("wd-bank-code").onchange = tryResolve;
  document.getElementById("wd-acct").oninput = tryResolve;

  document.getElementById("wd-form").onsubmit = async (e) => {
    e.preventDefault();
    const bankSel = document.getElementById("wd-bank-code");
    const body = {
      bank_name: bankSel.selectedOptions[0]?.dataset.name,
      bank_code: bankSel.value,
      account_number: document.getElementById("wd-acct").value,
      account_name: document.getElementById("wd-name").value,
      amount: document.getElementById("wd-amount").value,
      pin: document.getElementById("wd-pin").value,
    };
    if (!body.account_name) { document.getElementById("wd-error").textContent = "Select the bank and enter a valid account number first."; return; }
    const result = await callFunction("wallet-request-withdrawal", body);
    if (!result.status) { document.getElementById("wd-error").textContent = result.message || "Withdrawal failed"; return; }
    toast("Withdrawal request submitted ✅");
    await refreshWallet();
    go("#/transactions");
  };
}

/* ---------------- airtime to cash (3-step: OTP -> verify -> convert) ---------------- */

const NETWORKS = ["MTN", "AIRTEL", "GLO", "9MOBILE"];

let acState = { step: 1, phone_number: "", network: "MTN", session_id: "", balance: 0 };

function renderAirtimeCash() {
  acState = { step: 1, phone_number: "", network: "MTN", session_id: "", balance: 0 };
  drawAirtimeCash();
}

function drawAirtimeCash() {
  app.innerHTML = topBar("Airtime to Cash") + `<div id="ac-body"></div>`;
  const body = document.getElementById("ac-body");

  if (acState.step === 1) {
    body.innerHTML = `
      <form id="ac-form1">
        <div class="form-group"><label>Network</label>
          <select id="ac-network">${NETWORKS.map((n) => `<option value="${n.toLowerCase().replace("mobile", "mobile")}">${n}</option>`).join("")}</select>
        </div>
        <div class="form-group"><label>Phone Number (that will send the airtime)</label><input type="tel" id="ac-phone" required /></div>
        <div id="ac-error" class="error-text"></div>
        <div class="form-group"><button class="btn btn-primary btn-block" type="submit">Send OTP</button></div>
      </form>`;
    document.getElementById("ac-form1").onsubmit = async (e) => {
      e.preventDefault();
      acState.network = document.getElementById("ac-network").value;
      acState.phone_number = document.getElementById("ac-phone").value;
      const res = await callFunction("airtime-cash-request-otp", { phone_number: acState.phone_number, network: acState.network });
      if (!res.status) { document.getElementById("ac-error").textContent = res.message || "Could not send OTP"; return; }
      acState.session_id = res.session_id;
      acState.step = 2;
      drawAirtimeCash();
    };
  } else if (acState.step === 2) {
    body.innerHTML = `
      <p style="padding:0 16px;color:var(--text-muted);font-size:13px;">Enter the OTP sent to ${acState.phone_number}</p>
      <form id="ac-form2">
        <div class="form-group"><input type="text" id="ac-otp" inputmode="numeric" maxlength="6" required /></div>
        <div id="ac-error" class="error-text"></div>
        <div class="form-group"><button class="btn btn-primary btn-block" type="submit">Verify</button></div>
      </form>`;
    document.getElementById("ac-form2").onsubmit = async (e) => {
      e.preventDefault();
      const otp = document.getElementById("ac-otp").value;
      const res = await callFunction("airtime-cash-verify-otp", { phone_number: acState.phone_number, otp, session_id: acState.session_id });
      if (!res.status) { document.getElementById("ac-error").textContent = res.message || "Invalid OTP"; return; }
      acState.balance = res.airtime_balance;
      acState.step = 3;
      drawAirtimeCash();
    };
  } else {
    const rate = { mtn: 90, airtel: 85, glo: 50, "9mobile": 50 }[acState.network] || 0;
    body.innerHTML = `
      <div class="card">
        <div class="receipt-row"><div class="k">Airtime Balance</div><div>${naira(acState.balance)}</div></div>
        <div class="receipt-row"><div class="k">Rate</div><div>${rate}%</div></div>
      </div>
      <form id="ac-form3">
        <div class="form-group"><label>Amount to Convert (₦)</label><input type="number" id="ac-amount" max="${acState.balance}" required /></div>
        <div id="ac-cash-preview" style="padding:0 16px 10px;font-size:13px;color:var(--text-muted);"></div>
        <div id="ac-error" class="error-text"></div>
        <div class="form-group"><button class="btn btn-primary btn-block" type="submit">Convert to Cash</button></div>
      </form>`;
    const amtInput = document.getElementById("ac-amount");
    amtInput.oninput = () => {
      const cash = Math.floor(Number(amtInput.value || 0) * (rate / 100));
      document.getElementById("ac-cash-preview").textContent = `You'll receive: ${naira(cash)}`;
    };
    document.getElementById("ac-form3").onsubmit = async (e) => {
      e.preventDefault();
      const airtime_amount = amtInput.value;
      const res = await callFunction("airtime-cash-convert", {
        phone_number: acState.phone_number, network: acState.network,
        session_id: acState.session_id, airtime_amount,
      });
      if (!res.status) { document.getElementById("ac-error").textContent = res.message || "Conversion failed"; return; }
      toast(`Converted! ${naira(res.cash_amount)} added to your wallet ✅`);
      await refreshWallet();
      go("#/transactions");
    };
  }
}

/* ---------------- NIN / BVN (3 verification methods each) ---------------- */

const IDENTITY_METHODS = [
  ["phone", "By Registered Phone Number", "We'll look it up using the phone number linked to it"],
  ["number", "By NIN/BVN Number", "Enter the 11-digit number directly"],
  ["face", "Face Verification", "Take a selfie to verify and retrieve your details"],
];

function renderIdentityChoice(kind) {
  const label = kind.toUpperCase();
  app.innerHTML = topBar(`${label} Details`) + `
    <p style="padding:0 16px;color:var(--text-muted);font-size:13px;">Choose how you'd like to verify your ${label}:</p>
    ${IDENTITY_METHODS.map(([key, title, desc], i) => `
      <div class="method-tile" onclick="go('#/${kind}-form/${key}')">
        <div class="num">${i + 1}</div>
        <div><div class="t">${title}</div><div class="d">${desc}</div></div>
      </div>`).join("")}
  `;
}

function renderIdentityForm(kind, method) {
  const label = kind.toUpperCase();
  const fn = kind === "nin" ? "nin-lookup" : "bvn-lookup";
  let fields = "";
  if (method === "phone") {
    fields = `<div class="form-group"><label>Phone Number registered to your ${label}</label><input type="tel" id="id-phone" required /></div>`;
  } else if (method === "number") {
    fields = `<div class="form-group"><label>${label} Number</label><input type="text" id="id-number" maxlength="11" required /></div>`;
  } else {
    fields = `
      <div class="form-group"><label>${label} Number</label><input type="text" id="id-number" maxlength="11" required /></div>
      <div class="form-group"><label>Selfie for Face Verification</label><input type="file" accept="image/*" capture="user" id="id-face" required /></div>`;
  }

  app.innerHTML = topBar(`${label} Verification`) + `
    <form id="id-form">
      ${fields}
      <div id="id-error" class="error-text"></div>
      <div class="form-group"><button class="btn btn-primary btn-block" type="submit">Verify &amp; View</button></div>
    </form>
    <div id="id-result"></div>
  `;

  document.getElementById("id-form").onsubmit = async (e) => {
    e.preventDefault();
    const body = { method };
    if (method === "phone") body.phone_number = document.getElementById("id-phone").value;
    if (method === "number") body[kind + "_number"] = document.getElementById("id-number").value;
    if (method === "face") {
      body[kind + "_number"] = document.getElementById("id-number").value;
      const file = document.getElementById("id-face").files[0];
      body.face_image_base64 = await fileToBase64(file);
    }
    const btn = e.target.querySelector("button[type=submit]");
    btn.disabled = true; btn.textContent = "Verifying…";
    const res = await callFunction(fn, body);
    btn.disabled = false; btn.textContent = "Verify & View";
    if (!res.status) { document.getElementById("id-error").textContent = res.message || "Verification failed"; return; }
    await refreshWallet();
    const d = res.data || {};
    document.getElementById("id-result").innerHTML = `
      <div class="card">
        ${Object.entries(d).map(([k, v]) => `<div class="receipt-row"><div class="k">${k}</div><div>${v}</div></div>`).join("") || "No data returned"}
      </div>
      <div class="form-group"><button class="btn btn-outline-dark btn-block" onclick="window.print()">Print Slip</button></div>`;
  };
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/* ---------------- admin dashboard ---------------- */

async function renderAdmin() {
  if (!state.profile?.is_admin) { go("#/home"); return; }
  app.innerHTML = topBar("Admin Dashboard") + `<div class="center-pad">Loading…</div>`;

  const [{ data: allTx }, { data: settings }, { data: customers }] = await Promise.all([
    sb.from("transactions").select("*, profiles:user_id(full_name, phone)").order("created_at", { ascending: false }).limit(50),
    sb.from("admin_settings").select("*").order("key"),
    sb.from("profiles").select("*, wallets(balance)").order("created_at", { ascending: false }),
  ]);

  app.innerHTML = topBar("Admin Dashboard") + `
    <div class="section-title">Prices &amp; Rates</div>
    <div class="card">
      <form id="settings-form">
        ${(settings || []).map((s) => `
          <div class="form-group">
            <label>${s.description || s.key}</label>
            <input type="text" data-key="${s.key}" value="${s.value}" />
          </div>`).join("")}
        <button class="btn btn-primary btn-block" type="submit">Save Settings</button>
      </form>
    </div>

    <div class="section-title">Customers (${(customers || []).length})</div>
    <div class="card" style="padding:0;">
      ${(customers || []).length === 0 ? `<div class="empty-state">No customers yet</div>` : (customers || []).map((c) => `
        <div class="list-item" onclick="openCustomerActions('${c.id}', ${JSON.stringify(c.full_name || "")}, ${c.wallets?.[0]?.balance || c.wallets?.balance || 0})">
          <div>
            <div class="l-title">${c.full_name || "Unnamed"} ${c.is_suspended ? '<span class="badge badge-failed">suspended</span>' : ""}</div>
            <div class="l-sub">${c.phone || ""}</div>
          </div>
          <div class="l-amount">${naira(c.wallets?.[0]?.balance ?? 0)}</div>
        </div>`).join("")}
    </div>

    <div class="section-title">Recent Transactions (all customers)</div>
    <div class="card" style="padding:0;">
      ${(allTx || []).length === 0 ? `<div class="empty-state">No transactions yet</div>` : (allTx || []).map((t) => `
        <div class="list-item">
          <div>
            <div class="l-title">${t.profiles?.full_name || "Unknown"} — ${TX_LABELS[t.type] || t.type}</div>
            <div class="l-sub">${t.profiles?.phone || ""} · ${new Date(t.created_at).toLocaleString("en-NG")}</div>
          </div>
          <div style="text-align:right">
            <div class="l-amount">${naira(t.amount)}</div>
            <span class="badge ${t.status === "success" || t.status === "completed" ? "badge-success" : t.status === "failed" ? "badge-failed" : "badge-pending"}">${t.status}</span>
          </div>
        </div>`).join("")}
    </div>
  `;

  document.getElementById("settings-form").onsubmit = async (e) => {
    e.preventDefault();
    const inputs = e.target.querySelectorAll("input[data-key]");
    for (const input of inputs) {
      await sb.from("admin_settings").update({ value: input.value, updated_at: new Date().toISOString() }).eq("key", input.dataset.key);
    }
    toast("Settings saved ✅");
  };
}

async function adminAction(action, target_user_id, extra = {}) {
  const res = await callFunction("admin-manage-customer", { action, target_user_id, ...extra });
  toast(res.message || (res.status ? "Done ✅" : "Failed"));
  if (res.status) renderAdmin();
}

function openCustomerActions(userId, name, balance) {
  modalRoot.innerHTML = `
    <div class="modal-backdrop" onclick="if(event.target===this) closeModal()">
      <div class="modal-sheet">
        <div class="close-x" onclick="closeModal()">✕</div>
        <h3 style="margin:0 0 4px;">${name || "Customer"}</h3>
        <p style="color:var(--text-muted);font-size:13px;margin:0 0 16px;">Balance: ${naira(balance)}</p>

        <div class="form-group"><button class="btn btn-outline-dark btn-block" onclick="adminAction('suspend','${userId}',{suspended:true}); closeModal();">🚫 Suspend Account</button></div>
        <div class="form-group"><button class="btn btn-outline-dark btn-block" onclick="adminAction('suspend','${userId}',{suspended:false}); closeModal();">✅ Unsuspend Account</button></div>

        <div class="form-group">
          <label>Change Password</label>
          <input type="password" id="ca-newpass" placeholder="New password (min 6 chars)" />
        </div>
        <div class="form-group"><button class="btn btn-outline-dark btn-block" onclick="adminAction('change_password','${userId}',{new_password:document.getElementById('ca-newpass').value}); closeModal();">🔑 Update Password</button></div>

        <div class="form-group">
          <label>Debit / Credit Wallet</label>
          <input type="number" id="ca-amount" placeholder="Amount (₦)" />
        </div>
        <div style="display:flex;gap:10px;padding:0 16px;">
          <button class="btn btn-primary" style="flex:1;" onclick="adminAction('credit','${userId}',{amount:document.getElementById('ca-amount').value}); closeModal();">+ Credit</button>
          <button class="btn" style="flex:1;background:#FCEAEA;color:var(--danger);" onclick="adminAction('debit','${userId}',{amount:document.getElementById('ca-amount').value}); closeModal();">- Debit</button>
        </div>
      </div>
    </div>`;
}

/* ---------------- boot ---------------- */

initAuth();

// Register service worker for offline support
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(() => {}));
}

/* ---------------- flight / hotel booking (separate flows) ---------------- */

function renderTravelSearch(type) {
  const title = type === "flight" ? "Book a Flight" : "Book a Hotel";
  app.innerHTML = topBar(title) + `
    <form id="travel-search-form">
      ${type === "flight" ? `
        <div class="form-group"><label>From (city/airport)</label><input type="text" id="tv-origin" required /></div>
        <div class="form-group"><label>To (city/airport)</label><input type="text" id="tv-destination" required /></div>
        <div class="form-group"><label>Departure Date</label><input type="date" id="tv-departure" required /></div>
        <div class="form-group"><label>Return Date (optional)</label><input type="date" id="tv-return" /></div>
        <div class="form-group"><label>Passengers</label><input type="number" id="tv-passengers" value="1" min="1" required /></div>
      ` : `
        <div class="form-group"><label>City</label><input type="text" id="tv-city" required /></div>
        <div class="form-group"><label>Hotel Name (optional)</label><input type="text" id="tv-hotel-name" /></div>
        <div class="form-group"><label>Check-in</label><input type="date" id="tv-checkin" required /></div>
        <div class="form-group"><label>Check-out</label><input type="date" id="tv-checkout" required /></div>
        <div class="form-group"><label>Guests</label><input type="number" id="tv-guests" value="1" min="1" required /></div>
      `}
      <div id="tv-error" class="error-text"></div>
      <div class="form-group"><button class="btn btn-primary btn-block" type="submit">Search ${type === "flight" ? "Flights" : "Hotels"}</button></div>
    </form>
    <div id="tv-results"></div>
  `;

  document.getElementById("travel-search-form").onsubmit = async (e) => {
    e.preventDefault();
    const body = { type };
    if (type === "flight") {
      Object.assign(body, {
        origin: document.getElementById("tv-origin").value,
        destination: document.getElementById("tv-destination").value,
        departure_date: document.getElementById("tv-departure").value,
        return_date: document.getElementById("tv-return").value || null,
        passengers: document.getElementById("tv-passengers").value,
      });
    } else {
      Object.assign(body, {
        city: document.getElementById("tv-city").value,
        hotel_name: document.getElementById("tv-hotel-name").value || null,
        check_in: document.getElementById("tv-checkin").value,
        check_out: document.getElementById("tv-checkout").value,
        guests: document.getElementById("tv-guests").value,
      });
    }
    const btn = e.target.querySelector("button[type=submit]");
    btn.disabled = true; btn.textContent = "Searching…";
    const res = await callFunction("travel-search", body);
    btn.disabled = false; btn.textContent = `Search ${type === "flight" ? "Flights" : "Hotels"}`;

    if (!res.status) { document.getElementById("tv-error").textContent = res.message || "Search failed"; return; }
    const results = res.results || [];
    document.getElementById("tv-results").innerHTML = results.length === 0
      ? `<div class="empty-state">No results found</div>`
      : `<div class="section-title">Results</div><div class="card" style="padding:0;">
          ${results.map((r, i) => `
            <div class="list-item" onclick='bookTravel(${JSON.stringify(type)}, ${JSON.stringify(body)}, ${JSON.stringify(r)})'>
              <div>
                <div class="l-title">${r.name || r.airline || r.hotel_name || (type === "flight" ? "Flight option " + (i + 1) : "Hotel option " + (i + 1))}</div>
                <div class="l-sub">${r.description || r.details || ""}</div>
              </div>
              <div class="l-amount">${naira(r.amount || r.price)}</div>
            </div>`).join("")}
        </div>`;
  };
}

async function bookTravel(type, searchBody, selected) {
  const amount = selected.amount || selected.price;
  if (!confirm(`Confirm booking for ${naira(amount)}?`)) return;
  const body = { ...searchBody, amount, selection: selected };
  const res = await callFunction("travel-book", body);
  if (!res.status) { toast(res.message || "Booking failed"); return; }
  toast("Booking confirmed ✅");
  await refreshWallet();
  generateTicketPDF(type, res.booking || body);
  go("#/transactions");
}

function generateTicketPDF(type, booking) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.setTextColor(60, 52, 137);
  doc.text("ALFARUQ DATA SERVICES", 14, 18);
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text(type === "flight" ? "Flight Ticket / Receipt" : "Hotel Booking / Receipt", 14, 28);
  doc.line(14, 32, 196, 32);

  let y = 42;
  const row = (k, v) => { doc.setFontSize(11); doc.text(String(k), 14, y); doc.text(String(v ?? "-"), 90, y); y += 9; };

  if (type === "flight") {
    row("From", booking.origin);
    row("To", booking.destination);
    row("Departure Date", booking.departure_date);
    row("Return Date", booking.return_date || "-");
    row("Passengers", booking.passengers);
  } else {
    row("Hotel", booking.hotel_name);
    row("City", booking.city);
    row("Check-in", booking.check_in);
    row("Check-out", booking.check_out);
    row("Guests", booking.guests);
  }
  row("Amount Paid", naira(booking.amount));
  row("Reference", booking.provider_reference || "PENDING");
  row("Date Issued", new Date().toLocaleString("en-NG"));

  doc.save(`${type}-ticket-${Date.now()}.pdf`);
}
