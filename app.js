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

/* ---------------- icons (professional SVG, replaces emoji) ---------------- */

const ICON_PATHS = {
  "home": '<path d="M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  "receipt": '<path d="M6 2h12a1 1 0 0 1 1 1v18l-3-2-2 2-2-2-2 2-2-2-3 2V3a1 1 0 0 1 1-1z"/><path d="M9 8h6M9 12h6"/>',
  "headphones": '<path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3"/>',
  "user": '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7"/>',
  "message-circle": '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22z"/>',
  "phone": '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>',
  "mail": '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
  "bell": '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>',
  "eye": '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>',
  "eye-off": '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><path d="M1 1l22 22"/>',
  "wallet": '<path d="M3 7a2 2 0 0 1 2-2h13v4"/><path d="M3 7v11a2 2 0 0 0 2 2h14a1 1 0 0 0 1-1v-9a1 1 0 0 0-1-1H5a2 2 0 0 1-2-2z"/><circle cx="16" cy="14.5" r="1.2"/>',
  "wifi": '<path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><circle cx="12" cy="20" r=".8"/>',
  "graduation-cap": '<path d="M22 10 12 5 2 10l10 5z"/><path d="M6 12v5c3 2.5 9 2.5 12 0v-5"/><path d="M22 10v6"/>',
  "zap": '<path d="M13 2 3 14h9l-1 8 10-12h-9z"/>',
  "tv": '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="m17 2-5 5-5-5"/>',
  "id-card": '<rect x="2" y="5" width="20" height="14" rx="2"/><circle cx="8" cy="11" r="2"/><path d="M5 16c.5-1.5 1.7-2 3-2s2.5.5 3 2M14 10h5M14 14h4"/>',
  "shield": '<path d="M12 2 4 5v6c0 5 3.4 9.3 8 11 4.6-1.7 8-6 8-11V5z"/>',
  "shield-check": '<path d="M12 2 4 5v6c0 5 3.4 9.3 8 11 4.6-1.7 8-6 8-11V5z"/><path d="m9 12 2 2 4-4"/>',
  "repeat": '<path d="M17 3l4 4-4 4"/><path d="M3 11V9a2 2 0 0 1 2-2h16"/><path d="M7 21l-4-4 4-4"/><path d="M21 13v2a2 2 0 0 1-2 2H3"/>',
  "plane": '<path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>',
  "hotel": '<path d="M3 21h18"/><path d="M5 21V7l7-4 7 4v14"/><path d="M9 21v-6h6v6"/><path d="M9 10h.01M12 10h.01M15 10h.01"/>',
  "globe": '<circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
  "sliders": '<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3"/><path d="M1 14h6M9 8h6M17 16h6"/>',
  "megaphone": '<path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>',
  "ban": '<circle cx="12" cy="12" r="10"/><path d="m4.9 4.9 14.2 14.2"/>',
  "check": '<path d="M20 6 9 17l-5-5"/>',
  "check-circle": '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="M22 4 12 14.01l-3-3"/>',
  "x": '<path d="M18 6 6 18M6 6l12 12"/>',
  "clock": '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  "arrow-left": '<path d="M19 12H5M12 19l-7-7 7-7"/>',
  "chevron-right": '<path d="m9 18 6-6-6-6"/>',
  "camera": '<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>',
  "file-text": '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>',
  "gift": '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13"/><path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"/><path d="M7.5 8a2.5 2.5 0 0 1 0-5C11 3 12 8 12 8s1-5 4.5-5a2.5 2.5 0 0 1 0 5"/>',
  "palette": '<circle cx="13.5" cy="6.5" r=".8"/><circle cx="17.5" cy="10.5" r=".8"/><circle cx="8.5" cy="7.5" r=".8"/><circle cx="6.5" cy="12.5" r=".8"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.9 0 1.5-.7 1.5-1.5 0-.4-.2-.8-.4-1-.3-.3-.4-.6-.4-1 0-.8.7-1.5 1.5-1.5H16c3.3 0 6-2.7 6-6 0-4.9-4.5-9-10-9z"/>',
  "star": '<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"/>',
  "wrench": '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94z"/>',
  "list": '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
  "key": '<path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.78 7.78 5.5 5.5 0 0 1 7.78-7.78zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>',
  "smartphone": '<rect x="6" y="2" width="12" height="20" rx="2.5"/><path d="M11 18h2"/>',
  "contact": '<rect x="4" y="3" width="16" height="18" rx="2"/><circle cx="12" cy="10" r="2.5"/><path d="M7.5 17c.8-2 2.4-3 4.5-3s3.7 1 4.5 3"/><path d="M2 7h2M2 12h2M2 17h2"/>',
};

function icon(name, size = 20) {
  return `<svg class="ic-svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON_PATHS[name] || ""}</svg>`;
}

