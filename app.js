// ---------- Supabase setup ----------
const SUPABASE_URL = 'https://vcexczhmvtawldjgldob.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_Pa0ZBzzEP0VdKLx8sDGafQ_BVKGoXK8';

const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ---------- Global state ----------
const state = {
  view: 'login',
  history: [],
  user: null,
  name: 'there',
  fullName: '',
  phoneNumber: '',
  balance: 0,
  showBalance: true,
  notice: '',
  loading: true,

  dp: freshDp(),
  at: freshAt(),
  tv: freshTv(),
  elec: freshElec(),
  wd: freshWd(),
  ac: freshAc(),
  edu: freshEdu(),
  referralCode: null,
  profileEdit: freshProfileEdit(),
  pwChange: freshPasswordChange(),
};

function freshProfileEdit() {
  return { fullName: '', phone: '', saving: false, notice: '' };
}
function freshPasswordChange() {
  return { newPassword: '', confirmPassword: '', saving: false, notice: '' };
}

function freshDp() {
  return {
    networks: [], loadingNetworks: true,
    selectedNetwork: '', selectedDataType: '', selectedServiceId: null,
    plans: [], loadingPlans: false, planNotice: '',
    selectedPlan: null, phone: '', pin: '', submitting: false, notice: '', done: false,
  };
}
function freshAt() {
  return {
    networks: [], loadingNetworks: true,
    selectedNetwork: '', selectedServiceId: null,
    phone: '', amount: '', pin: '', submitting: false, notice: '', done: false,
  };
}
function freshTv() {
  return {
    providers: [], loadingProviders: true,
    selectedProvider: '', selectedServiceId: null,
    smartcard: '', phone: '', verifying: false, verified: null, // {smartcard_name, cable_plans}
    selectedPlan: null, pin: '', submitting: false, notice: '', done: false,
  };
}
function freshElec() {
  return {
    discos: [], loadingDiscos: true,
    selectedDisco: '', selectedServiceId: null,
    meterNo: '', phone: '', verifying: false, verified: null, // {customer_name}
    amount: '', pin: '', submitting: false, notice: '', done: false,
  };
}
const NIGERIAN_BANKS = [
  { name: 'Access Bank', code: '044' },
  { name: 'Citibank Nigeria', code: '023' },
  { name: 'Ecobank Nigeria', code: '050' },
  { name: 'Fidelity Bank', code: '070' },
  { name: 'First Bank of Nigeria', code: '011' },
  { name: 'First City Monument Bank', code: '214' },
  { name: 'Globus Bank', code: '00103' },
  { name: 'Guaranty Trust Bank', code: '058' },
  { name: 'Heritage Bank', code: '030' },
  { name: 'Keystone Bank', code: '082' },
  { name: 'Kuda Bank', code: '50211' },
  { name: 'Moniepoint MFB', code: '50515' },
  { name: 'Opay', code: '999992' },
  { name: 'Palmpay', code: '999991' },
  { name: 'Polaris Bank', code: '076' },
  { name: 'Providus Bank', code: '101' },
  { name: 'Stanbic IBTC Bank', code: '221' },
  { name: 'Standard Chartered Bank', code: '068' },
  { name: 'Sterling Bank', code: '232' },
  { name: 'Union Bank of Nigeria', code: '032' },
  { name: 'United Bank For Africa', code: '033' },
  { name: 'Unity Bank', code: '215' },
  { name: 'Wema Bank', code: '035' },
  { name: 'Zenith Bank', code: '057' },
];

function freshWd() {
  return {
    amount: '', bankCode: '', bankName: '', accountNumber: '', accountName: '',
    verifying: false, verified: false,
    pin: '', submitting: false, notice: '', done: false,
  };
}
function freshAc() {
  return {
    network: '', amount: '', senderNumber: '',
    submitting: false, notice: '', done: false,
  };
}
function freshEdu() {
  return {
    types: [], loadingTypes: true,
    selectedType: '', selectedServiceId: null,
    loadingPrice: false, unitPrice: null,
    quantity: 1, phone: '', pin: '', submitting: false, notice: '', done: false,
  };
}

const root = document.getElementById('app');

