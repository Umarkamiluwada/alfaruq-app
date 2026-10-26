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
// Defaults — overwritten by loadSupportSettings() from admin_settings at boot,
// so the admin can change these from the Admin Dashboard without a code edit.
let SUPPORT_PHONE = "09077049048";
let SUPPORT_EMAIL = "support@alfaruqdata.com";
let SUPPORT_WHATSAPP = "2349077049048";

async function loadSupportSettings() {
  const { data } = await sb.from("admin_settings").select("key, value").in("key", ["support_phone", "support_email", "support_whatsapp"]);
  (data || []).forEach((row) => {
    if (row.key === "support_phone" && row.value) SUPPORT_PHONE = row.value;
    if (row.key === "support_email" && row.value) SUPPORT_EMAIL = row.value;
    if (row.key === "support_whatsapp" && row.value) SUPPORT_WHATSAPP = row.value;
  });
}
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

/* ---------------- icon set (replaces emoji with clean line icons) ---------------- */

const ICONS = {
  home: '<path d="M3 11.5 12 4l9 7.5"/><path d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9"/>',
  receipt: '<path d="M6 2h12v19l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6"/>',
  headset: '<path d="M3 13a9 9 0 0 1 18 0"/><path d="M3 13v4a2 2 0 0 0 2 2h1v-7H4a1 1 0 0 0-1 1z"/><path d="M21 13v4a2 2 0 0 1-2 2h-1v-7h2a1 1 0 0 1 1 1z"/><path d="M18 19a2 2 0 0 1-2 2h-2"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>',
  bell: '<path d="M6 10a6 6 0 1 1 12 0c0 4 1.5 5.5 1.5 5.5H4.5S6 14 6 10z"/><path d="M10.3 19a1.7 1.7 0 0 0 3.4 0"/>',
  phone: '<path d="M5 4h3l1.5 4-2 1.5a12 12 0 0 0 5.5 5.5L14.5 13l4 1.5v3a1 1 0 0 1-1 1C10.5 18.5 5.5 13.5 4 6.5A1 1 0 0 1 5 5z"/>',
  contact: '<rect x="4" y="3" width="16" height="18" rx="2"/><circle cx="12" cy="10" r="2.5"/><path d="M8 17c0-2 2-3 4-3s4 1 4 3"/>',
  wallet: '<rect x="3" y="7" width="18" height="12" rx="2"/><path d="M7 7V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v1"/><circle cx="16" cy="13" r="1.5"/>',
  wifi: '<path d="M2 9a16 16 0 0 1 20 0"/><path d="M5.5 13a11 11 0 0 1 13 0"/><path d="M9 17a6 6 0 0 1 6 0"/><circle cx="12" cy="20" r="1"/>',
  cap: '<path d="M12 4 2 9l10 5 10-5z"/><path d="M6 11.5V17c0 1 3 2.5 6 2.5s6-1.5 6-2.5v-5.5"/>',
  bolt: '<path d="M13 3 4 14h6l-1 7 9-11h-6z"/>',
  tv: '<rect x="3" y="5" width="18" height="13" rx="2"/><path d="M8 21h8M12 18v3"/>',
  shield: '<path d="M12 3 5 6v5c0 5 3 8.5 7 10 4-1.5 7-5 7-10V6z"/><path d="m9.5 12 2 2 3.5-4"/>',
  exchange: '<path d="M4 7h13l-3-3M20 17H7l3 3"/>',
  plane: '<path d="M10.5 20.5 12 15l6.5-6.5a2 2 0 0 0-2.8-2.8L9 12.2l-5.5-1.7-1 1L7 14l-1 4 1 1 2.5-3 3 3 1-1z"/>',
  bed: '<path d="M3 18v-6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6"/><path d="M3 15h18"/><path d="M3 18v2M21 18v2"/><circle cx="7" cy="10" r="1.3"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 13.5a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.9 2.9l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.9-2.9l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.6-1h-.2a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.6-1.1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.9-2.9l.1.1a1.7 1.7 0 0 0 1.9.3h0a1.7 1.7 0 0 0 1-1.6v-.2a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.9 2.9l-.1.1a1.7 1.7 0 0 0-.3 1.9v0a1.7 1.7 0 0 0 1.6 1h.2a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.6 1z"/>',
  withdraw: '<circle cx="12" cy="12" r="9"/><path d="M12 7v7M8.5 11 12 14.5 15.5 11"/>',
  topup: '<circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/>',
  eyeOpen: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>',
  eyeOff: '<path d="M3 3l18 18"/><path d="M10.6 5.2A10.6 10.6 0 0 1 12 5c6.5 0 10 7 10 7a15 15 0 0 1-3.3 4.1M6.4 6.4A14.9 14.9 0 0 0 2 12s3.5 7 10 7a10.6 10.6 0 0 0 4.4-.9"/><path d="M9.5 9.8A3 3 0 0 0 12 15a3 3 0 0 0 2.2-.96"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18z"/>',
  whatsapp: '<path d="M7 17.5 3.5 18.5 4.5 15A8 8 0 1 1 7 17.5Z"/><path d="M9 9.5c0 3 2.5 5.5 5.5 5.5" stroke-linecap="round"/>',
  idcard: '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="8" cy="11" r="2"/><path d="M5.5 16c0-1.5 1.2-2.5 2.5-2.5s2.5 1 2.5 2.5"/><path d="M14 9h4M14 12h4M14 15h2"/>',
  sliders: '<path d="M4 6h10M17 6h3M4 12h3M10 12h10M4 18h14M21 18h0"/><circle cx="14" cy="6" r="2"/><circle cx="7" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>',
  check: '<path d="M4 12.5 9.5 18 20 6"/>',
  xmark: '<path d="M6 6l12 12M18 6 6 18"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
  image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9.5" r="1.5"/><path d="m4 17 5-5 3.5 3.5L17 11l3 3"/>',
  filetext: '<path d="M7 3h7l4 4v14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/><path d="M14 3v4h4"/><path d="M9 13h6M9 16h6M9 10h2"/>',
};

function icon(name, size = 20, strokeWidth = 2.2) {
  const path = ICONS[name] || ICONS.home;
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round">${path}</svg>`;
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
  if (eye) eye.innerHTML = icon(state.balanceHidden ? "eyeOff" : "eyeOpen", 18);
}

const loaderRoot = document.getElementById("loader-root");
function showLoader() {
  loaderRoot.innerHTML = `
    <div class="loader-backdrop">
      <div class="loader-spin-wrap">
        <div class="loader-ring"></div>
        <img src="./icon-192.png" class="loader-logo" alt="Loading" />
      </div>
    </div>`;
}
function hideLoader() {
  loaderRoot.innerHTML = "";
}

function closeModal() {
  modalRoot.innerHTML = "";
}