// Escape text before putting provider/user data into innerHTML.
function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

// Compact naira format used on plan cards: ₦280, ₦1,100, ₦130,000
function naira0(n) {
  return "₦" + Number(n || 0).toLocaleString("en-NG", { maximumFractionDigits: 2 });
}

(function injectUiStyles() {
  const s = document.createElement("style");
  s.id = "alfaruq-ui-styles";
  s.textContent = `
    .ic-svg{display:inline-block;vertical-align:middle;flex:none}
    .l-title .ic-svg{margin-right:10px;color:var(--primary);vertical-align:-4px}
    .btn .ic-svg{margin-right:8px;vertical-align:-4px}
    .label .ic-svg{margin-right:6px;vertical-align:-3px}
    h3 .ic-svg{margin-right:6px;vertical-align:-4px}
    a .ic-svg{margin-right:4px;vertical-align:-2px}
    .nav-item .ic,.service-tile .ic,.bell,.fab-whatsapp,.back-btn,.close-x,.avatar,#balance-eye{display:flex;align-items:center;justify-content:center}
    .service-tile .ic{color:var(--primary)}

    /* ---- Buy Data Bundle screen ---- */
    .bd-wrap{padding:0 16px 8px}
    .bd-label{font-size:16px;font-weight:700;color:#141B2D;margin:20px 0 10px}
    .bd-phone{display:flex;align-items:center;gap:10px;background:#fff;border:1.5px solid #D5DBE8;border-radius:14px;padding:0 14px;height:50px;color:#1F57E7;box-sizing:border-box}
    .bd-phone:focus-within{border-color:#1F57E7}
    .bd-phone input{all:unset;flex:1;min-width:0;font-size:15px;color:#141B2D;height:100%}
    .bd-phone input::placeholder{color:#9AA4B8}
    .bd-phone .bd-contacts{all:unset;cursor:pointer;color:#4B5563;display:flex;align-items:center;padding:4px}
    .bd-networks{display:flex;justify-content:space-between;gap:8px;padding:6px 4px}
    .bd-net{all:unset;position:relative;box-sizing:border-box;width:60px;height:60px;border-radius:50%;cursor:pointer;border:2px solid #E1E5EE;background:#fff;display:flex;align-items:center;justify-content:center;transition:all .15s}
    .bd-net img,.bd-net .bd-fb{width:100%;height:100%;border-radius:50%;object-fit:cover}
    .bd-net .bd-fb{display:none;align-items:center;justify-content:center;font-weight:800;font-size:13px;letter-spacing:-.3px}
    .bd-net .bd-tick{position:absolute;right:-3px;bottom:-3px;width:22px;height:22px;border-radius:50%;background:#1F57E7;color:#fff;border:2px solid #fff;display:none;align-items:center;justify-content:center}
    .bd-net.active{border:3px solid #1F57E7;box-shadow:0 0 0 4px rgba(31,87,231,.16);transform:scale(1.08)}
    .bd-net.active .bd-tick{display:flex}
    .bd-types{display:flex;gap:8px;overflow-x:auto;padding:2px 2px 6px;scrollbar-width:none}
    .bd-types::-webkit-scrollbar{display:none}
    .bd-type{all:unset;flex:0 0 auto;box-sizing:border-box;display:flex;align-items:center;gap:6px;padding:0 18px;height:38px;border-radius:19px;background:#fff;border:1px solid #E1E5EE;font-size:14px;font-weight:500;color:#141B2D;cursor:pointer}
    .bd-type.active{background:#1F57E7;border-color:#1F57E7;color:#fff;font-weight:600}
    .bd-plans{display:grid;grid-template-columns:1fr 1fr;gap:10px}
    .bd-plan{all:unset;box-sizing:border-box;cursor:pointer;background:#F0F3FA;border:1.5px solid #E1E6F2;border-radius:16px;padding:14px;min-height:72px;display:flex;flex-direction:column;justify-content:space-between;gap:8px}
    .bd-plan .n{font-size:14px;color:#141B2D;line-height:1.3}
    .bd-plan .p{font-size:17px;font-weight:800;color:#1F57E7}
    .bd-plan.active{background:#E4ECFF;border-color:#1F57E7;box-shadow:0 0 0 2px rgba(31,87,231,.15)}
    .bd-msg{grid-column:1 / -1;text-align:center;color:#6B7488;font-size:14px;padding:24px 0}
    .bd-price{display:flex;justify-content:space-between;align-items:center;margin-top:18px;padding:0 16px;height:52px;border-radius:14px;background:#E8EEFB;border:1px solid #C9D6F5}
    .bd-price span{font-size:14px;color:#6B7488}
    .bd-price b{font-size:19px;color:#1F57E7}
    .bd-footer{position:sticky;bottom:0;padding:12px 16px calc(14px + env(safe-area-inset-bottom,0px));background:linear-gradient(to top,var(--bg-page,#F7F9FC) 70%,rgba(247,249,252,0))}
    .bd-proceed{all:unset;box-sizing:border-box;display:block;width:100%;height:50px;line-height:50px;text-align:center;border-radius:14px;background:#1F57E7;color:#fff;font-size:15px;font-weight:600;cursor:pointer}
    .bd-proceed:disabled{background:#DDE0E8;color:#9AA0AE;cursor:not-allowed}
  `;
  document.head.appendChild(s);
})();


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
  if (eye) eye.innerHTML = icon(state.balanceHidden ? "eye-off" : "eye", 20);
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
      ${opts.noBack ? '<div class="spacer"></div>' : `<div class="back-btn" onclick="goBack()">${icon("arrow-left", 22)}</div>`}
      <h1>${title}</h1>
      <div class="spacer"></div>
    </div>`;
}

function bottomNav(active) {
  const items = [
    ["home", "home", "Home", "#/home"],
    ["transactions", "receipt", "Transactions", "#/transactions"],
    ["support", "headphones", "Support", "#/support"],
    ["account", "user", "Account", "#/account"],
  ];
  return `
    <div class="bottom-nav">
      ${items.map(([key, ic, label, href]) => `
        <div class="nav-item ${active === key ? "active" : ""}" onclick="go('${href}')">
          <div class="ic">${icon(ic, 22)}</div><div>${label}</div>
        </div>`).join("")}
    </div>
    <div class="fab-whatsapp" onclick="window.open('https://wa.me/${SUPPORT_WHATSAPP}','_blank')">${icon("message-circle", 26)}</div>`;
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
      await sb.from("profiles").upsert({ id: data.user.id, full_name, phone });
      await sb.from("wallets").upsert({ user_id: data.user.id, balance: 0 });
    }
    hideLoader();
    if (data.session) { state.session = data.session; go("#/home"); }
    else { toast("Check your email to confirm your account, then log in."); go("#/login"); }
  };
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
        <h3 style="margin:0 0 10px;">${icon("megaphone", 20)} Announcement</h3>
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
      <div style="margin-bottom:12px;color:var(--primary);display:flex;justify-content:center;">${icon("globe", 52)}</div>
      <h2 style="margin:0 0 8px;">${title || "Coming Soon"}</h2>
      <p style="color:var(--text-muted);font-size:14px;">We're working on this feature. Check back soon!</p>
    </div>`;
}