function setState(patch) { Object.assign(state, patch); render(); }
function setDp(patch) { Object.assign(state.dp, patch); render(); }
function setAt(patch) { Object.assign(state.at, patch); render(); }
function setTv(patch) { Object.assign(state.tv, patch); render(); }
function setElec(patch) { Object.assign(state.elec, patch); render(); }
function setWd(patch) { Object.assign(state.wd, patch); render(); }
function setAc(patch) { Object.assign(state.ac, patch); render(); }
function setEdu(patch) { Object.assign(state.edu, patch); render(); }

// ---------- Helpers ----------
function money(n) {
  return '₦' + Number(n || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 });
}

function icon(name, size = 20) {
  const icons = {
    wifi: `<path d="M5 12.5a11 11 0 0 1 14 0"/><path d="M8.5 16a6 6 0 0 1 7 0"/><circle cx="12" cy="19" r="1"/>`,
    phone: `<rect x="6" y="2" width="12" height="20" rx="2"/><line x1="11" y1="18" x2="13" y2="18"/>`,
    tv: `<rect x="3" y="6" width="18" height="13" rx="2"/><line x1="8" y1="22" x2="16" y2="22"/>`,
    zap: `<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>`,
    grad: `<path d="M22 10 12 5 2 10l10 5 10-5Z"/><path d="M6 12v5c0 1.5 3 3 6 3s6-1.5 6-3v-5"/>`,
    users: `<circle cx="9" cy="8" r="3"/><path d="M2 20c0-3 3-5 7-5s7 2 7 5"/><circle cx="17" cy="9" r="2.5"/><path d="M22 20c0-2.2-1.7-4-4-4.6"/>`,
    refresh: `<polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.5 9a9 9 0 0 1 15-4l4 4M20.5 15a9 9 0 0 1-15 4l-4-4"/>`,
    plus: `<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>`,
    banknote: `<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2"/>`,
    eye: `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z"/><circle cx="12" cy="12" r="3"/>`,
    eyeOff: `<path d="M17.9 17.9A10.9 10.9 0 0 1 12 20c-7 0-11-8-11-8a20.6 20.6 0 0 1 5-5.9M9.9 4.2A9.6 9.6 0 0 1 12 4c7 0 11 8 11 8a20.9 20.9 0 0 1-3.2 4.4M14.1 14.1a3 3 0 1 1-4.2-4.2"/><line x1="2" y1="2" x2="22" y2="22"/>`,
    menu: `<line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>`,
    user: `<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-7 8-7s8 3 8 7"/>`,
    chevron: `<polyline points="9 18 15 12 9 6"/>`,
    receipt: `<path d="M5 2h14v20l-3-2-2 2-2-2-2 2-2-2-3 2Z"/><line x1="8" y1="7" x2="16" y2="7"/><line x1="8" y1="11" x2="16" y2="11"/>`,
    shield: `<path d="M12 2 4 5v6c0 5 3.4 8.7 8 11 4.6-2.3 8-6 8-11V5Z"/><polyline points="9 12 11 14 15 10"/>`,
    gauge: `<path d="M12 2a10 10 0 1 0 10 10"/><path d="M12 12 17 7"/><path d="M12 2v3"/>`,
    history: `<polyline points="1 4 1 10 7 10"/><path d="M3.5 15a9 9 0 1 0 2-9.9L1 10"/>`,
    arrowLeft: `<line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>`,
    arrowRight: `<line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>`,
    whatsapp: `<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>`,
    copy: `<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>`,
  };
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${icons[name] || ''}</svg>`;
}

const services = [
  { key: 'data', title: 'Buy Data', ic: 'wifi', tone: 'green', desc: 'MTN, Airtel, Glo & 9mobile' },
  { key: 'airtime', title: 'Airtime', ic: 'phone', tone: 'purple', desc: 'All major Nigerian networks' },
  { key: 'tv', title: 'TV Subscription', ic: 'tv', tone: 'blue', desc: 'DStv, GOtv & Startimes' },
  { key: 'electricity', title: 'Electricity/Bills', ic: 'zap', tone: 'orange', desc: 'Meter & bill payments' },
];

const moreServices = [
  { key: 'edu-pin', title: 'Edu PIN', ic: 'grad', tone: 'blue', desc: 'WAEC, NECO, NABTEB & JAMB' },
  { key: 'airtime-cash', title: 'Airtime to Cash', ic: 'refresh', tone: 'orange', desc: 'Convert eligible airtime to wallet value' },
  { key: 'referral', title: 'My Referral', ic: 'users', tone: 'purple', desc: 'Invite friends and earn' },
  { key: 'withdrawal', title: 'Withdraw', ic: 'banknote', tone: 'green', desc: 'Withdraw wallet balance to your bank' },
  { key: 'fund', title: 'Fund Wallet', ic: 'plus', tone: 'green', desc: 'Add money to your wallet' },
  { key: 'customer-care', title: 'Customer Care', ic: 'whatsapp', tone: 'green', desc: 'Chat with us on WhatsApp' },
];

function logoHTML(compact) {
  return `
    <div class="brand ${compact ? 'brand-compact' : ''}">
      <img src="icon-192.png" alt="ALFARUQ" style="width:${compact ? 34 : 48}px;height:${compact ? 34 : 48}px;border-radius:12px;" />
      ${compact ? '' : `<div><div class="brand-name">ALFARUQ</div><div class="brand-sub">DATA SERVICE</div></div>`}
    </div>`;
}

// ---------- Auth ----------
async function initAuth() {
  const { data } = await sb.auth.getSession();
  state.user = data.session?.user || null;

  sb.auth.onAuthStateChange((_event, session) => {
    state.user = session?.user || null;
    if (state.user) { state.view = 'home'; loadProfile(); }
    else { state.view = 'login'; render(); }
  });

  state.loading = false;

  if (state.user) { state.view = 'home'; await loadProfile(); }
  else { render(); }
}

async function loadProfile() {
  if (!state.user) return;

  const { data: profile } = await sb
    .from('profiles').select('full_name, phone, referral_code').eq('id', state.user.id).maybeSingle();

  if (profile?.full_name) { state.name = profile.full_name.split(' ')[0]; state.fullName = profile.full_name; }
  if (profile?.phone) state.phoneNumber = profile.phone;
  if (profile?.referral_code) state.referralCode = profile.referral_code;

  const { data: wallet } = await sb
    .from('wallets').select('balance').eq('user_id', state.user.id).maybeSingle();

  if (wallet?.balance !== undefined) state.balance = Number(wallet.balance);

  render();
}

function getReferralCodeFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get('ref');
}

async function login(email, password) {
  if (!email || !password) return setState({ notice: 'Enter your email and password.' });
  setState({ loading: true });
  const { error } = await sb.auth.signInWithPassword({ email, password });
  setState({ loading: false, notice: error ? error.message : '' });
}

async function register(fullName, phone, email, password, confirmPassword) {
  if (!fullName || !phone || !email || password.length < 6 || password !== confirmPassword) {
    return setState({ notice: 'Complete all fields and make sure both passwords match.' });
  }

  setState({ loading: true });

  const { data, error } = await sb.auth.signUp({
    email, password,
    options: { data: { full_name: fullName, phone }, emailRedirectTo: window.location.origin },
  });

  setState({ loading: false });

  if (error) return setState({ notice: error.message });

  if (data.user) {
    const myCode = 'ALF' + data.user.id.slice(0, 6).toUpperCase();
    const referredCode = getReferralCodeFromUrl();
    let referredBy = null;

    if (referredCode) {
      const { data: refProfile } = await sb
        .from('profiles').select('id').eq('referral_code', referredCode).maybeSingle();
      if (refProfile) referredBy = refProfile.id;
    }

    await sb.from('profiles').upsert({
      id: data.user.id, full_name: fullName, phone,
      referral_code: myCode, referred_by: referredBy,
    });
    await sb.from('wallets').upsert({ user_id: data.user.id, balance: 0 });

    setState({ notice: 'Account created. Check your email if confirmation is enabled.' });
  }
}

async function logout() {
  await sb.auth.signOut();
  setState({ user: null, view: 'login' });
}

async function forgotPassword(email) {
  if (!email) return setState({ notice: 'Enter your email address.' });
  const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
  setState({ notice: error ? error.message : 'Password reset instructions sent if the email is registered.' });
}

// ---------- Shared: fetch services for a given type ----------
async function fetchServiceList(serviceType) {
  const { data, error } = await sb.functions.invoke('vtugate-fetch-services', {
    body: { service_type: serviceType },
  });
  if (error || !data?.status) return null;
  return data.data || [];
}

// ---------- Data purchase flow ----------
async function loadNetworks() {
  setDp({ loadingNetworks: true });
  const list = await fetchServiceList('data');
  if (!list) return setDp({ loadingNetworks: false, notice: 'Could not load networks. Pull down to retry.' });
  setDp({ networks: list, loadingNetworks: false });
}

function uniqueNetworkNames() {
  return [...new Set(state.dp.networks.map((n) => n.network_name))];
}
function dataTypesForNetwork() {
  if (!state.dp.selectedNetwork) return [];
  return [...new Set(state.dp.networks
    .filter((n) => n.network_name?.toLowerCase() === state.dp.selectedNetwork.toLowerCase())
    .map((n) => n.data_type))];
}
function onPickNetwork(value) {
  setDp({ selectedNetwork: value, selectedDataType: '', selectedServiceId: null, plans: [], selectedPlan: null, planNotice: '' });
}
function onPickDataType(value) {
  const match = state.dp.networks.find((n) =>
    n.network_name?.toLowerCase() === state.dp.selectedNetwork.toLowerCase() && n.data_type === value);
  setDp({ selectedDataType: value, selectedPlan: null, plans: [] });
  if (match) { setDp({ selectedServiceId: match.service_id }); loadPlans(match.service_id); }
}
async function loadPlans(serviceId) {
  setDp({ loadingPlans: true, planNotice: '' });
  const { data, error } = await sb.functions.invoke('vtugate-data-plans', { body: { service_id: serviceId } });
  if (error || !data?.status) return setDp({ loadingPlans: false, planNotice: 'Could not load plans. Try a different network/type.' });
  const list = data.data?.data_plans || [];
  if (!data.data?.provider_status || list.length === 0) {
    return setDp({ loadingPlans: false, plans: [], planNotice: 'No plans available right now — please try again later or contact support.' });
  }
  setDp({ loadingPlans: false, plans: list });
}
function onPickPlan(code) {
  const plan = state.dp.plans.find((p) => String(p.code) === code);
  if (!plan || state.dp.selectedServiceId === null) return;
  setDp({ selectedPlan: { service_id: state.dp.selectedServiceId, code: String(plan.code), price: Number(plan.price), name: plan.name } });
}
async function submitDataPurchase() {
  setDp({ notice: '' });
  const { phone, pin, selectedPlan, selectedNetwork } = state.dp;

  if (!phone || phone.length < 10) return setDp({ notice: 'Enter a valid phone number.' });
  if (!selectedPlan) return setDp({ notice: 'Select a data plan first.' });
  if (!/^\d{4}$/.test(pin)) return setDp({ notice: 'Enter your 4-digit payment PIN.' });

  setDp({ submitting: true });

  const { data, error } = await sb.functions.invoke('vtugate-secure-buy-data', {
    body: {
      service_id: selectedPlan.service_id, phone_number: phone, amount: selectedPlan.price,
      plan_code: selectedPlan.code, network: selectedNetwork, plan_name: selectedPlan.name, pin,
    },
  });

  if (error || !data?.status) return setDp({ submitting: false, notice: data?.message || 'Data purchase failed. Please try again.' });

  state.balance = data.new_balance;
  setDp({ submitting: false, done: true });
}
function resetDataForm() { state.dp = freshDp(); }

// ---------- Airtime purchase flow ----------
async function loadAtNetworks() {
  setAt({ loadingNetworks: true });
  const list = await fetchServiceList('airtime');
  if (!list) return setAt({ loadingNetworks: false, notice: 'Could not load networks.' });
  setAt({ networks: list, loadingNetworks: false });
}
function onPickAtNetwork(value) {
  const match = state.at.networks.find((n) => n.network_name?.toLowerCase() === value.toLowerCase());
  setAt({ selectedNetwork: value, selectedServiceId: match ? match.service_id : null });
}
async function submitAirtimePurchase() {
  setAt({ notice: '' });
  const { phone, amount, pin, selectedServiceId, selectedNetwork } = state.at;

  if (!phone || phone.length < 10) return setAt({ notice: 'Enter a valid phone number.' });
  if (!selectedServiceId) return setAt({ notice: 'Choose a network.' });
  if (!amount || Number(amount) < 50) return setAt({ notice: 'Enter an amount (minimum ₦50).' });
  if (!/^\d{4}$/.test(pin)) return setAt({ notice: 'Enter your 4-digit payment PIN.' });

  setAt({ submitting: true });

  const { data, error } = await sb.functions.invoke('vtugate-secure-buy-airtime', {
    body: { service_id: selectedServiceId, phone_number: phone, amount: Number(amount), network: selectedNetwork, pin },
  });

  if (error || !data?.status) return setAt({ submitting: false, notice: data?.message || 'Airtime purchase failed.' });

  state.balance = data.new_balance;
  setAt({ submitting: false, done: true });
}
function resetAirtimeForm() { state.at = freshAt(); }

// ---------- TV purchase flow ----------
async function loadTvProviders() {
  setTv({ loadingProviders: true });
  const list = await fetchServiceList('tv');
  if (!list) return setTv({ loadingProviders: false, notice: 'Could not load TV providers.' });
  setTv({ providers: list, loadingProviders: false });
}
function onPickTvProvider(value) {
  const match = state.tv.providers.find((n) => n.network_name?.toLowerCase() === value.toLowerCase());
  setTv({ selectedProvider: value, selectedServiceId: match ? match.service_id : null, verified: null, selectedPlan: null });
}
async function verifySmartcard() {
  setTv({ notice: '' });
  const { selectedServiceId, smartcard, phone } = state.tv;
  if (!selectedServiceId) return setTv({ notice: 'Choose a TV provider first.' });
  if (!smartcard || smartcard.length < 5) return setTv({ notice: 'Enter a valid smartcard/IUC number.' });
  if (!phone || phone.length < 10) return setTv({ notice: 'Enter a valid phone number.' });

  setTv({ verifying: true });

  const { data, error } = await sb.functions.invoke('vtugate-verify-cabletv', {
    body: { service_id: selectedServiceId, phone, smartcard_number: smartcard },
  });

  if (error || !data?.status || !data.data?.provider_status) {
    return setTv({ verifying: false, notice: data?.message || 'Could not verify this smartcard number.' });
  }

  setTv({ verifying: false, verified: data.data });
}
function onPickTvPlan(code) {
  const plan = state.tv.verified?.cable_plans?.find((p) => String(p.code) === code);
  if (!plan) return;
  setTv({ selectedPlan: plan });
}
async function submitTvPurchase() {
  setTv({ notice: '' });
  const { selectedServiceId, smartcard, phone, selectedPlan, pin } = state.tv;

  if (!selectedPlan) return setTv({ notice: 'Select a subscription plan.' });
  if (!/^\d{4}$/.test(pin)) return setTv({ notice: 'Enter your 4-digit payment PIN.' });

  setTv({ submitting: true });

  const { data, error } = await sb.functions.invoke('vtugate-secure-buy-cabletv', {
    body: {
      service_id: selectedServiceId, phone, smartcard_number: smartcard,
      amount: selectedPlan.price, plan_code: selectedPlan.code, plan_name: selectedPlan.name, pin,
    },
  });

  if (error || !data?.status) return setTv({ submitting: false, notice: data?.message || 'TV subscription failed.' });

  state.balance = data.new_balance;
  setTv({ submitting: false, done: true });
}
function resetTvForm() { state.tv = freshTv(); }

// ---------- Electricity purchase flow ----------
async function loadDiscos() {
  setElec({ loadingDiscos: true });
  const list = await fetchServiceList('electricity');
  if (!list) return setElec({ loadingDiscos: false, notice: 'Could not load electricity providers.' });
  setElec({ discos: list, loadingDiscos: false });
}
function onPickDisco(value) {
  const match = state.elec.discos.find((n) => n.network_name?.toLowerCase() === value.toLowerCase());
  setElec({ selectedDisco: value, selectedServiceId: match ? match.service_id : null, verified: null });
}
async function verifyMeter() {
  setElec({ notice: '' });
  con