// Shows a branded "confirm payment" PIN modal and resolves with the 4-digit
// PIN the person enters, or null if they cancel. Replaces the native
// prompt() dialog (which showed the raw GitHub Pages URL — not trustworthy-
// looking for a payment confirmation).
function askForPin(amountLabel) {
  return new Promise((resolve) => {
    modalRoot.innerHTML = `
      <div class="modal-backdrop" onclick="if(event.target===this){ window.__pinResolve(null); }">
        <div class="modal-sheet" style="text-align:center;">
          <img src="./icon-192.png" alt="ALFARUQ" style="width:48px;height:48px;border-radius:12px;margin:4px auto 10px;display:block;" />
          <h3 style="margin:0 0 4px;">Confirm Payment</h3>
          ${amountLabel ? `<p style="color:var(--text-muted);font-size:13px;margin:0 0 16px;">${amountLabel}</p>` : ""}
          <form id="pin-confirm-form">
            <div class="form-group">
              <input type="password" id="pin-confirm-input" inputmode="numeric" maxlength="4" placeholder="••••" style="text-align:center;font-size:22px;letter-spacing:10px;" required autofocus />
            </div>
            <div class="form-group"><button class="btn btn-primary btn-block" type="submit">Confirm</button></div>
            <div class="form-group"><button class="btn btn-outline-dark btn-block" type="button" id="pin-cancel-btn">Cancel</button></div>
          </form>
        </div>
      </div>`;
    window.__pinResolve = (val) => { closeModal(); resolve(val); };
    document.getElementById("pin-confirm-form").onsubmit = (e) => {
      e.preventDefault();
      window.__pinResolve(document.getElementById("pin-confirm-input").value);
    };
    document.getElementById("pin-cancel-btn").onclick = () => window.__pinResolve(null);
  });
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
    ["home", "home", "Home", "#/home"],
    ["transactions", "receipt", "Transactions", "#/transactions"],
    ["support", "headset", "Support", "#/support"],
    ["account", "user", "Account", "#/account"],
  ];
  return `
    <div class="bottom-nav">
      ${items.map(([key, iconName, label, href]) => `
        <div class="nav-item ${active === key ? "active" : ""}" onclick="go('${href}')">
          <div class="ic">${icon(iconName, 20)}</div><div>${label}</div>
        </div>`).join("")}
    </div>
    <div class="fab-whatsapp" onclick="window.open('https://wa.me/${SUPPORT_WHATSAPP}','_blank')">${icon("whatsapp", 24)}</div>`;
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
    case "manage-account": return renderManageAccount();
    case "refer": return renderReferScreen();
    case "appearances": return renderAppearances();
    case "legal": return renderLegal(param);
    case "service": return renderServiceForm(param);
    case "withdraw": return renderWithdraw();
    case "topup": return renderTopup();
    case "airtime-cash": return renderAirtimeCash();
    case "nin": return renderIdentityChoice("nin");
    case "nin-form": return renderIdentityForm("nin", param);
    case "bvn": return renderIdentityChoice("bvn");
    case "bvn-form": return renderIdentityForm("bvn", param);
    case "admin": return renderAdmin();
    case "admin-prices": return renderAdminPrices(param);
    case "flight": return renderTravelSearch("flight");
    case "coming-soon": return renderComingSoon(decodeURIComponent(param));
    case "hotel": return renderTravelSearch("hotel");
    case "receipt": return renderReceiptScreen(param);
    default: return renderHome();
  }
}

window.addEventListener("hashchange", route);

/* ---------------- auth ---------------- */

async function initAuth() {
  showLoader();
  const { data } = await sb.auth.getSession();
  state.session = data.session;
  sb.auth.onAuthStateChange((_event, session) => {
    state.session = session;
  });
  await loadSupportSettings();
  await route();
  hideLoader();
  checkPendingTopup();
}

function renderLogin() {
  app.innerHTML = `
    <div class="center-pad">
      <img src="./icon-192.png" alt="ALFARUQ" style="width:52px;height:52px;border-radius:14px;margin:0 auto 14px;display:block;" />
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
    showLoader();
    const email = document.getElementById("li-email").value.trim();
    const password = document.getElementById("li-password").value;
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    hideLoader();
    if (error) { document.getElementById("login-error").textContent = error.message; return; }
    state.session = data.session;
    go("#/home");
  };
}

function renderSignup() {
  app.innerHTML = `
    <div class="center-pad">
      <img src="./icon-192.png" alt="ALFARUQ" style="width:52px;height:52px;border-radius:14px;margin:0 auto 14px;display:block;" />
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
    showLoader();
    const full_name = document.getElementById("su-name").value.trim();
    const phone = document.getElementById("su-phone").value.trim();
    const email = document.getElementById("su-email").value.trim();
    const password = document.getElementById("su-password").value;
    const { data, error } = await sb.auth.signUp({ email, password, options: { data: { full_name, phone } } });
    if (error) { hideLoader(); document.getElementById("signup-error").textContent = error.message; return; }
    if (data.user) {
      const referral_code = data.user.id.replace(/-/g, "").slice(0, 8);
      let referred_by = null;
      const refCode = new URLSearchParams(location.search).get("ref");
      if (refCode) {
        const { data: referrer } = await sb.from("profiles").select("id").eq("referral_code", refCode).maybeSingle();
        if (referrer) referred_by = referrer.id;
      }
      await sb.from("profiles").upsert({ id: data.user.id, full_name, phone, referral_code, referred_by });
      await sb.from("wallets").upsert({ user_id: data.user.id, balance: 0 });
    }
    hideLoader();
    if (data.session) { state.session = data.session; go("#/home"); }
    else { toast("Check your email to confirm your account, then log in."); go("#/login"); }
  };
}

async function refreshNotifBadge() {
  const lastSeen = localStorage.getItem("alfaruq_notif_last_seen") || "1970-01-01";
  const { count } = await sb.from("transactions").select("id", { count: "exact", head: true }).eq("user_id", state.session.user.id).gt("created_at", lastSeen);
  const badge = document.getElementById("notif-badge");
  if (badge) badge.style.display = count > 0 ? "block" : "none";
}

async function openNotifications() {
  const { data } = await sb.from("transactions").select("*").eq("user_id", state.session.user.id).order("created_at", { ascending: false }).limit(15);
  const items = data || [];
  modalRoot.innerHTML = `
    <div class="modal-backdrop" onclick="if(event.target===this) closeModal()">
      <div class="modal-sheet">
        <div class="close-x" onclick="closeModal()">✕</div>
        <h3 style="margin:0 0 10px;">Notifications</h3>
        ${items.length === 0 ? `<div class="empty-state">Nothing yet</div>` : items.map((t) => `
          <div class="list-item" style="cursor:default;">
            <div>
              <div class="l-title">${TX_LABELS[t.type] || t.type} — ${naira(t.amount)}</div>
              <div class="l-sub">${new Date(t.created_at).toLocaleString("en-NG")}</div>
            </div>
            <span class="badge ${t.status === "success" || t.status === "completed" ? "badge-success" : t.status === "failed" ? "badge-failed" : "badge-pending"}">${t.status}</span>
          </div>`).join("")}
      </div>
    </div>`;
  localStorage.setItem("alfaruq_notif_last_seen", new Date().toISOString());
  const badge = document.getElementById("notif-badge");
  if (badge) badge.style.display = "none";
}

async function checkAnnouncement() {
  const { data } = await sb.from("admin_settings").select("value").eq("key", "broadcast_message").maybeSingle();
  const message = (data?.value || "").trim();
  if (!message) return;
  const shownFor = sessionStorage.getItem("alfaruq_announcement_shown");
  if (shownFor === message) return; // already shown this exact message this session
  sessionStorage.setItem("alfaruq_announcement_shown", message);
  modalRoot.innerHTML = `
    <div class="modal-backdrop" onclick="if(event.target===this) closeModal()">
      <div class="modal-sheet" style="text-align:center;">
        <img src="./icon-192.png" alt="ALFARUQ" style="width:48px;height:48px;border-radius:12px;margin:4px auto 10px;display:block;" />
        <h3 style="margin:0 0 10px;">📢 Announcement</h3>
        <p style="font-size:14px;color:var(--text-dark);white-space:pre-wrap;">${message}</p>
        <div class="form-group" style="margin-top:16px;"><button class="btn btn-primary btn-block" onclick="closeModal()">Got it</button></div>
      </div>
    </div>`;
}

async function logout() {
  await sb.auth.signOut();
  state.session = null;
  state.profile = null;
  sessionStorage.removeItem("alfaruq_announcement_shown");
  go("#/login");
}

function renderComingSoon(title) {
  app.innerHTML = topBar(title || "Coming Soon") + `
    <div class="center-pad">
      <div style="font-size:48px;margin-bottom:12px;">🌍</div>
      <h2 style="margin:0 0 8px;">${title || "Coming Soon"}</h2>
      <p style="color:var(--text-muted);font-size:14px;">We're working on this feature. Check back soon!</p>
    </div>`;
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
  ["airtime", "phone", "Airtime"],
  ["data", "wifi", "Data"],
  ["education", "cap", "Education"],
  ["electricity", "bolt", "Electricity"],
  ["tv", "tv", "TV Cable"],
];