function renderSuspended() {
  app.innerHTML = `
    <div class="center-pad">
      <div style="margin-bottom:12px;color:var(--danger);display:flex;justify-content:center;">${icon("ban", 52)}</div>
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
  ["education", "graduation-cap", "Education"],
  ["electricity", "zap", "Electricity"],
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
    <div class="greeting">
      <div class="who">
        <div class="avatar">${name[0]?.toUpperCase() || "U"}</div>
        <div>
          <div class="sub">${greet}!</div>
          <div class="name">${name}</div>
        </div>
      </div>
      <div class="bell">${icon("bell", 22)}</div>
    </div>

    <div class="wallet-card">
      <div class="row">
        <div class="label">${icon("wallet", 16)} Total Wallet Balance</div>
        <div style="cursor:pointer;" onclick="toggleBalance()" id="balance-eye">${icon(state.balanceHidden ? "eye-off" : "eye", 20)}</div>
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
      ${SERVICE_TILES.map(([key, ic, label]) => `
        <div class="service-tile" onclick="go('#/service/${key}')">
          <div class="ic">${icon(ic, 26)}</div><span>${label}</span>
        </div>`).join("")}
      <div class="service-tile" onclick="go('#/nin')"><div class="ic">${icon("id-card", 26)}</div><span>NIN</span></div>
      <div class="service-tile" onclick="go('#/bvn')"><div class="ic">${icon("shield-check", 26)}</div><span>BVN</span></div>
      <div class="service-tile" onclick="go('#/airtime-cash')"><div class="ic">${icon("repeat", 26)}</div><span>Airtime2Cash</span></div>
      <div class="service-tile" onclick="go('#/flight')"><div class="ic">${icon("plane", 26)}</div><span>Flight</span></div>
      <div class="service-tile" onclick="go('#/hotel')"><div class="ic">${icon("hotel", 26)}</div><span>Hotel</span></div>
      <div class="service-tile" onclick="go('#/coming-soon/International Data')"><div class="ic">${icon("globe", 26)}</div><span>Intl. Data</span></div>
      <div class="service-tile" onclick="go('#/coming-soon/International Airtime')"><div class="ic">${icon("globe", 26)}</div><span>Intl. Airtime</span></div>
      ${state.profile?.is_admin ? `<div class="service-tile" onclick="go('#/admin')"><div class="ic">${icon("sliders", 26)}</div><span>Admin</span></div>` : ""}
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
      ? `<div class="empty-state"><div class="ic" style="color:var(--primary);display:flex;justify-content:center;">${icon("receipt", 44)}</div><h3>No Transactions Yet</h3>
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

  app.innerHTML = topBar("Receipt") + `
    <div id="receipt-card" style="background:#fff;margin:0 16px;border-radius:16px;overflow:hidden;border:1px solid var(--border);">
      <div style="background:var(--primary);padding:20px;text-align:center;color:#fff;">
        <img src="./icon-192.png" alt="ALFARUQ" style="width:44px;height:44px;border-radius:10px;margin:0 auto 10px;display:block;" />
        <div style="font-size:13px;color:var(--primary-light);">ALFARUQ DATA SERVICES</div>
      </div>
      <div style="padding:20px;text-align:center;border-bottom:1px dashed var(--border);">
        <div style="width:52px;height:52px;border-radius:50%;margin:0 auto 10px;display:flex;align-items:center;justify-content:center;font-size:24px;background:${isSuccess ? "#E5F7F1" : isFailed ? "#FCEAEA" : "#FBF2DC"};color:${isSuccess ? "var(--success)" : isFailed ? "var(--danger)" : "var(--accent-gold-dark)"};">${icon(isSuccess ? "check" : isFailed ? "x" : "clock", 26)}</div>
        <div style="font-size:26px;font-weight:700;">${naira(t.amount)}</div>
        <span class="badge ${isSuccess ? "badge-success" : isFailed ? "badge-failed" : "badge-pending"}" style="margin-top:8px;">${t.status}</span>
      </div>
      <div style="padding:8px 20px 20px;">
        <div class="receipt-row"><div class="k">Transaction Type</div><div>${TX_LABELS[t.type] || t.type}</div></div>
        <div class="receipt-row"><div class="k">Reference</div><div>TXN-${String(t.id).padStart(6, "0")}</div></div>
        <div class="receipt-row"><div class="k">Date</div><div>${new Date(t.created_at).toLocaleString("en-NG")}</div></div>
        ${detailRows}
      </div>
      <div style="padding:12px 20px;text-align:center;background:var(--bg-page);font-size:11px;color:var(--text-muted);">Thank you for using ALFARUQ DATA SERVICES</div>
    </div>
    <div class="form-group" style="margin-top:16px;">
      <button class="btn btn-primary btn-block" id="save-image-btn">${icon("camera", 18)} Save as Image</button>
    </div>
    <div class="form-group">
      <button class="btn btn-outline-dark btn-block" id="save-pdf-btn">${icon("file-text", 18)} Save as PDF</button>
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

function renderSupport() {
  app.innerHTML = topBar("Customer Support", { noBack: true }) + `
    <div class="card">
      <div style="display:flex;gap:12px;align-items:center;">
        <div class="avatar" style="background:var(--primary);color:#fff;">${icon("headphones", 22)}</div>
        <div>
          <div style="font-weight:600;">How can we help?</div>
          <div style="font-size:12px;color:var(--text-muted);">Our support team is available to assist you 24/7.</div>
        </div>
      </div>
    </div>
    <div class="section-title">Contact Channels</div>
    <div class="card" style="padding:0;">
      <div class="list-item" onclick="window.open('tel:${SUPPORT_PHONE}')">
        <div><div class="l-title">${icon("phone", 18)} Phone Number</div><div class="l-sub">${SUPPORT_PHONE}</div></div><div>${icon("chevron-right", 18)}</div>
      </div>
      <div class="list-item" onclick="window.open('mailto:${SUPPORT_EMAIL}')">
        <div><div class="l-title">${icon("mail", 18)} Email</div><div class="l-sub">${SUPPORT_EMAIL}</div></div><div>${icon("chevron-right", 18)}</div>
      </div>
      <div class="list-item" onclick="window.open('https://wa.me/${SUPPORT_WHATSAPP}')">
        <div><div class="l-title">${icon("message-circle", 18)} WhatsApp</div><div class="l-sub">Chat with us</div></div><div>${icon("chevron-right", 18)}</div>
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
      <div class="list-item"><div class="l-title">${icon("user", 18)} Manage Account</div><div>${icon("chevron-right", 18)}</div></div>
      <div class="list-item" onclick="go('#/support')"><div class="l-title">${icon("headphones", 18)} Customer Care</div><div>${icon("chevron-right", 18)}</div></div>
      <div class="list-item"><div class="l-title">${icon("gift", 18)} Refer to Earn</div><div>Share</div></div>
    </div>

    <div class="section-title">Identity Services</div>
    <div class="card" style="padding:0;">
      <div class="list-item" onclick="go('#/nin')"><div class="l-title">${icon("id-card", 18)} NIN Details</div><div>${icon("chevron-right", 18)}</div></div>
      <div class="list-item" onclick="go('#/bvn')"><div class="l-title">${icon("shield-check", 18)} BVN Details</div><div>${icon("chevron-right", 18)}</div></div>
    </div>

    <div class="section-title">Preferences &amp; Legal</div>
    <div class="card" style="padding:0;">
      <div class="list-item"><div class="l-title">${icon("palette", 18)} Appearances</div><div>${icon("chevron-right", 18)}</div></div>
      <div class="list-item"><div class="l-title">${icon("star", 18)} Rate Us</div><div>${icon("chevron-right", 18)}</div></div>
      <div class="list-item"><div class="l-title">${icon("shield", 18)} Privacy Policy</div><div>${icon("chevron-right", 18)}</div></div>
      <div class="list-item"><div class="l-title">${icon("file-text", 18)} Terms &amp; Conditions</div><div>${icon("chevron-right", 18)}</div></div>
    </div>

    <div class="form-group" style="margin-top:16px;">
      <button class="btn btn-block" style="background:#FCEAEA;color:var(--danger);" onclick="logout()">Logout</button>
    </div>
    ${bottomNav("account")}
  `;
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
        <div class="close-x" onclick="closeModal()">${icon("x", 20)}</div>
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
        <div class="close-x" onclick="closeModal()">${icon("x", 20)}</div>
        <h3 style="margin:0 0 10px;">Raw data-plans (service_id ${serviceId})</h3>
        <pre style="white-space:pre-wrap;word-break:break-all;font-size:11px;background:var(--primary-bg);padding:10px;border-radius:8px;max-height:60vh;overflow:auto;">${JSON.stringify(res, null, 2)}</pre>
      </div>
    </div>`;
}

/* ---------------- Buy Data Bundle: network logos -> data type chips -> plan cards ---------------- */

// Network logos embedded as SVG data URIs (no external files needed)
const NETWORK_LOGOS = {
  "mtn": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMjAgMTIwIj48Y2lyY2xlIGN4PSI2MCIgY3k9IjYwIiByPSI2MCIgZmlsbD0iI0ZGQ0MwMCIvPjxlbGxpcHNlIGN4PSI2MCIgY3k9IjYwIiByeD0iNDIiIHJ5PSIyNiIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMTExIiBzdHJva2Utd2lkdGg9IjUiLz48dGV4dCB4PSI2MCIgeT0iNjkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtZmFtaWx5PSJBcmlhbCxIZWx2ZXRpY2Esc2Fucy1zZXJpZiIgZm9udC13ZWlnaHQ9IjkwMCIgZm9udC1zaXplPSIyNiIgZmlsbD0iIzExMSI+TVROPC90ZXh0Pjwvc3ZnPgo=",
  "airtel": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMjAgMTIwIj48Y2lyY2xlIGN4PSI2MCIgY3k9IjYwIiByPSI2MCIgZmlsbD0iI0U0MDAyQiIvPjxwYXRoIGQ9Ik02MCAyNGMtMTEgMC0xOSA3LTE5IDE2IDAgNCAyIDcgNiA5IDUtNSAxMS04IDE4LTggOSAwIDE1IDUgMTcgMTEgMi0xNC02LTI4LTIyLTI4eiIgZmlsbD0iI2ZmZiIgb3BhY2l0eT0iLjk1Ii8+PHRleHQgeD0iNjAiIHk9Ijg0IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0iQXJpYWwsSGVsdmV0aWNhLHNhbnMtc2VyaWYiIGZvbnQtd2VpZ2h0PSI3MDAiIGZvbnQtc2l6ZT0iMjMiIGZpbGw9IiNmZmYiPmFpcnRlbDwvdGV4dD48L3N2Zz4K",
  "9mobile": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMjAgMTIwIj48Y2lyY2xlIGN4PSI2MCIgY3k9IjYwIiByPSI2MCIgZmlsbD0iIzFCMUIxQiIvPjx0ZXh0IHg9IjYwIiB5PSI2OCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1mYW1pbHk9IkFyaWFsLEhlbHZldGljYSxzYW5zLXNlcmlmIiBmb250LXdlaWdodD0iOTAwIiBmb250LXNpemU9IjY0IiBmaWxsPSIjQjVEMzM0Ij45PC90ZXh0Pjx0ZXh0IHg9IjYwIiB5PSI5NSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1mYW1pbHk9IkFyaWFsLEhlbHZldGljYSxzYW5zLXNlcmlmIiBmb250LXdlaWdodD0iNzAwIiBmb250LXNpemU9IjE3IiBmaWxsPSIjZmZmIj5tb2JpbGU8L3RleHQ+PC9zdmc+Cg==",
  "glo": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMjAgMTIwIj48Y2lyY2xlIGN4PSI2MCIgY3k9IjYwIiByPSI2MCIgZmlsbD0iI0I3RTMwMCIvPjxjaXJjbGUgY3g9IjYwIiBjeT0iNjAiIHI9IjUwIiBmaWxsPSIjMkU5RTJFIi8+PHRleHQgeD0iNjAiIHk9IjczIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0iQXJpYWwsSGVsdmV0aWNhLHNhbnMtc2VyaWYiIGZvbnQtd2VpZ2h0PSI5MDAiIGZvbnQtc2l6ZT0iNDAiIGZpbGw9IiNmZmYiPmdsbzwvdGV4dD48L3N2Zz4K",
};