async function renderHome() {
  app.innerHTML = `<div class="center-pad">Loading…</div>`;
  await Promise.all([refreshWallet(), refreshProfile()]);
  checkAnnouncement();
  const name = state.profile?.full_name?.split(" ")[0] || "there";
  const hour = new Date().getHours();
  const greet = hour < 12 ? "Morning" : hour < 17 ? "Afternoon" : "Night";

  app.innerHTML = `
    <div style="display:flex;align-items:center;gap:8px;padding:14px 16px 0;">
      <img src="./icon-192.png" alt="ALFARUQ" style="width:28px;height:28px;border-radius:7px;" />
      <span style="font-weight:700;font-size:14px;color:var(--primary);">ALFARUQ DATA SERVICES</span>
    </div>
    <div class="greeting">
      <div class="who">
        <div class="avatar">${name[0]?.toUpperCase() || "U"}</div>
        <div>
          <div class="sub">${greet}! 👋</div>
          <div class="name">${name}</div>
        </div>
      </div>
      <div class="bell" id="notif-bell" onclick="openNotifications()" style="position:relative;">
        ${icon("bell", 20)}
        <span id="notif-badge" style="display:none;position:absolute;top:-2px;right:-2px;width:9px;height:9px;border-radius:50%;background:var(--danger);"></span>
      </div>
    </div>

    <div class="wallet-card">
      <div class="row">
        <div class="label" style="display:flex;align-items:center;gap:6px;">${icon("wallet", 16)} Total Wallet Balance</div>
        <div style="cursor:pointer;" onclick="toggleBalance()" id="balance-eye">${icon(state.balanceHidden ? "eyeOff" : "eyeOpen", 18)}</div>
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
      ${SERVICE_TILES.map(([key, iconName, label]) => `
        <div class="service-tile" onclick="go('#/service/${key}')">
          <div class="ic">${icon(iconName, 22)}</div><span>${label}</span>
        </div>`).join("")}
      <div class="service-tile" onclick="go('#/nin')"><div class="ic">${icon("idcard", 22)}</div><span>NIN</span></div>
      <div class="service-tile" onclick="go('#/bvn')"><div class="ic">${icon("shield", 22)}</div><span>BVN</span></div>
      <div class="service-tile" onclick="go('#/airtime-cash')"><div class="ic">${icon("exchange", 22)}</div><span>Airtime2Cash</span></div>
      <div class="service-tile" onclick="go('#/flight')"><div class="ic">${icon("plane", 22)}</div><span>Flight</span></div>
      <div class="service-tile" onclick="go('#/hotel')"><div class="ic">${icon("bed", 22)}</div><span>Hotel</span></div>
      <div class="service-tile" onclick="go('#/coming-soon/International Data')"><div class="ic">${icon("globe", 22)}</div><span>Intl. Data</span></div>
      <div class="service-tile" onclick="go('#/coming-soon/International Airtime')"><div class="ic">${icon("globe", 22)}</div><span>Intl. Airtime</span></div>
      ${state.profile?.is_admin ? `<div class="service-tile" onclick="go('#/admin')"><div class="ic">${icon("sliders", 22)}</div><span>Admin</span></div>` : ""}
    </div>

    <div style="height:20px"></div>
    ${bottomNav("home")}
  `;
  refreshNotifBadge();
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

const BILL_DETAIL_FIELDS = [
  ["network", "Network"], ["phone_number", "Phone Number"], ["phone", "Phone Number"],
  ["plan", "Plan"], ["meter_no", "Meter Number"], ["smartcard_number", "Smart Card Number"],
  ["token", "Token"], ["account_number", "Account Number"], ["account_name", "Account Name"],
  ["bank_name", "Bank"], ["reference", "Payment Reference"],
];

async function renderReceiptScreen(id) {
  if (!state.transactions.length) await refreshTransactions();
  const t = state.transactions.find((x) => String(x.id) === String(id));
  if (!t) { go("#/transactions"); return; }

  const isSuccess = t.status === "success" || t.status === "completed";
  const isFailed = t.status === "failed";
  const meta = t.meta || {};
  const seenLabels = new Set();
  const detailRows = BILL_DETAIL_FIELDS
    .filter(([key]) => meta[key] && !seenLabels.has(key))
    .map(([key, label]) => { seenLabels.add(key); return `<div class="receipt-row"><div class="k">${label}</div><div>${meta[key]}</div></div>`; })
    .join("");

  const statusIcon = isSuccess ? "check" : isFailed ? "xmark" : "clock";
  const statusBg = isSuccess ? "#E5F7F1" : isFailed ? "#FCEAEA" : "#FBF2DC";
  const statusColor = isSuccess ? "var(--success)" : isFailed ? "var(--danger)" : "var(--accent-gold-dark)";

  app.innerHTML = topBar("Receipt") + `
    <div id="receipt-card" style="background:#fff;margin:0 16px;border-radius:16px;overflow:hidden;border:1px solid var(--border);box-shadow:0 4px 18px rgba(0,0,0,0.06);">
      <div style="background:var(--primary);padding:22px 20px;text-align:center;color:#fff;">
        <img src="./icon-192.png" alt="ALFARUQ" style="width:44px;height:44px;border-radius:10px;margin:0 auto 10px;display:block;" />
        <div style="font-size:15px;font-weight:700;letter-spacing:0.3px;">ALFARUQ DATA SERVICES</div>
        <div style="font-size:11px;color:var(--primary-light);margin-top:2px;">Payment Receipt</div>
      </div>
      <div style="padding:22px 20px;text-align:center;border-bottom:1px dashed var(--border);">
        <div style="width:54px;height:54px;border-radius:50%;margin:0 auto 12px;display:flex;align-items:center;justify-content:center;background:${statusBg};color:${statusColor};">${icon(statusIcon, 26, 2.4)}</div>
        <div style="font-size:28px;font-weight:700;">${naira(t.amount)}</div>
        <span class="badge ${isSuccess ? "badge-success" : isFailed ? "badge-failed" : "badge-pending"}" style="margin-top:8px;">${t.status}</span>
      </div>
      <div style="padding:10px 20px 20px;">
        <div class="receipt-row"><div class="k">Transaction Type</div><div>${TX_LABELS[t.type] || t.type}</div></div>
        <div class="receipt-row"><div class="k">Reference</div><div>TXN-${String(t.id).padStart(6, "0")}</div></div>
        <div class="receipt-row"><div class="k">Date</div><div>${new Date(t.created_at).toLocaleString("en-NG")}</div></div>
        ${detailRows}
      </div>
      <div style="padding:14px 20px;text-align:center;background:var(--bg-page);border-top:1px solid var(--border);">
        <div style="font-size:12px;font-weight:600;color:var(--primary);">Thank you for using ALFARUQ DATA SERVICES</div>
        <div style="font-size:10px;color:var(--text-muted);margin-top:2px;">This is an electronically generated receipt.</div>
      </div>
    </div>
    <div class="form-group" style="margin-top:18px;">
      <button class="btn btn-primary btn-block" id="save-image-btn" style="display:flex;align-items:center;justify-content:center;gap:8px;">${icon("image", 18)} Save as Image</button>
    </div>
    <div class="form-group">
      <button class="btn btn-outline-dark btn-block" id="save-pdf-btn" style="display:flex;align-items:center;justify-content:center;gap:8px;">${icon("filetext", 18)} Save as PDF</button>
    </div>
  `;

  document.getElementById("save-image-btn").onclick = async () => {
    const canvas = await html2canvas(document.getElementById("receipt-card"), { backgroundColor: "#ffffff", scale: 2 });
    const link = document.createElement("a");
    link.download = `alfaruq-receipt-${t.id}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  document.getElementById("save-pdf-btn").onclick = async () => {
    const canvas = await html2canvas(document.getElementById("receipt-card"), { backgroundColor: "#ffffff", scale: 2 });
    const { jsPDF } = window.jspdf;
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ unit: "px", format: [canvas.width / 2, canvas.height / 2] });
    pdf.addImage(imgData, "PNG", 0, 0, canvas.width / 2, canvas.height / 2);
    pdf.save(`alfaruq-receipt-${t.id}.pdf`);
  };
}

/* ---------------- support ---------------- */

async function renderSupport() {
  await loadSupportSettings();
  app.innerHTML = topBar("Customer Support", { noBack: true }) + `
    <div class="card">
      <div style="display:flex;gap:12px;align-items:center;">
        <div class="avatar" style="background:var(--primary);color:#fff;">${icon("headset", 20)}</div>
        <div>
          <div style="font-weight:600;">How can we help?</div>
          <div style="font-size:12px;color:var(--text-muted);">Our support team is available to assist you 24/7.</div>
        </div>
      </div>
    </div>
    <div class="section-title">Contact Channels</div>
    <div class="card" style="padding:0;">
      <div class="list-item" onclick="window.open('tel:${SUPPORT_PHONE}')">
        <div><div class="l-title">${icon("phone", 16)} Phone Number</div><div class="l-sub">${SUPPORT_PHONE}</div></div><div>›</div>
      </div>
      <div class="list-item" onclick="window.open('mailto:${SUPPORT_EMAIL}')">
        <div><div class="l-title">${icon("filetext", 16)} Email</div><div class="l-sub">${SUPPORT_EMAIL}</div></div><div>›</div>
      </div>
      <div class="list-item" onclick="window.open('https://wa.me/${SUPPORT_WHATSAPP}')">
        <div><div class="l-title">${icon("whatsapp", 16)} WhatsApp</div><div class="l-sub">Chat with us</div></div><div>›</div>
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
      <div class="list-item" onclick="go('#/manage-account')"><div class="l-title">${icon("user", 18)} Manage Account</div><div>›</div></div>
      <div class="list-item" onclick="go('#/support')"><div class="l-title">${icon("headset", 18)} Customer Care</div><div>›</div></div>
      <div class="list-item" onclick="go('#/refer')"><div class="l-title">${icon("exchange", 18)} Refer to Earn</div><div>Share</div></div>
    </div>

    <div class="section-title">Identity Services</div>
    <div class="card" style="padding:0;">
      <div class="list-item" onclick="go('#/nin')"><div class="l-title">${icon("idcard", 18)} NIN Details</div><div>›</div></div>
      <div class="list-item" onclick="go('#/bvn')"><div class="l-title">${icon("shield", 18)} BVN Details</div><div>›</div></div>
    </div>

    <div class="section-title">Preferences &amp; Legal</div>
    <div class="card" style="padding:0;">
      <div class="list-item" onclick="go('#/appearances')"><div class="l-title">${icon("sliders", 18)} Appearances</div><div>›</div></div>
      <div class="list-item" onclick="window.open('https://wa.me/${SUPPORT_WHATSAPP}?text=' + encodeURIComponent('I would like to rate the ALFARUQ DATA SERVICES app: '))"><div class="l-title">${icon("check", 18)} Rate Us</div><div>›</div></div>
      <div class="list-item" onclick="go('#/legal/privacy')"><div class="l-title">${icon("shield", 18)} Privacy Policy</div><div>›</div></div>
      <div class="list-item" onclick="go('#/legal/terms')"><div class="l-title">${icon("filetext", 18)} Terms &amp; Conditions</div><div>›</div></div>
    </div>

    <div class="form-group" style="margin-top:16px;">
      <button class="btn btn-block" style="background:#FCEAEA;color:var(--danger);" onclick="logout()">Logout</button>
    </div>
    ${bottomNav("account")}
  `;
}

function renderManageAccount() {
  const p = state.profile;
  app.innerHTML = topBar("Manage Account") + `
    <form id="manage-form">
      <div class="form-group"><label>Full Name</label><input type="text" id="ma-name" value="${p?.full_name || ""}" /></div>
      <div class="form-group"><label>Phone</label><input type="tel" id="ma-phone" value="${p?.phone || ""}" /></div>
      <div class="form-group"><label>Email (cannot be changed here)</label><input type="email" value="${state.session?.user?.email || ""}" readonly /></div>
      <div id="ma-error" class="error-text"></div>
      <div class="form-group"><button class="btn btn-primary btn-block" type="submit">Save Changes</button></div>
    </form>

    <div class="section-title">Security</div>
    <div class="form-group"><label>New Wallet PIN (4 digits)</label><input type="password" id="ma-pin" maxlength="4" inputmode="numeric" placeholder="••••" /></div>
    <div class="form-group"><button class="btn btn-outline-dark btn-block" id="ma-pin-btn">Update Wallet PIN</button></div>

    <div class="form-group"><label>New Password</label><input type="password" id="ma-password" placeholder="At least 6 characters" /></div>
    <div class="form-group"><button class="btn btn-outline-dark btn-block" id="ma-password-btn">Update Password</button></div>
  `;

  document.getElementById("manage-form").onsubmit = async (e) => {
    e.preventDefault();
    const full_name = document.getElementById("ma-name").value.trim();
    const phone = document.getElementById("ma-phone").value.trim();
    const { error } = await sb.from("profiles").update({ full_name, phone }).eq("id", state.session.user.id);
    if (error) { document.getElementById("ma-error").textContent = error.message; return; }
    await refreshProfile();
    toast("Profile updated ✅");
  };

  document.getElementById("ma-pin-btn").onclick = async () => {
    const pin = document.getElementById("ma-pin").value;
    if (!/^\d{4}$/.test(pin)) { toast("PIN must be exactly 4 digits"); return; }
    const { error } = await sb.from("wallets").update({ pin }).eq("user_id", state.session.user.id);
    toast(error ? "Could not update PIN: " + error.message : "Wallet PIN updated ✅");
  };

  document.getElementById("ma-password-btn").onclick = async () => {
    const password = document.getElementById("ma-password").value;
    if (password.length < 6) { toast("Password must be at least 6 characters"); return; }
    const { error } = await sb.auth.updateUser({ password });
    toast(error ? "Could not update password: " + error.message : "Password updated ✅");
  };
}

function renderReferScreen() {
  const p = state.profile;
  const code = p?.referral_code || "";
  const link = `${location.origin}${location.pathname}?ref=${code}`;
  app.innerHTML = topBar("Refer to Earn") + `
    <div class="center-pad">
      <div style="font-size:40px;">${icon("exchange", 40)}</div>
      <h3 style="margin:10px 0 4px;">Invite friends, earn rewards</h3>
      <p style="color:var(--text-muted);font-size:13px;">Share your link below. When someone signs up with it and completes their first transaction, you get credited automatically.</p>
    </div>
    <div class="card">
      <div class="receipt-row"><div class="k">Your Referral Code</div><div style="font-weight:700;">${code}</div></div>
    </div>
    <div class="form-group"><input type="text" id="refer-link" value="${link}" readonly /></div>
    <div class="form-group"><button class="btn btn-primary btn-block" id="refer-share-btn">Share Link</button></div>
    <div class="form-group"><button class="btn btn-outline-dark btn-block" id="refer-copy-btn">Copy Link</button></div>
  `;
  document.getElementById("refer-share-btn").onclick = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: "ALFARUQ DATA SERVICES", text: "Join me on ALFARUQ for cheap data, airtime and bills:", url: link }); }
      catch { /* cancelled */ }
    } else {
      navigator.clipboard.writeText(link);
      toast("Link copied — paste it anywhere to share");
    }
  };
  document.getElementById("refer-copy-btn").onclick = () => {
    navigator.clipboard.writeText(link);
    toast("Link copied ✅");
  };
}

function renderAppearances() {
  app.innerHTML = topBar("Appearances") + `
    <div class="center-pad">
      <div style="font-size:40px;">${icon("sliders", 40)}</div>
      <h3 style="margin:10px 0 4px;">Theme</h3>
      <p style="color:var(--text-muted);font-size:13px;">ALFARUQ currently uses a single signature theme. More appearance options are coming soon.</p>
    </div>`;
}

function renderLegal(kind) {
  const isPrivacy = kind === "privacy";
  app.innerHTML = topBar(isPrivacy ? "Privacy Policy" : "Terms & Conditions") + `
    <div class="card" style="font-size:13px;line-height:1.7;color:var(--text-dark);">
      ${isPrivacy ? `
        <p><strong>Privacy Policy</strong></p>
        <p>ALFARUQ DATA SERVICES collects only the information needed to operate your wallet and process your transactions: your name, phone number, email, and transaction history.</p>
        <p>We do not sell your personal information. Identity lookups (NIN/BVN) are processed through licensed third-party providers and are not stored by us beyond what's needed to bill you.</p>
        <p>For questions about your data, contact us via Customer Care.</p>
      ` : `
        <p><strong>Terms &amp; Conditions</strong></p>
        <p>By using ALFARUQ DATA SERVICES, you agree to fund your wallet before making purchases, and that purchases (airtime, data, TV, electricity, education PINs) are final once successfully delivered.</p>
        <p>Wallet withdrawals are sent to the bank account you provide — please double-check your details before confirming.</p>
        <p>We reserve the right to suspend accounts involved in fraudulent activity.</p>
      `}
    </div>`;
}

/* ---------------- VTU service purchase (airtime/data/tv/electricity/education) ---------------- */
/* VTUGATE requires the numeric service_id returned by vtugate-fetch-services
   for every product (confirmed via live testing — plain network/provider
   strings are rejected). So every category here loads its real provider
   list from vtugate-fetch-services and uses service_id from that response. */

const SERVICE_TITLES = { airtime: "Buy Airtime", data: "Buy Data", tv: "TV Subscription", electricity: "Electricity Bill", education: "Education PIN" };

function pick(obj, keys, fallback) {
  for (const k of keys) if (obj && obj[k] !== undefined && obj[k] !== null && obj[k] !== "") return obj[k];
  return fallback;
}
function extractList(res) {
  const d = res?.data ?? res?.plans ?? res?.services ?? res?.variations ?? res;
  return Array.isArray(d) ? d : Object.values(d || {}).find(Array.isArray) || [];
}
async function getMarkup(serviceType) {
  const { data } = await sb.from("admin_settings").select("value").eq("key", `${serviceType}_markup_percent`).maybeSingle();
  return Number(data?.value ?? 0);
}
async function getProviderList(category) {
  const cacheKey = "providers_" + category;
  if (state.services[cacheKey]) return state.services[cacheKey];
  const res = await callFunction("vtugate-fetch-services", { service_type: category });
  const list = extractList(res);
  state.services[cacheKey] = list;
  return list;
}
const DATA_TYPE_LABELS = { sme: "SME", awoof: "AWOOF", dg: "Direct Gifting", cg: "Corporate Gifting", gifting: "Gifting", corporate: "Corporate" };

function providerOptionsHtml(list) {
  if (!list.length) return `<option value="">No providers returned — check VTUGATE_API_KEY, or this category name</option>`;
  const seen = new Set();
  const rows = [];
  for (const s of list) {
    const id = pick(s, ["service_id", "id", "serviceID", "code"], "");
    let name = pick(s, ["name", "tv_name", "disco", "service_name", "network", "provider_name", "network_name", "title", "label", "biller_name", "disco_name", "cable_name", "provider", "company", "description"], `Service ${id}`);
    // VTUGATE splits data into several plan families (SME/AWOOF/DG/CG) per
    // network, and education into sub-products (result checker vs reg pin)
    // per exam body — each has its own service_id, keep them distinct.
    const dataType = pick(s, ["data_type", "plan_type", "category"], null);
    if (dataType) name = `${name} (${DATA_TYPE_LABELS[String(dataType).toLowerCase()] || dataType.toUpperCase()})`;
    const eduType = pick(s, ["edu_type"], null);
    if (eduType) name = `${name} — ${eduType}`;
    if (seen.has(name)) continue; // true duplicates (same name, no distinguishing type) — show once
    seen.add(name);
    const productCode = pick(s, ["product_code"], "");
    rows.push(`<option value="${id}" data-product-code="${productCode}">${name}</option>`);
  }
  return rows.join("");
}

async function debugFetchRaw(category) {
  const res = await callFunction("vtugate-fetch-services", { service_type: category });
  modalRoot.innerHTML = `
    <div class="modal-backdrop" onclick="if(event.target===this) closeModal()">
      <div class="modal-sheet">
        <div class="close-x" onclick="closeModal()">✕</div>
        <h3 style="margin:0 0 10px;">Raw: ${category}</h3>
        <pre style="white-space:pre-wrap;word-break:break-all;font-size:11px;background:var(--primary-bg);padding:10px;border-radius:8px;max-height:60vh;overflow:auto;">${JSON.stringify(res, null, 2)}</pre>
      </div>
    </div>`;
}

async function debugDataPlans() {
  const serviceId = document.getElementById("svc-provider")?.value;
  if (!serviceId) { toast("Select a network first"); return; }
  const res = await callFunction("vtugate-data-plans", { service_id: serviceId });
  modalRoot.innerHTML = `
    <div class="modal-backdrop" onclick="if(event.target===this) closeModal()">
      <div class="modal-sheet">
        <div class="close-x" onclick="closeModal()">✕</div>
        <h3 style="margin:0 0 10px;">Raw data-plans (service_id ${serviceId})</h3>
        <pre style="white-space:pre-wrap;word-break:break-all;font-size:11px;background:var(--primary-bg);padding:10px;border-radius:8px;max-height:60vh;overflow:auto;">${JSON.stringify(res, null, 2)}</pre>
      </div>
    </div>`;
}

/* ---------------- Buy Data: separated by network (tabs), plans as cards ---------------- */

/* ---------------- Buy Data: phone -> network (circles) -> data type (chips) -> plans (grid) ---------------- */

const NETWORK_BRAND = {
  mtn: { bg: "#FFCC00", fg: "#1A1730", label: "MTN" },
  airtel: { bg: "#ED1C24", fg: "#fff", label: "airtel" },
  glo: { bg: "#90D500", fg: "#fff", label: "glo" },
  "9mobile": { bg: "#004B23", fg: "#8DC63F", label: "9mobile" },
};

async function renderBuyDataScreen() {
  app.innerHTML = topBar("Buy Data Bundle") + `<div class="center-pad">Loading networks…</div>`;

  const markupPct = await getMarkup("data");
  const providers = await getProviderList("data"); // raw: one entry per {network_name, data_type, service_id}

  const groups = {};
  for (const p of providers) {
    const net = pick(p, ["network_name", "network", "name"], "unknown");
    const key = String(net).toLowerCase();
    const sid = pick(p, ["service_id", "id"], "");
    const dtype = pick(p, ["data_type", "plan_type", "category"], "");
    if (!groups[key]) groups[key] = [];
    groups[key].push({ service_id: sid, data_type: dtype });
  }
  const networkKeys = Object.keys(groups);
  if (!networkKeys.length) {
    app.innerHTML = topBar("Buy Data Bundle") + `<div class="empty-state">No networks returned — check VTUGATE_API_KEY</div>`;
    return;
  }

  let selectedNetwork = networkKeys[0];
  let selectedType = null;
  let selectedPlan = null; // { service_id, plan_code, plan_name, amount }
  const hasContactPicker = "contacts" in navigator && "ContactsManager" in window;

  app.innerHTML = topBar("Buy Data Bundle") + `
    <div class="form-group">
      <label>Recipient Phone Number</label>
      <div style="position:relative;">
        <input type="tel" id="data-phone" placeholder="e.g. 08012345678" style="padding-left:40px;${hasContactPicker ? "padding-right:40px;" : ""}" required />
        <span style="position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--primary);">${icon("phone", 18)}</span>
        ${hasContactPicker ? `<span id="pick-contact-btn" style="position:absolute;right:12px;top:50%;transform:translateY(-50%);color:var(--primary);cursor:pointer;">${icon("contact", 18)}</span>` : ""}
      </div>
    </div>

    <div class="section-title" style="margin-top:4px;">Select Network Provider</div>
    <div style="display:flex;gap:14px;padding:4px 16px 14px;">
      ${networkKeys.map((k) => {
        const brand = NETWORK_BRAND[k] || { bg: "var(--primary-bg)", fg: "var(--primary)", label: k.toUpperCase() };
        return `
          <div class="net-circle" data-net="${k}" style="position:relative;width:60px;height:60px;border-radius:50%;background:${brand.bg};color:${brand.fg};display:flex;align-items:center;justify-content:center;font-weight:700;font-size:11px;text-align:center;cursor:pointer;border:3px solid transparent;flex:0 0 auto;">
            ${brand.label}
            <span class="net-check" style="display:none;position:absolute;bottom:-2px;right:-2px;width:18px;height:18px;border-radius:50%;background:var(--primary);color:#fff;align-items:center;justify-content:center;font-size:11px;">✓</span>
          </div>`;
      }).join("")}
    </div>

    <div class="section-title">Select Data Type</div>
    <div id="data-type-chips" style="display:flex;gap:8px;padding:4px 16px 14px;overflow-x:auto;"></div>

    <div class="section-title">Select Data Bundle Plan</div>
    <div id="data-plans-grid" style="padding:0 16px;"><div class="center-pad">Loading plans…</div></div>

    <div class="card" style="display:flex;justify-content:space-between;align-items:center;margin-top:16px;">
      <span style="color:var(--text-muted);font-size:13px;">Selected Plan Price</span>
      <span id="data-selected-price" style="font-size:20px;font-weight:700;">₦0.0</span>
    </div>
    <div id="data-error" class="error-text"></div>
    <div class="form-group"><button class="btn btn-primary btn-block" id="data-continue-btn" disabled>Proceed to Purchase</button></div>
  `;

  if (hasContactPicker) {
    document.getElementById("pick-contact-btn").onclick = async () => {
      try {
        const [contact] = await navigator.contacts.select(["tel"], { multiple: false });
        if (contact?.tel?.[0]) document.getElementById("data-phone").value = contact.tel[0].replace(/\D/g, "").slice(-11);
      } catch { /* person cancelled or denied — ignore */ }
    };
  }

  function selectNetworkUI(key) {
    document.querySelectorAll(".net-circle").forEach((el) => {
      const active = el.dataset.net === key;
      el.style.borderColor = active ? "var(--primary)" : "transparent";
      el.style.boxShadow = active ? "0 0 0 2px var(--primary-light)" : "none";
      el.querySelector(".net-check").style.display = active ? "flex" : "none";
    });
  }

  function renderTypeChips(key) {
    const types = [...new Set(groups[key].map((g) => g.data_type).filter(Boolean))];
    selectedType = types[0] || null;
    document.getElementById("data-type-chips").innerHTML = types.length
      ? types.map((t) => `<button type="button" class="type-chip" data-type="${t}" style="flex:0 0 auto;padding:8px 16px;border-radius:20px;border:1px solid var(--border);background:#fff;font-size:13px;font-weight:500;white-space:nowrap;">${DATA_TYPE_LABELS[String(t).toLowerCase()] || t.toUpperCase()}</button>`).join("")
      : `<span style="font-size:12px;color:var(--text-muted);">Standard</span>`;
    highlightTypeChip(selectedType);
    document.querySelectorAll(".type-chip").forEach((btn) => {
      btn.onclick = () => { selectedType = btn.dataset.type; highlightTypeChip(selectedType); loadPlans(); };
    });
  }

  function highlightTypeChip(type) {
    document.querySelectorAll(".type-chip").forEach((btn) => {
      const active = btn.dataset.type === type;
      btn.style.background = active ? "var(--primary)" : "#fff";
      btn.style.color = active ? "#fff" : "var(--text-dark)";
      btn.style.borderColor = active ? "var(--primary)" : "var(--border)";
    });
  }

  function updateSelectedPrice() {
    document.getElementById("data-continue-btn").disabled = !selectedPlan;
    document.getElementById("data-selected-price").textContent = selectedPlan ? naira(selectedPlan.sell) : "₦0.0";
  }

  async function loadPlans() {
    selectedPlan = null;
    updateSelectedPrice();
    document.getElementById("data-plans-grid").innerHTML = `<div class="center-pad">Loading plans…</div>`;

    const entry = groups[selectedNetwork].find((g) => g.data_type === selectedType) || groups[selectedNetwork][0];
    const [res, { data: overrides }] = await Promise.all([
      callFunction("vtugate-data-plans", { service_id: entry.service_id }),
      sb.from("plan_price_overrides").select("plan_code, custom_price").eq("service_type", "data"),
    ]);
    const overrideMap = Object.fromEntries((overrides || []).map((o) => [o.plan_code, Number(o.custom_price)]));
    const plans = extractList(res);

    if (!plans.length) {
      document.getElementById("data-plans-grid").innerHTML = `<div class="empty-state">No plans returned for this selection yet</div>`;
      return;
    }

    document.getElementById("data-plans-grid").innerHTML = `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
        ${plans.map((p, i) => {
          const amt = Number(pick(p, ["amount", "price", "variation_amount", "data_amount"], 0));
          const name = pick(p, ["name", "plan_name", "data_plan", "variation_name"], `Plan ${i + 1}`);
          const code = pick(p, ["plan_code", "code", "variation_code", "id"], "");
          const sell = overrideMap[code] ?? Math.ceil(amt * (1 + markupPct / 100));
          return `
            <div class="data-plan-card" data-plan-idx="${i}" style="background:var(--primary-bg);border:2px solid transparent;border-radius:14px;padding:14px;cursor:pointer;">
              <div style="font-weight:600;font-size:14px;">${name}</div>
              <div style="color:var(--primary);font-weight:700;margin-top:4px;">${naira(sell)}</div>
            </div>`;
        }).join("")}
      </div>`;

    document.querySelectorAll("[data-plan-idx]").forEach((card) => {
      card.onclick = () => {
        const p = plans[Number(card.dataset.planIdx)];
        const amt = Number(pick(p, ["amount", "price", "variation_amount", "data_amount"], 0));
        const name = pick(p, ["name", "plan_name", "data_plan", "variation_name"], "Plan");
        const code = pick(p, ["plan_code", "code", "variation_code", "id"], "");
        const sell = overrideMap[code] ?? Math.ceil(amt * (1 + markupPct / 100));
        selectedPlan = { service_id: entry.service_id, plan_code: code, plan_name: name, amount: amt, sell };
        document.querySelectorAll(".data-plan-card").forEach((c) => (c.style.borderColor = "transparent"));
        card.style.borderColor = "var(--primary)";
        updateSelectedPrice();
      };
    });
  }

  document.querySelectorAll(".net-circle").forEach((el) => {
    el.onclick = () => { selectedNetwork = el.dataset.net; selectNetworkUI(selectedNetwork); renderTypeChips(selectedNetwork); loadPlans(); };
  });
  selectNetworkUI(selectedNetwork);
  renderTypeChips(selectedNetwork);
  await loadPlans();

  document.getElementById("data-continue-btn").onclick = async () => {
    const phone_number = document.getElementById("data-phone").value;
    if (!phone_number) { document.getElementById("data-error").textContent = "Enter a phone number"; return; }
    if (!selectedPlan) { document.getElementById("data-error").textContent = "Select a plan"; return; }
    const pin = await askForPin("Buy Data");
    if (!pin) return;

    const btn = document.getElementById("data-continue-btn");
    btn.disabled = true; showLoader();
    const result = await callFunction("vtugate-secure-buy-data", {
      service_id: selectedPlan.service_id, network: selectedNetwork, phone_number,
      plan_code: selectedPlan.plan_code, plan_name: selectedPlan.plan_name,
      provider_amount: selectedPlan.amount, pin,
    });
    btn.disabled = false; hideLoader();

    if (!result.status) { document.getElementById("data-error").textContent = result.message || "Transaction failed"; return; }
    toast("Successful! ✅");
    await refreshWallet();
    go("#/transactions");
  };
}

async function renderServiceForm(type) {
  if (!SERVICE_TITLES[type]) { go("#/home"); return; }
  if (type === "data") return renderBuyDataScreen();
  app.innerHTML = topBar(SERVICE_TITLES[type]) + `<div class="center-pad">Loading providers…</div>`;

  const providers = await getProviderList(type);
  const markupPct = await getMarkup(type);

  app.innerHTML = topBar(SERVICE_TITLES[type]) + `
    <form id="svc-form">
      <div class="form-group">
        <label>${type === "tv" ? "Cable Provider" : type === "electricity" ? "Disco" : type === "education" ? "Exam Type" : "Network"}</label>
        <select id="svc-provider" required>${providerOptionsHtml(providers)}</select>
      </div>
      ${state.profile?.is_admin ? `<p style="padding:0 16px 10px;"><a href="javascript:void(0)" onclick="debugFetchRaw('${type}')" style="font-size:11px;color:var(--text-muted);">🔧 Admin: view raw provider data</a></p>` : ""}

      ${type === "tv" ? `
        <div class="form-group"><label>Smart Card / IUC Number</label><input type="text" id="svc-smartcard" required /></div>
        <div class="form-group"><label>Phone Number</label><input type="tel" id="svc-phone" required /></div>
        <div class="form-group"><button type="button" class="btn btn-outline-dark btn-block" id="svc-verify-btn">Verify Smart Card</button></div>
        <div id="svc-verify-result"></div>
      ` : type === "electricity" ? `
        <div class="form-group"><label>Meter Number</label><input type="text" id="svc-meter" required /></div>
        <div class="form-group"><label>Phone Number</label><input type="tel" id="svc-phone" required /></div>
        <div class="form-group"><button type="button" class="btn btn-outline-dark btn-block" id="svc-verify-btn">Verify Meter</button></div>
        <div id="svc-verify-result"></div>
      ` : `
        <div class="form-group"><label>Phone Number</label><input type="tel" id="svc-phone" required /></div>
      `}

      ${type === "airtime" ? `<div class="form-group"><label>Amount (₦)</label><input type="number" id="svc-amount" min="50" required /></div>` : ""}

      <div id="svc-plan-area">${type === "data" || type === "education" ? `<div class="center-pad">Loading…</div>` : ""}</div>
      ${state.profile?.is_admin && type === "data" ? `<p style="padding:0 16px 10px;"><a href="javascript:void(0)" onclick="debugDataPlans()" style="font-size:11px;color:var(--text-muted);">🔧 Admin: view raw data-plans response</a></p>` : ""}
      <div id="svc-error" class="error-text"></div>
      <div class="form-group"><button class="btn btn-primary btn-block" type="submit" ${type === "tv" || type === "electricity" ? "disabled" : ""}>Continue</button></div>
    </form>
  `;

  const submitBtn = document.querySelector("#svc-form button[type=submit]");
  let educationPrice = 0;

  async function loadDataPlans() {
    const serviceId = document.getElementById("svc-provider").value;
    const [res, { data: overrides }] = await Promise.all([
      callFunction("vtugate-data-plans", { service_id: serviceId }),
      sb.from("plan_price_overrides").select("plan_code, custom_price").eq("service_type", "data"),
    ]);
    const overrideMap = Object.fromEntries((overrides || []).map((o) => [o.plan_code, Number(o.custom_price)]));
    const plans = extractList(res);
    document.getElementById("svc-plan-area").innerHTML = `
      <div class="form-group"><label>Data Plan</label>
        <select id="svc-plan">
          ${plans.length ? plans.map((p, i) => {
            const amt = Number(pick(p, ["amount", "price", "variation_amount", "data_amount"], 0));
            const name = pick(p, ["name", "plan_name", "data_plan", "variation_name"], `Plan ${i + 1}`);
            const category = pick(p, ["plan_type", "category", "type"], "");
            const code = pick(p, ["plan_code", "code", "variation_code", "id"], "");
            const sell = overrideMap[code] ?? Math.ceil(amt * (1 + markupPct / 100));
            return `<option value="${code}" data-amount="${amt}" data-name="${name}">${category ? `[${category}] ` : ""}${name} — ${naira(sell)}</option>`;
          }).join("") : `<option value="">No plans returned for this network yet</option>`}
        </select>
      </div>`;
  }

  async function loadEducationPrice() {
    const serviceId = document.getElementById("svc-provider").value;
    const res = await callFunction("vtugate-education-price", { service_id: serviceId });
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
      const serviceId = document.getElementById("svc-provider").value;
      verifyBtn.disabled = true; verifyBtn.textContent = "Verifying…";
      let res;
      if (type === "tv") {
        res = await callFunction("vtugate-verify-cabletv", { service_id: serviceId, smartcard_number: document.getElementById("svc-smartcard").value, phone: document.getElementById("svc-phone").value });
      } else {
        res = await callFunction("vtugate-verify-electricity", { service_id: serviceId, meter_no: document.getElementById("svc-meter").value });
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
    const pin = await askForPin(`${SERVICE_TITLES[type]}`);
    if (!pin) return;
    const serviceId = document.getElementById("svc-provider").value;
    const network = document.getElementById("svc-provider").selectedOptions[0]?.text;
    let body = { service_id: serviceId, network, pin };
    let fnName = "";

    if (type === "airtime") {
      // VTUGATE's airtime endpoint is currently broken on their end (confirmed
      // via their own website failing identically) — routed to HusmoData instead.
      fnName = "husmodata-buy-airtime";
      body.phone_number = document.getElementById("svc-phone").value;
      body.provider_amount = document.getElementById("svc-amount").value;
    } else if (type === "data") {
      fnName = "vtugate-secure-buy-data";
      const sel = document.getElementById("svc-plan")?.selectedOptions?.[0];
      body.phone_number = document.getElementById("svc-phone").value;
      body.plan_code = sel?.value; body.plan_name = sel?.dataset.name; body.provider_amount = sel?.dataset.amount;
    } else if (type === "education") {
      fnName = "vtugate-secure-buy-education";
      body.phone = document.getElementById("svc-phone")?.value || "N/A";
      body.quantity = document.getElementById("svc-qty").value;
      body.provider_amount = Math.ceil(educationPrice * Number(body.quantity) * (1 + markupPct / 100));
      body.product_code = document.getElementById("svc-provider").selectedOptions[0]?.dataset.productCode || "";
    } else if (type === "tv") {
      fnName = "vtugate-secure-buy-cabletv-";
      const sel = document.getElementById("svc-plan");
      body.phone = document.getElementById("svc-phone").value;
      body.smartcard_number = document.getElementById("svc-smartcard").value;
      if (sel) { const o = sel.selectedOptions[0]; body.plan_code = o.value; body.plan_name = o.dataset.name; body.provider_amount = o.dataset.amount; }
      else { body.plan_code = document.getElementById("svc-plan-code").value; body.plan_name = document.getElementById("svc-plan-label").value; body.provider_amount = document.getElementById("svc-plan-amount").value; }
    } else if (type === "electricity") {
      fnName = "vtugate-secure-buy-electricity";
      body.meter_no = document.getElementById("svc-meter").value;
      body.phone = document.getElementById("svc-phone").value;
      body.provider_amount = document.getElementById("svc-amount").value;
    }

    submitBtn.disabled = true; showLoader();
    const result = await callFunction(fnName, body);
    submitBtn.disabled = false; hideLoader();

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
      <div class="form-group">
        <label>Payment Gateway</label>
        <select id="topup-gateway">
          <option value="paystack">Paystack</option>
          <option value="flutterwave">Flutterwave</option>
        </select>
      </div>
      <div class="form-group"><label>Amount (₦)</label><input type="number" id="topup-amount" min="100" required /></div>
      <div id="topup-error" class="error-text"></div>
      <div class="form-group"><button class="btn btn-primary btn-block" type="submit">Continue to Payment</button></div>
    </form>
    <p style="padding:0 16px;color:var(--text-muted);font-size:12px;">You'll be taken to a secure checkout page. Come back to the app after paying and your balance updates automatically.</p>
  `;

  document.getElementById("topup-form").onsubmit = async (e) => {
    e.preventDefault();
    const amount = document.getElementById("topup-amount").value;
    const gateway = document.getElementById("topup-gateway").value;
    const btn = e.target.querySelector("button[type=submit]");
    btn.disabled = true; showLoader();
    const fnName = gateway === "flutterwave" ? "flutterwave-payment" : "paystack-payment";
    const res = await callFunction(fnName, { amount, email: state.session.user.email });
    btn.disabled = false; hideLoader();

    if (!res.success || !res.authorization_url) {
      document.getElementById("topup-error").textContent = res.message || "Could not start payment";
      return;
    }
    // Remember the reference AND which gateway it's on, so we know which
    // verify function to call the moment the person comes back to the app.
    localStorage.setItem("alfaruq_pending_reference", res.reference);
    localStorage.setItem("alfaruq_pending_gateway", gateway);
    window.open(res.authorization_url, "_blank");
    toast("Complete your payment in the new tab, then come back here.");
  };
}

async function checkPendingTopup() {
  const reference = localStorage.getItem("alfaruq_pending_reference");
  if (!reference || !state.session) return;
  const gateway = localStorage.getItem("alfaruq_pending_gateway") || "paystack";
  const fnName = gateway === "flutterwave" ? "flutterwave-verify-payment" : "paystack-verify-payment";
  const res = await callFunction(fnName, { reference });
  if (res.status) {
    localStorage.removeItem("alfaruq_pending_reference");
    localStorage.removeItem("alfaruq_pending_gateway");
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
    showLoader();
    const result = await callFunction("wallet-request-withdrawal", body);
    hideLoader();
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

  const [{ data: allTx }, { data: settings }, { data: customers }, { data: pendingWithdrawals }, { data: stats }] = await Promise.all([
    sb.from("transactions").select("*, profiles:user_id(full_name, phone)").order("created_at", { ascending: false }).limit(50),
    sb.from("admin_settings").select("*").order("key"),
    sb.from("profiles").select("*, wallets(balance)").order("created_at", { ascending: false }),
    sb.from("withdrawal_requests").select("*, profiles:user_id(full_name, phone)").in("status", ["pending", "processing"]).order("created_at", { ascending: false }),
    sb.rpc("admin_get_stats"),
  ]);

  const s = stats || {};
  const statTile = (label, value) => `
    <div style="background:#fff;border:1px solid var(--border);border-radius:12px;padding:12px;">
      <div style="font-size:11px;color:var(--text-muted);">${label}</div>
      <div style="font-size:16px;font-weight:700;margin-top:4px;">${value}</div>
    </div>`;

  app.innerHTML = topBar("Admin Dashboard") + `
    <div class="section-title">Overview</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;padding:0 16px;">
      ${statTile("Total Users", s.total_users ?? 0)}
      ${statTile("Customer Funds", naira(s.total_customer_funds))}
      ${statTile("Total Transactions", s.total_transactions ?? 0)}
      ${statTile("Total Inflow", naira(s.total_inflow))}
      ${statTile("Total Outflow", naira(s.total_outflow))}
      ${statTile("Data Sold", `${naira(s.data_sold)} (${s.data_count ?? 0})`)}
      ${statTile("Airtime Sold", `${naira(s.airtime_sold)} (${s.airtime_count ?? 0})`)}
      ${statTile("Electricity Sold", `${naira(s.electricity_sold)} (${s.electricity_count ?? 0})`)}
      ${statTile("TV Sold", `${naira(s.tv_sold)} (${s.tv_count ?? 0})`)}
      ${statTile("NIN / BVN Checks", `${s.nin_count ?? 0} / ${s.bvn_count ?? 0}`)}
    </div>

    <div class="section-title">Withdrawals Needing Attention (${(pendingWithdrawals || []).length})</div>
    <div class="card" style="padding:0;">
      ${(pendingWithdrawals || []).length === 0 ? `<div class="empty-state">No pending withdrawals</div>` : (pendingWithdrawals || []).map((w) => `
        <div class="list-item" style="cursor:default;">
          <div>
            <div class="l-title">${w.profiles?.full_name || "Customer"} — ${naira(w.amount)}</div>
            <div class="l-sub">${w.bank_name} · ${w.account_number} · ${w.account_name}</div>
          </div>
          <button class="btn btn-primary" style="padding:6px 12px;font-size:12px;" onclick="completeWithdrawal(${w.id})">Mark Paid</button>
        </div>`).join("")}
    </div>
    <p style="padding:0 16px 8px;font-size:11px;color:var(--text-muted);">Withdrawals now pay out automatically via Paystack. Only ones stuck here (failed recipient setup, or your Paystack account requires transfer OTP) need a manual "Mark Paid".</p>

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
      <div class="form-group" style="margin-top:10px;"><button class="btn btn-outline-dark btn-block" onclick="go('#/admin-prices')">📋 Set Individual Data Plan Prices</button></div>
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

async function completeWithdrawal(withdrawalId) {
  if (!confirm("Confirm you've sent this money to the customer's bank account?")) return;
  const { error } = await sb.from("withdrawal_requests").update({ status: "completed" }).eq("id", withdrawalId);
  if (error) { toast("Failed to update: " + error.message); return; }
  toast("Marked as paid ✅");
  renderAdmin();
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

/* ---------------- admin: per-plan price overrides ---------------- */

async function renderAdminPrices(preselectedServiceId) {
  if (!state.profile?.is_admin) { go("#/home"); return; }
  app.innerHTML = topBar("Data Plan Prices") + `<div class="center-pad">Loading networks…</div>`;

  const providers = await getProviderList("data");
  app.innerHTML = topBar("Data Plan Prices") + `
    <div class="form-group">
      <label>Network</label>
      <select id="ap-network">${providerOptionsHtml(providers)}</select>
    </div>
    <div id="ap-plans"><div class="center-pad">Loading plans…</div></div>
  `;

  async function loadPlans() {
    const serviceId = document.getElementById("ap-network").value;
    const [planRes, { data: overrides }] = await Promise.all([
      callFunction("vtugate-data-plans", { service_id: serviceId }),
      sb.from("plan_price_overrides").select("*").eq("service_type", "data"),
    ]);
    const plans = extractList(planRes);
    const overrideMap = Object.fromEntries((overrides || []).map((o) => [o.plan_code, o]));

    document.getElementById("ap-plans").innerHTML = plans.length === 0
      ? `<div class="empty-state">No plans returned for this network</div>`
      : `<div class="card" style="padding:0;">
          ${plans.map((p) => {
            const amt = Number(pick(p, ["amount", "price", "variation_amount", "data_amount"], 0));
            const name = pick(p, ["name", "plan_name", "data_plan", "variation_name"], "Plan");
            const code = pick(p, ["plan_code", "code", "variation_code", "id"], "");
            const ov = overrideMap[code];
            return `
              <div class="list-item" style="cursor:default;flex-direction:column;align-items:stretch;gap:8px;">
                <div style="display:flex;justify-content:space-between;">
                  <div class="l-title">${name}</div>
                  <div class="l-sub">Provider: ${naira(amt)}</div>
                </div>
                <div style="display:flex;gap:8px;">
                  <input type="number" placeholder="Your price" value="${ov?.custom_price ?? ""}" data-code="${code}" data-name="${name}" data-provider="${amt}" style="flex:1;" />
                  <button class="btn btn-primary" style="padding:8px 12px;font-size:12px;" onclick="saveOverridePrice(this)">Save</button>
                  ${ov ? `<button class="btn" style="padding:8px 12px;font-size:12px;background:#FCEAEA;color:var(--danger);" onclick="deleteOverridePrice('${code}', this)">Reset</button>` : ""}
                </div>
              </div>`;
          }).join("")}
        </div>`;
  }

  document.getElementById("ap-network").onchange = loadPlans;
  if (preselectedServiceId) document.getElementById("ap-network").value = preselectedServiceId;
  await loadPlans();
}

async function saveOverridePrice(btn) {
  const row = btn.parentElement.querySelector("input");
  const customPrice = Number(row.value);
  if (!customPrice || customPrice <= 0) { toast("Enter a valid price"); return; }
  const { error } = await sb.from("plan_price_overrides").upsert({
    service_type: "data", plan_code: row.dataset.code, plan_name: row.dataset.name,
    provider_price: row.dataset.provider, custom_price: customPrice, updated_at: new Date().toISOString(),
  }, { onConflict: "service_type,plan_code" });
  toast(error ? "Failed to save" : "Price saved ✅");
}

async function deleteOverridePrice(planCode, btn) {
  await sb.from("plan_price_overrides").delete().eq("service_type", "data").eq("plan_code", planCode);
  toast("Reverted to default pricing");
  document.getElementById("ap-network").onchange();
}