const NETWORK_ORDER = ["mtn", "airtel", "9mobile", "glo"];

function networkBrand(key) {
  const k = String(key).toLowerCase();
  if (k.includes("mtn")) return { id: "mtn", bg: "#FFCC00", fg: "#111111", text: "MTN" };
  if (k.includes("airtel")) return { id: "airtel", bg: "#E4002B", fg: "#FFFFFF", text: "airtel" };
  if (k.includes("9mobile") || k.includes("etisalat")) return { id: "9mobile", bg: "#1B1B1B", fg: "#C5E500", text: "9mobile" };
  if (k.includes("glo")) return { id: "glo", bg: "#50B848", fg: "#FFFFFF", text: "glo" };
  return { id: k, bg: "#E4ECFF", fg: "#1F57E7", text: String(key).slice(0, 4).toUpperCase() };
}

function dataTypeLabel(raw) {
  const r = String(raw || "").trim();
  if (!r) return "Data";
  const mapped = DATA_TYPE_LABELS[r.toLowerCase()];
  if (mapped) return mapped;
  return r.length <= 4 ? r.toUpperCase() : r[0].toUpperCase() + r.slice(1).toLowerCase();
}

function normalizePhone(raw) {
  let d = String(raw || "").replace(/\D/g, "");
  if (d.startsWith("234") && d.length >= 13) d = "0" + d.slice(3);
  else if (d.length === 10) d = "0" + d;
  return d.slice(0, 11);
}

async function renderBuyDataScreen() {
  app.innerHTML = topBar("Buy Data Bundle") + `<div class="center-pad">Loading networks…</div>`;

  const [markupPct, providers, { data: overrides }] = await Promise.all([
    getMarkup("data"),
    getProviderList("data"),
    sb.from("plan_price_overrides").select("plan_code, custom_price").eq("service_type", "data"),
  ]);
  const overrideMap = Object.fromEntries((overrides || []).map((o) => [o.plan_code, Number(o.custom_price)]));

  // Group every service_id under its network (MTN / Airtel / 9mobile / Glo)
  const groups = {};
  for (const p of providers) {
    const net = String(pick(p, ["network_name", "network", "name"], "unknown")).toLowerCase();
    const sid = pick(p, ["service_id", "id"], "");
    const dtype = pick(p, ["data_type", "plan_type", "category"], "");
    if (!groups[net]) groups[net] = [];
    if (!groups[net].some((t) => String(t.service_id) === String(sid))) groups[net].push({ service_id: sid, data_type: dtype });
  }
  const networkKeys = Object.keys(groups).sort((a, b) => {
    const ia = NETWORK_ORDER.indexOf(networkBrand(a).id), ib = NETWORK_ORDER.indexOf(networkBrand(b).id);
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
  });
  if (!networkKeys.length) {
    app.innerHTML = topBar("Buy Data Bundle") + `<div class="empty-state">No networks returned — check VTUGATE_API_KEY</div>`;
    return;
  }

  let net = networkKeys[0];
  let typeIdx = 0;
  let plans = [];          // plans currently shown
  let selectedPlan = null; // { service_id, plan_code, plan_name, amount, sell }
  let loadToken = 0;
  const planCache = {};    // service_id -> raw plan list

  app.innerHTML = topBar("Buy Data Bundle") + `
    <div class="bd-wrap">
      <div class="bd-label" style="margin-top:8px;">Recipient Phone Number</div>
      <div class="bd-phone">
        ${icon("smartphone", 22)}
        <input type="tel" id="data-phone" inputmode="numeric" maxlength="11" placeholder="e.g. 08012345678" autocomplete="off" />
        <button type="button" class="bd-contacts" id="data-contacts-btn" aria-label="Pick from contacts">${icon("contact", 24)}</button>
      </div>

      <div class="bd-label">Select Network Provider</div>
      <div class="bd-networks" id="data-networks"></div>

      <div class="bd-label">Select Data Type</div>
      <div class="bd-types" id="data-types"></div>

      <div class="bd-label">Select Data Bundle Plan</div>
      <div class="bd-plans" id="data-plans-list"></div>

      <div class="bd-price"><span>Selected Plan Price</span><b id="data-price">—</b></div>
      <div id="data-error" class="error-text"></div>
      ${state.profile?.is_admin ? `<p style="padding:10px 0 0;"><a href="javascript:void(0)" onclick="debugFetchRaw('data')" style="font-size:11px;color:var(--text-muted);">${icon("wrench", 12)} Admin: view raw provider data</a></p>` : ""}
    </div>
    <div class="bd-footer"><button type="button" class="bd-proceed" id="data-continue-btn" disabled>Proceed to Purchase</button></div>
  `;

  const phoneEl = document.getElementById("data-phone");
  const btn = document.getElementById("data-continue-btn");
  const errEl = document.getElementById("data-error");

  function syncButton() {
    const phoneOk = /^0\d{10}$/.test(phoneEl.value);
    btn.disabled = !(phoneOk && selectedPlan);
  }

  function renderNetworks() {
    document.getElementById("data-networks").innerHTML = networkKeys.map((k) => {
      const b = networkBrand(k);
      return `
        <button type="button" class="bd-net ${k === net ? "active" : ""}" data-net="${esc(k)}" aria-label="${esc(k)}">
          <img src="${NETWORK_LOGOS[b.id] || ''}" alt="${esc(b.text)}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'" />
          <div class="bd-fb" style="background:${b.bg};color:${b.fg};">${esc(b.text)}</div>
          <span class="bd-tick">${icon("check", 13)}</span>
        </button>`;
    }).join("");
    document.querySelectorAll(".bd-net").forEach((el) => {
      el.onclick = () => {
        if (el.dataset.net === net) return;
        net = el.dataset.net; typeIdx = 0;
        renderNetworks(); renderTypes(); loadPlans();
      };
    });
  }

  function renderTypes() {
    const types = groups[net] || [];
    document.getElementById("data-types").innerHTML = types.map((t, i) => `
      <button type="button" class="bd-type ${i === typeIdx ? "active" : ""}" data-idx="${i}">
        ${i === typeIdx ? icon("check", 16) : ""}<span>${esc(dataTypeLabel(t.data_type))}</span>
      </button>`).join("");
    document.querySelectorAll(".bd-type").forEach((el) => {
      el.onclick = () => {
        const i = Number(el.dataset.idx);
        if (i === typeIdx) return;
        typeIdx = i; renderTypes(); loadPlans();
      };
    });
  }

  function setSelected(p) {
    selectedPlan = p;
    document.getElementById("data-price").textContent = p ? naira0(p.sell) : "—";
    document.querySelectorAll(".bd-plan").forEach((el) => el.classList.toggle("active", p && el.dataset.code === String(p.plan_code)));
    errEl.textContent = "";
    syncButton();
  }

  async function loadPlans() {
    const token = ++loadToken;
    const svc = groups[net][typeIdx];
    const list = document.getElementById("data-plans-list");
    plans = []; setSelected(null);
    list.innerHTML = `<div class="bd-msg">Loading plans…</div>`;

    let raw = planCache[svc.service_id];
    if (!raw) {
      const res = await callFunction("vtugate-data-plans", { service_id: svc.service_id });
      raw = extractList(res);
      if (raw.length) planCache[svc.service_id] = raw;
    }
    if (token !== loadToken) return; // user switched network/type meanwhile

    plans = raw.map((p, i) => {
      const amount = Number(pick(p, ["amount", "price", "variation_amount", "data_amount"], 0));
      const code = pick(p, ["plan_code", "code", "variation_code", "id"], "");
      return {
        service_id: svc.service_id, plan_code: code, amount,
        plan_name: pick(p, ["name", "plan_name", "data_plan", "variation_name"], `Plan ${i + 1}`),
        sell: overrideMap[code] ?? Math.ceil(amount * (1 + markupPct / 100)),
      };
    });

    if (!plans.length) { list.innerHTML = `<div class="bd-msg">No plans available for this network yet</div>`; return; }

    list.innerHTML = plans.map((p, i) => `
      <button type="button" class="bd-plan" data-i="${i}" data-code="${esc(p.plan_code)}">
        <div class="n">${esc(p.plan_name)}</div>
        <div class="p">${naira0(p.sell)}</div>
      </button>`).join("");
    document.querySelectorAll(".bd-plan").forEach((el) => {
      el.onclick = () => setSelected(plans[Number(el.dataset.i)]);
    });
  }

  // phone input: digits only, max 11
  phoneEl.addEventListener("input", () => {
    const clean = phoneEl.value.replace(/\D/g, "").slice(0, 11);
    if (clean !== phoneEl.value) phoneEl.value = clean;
    errEl.textContent = "";
    syncButton();
  });

  // contacts picker (Chrome on Android); falls back gracefully elsewhere
  document.getElementById("data-contacts-btn").onclick = async () => {
    if (!("contacts" in navigator) || !("ContactsManager" in window)) { toast("Contact picker is not supported on this device"); return; }
    try {
      const picked = await navigator.contacts.select(["tel"], { multiple: false });
      const raw = picked?.[0]?.tel?.[0];
      if (!raw) return;
      phoneEl.value = normalizePhone(raw);
      syncButton();
    } catch (_) { /* user cancelled */ }
  };

  btn.onclick = async () => {
    if (!selectedPlan) { errEl.textContent = "Select a plan"; return; }
    const phone_number = phoneEl.value;
    if (!/^0\d{10}$/.test(phone_number)) { errEl.textContent = "Enter a valid 11-digit phone number"; return; }
    const pin = await askForPin(`${esc(selectedPlan.plan_name)} — ${naira0(selectedPlan.sell)}`);
    if (!pin) return;

    btn.disabled = true; showLoader();
    const result = await callFunction("vtugate-secure-buy-data", {
      service_id: selectedPlan.service_id, network: net, phone_number,
      plan_code: selectedPlan.plan_code, plan_name: selectedPlan.plan_name,
      provider_amount: selectedPlan.amount, pin,
    });
    hideLoader(); syncButton();

    if (!result.status) { errEl.textContent = result.message || "Transaction failed"; return; }
    toast("Successful!");
    await refreshWallet();
    go("#/transactions");
  };

  renderNetworks();
  renderTypes();
  await loadPlans();
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
      ${state.profile?.is_admin ? `<p style="padding:0 16px 10px;"><a href="javascript:void(0)" onclick="debugFetchRaw('${type}')" style="font-size:11px;color:var(--text-muted);">${icon("wrench", 12)} Admin: view raw provider data</a></p>` : ""}

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
      ${state.profile?.is_admin && type === "data" ? `<p style="padding:0 16px 10px;"><a href="javascript:void(0)" onclick="debugDataPlans()" style="font-size:11px;color:var(--text-muted);">${icon("wrench", 12)} Admin: view raw data-plans response</a></p>` : ""}
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
      document.getElementById("svc-verify-result").innerHTML = `<div class="card" style="display:flex;align-items:center;gap:8px;"><span style="color:var(--success);display:flex;">${icon("check-circle", 20)}</span> ${esc(customerName)}</div>`;
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
    toast("Successful!");
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
    toast(`Wallet funded! New balance: ${naira(res.new_balance)}`);
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
    toast("Withdrawal request submitted");
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
      toast(`Converted! ${naira(res.cash_amount)} added to your wallet`);
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
      <div class="form-group" style="margin-top:10px;"><button class="btn btn-outline-dark btn-block" onclick="go('#/admin-prices')">${icon("list", 18)} Set Individual Data Plan Prices</button></div>
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
    toast("Settings saved");
  };
}

async function adminAction(action, target_user_id, extra = {}) {
  const res = await callFunction("admin-manage-customer", { action, target_user_id, ...extra });
  toast(res.message || (res.status ? "Done" : "Failed"));
  if (res.status) renderAdmin();
}

async function completeWithdrawal(withdrawalId) {
  if (!confirm("Confirm you've sent this money to the customer's bank account?")) return;
  const { error } = await sb.from("withdrawal_requests").update({ status: "completed" }).eq("id", withdrawalId);
  if (error) { toast("Failed to update: " + error.message); return; }
  toast("Marked as paid");
  renderAdmin();
}

function openCustomerActions(userId, name, balance) {
  modalRoot.innerHTML = `
    <div class="modal-backdrop" onclick="if(event.target===this) closeModal()">
      <div class="modal-sheet">
        <div class="close-x" onclick="closeModal()">${icon("x", 20)}</div>
        <h3 style="margin:0 0 4px;">${name || "Customer"}</h3>
        <p style="color:var(--text-muted);font-size:13px;margin:0 0 16px;">Balance: ${naira(balance)}</p>

        <div class="form-group"><button class="btn btn-outline-dark btn-block" onclick="adminAction('suspend','${userId}',{suspended:true}); closeModal();">${icon("ban", 18)} Suspend Account</button></div>
        <div class="form-group"><button class="btn btn-outline-dark btn-block" onclick="adminAction('suspend','${userId}',{suspended:false}); closeModal();">${icon("check-circle", 18)} Unsuspend Account</button></div>

        <div class="form-group">
          <label>Change Password</label>
          <input type="password" id="ca-newpass" placeholder="New password (min 6 chars)" />
        </div>
        <div class="form-group"><button class="btn btn-outline-dark btn-block" onclick="adminAction('change_password','${userId}',{new_password:document.getElementById('ca-newpass').value}); closeModal();">${icon("key", 18)} Update Password</button></div>

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
  toast("Booking confirmed");
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
  toast(error ? "Failed to save" : "Price saved");
}

async function deleteOverridePrice(planCode, btn) {
  await sb.from("plan_price_overrides").delete().eq("service_type", "data").eq("plan_code", planCode);
  toast("Reverted to default pricing");
  document.getElementById("ap-network").onchange();
}
