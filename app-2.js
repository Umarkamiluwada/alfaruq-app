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
      ${compact ? '' : `<div><div class="brand-name">Alfaruq</div><div class="brand-sub">data</div></div>`}
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
  const { selectedServiceId, selectedDisco, meterNo } = state.elec;
  if (!selectedServiceId) return setElec({ notice: 'Choose your electricity provider (disco) first.' });
  if (!meterNo || meterNo.length < 5) return setElec({ notice: 'Enter a valid meter number.' });

  setElec({ verifying: true });

  const { data, error } = await sb.functions.invoke('vtugate-verify-electricity', {
    body: { service_id: selectedServiceId, meter_no: meterNo, disco: selectedDisco },
  });

  if (error || !data?.status || !data.data?.provider_status) {
    return setElec({ verifying: false, notice: data?.message || 'Could not verify this meter number.' });
  }

  setElec({ verifying: false, verified: data.data });
}
async function submitElectricityPurchase() {
  setElec({ notice: '' });
  const { selectedServiceId, selectedDisco, meterNo, phone, amount, pin, verified } = state.elec;

  if (!verified) return setElec({ notice: 'Verify your meter number first.' });
  if (!phone || phone.length < 10) return setElec({ notice: 'Enter a valid phone number.' });
  if (!amount || Number(amount) < 500) return setElec({ notice: 'Enter an amount (minimum ₦500).' });
  if (!/^\d{4}$/.test(pin)) return setElec({ notice: 'Enter your 4-digit payment PIN.' });

  setElec({ submitting: true });

  const { data, error } = await sb.functions.invoke('vtugate-secure-buy-electricity', {
    body: { service_id: selectedServiceId, meter_no: meterNo, disco: selectedDisco, amount: Number(amount), phone_number: phone, pin },
  });

  if (error || !data?.status) return setElec({ submitting: false, notice: data?.message || 'Electricity purchase failed.' });

  state.balance = data.new_balance;
  setElec({ submitting: false, done: true, verified: { ...verified, token: data.data?.token } });
}
function resetElecForm() { state.elec = freshElec(); }

// ---------- Withdrawal ----------
function loadBanksIfNeeded() { /* static list, nothing to fetch */ }

function onPickBank(code) {
  const bank = NIGERIAN_BANKS.find((b) => b.code === code);
  setWd({ bankCode: code, bankName: bank ? bank.name : '', accountName: '', verified: false });
}

let verifyAccountTimeout = null;
function onAccountNumberInput(value) {
  setWd({ accountNumber: value, accountName: '', verified: false });

  clearTimeout(verifyAccountTimeout);
  if (value.length !== 10 || !state.wd.bankCode) return;

  verifyAccountTimeout = setTimeout(() => verifyAccount(), 500);
}

async function verifyAccount() {
  const { accountNumber, bankCode } = state.wd;
  if (accountNumber.length !== 10 || !bankCode) return;

  setWd({ verifying: true, notice: '' });

  const { data, error } = await sb.functions.invoke('paystack-resolve-account', {
    body: { account_number: accountNumber, bank_code: bankCode },
  });

  if (error || !data?.status) {
    return setWd({ verifying: false, verified: false, notice: data?.message || 'Could not verify this account number.' });
  }

  setWd({ verifying: false, verified: true, accountName: data.account_name });
}

async function submitWithdrawal() {
  setWd({ notice: '' });
  const { amount, bankName, accountNumber, accountName, verified, pin } = state.wd;

  if (!amount || Number(amount) < 100) return setWd({ notice: 'Minimum withdrawal is ₦100.' });
  if (!bankName || !accountNumber || !verified || !accountName) return setWd({ notice: 'Select your bank and enter a valid account number to verify.' });
  if (!/^\d{4}$/.test(pin)) return setWd({ notice: 'Enter your 4-digit payment PIN.' });

  setWd({ submitting: true });

  const { data, error } = await sb.functions.invoke('wallet-request-withdrawal', {
    body: { amount: Number(amount), bank_name: bankName, account_number: accountNumber, account_name: accountName, pin },
  });

  if (error || !data?.status) return setWd({ submitting: false, notice: data?.message || 'Withdrawal request failed.' });

  state.balance = data.new_balance;
  setWd({ submitting: false, done: true });
}
function resetWdForm() { state.wd = freshWd(); }

// ---------- Airtime to Cash (manual review request) ----------
async function submitAirtimeCash() {
  setAc({ notice: '' });
  const { network, amount, senderNumber } = state.ac;

  if (!network) return setAc({ notice: 'Select the network.' });
  if (!amount || Number(amount) < 100) return setAc({ notice: 'Enter a valid amount.' });
  if (!senderNumber || senderNumber.length < 10) return setAc({ notice: 'Enter the phone number you sent airtime from.' });

  setAc({ submitting: true });

  const { error } = await sb.from('airtime_cash_requests').insert({
    user_id: state.user.id, network, amount: Number(amount), sender_number: senderNumber, status: 'pending',
  });

  if (error) return setAc({ submitting: false, notice: 'Could not submit request. Please try again.' });

  setAc({ submitting: false, done: true });
}
function resetAcForm() { state.ac = freshAc(); }

// ---------- Education PIN flow ----------
async function loadEduTypes() {
  setEdu({ loadingTypes: true });
  const list = await fetchServiceList('education');
  if (!list) return setEdu({ loadingTypes: false, notice: 'Could not load education types.' });
  setEdu({ types: list, loadingTypes: false });
}
async function onPickEduType(value) {
  const match = state.edu.types.find((n) => n.network_name?.toLowerCase() === value.toLowerCase());
  setEdu({ selectedType: value, selectedServiceId: match ? match.service_id : null, unitPrice: null });
  if (!match) return;

  setEdu({ loadingPrice: true });
  const { data, error } = await sb.functions.invoke('vtugate-education-price', { body: { service_id: match.service_id } });

  if (error || !data?.status) return setEdu({ loadingPrice: false, notice: 'Could not load price for this PIN.' });

  const price = Number(data.data?.price ?? data.price ?? 0);
  setEdu({ loadingPrice: false, unitPrice: price, notice: '' });
}
async function submitEduPurchase() {
  setEdu({ notice: '' });
  const { selectedServiceId, selectedType, unitPrice, quantity, phone, pin } = state.edu;

  if (!selectedServiceId) return setEdu({ notice: 'Select an exam type.' });
  if (!unitPrice) return setEdu({ notice: 'Price not loaded yet, please wait.' });
  if (!quantity || Number(quantity) < 1) return setEdu({ notice: 'Enter a valid quantity.' });
  if (!phone || phone.length < 10) return setEdu({ notice: 'Enter a valid phone number.' });
  if (!/^\d{4}$/.test(pin)) return setEdu({ notice: 'Enter your 4-digit payment PIN.' });

  setEdu({ submitting: true });

  const totalAmount = unitPrice * Number(quantity);

  const { data, error } = await sb.functions.invoke('vtugate-secure-buy-education', {
    body: {
      service_id: selectedServiceId, phone, quantity: Number(quantity),
      product_code: selectedType.toLowerCase(), amount: totalAmount, pin,
    },
  });

  if (error || !data?.status) return setEdu({ submitting: false, notice: data?.message || 'Education PIN purchase failed.' });

  state.balance = data.new_balance;
  setEdu({ submitting: false, done: true });
}
function resetEduForm() { state.edu = freshEdu(); }

// ---------- Fund wallet (Paystack) ----------
async function startFunding(amount) {
  if (!state.user || !amount || Number(amount) <= 0) return setState({ notice: 'Enter a valid amount.' });

  setState({ loading: true });

  const { data, error } = await sb.functions.invoke('paystack-payment', {
    body: { email: state.user.email, amount: Number(amount) },
  });

  setState({ loading: false });

  if (error || !data?.success) return setState({ notice: data?.message || 'Could not start payment.' });

  window.open(data.authorization_url, '_blank');
  setState({ notice: 'Complete your payment in the new tab, then come back and tap "Refresh balance".' });
}

// ---------- Navigation ----------
function go(view) {
  const topLevel = ['home', 'history', 'profile'];

  if (topLevel.includes(view)) {
    state.history = [];
  } else if (state.view && state.view !== view) {
    state.history.push(state.view);
  }

  if (view === 'data') { resetDataForm(); loadNetworks(); }
  if (view === 'airtime') { resetAirtimeForm(); loadAtNetworks(); }
  if (view === 'tv') { resetTvForm(); loadTvProviders(); }
  if (view === 'electricity') { resetElecForm(); loadDiscos(); }
  if (view === 'withdrawal') { resetWdForm(); loadBanksIfNeeded(); }
  if (view === 'airtime-cash') { resetAcForm(); }
  if (view === 'edu-pin') { resetEduForm(); loadEduTypes(); }
  if (view === 'edit-profile') { state.profileEdit = { fullName: state.fullName, phone: state.phoneNumber, saving: false, notice: '' }; }
  if (view === 'change-password') { state.pwChange = freshPasswordChange(); }

  setState({ view, notice: '' });
  window.scrollTo(0, 0);
}

function goBack() {
  const prev = state.history.pop();
  setState({ view: prev || 'home', notice: '' });
  window.scrollTo(0, 0);
}

// ---------- Rendering ----------
function render() {
  if (state.loading && !state.user) {
    root.innerHTML = `<div class="boot">Loading Alfaruq data…</div>`;
    return;
  }

  if (!state.user) { root.innerHTML = renderAuth(); bindAuthEvents(); return; }

  root.innerHTML = `
    <header class="topbar">
      <button class="icon-btn" data-nav="home">${icon('menu', 22)}</button>
      ${logoHTML(true)}
      <div class="avatar">${icon('user', 18)}</div>
    </header>
    <main class="content">${renderView()}</main>
    <nav class="bottom-nav">
      ${navItem('home', 'gauge', 'Home')}
      ${navItem('history', 'history', 'History')}
      ${navItem('profile', 'user', 'Profile')}
    </nav>
  `;

  bindGlobalEvents();
  bindViewEvents();
}

function navItem(view, ic, label) {
  const active = state.view === view;
  return `<button class="nav-item ${active ? 'active' : ''}" data-nav="${view}">${icon(ic, 20)}<span>${label}</span></button>`;
}

function renderAuth() {
  const v = state.view;
  const title = v === 'login' ? 'Welcome Back' : v === 'register' ? 'Create Account' : 'Reset Password';
  const sub = v === 'login' ? 'Login to your Alfaruq data account' : v === 'register' ? 'Join Alfaruq data' : 'Enter your email to receive reset instructions';

  return `
  <div class="auth-page">
    <div class="auth-card">
      ${logoHTML(false)}
      <div class="auth-copy"><h1>${title}</h1><p>${sub}</p></div>
      ${v === 'register' ? `
        <label class="field"><span>Full name</span><div>${icon('user', 18)}<input id="fullName" type="text" placeholder="Full name" /></div></label>
        <label class="field"><span>Phone number</span><div>${icon('phone', 18)}<input id="phone" type="tel" placeholder="Phone number" /></div></label>
      ` : ''}
      <label class="field"><span>Email address</span><div>${icon('user', 18)}<input id="email" type="email" placeholder="Email address" /></div></label>
      ${v !== 'forgot' ? `<label class="field"><span>Password</span><div>${icon('shield', 18)}<input id="password" type="password" placeholder="Password" /></div></label>` : ''}
      ${v === 'register' ? `<label class="field"><span>Confirm password</span><div>${icon('shield', 18)}<input id="confirmPassword" type="password" placeholder="Confirm password" /></div></label>` : ''}
      ${state.notice ? `<div class="notice">${state.notice}</div>` : ''}
      <button class="primary wide" id="authSubmit">${v === 'login' ? 'Login' : v === 'register' ? 'Create Account' : 'Send Reset Email'}</button>
      ${v === 'login' ? `<button class="link-btn" data-authview="forgot">Forgot password?</button>` : ''}
      <div class="switch">
        ${v === 'login' ? `Don't have an account? <button data-authview="register">Sign Up</button>` : `Already have an account? <button data-authview="login">Login</button>`}
      </div>
      <p class="legal">Secure account access. Financial operations are only activated after real provider verification.</p>
    </div>
  </div>`;
}

function bindAuthEvents() {
  root.querySelectorAll('[data-authview]').forEach((btn) =>
    btn.addEventListener('click', () => setState({ view: btn.dataset.authview, notice: '' })));

  const submit = root.querySelector('#authSubmit');
  if (submit) {
    submit.addEventListener('click', () => {
      const email = root.querySelector('#email')?.value.trim();
      const password = root.querySelector('#password')?.value || '';
      if (state.view === 'login') return login(email, password);
      if (state.view === 'register') {
        const fullName = root.querySelector('#fullName')?.value.trim();
        const phone = root.querySelector('#phone')?.value.trim();
        const confirmPassword = root.querySelector('#confirmPassword')?.value || '';
        return register(fullName, phone, email, password, confirmPassword);
      }
      if (state.view === 'forgot') return forgotPassword(email);
    });
  }
}

function bindGlobalEvents() {
  root.querySelectorAll('[data-nav]').forEach((btn) => btn.addEventListener('click', () => go(btn.dataset.nav)));
  root.querySelectorAll('[data-back]').forEach((btn) => btn.addEventListener('click', goBack));
}

function renderView() {
  switch (state.view) {
    case 'home': return renderHome();
    case 'services': return renderServices();
    case 'history': return renderHistory();
    case 'profile': return renderProfile();
    case 'edit-profile': return renderEditProfile();
    case 'change-password': return renderChangePassword();
    case 'fund': return renderFund();
    case 'data': return renderDataForm();
    case 'airtime': return renderAirtimeForm();
    case 'tv': return renderTvForm();
    case 'electricity': return renderElecForm();
    case 'withdrawal': return renderWithdrawal();
    case 'airtime-cash': return renderAirtimeCash();
    case 'referral': return renderReferral();
    case 'customer-care': return renderCustomerCare();
    case 'edu-pin': return renderEduForm();
    default: return renderHome();
  }
}

function renderHome() {
  const quick = [...services, ...moreServices.filter((s) => s.key === 'edu-pin' || s.key === 'referral' || s.key === 'airtime-cash')];

  return `
    <div class="welcome">
      <div><span>Welcome, ${state.name} 👋</span><h2>Alfaruq data</h2></div>
      <div class="mini-avatar">${(state.name || 'U')[0].toUpperCase()}</div>
    </div>
    <section class="balance-card">
      <div class="balance-top"><span>Wallet Balance</span><button data-toggle-balance>${icon(state.showBalance ? 'eye' : 'eyeOff', 18)}</button></div>
      <strong>${state.showBalance ? money(state.balance) : '₦ ••••••'}</strong>
      <div class="balance-actions">
        <button data-nav="fund">${icon('plus', 16)} Fund Wallet</button>
        <button data-nav="withdrawal">${icon('banknote', 16)} Withdraw</button>
      </div>
    </section>
    ${state.notice ? `<div class="notice">${state.notice}</div>` : ''}
    <div class="section-head"><h3>Quick Services</h3><button data-nav="services">View all ${icon('arrowRight', 16)}</button></div>
    <div class="service-grid">
      ${quick.map((s) => `<button class="service-tile ${s.tone}" data-nav="${s.key}">${icon(s.ic, 25)}<b>${s.title}</b><small>${s.desc}</small></button>`).join('')}
    </div>
    <div class="trust">${icon('shield', 22)}<div><b>Built for secure digital services</b><p>All purchases are verified server-side before your wallet is charged.</p></div></div>
  `;
}

function renderServices() {
  const all = [...services, ...moreServices];
  return `
    ${pageHead('All Services')}
    <div class="service-list">
      ${all.map((s) => `<button class="list-card" data-nav="${s.key}"><div class="list-icon ${s.tone}">${icon(s.ic, 18)}</div><div><b>${s.title}</b><small>${s.desc}</small></div>${icon('chevron', 18)}</button>`).join('')}
    </div>
  `;
}

function pageHead(title) {
  return `<div class="page-head"><button class="icon-btn" data-back>${icon('arrowLeft', 20)}</button><h2>${title}</h2></div>`;
}

let historyRows = null;

function renderHistory() {
  if (historyRows === null) {
    sb.from('transactions').select('id,type,amount,status,created_at').order('created_at', { ascending: false }).limit(50)
      .then(({ data }) => { historyRows = data || []; render(); });
    return `${pageHead('Transaction History')}<div class="empty"><h3>Loading history...</h3></div>`;
  }
  if (historyRows.length === 0) {
    return `${pageHead('Transaction History')}<div class="empty">${icon('receipt', 46)}<h3>No transactions yet</h3><p>Your purchases will show up here.</p></div>`;
  }
  return `
    ${pageHead('Transaction History')}
    <div class="service-list">
      ${historyRows.map((r) => `<div class="list-card"><div class="list-icon green">${icon('receipt', 18)}</div><div><b>${String(r.type).replace(/_/g, ' ')}</b><small>Amount: ${Number(r.amount).toLocaleString('en-NG')} • ${r.status}</small><small>${new Date(r.created_at).toLocaleString('en-NG')}</small></div></div>`).join('')}
    </div>
  `;
}

function renderProfile() {
  return `
    ${pageHead('Profile')}
    <div class="list-card"><div class="list-icon green">${icon('user', 18)}</div><div><b>${state.fullName || state.name}</b><small>${state.user?.email || ''}</small><small>${state.phoneNumber || 'No phone on file'}</small></div></div>

    <button class="list-card" data-nav="edit-profile">
      <div class="list-icon blue">${icon('user', 18)}</div>
      <div><b>Edit Profile</b><small>Update your name and phone number</small></div>
      ${icon('chevron', 18)}
    </button>

    <button class="list-card" data-nav="change-password">
      <div class="list-icon purple">${icon('shield', 18)}</div>
      <div><b>Change Password</b><small>Update your account password</small></div>
      ${icon('chevron', 18)}
    </button>

    <button class="primary wide" style="margin-top:16px;background:#c0392b" id="logoutBtn">Log out</button>
  `;
}

function renderEditProfile() {
  const pe = state.profileEdit;
  return `
    ${pageHead('Edit Profile')}
    <label class="field"><span>Full name</span><div>${icon('user', 18)}<input id="peName" type="text" value="${pe.fullName}" /></div></label>
    <label class="field"><span>Phone number</span><div>${icon('phone', 18)}<input id="pePhone" type="tel" value="${pe.phone}" /></div></label>
    <label class="field"><span>Email</span><div>${icon('user', 18)}<input type="text" readonly value="${state.user?.email || ''}" /></div></label>
    ${pe.notice ? `<div class="notice">${pe.notice}</div>` : ''}
    <button class="primary wide" id="peSaveBtn" ${pe.saving ? 'disabled' : ''}>${pe.saving ? 'Saving...' : 'Save Changes'}</button>
  `;
}

function renderChangePassword() {
  const pw = state.pwChange;
  return `
    ${pageHead('Change Password')}
    <label class="field"><span>New password</span><div>${icon('shield', 18)}<input id="pwNew" type="password" placeholder="At least 6 characters" value="${pw.newPassword}" /></div></label>
    <label class="field"><span>Confirm new password</span><div>${icon('shield', 18)}<input id="pwConfirm" type="password" placeholder="Repeat new password" value="${pw.confirmPassword}" /></div></label>
    ${pw.notice ? `<div class="notice">${pw.notice}</div>` : ''}
    <button class="primary wide" id="pwSaveBtn" ${pw.saving ? 'disabled' : ''}>${pw.saving ? 'Updating...' : 'Update Password'}</button>
  `;
}

async function saveProfileDetails() {
  const pe = state.profileEdit;
  if (!pe.fullName.trim()) return setState({ profileEdit: { ...pe, notice: 'Full name is required.' } });

  setState({ profileEdit: { ...pe, saving: true, notice: '' } });

  const { error } = await sb.from('profiles').update({ full_name: pe.fullName.trim(), phone: pe.phone.trim() }).eq('id', state.user.id);

  if (error) return setState({ profileEdit: { ...pe, saving: false, notice: 'Could not save changes.' } });

  state.fullName = pe.fullName.trim();
  state.name = pe.fullName.trim().split(' ')[0];
  state.phoneNumber = pe.phone.trim();

  setState({ profileEdit: { ...pe, saving: false, notice: '' }, view: 'profile' });
}

async function changePassword() {
  const pw = state.pwChange;

  if (pw.newPassword.length < 6) return setState({ pwChange: { ...pw, notice: 'Password must be at least 6 characters.' } });
  if (pw.newPassword !== pw.confirmPassword) return setState({ pwChange: { ...pw, notice: 'Passwords do not match.' } });

  setState({ pwChange: { ...pw, saving: true, notice: '' } });

  const { error } = await sb.auth.updateUser({ password: pw.newPassword });

  if (error) return setState({ pwChange: { ...pw, saving: false, notice: error.message } });

  setState({ pwChange: freshPasswordChange(), notice: 'Password updated successfully.', view: 'profile' });
}

function renderFund() {
  return `
    ${pageHead('Fund Wallet')}
    <label class="field"><span>Amount (₦)</span><div>${icon('banknote', 18)}<input id="fundAmount" type="number" placeholder="e.g. 1000" /></div></label>
    ${state.notice ? `<div class="notice">${state.notice}</div>` : ''}
    <button class="primary wide" id="fundBtn" ${state.loading ? 'disabled' : ''}>${state.loading ? 'Please wait...' : 'Proceed to Payment'}</button>
    <button class="primary wide" id="refreshBalanceBtn" style="background:#1f6fdb;margin-top:10px;">Refresh balance</button>
  `;
}

// ---- Data ----
function renderDataForm() {
  const dp = state.dp;
  if (dp.done) return successScreen('Buy Data', `${dp.selectedPlan?.name} sent to ${dp.phone}.`);

  const networkOptions = uniqueNetworkNames();
  const typeOptions = dataTypesForNetwork();

  return `
    ${pageHead('Buy Data')}
    <label class="field"><span>Phone Number</span><div>${icon('phone', 18)}<input id="dpPhone" type="tel" placeholder="08012345678" value="${dp.phone}" /></div></label>
    <label class="field"><span>Choose provider</span>
      <select id="dpNetwork" ${dp.loadingNetworks ? 'disabled' : ''}>
        <option value="">${dp.loadingNetworks ? 'Loading...' : 'Select provider'}</option>
        ${networkOptions.map((n) => `<option value="${n}" ${dp.selectedNetwork === n ? 'selected' : ''}>${n.toUpperCase()}</option>`).join('')}
      </select>
    </label>
    <label class="field"><span>Select plan type</span>
      <select id="dpType" ${!dp.selectedNetwork ? 'disabled' : ''}>
        <option value="">${dp.selectedNetwork ? 'Select plan type' : 'Choose provider first'}</option>
        ${typeOptions.map((t) => `<option value="${t}" ${dp.selectedDataType === t ? 'selected' : ''}>${t.toUpperCase()}</option>`).join('')}
      </select>
    </label>
    <label class="field"><span>Select plan</span>
      <select id="dpPlan" ${!dp.selectedServiceId || dp.loadingPlans ? 'disabled' : ''}>
        <option value="">${dp.loadingPlans ? 'Loading plans...' : !dp.selectedServiceId ? 'Select plan type first' : 'Select plan'}</option>
        ${dp.plans.map((p) => `<option value="${p.code}" ${dp.selectedPlan?.code === String(p.code) ? 'selected' : ''}>${p.name} — ${money(p.price)}</option>`).join('')}
      </select>
      ${dp.planNotice ? `<div class="notice">${dp.planNotice}</div>` : ''}
    </label>
    <label class="field"><span>Amount / Package</span><div>${icon('wifi', 18)}<input type="text" readonly value="${dp.selectedPlan ? money(dp.selectedPlan.price) : '₦0.00'}" /></div></label>
    <label class="field"><span>Payment PIN</span><div>${icon('shield', 18)}<input id="dpPin" type="password" inputmode="numeric" maxlength="4" placeholder="4-digit PIN" value="${dp.pin}" /></div></label>
    ${dp.notice ? `<div class="notice">${dp.notice}</div>` : ''}
    <button class="primary wide" id="dpSubmit" ${dp.submitting ? 'disabled' : ''}>${dp.submitting ? 'Processing...' : 'Continue'}</button>
  `;
}

// ---- Airtime ----
function renderAirtimeForm() {
  const at = state.at;
  if (at.done) return successScreen('Airtime', `${money(at.amount)} airtime sent to ${at.phone}.`);

  const networkOptions = [...new Set(at.networks.map((n) => n.network_name))];

  return `
    ${pageHead('Buy Airtime')}
    <label class="field"><span>Phone Number</span><div>${icon('phone', 18)}<input id="atPhone" type="tel" placeholder="08012345678" value="${at.phone}" /></div></label>
    <label class="field"><span>Choose provider</span>
      <select id="atNetwork" ${at.loadingNetworks ? 'disabled' : ''}>
        <option value="">${at.loadingNetworks ? 'Loading...' : 'Select provider'}</option>
        ${networkOptions.map((n) => `<option value="${n}" ${at.selectedNetwork === n ? 'selected' : ''}>${n.toUpperCase()}</option>`).join('')}
      </select>
    </label>
    <label class="field"><span>Amount (₦)</span><div>${icon('banknote', 18)}<input id="atAmount" type="number" placeholder="e.g. 500" value="${at.amount}" /></div></label>
    <label class="field"><span>Payment PIN</span><div>${icon('shield', 18)}<input id="atPin" type="password" inputmode="numeric" maxlength="4" placeholder="4-digit PIN" value="${at.pin}" /></div></label>
    ${at.notice ? `<div class="notice">${at.notice}</div>` : ''}
    <button class="primary wide" id="atSubmit" ${at.submitting ? 'disabled' : ''}>${at.submitting ? 'Processing...' : 'Continue'}</button>
  `;
}

// ---- TV ----
function renderTvForm() {
  const tv = state.tv;
  if (tv.done) return successScreen('TV Subscription', `${tv.selectedPlan?.name} activated for smartcard ${tv.smartcard}.`);

  const providerOptions = [...new Set(tv.providers.map((n) => n.network_name))];

  return `
    ${pageHead('TV Subscription')}
    <label class="field"><span>Choose provider</span>
      <select id="tvProvider" ${tv.loadingProviders ? 'disabled' : ''}>
        <option value="">${tv.loadingProviders ? 'Loading...' : 'Select provider'}</option>
        ${providerOptions.map((n) => `<option value="${n}" ${tv.selectedProvider === n ? 'selected' : ''}>${n.toUpperCase()}</option>`).join('')}
      </select>
    </label>
    <label class="field"><span>Smartcard / IUC Number</span><div>${icon('tv', 18)}<input id="tvSmartcard" type="text" placeholder="1234567890" value="${tv.smartcard}" /></div></label>
    <label class="field"><span>Phone Number</span><div>${icon('phone', 18)}<input id="tvPhone" type="tel" placeholder="08012345678" value="${tv.phone}" /></div></label>
    ${!tv.verified ? `
      ${tv.notice ? `<div class="notice">${tv.notice}</div>` : ''}
      <button class="primary wide" id="tvVerifyBtn" ${tv.verifying ? 'disabled' : ''}>${tv.verifying ? 'Verifying...' : 'Verify Smartcard'}</button>
    ` : `
      <div class="notice" style="background:#e8f5ee;border-color:#bfe6cf;color:#1a6b3f;">Verified: ${tv.verified.smartcard_name}</div>
      <label class="field"><span>Select plan</span>
        <select id="tvPlan">
          <option value="">Select plan</option>
          ${(tv.verified.cable_plans || []).map((p) => `<option value="${p.code}" ${tv.selectedPlan?.code === p.code ? 'selected' : ''}>${p.name} — ${money(p.price)}</option>`).join('')}
        </select>
      </label>
      <label class="field"><span>Payment PIN</span><div>${icon('shield', 18)}<input id="tvPin" type="password" inputmode="numeric" maxlength="4" placeholder="4-digit PIN" value="${tv.pin}" /></div></label>
      ${tv.notice ? `<div class="notice">${tv.notice}</div>` : ''}
      <button class="primary wide" id="tvSubmit" ${tv.submitting ? 'disabled' : ''}>${tv.submitting ? 'Processing...' : 'Continue'}</button>
    `}
  `;
}

// ---- Electricity ----
function renderElecForm() {
  const el = state.elec;
  if (el.done) return successScreen('Electricity', `Token: ${el.verified?.token || 'sent via SMS'} — meter ${el.meterNo}.`);

  const discoOptions = [...new Set(el.discos.map((n) => n.network_name))];

  return `
    ${pageHead('Electricity / Bills')}
    <label class="field"><span>Choose provider (Disco)</span>
      <select id="elDisco" ${el.loadingDiscos ? 'disabled' : ''}>
        <option value="">${el.loadingDiscos ? 'Loading...' : 'Select disco'}</option>
        ${discoOptions.map((n) => `<option value="${n}" ${el.selectedDisco === n ? 'selected' : ''}>${n.toUpperCase()}</option>`).join('')}
      </select>
    </label>
    <label class="field"><span>Meter Number</span><div>${icon('zap', 18)}<input id="elMeter" type="text" placeholder="1234567890" value="${el.meterNo}" /></div></label>
    ${!el.verified ? `
      ${el.notice ? `<div class="notice">${el.notice}</div>` : ''}
      <button class="primary wide" id="elVerifyBtn" ${el.verifying ? 'disabled' : ''}>${el.verifying ? 'Verifying...' : 'Verify Meter'}</button>
    ` : `
      <div class="notice" style="background:#e8f5ee;border-color:#bfe6cf;color:#1a6b3f;">Verified: ${el.verified.customer_name || el.verified.provider_message}</div>
      <label class="field"><span>Phone Number</span><div>${icon('phone', 18)}<input id="elPhone" type="tel" placeholder="08012345678" value="${el.phone}" /></div></label>
      <label class="field"><span>Amount (₦)</span><div>${icon('banknote', 18)}<input id="elAmount" type="number" placeholder="e.g. 2000" value="${el.amount}" /></div></label>
      <label class="field"><span>Payment PIN</span><div>${icon('shield', 18)}<input id="elPin" type="password" inputmode="numeric" maxlength="4" placeholder="4-digit PIN" value="${el.pin}" /></div></label>
      ${el.notice ? `<div class="notice">${el.notice}</div>` : ''}
      <button class="primary wide" id="elSubmit" ${el.submitting ? 'disabled' : ''}>${el.submitting ? 'Processing...' : 'Continue'}</button>
    `}
  `;
}

// ---- Withdrawal ----
function renderWithdrawal() {
  const wd = state.wd;
  if (wd.done) return successScreen('Withdrawal Requested', 'Your withdrawal is pending review and will be processed within 24 hours.');

  return `
    ${pageHead('Withdraw to Bank')}
    <label class="field"><span>Amount (₦)</span><div>${icon('banknote', 18)}<input id="wdAmount" type="number" placeholder="e.g. 5000" value="${wd.amount}" /></div></label>
    <label class="field"><span>Select Bank</span>
      <select id="wdBank">
        <option value="">Select your bank</option>
        ${NIGERIAN_BANKS.map((b) => `<option value="${b.code}" ${wd.bankCode === b.code ? 'selected' : ''}>${b.name}</option>`).join('')}
      </select>
    </label>
    <label class="field"><span>Account Number</span><div>${icon('banknote', 18)}<input id="wdAccNum" type="text" inputmode="numeric" maxlength="10" placeholder="0123456789" value="${wd.accountNumber}" /></div></label>
    ${wd.verifying ? `<div class="notice">Verifying account...</div>` : ''}
    ${wd.verified ? `<div class="notice" style="background:#e8f5ee;border-color:#bfe6cf;color:#1a6b3f;">Account name: ${wd.accountName}</div>` : ''}
    <label class="field"><span>Payment PIN</span><div>${icon('shield', 18)}<input id="wdPin" type="password" inputmode="numeric" maxlength="4" placeholder="4-digit PIN" value="${wd.pin}" /></div></label>
    ${wd.notice ? `<div class="notice">${wd.notice}</div>` : ''}
    <button class="primary wide" id="wdSubmit" ${wd.submitting ? 'disabled' : ''}>${wd.submitting ? 'Submitting...' : 'Request Withdrawal'}</button>
    <p class="legal">Withdrawals are reviewed and paid out manually within 24 hours for your security.</p>
  `;
}

// ---- Airtime to Cash ----
function renderAirtimeCash() {
  const ac = state.ac;
  if (ac.done) return successScreen('Request Submitted', 'We will confirm your airtime transfer and credit your wallet shortly.');

  return `
    ${pageHead('Airtime to Cash')}
    <p style="color:var(--muted);font-size:13px;margin-top:-6px;">Transfer airtime to our number, then submit the details below. Your wallet is credited after we confirm receipt.</p>
    <label class="field"><span>Network</span>
      <select id="acNetwork">
        <option value="">Select network</option>
        <option ${ac.network === 'MTN' ? 'selected' : ''}>MTN</option>
        <option ${ac.network === 'Airtel' ? 'selected' : ''}>Airtel</option>
        <option ${ac.network === 'Glo' ? 'selected' : ''}>Glo</option>
        <option ${ac.network === '9mobile' ? 'selected' : ''}>9mobile</option>
      </select>
    </label>
    <label class="field"><span>Amount sent (₦)</span><div>${icon('banknote', 18)}<input id="acAmount" type="number" placeholder="e.g. 1000" value="${ac.amount}" /></div></label>
    <label class="field"><span>The phone number you sent from</span><div>${icon('phone', 18)}<input id="acSender" type="tel" placeholder="08012345678" value="${ac.senderNumber}" /></div></label>
    ${ac.notice ? `<div class="notice">${ac.notice}</div>` : ''}
    <button class="primary wide" id="acSubmit" ${ac.submitting ? 'disabled' : ''}>${ac.submitting ? 'Submitting...' : 'Submit Request'}</button>
  `;
}

// ---- Referral ----
function renderReferral() {
  const link = state.referralCode ? `${window.location.origin}${window.location.pathname}?ref=${state.referralCode}` : '';

  return `
    ${pageHead('My Referral')}
    <div class="balance-card" style="background:linear-gradient(135deg,#7b3fe4,#4c1fa3);">
      <div class="balance-top"><span>Your referral code</span></div>
      <strong style="font-size:24px;">${state.referralCode || '...'}</strong>
    </div>
    <p style="color:var(--muted);font-size:13px;">Share your link below. When someone signs up and completes their first purchase, you earn a ₦100 bonus automatically.</p>
    <label class="field"><span>Your referral link</span><div><input id="refLink" type="text" readonly value="${link}" /></div></label>
    <button class="primary wide" id="refCopyBtn">${icon('copy', 16)} Copy Link</button>
  `;
}

// ---- Customer Care ----
function renderCustomerCare() {
  return `
    ${pageHead('Customer Care')}
    <p style="color:var(--muted);font-size:13px;">Chat with us directly on WhatsApp for any issue with your account or a transaction.</p>
    <a class="list-card" href="https://wa.me/2348066071218" target="_blank" style="text-decoration:none;color:inherit;">
      <div class="list-icon green">${icon('whatsapp', 18)}</div>
      <div><b>Support Line 1</b><small>0806 607 1218</small></div>
      ${icon('chevron', 18)}
    </a>
    <a class="list-card" href="https://wa.me/2349019624093" target="_blank" style="text-decoration:none;color:inherit;">
      <div class="list-icon green">${icon('whatsapp', 18)}</div>
      <div><b>Support Line 2</b><small>0901 962 4093</small></div>
      ${icon('chevron', 18)}
    </a>
  `;
}

function renderEduForm() {
  const edu = state.edu;
  if (edu.done) return successScreen('Edu PIN', `${edu.quantity} × ${edu.selectedType.toUpperCase()} PIN sent to ${edu.phone}. Check History for your PIN(s).`);

  const typeOptions = [...new Set(edu.types.map((n) => n.network_name))];
  const total = edu.unitPrice ? edu.unitPrice * Number(edu.quantity || 1) : null;

  return `
    ${pageHead('Edu PIN')}
    <label class="field"><span>Exam type</span>
      <select id="eduType" ${edu.loadingTypes ? 'disabled' : ''}>
        <option value="">${edu.loadingTypes ? 'Loading...' : 'Select exam type'}</option>
        ${typeOptions.map((n) => `<option value="${n}" ${edu.selectedType === n ? 'selected' : ''}>${n.toUpperCase()}</option>`).join('')}
      </select>
    </label>
    <label class="field"><span>Quantity</span><div>${icon('grad', 18)}<input id="eduQty" type="number" min="1" value="${edu.quantity}" /></div></label>
    <label class="field"><span>Price per PIN</span><div>${icon('banknote', 18)}<input type="text" readonly value="${edu.loadingPrice ? 'Loading...' : edu.unitPrice ? money(edu.unitPrice) : '₦0.00'}" /></div></label>
    <label class="field"><span>Total</span><div>${icon('banknote', 18)}<input type="text" readonly value="${total ? money(total) : '₦0.00'}" /></div></label>
    <label class="field"><span>Phone Number</span><div>${icon('phone', 18)}<input id="eduPhone" type="tel" placeholder="08012345678" value="${edu.phone}" /></div></label>
    <label class="field"><span>Payment PIN</span><div>${icon('shield', 18)}<input id="eduPin" type="password" inputmode="numeric" maxlength="4" placeholder="4-digit PIN" value="${edu.pin}" /></div></label>
    ${edu.notice ? `<div class="notice">${edu.notice}</div>` : ''}
    <button class="primary wide" id="eduSubmit" ${edu.submitting ? 'disabled' : ''}>${edu.submitting ? 'Processing...' : 'Continue'}</button>
  `;
}

function successScreen(title, message) {
  return `
    ${pageHead(title)}
    <div class="empty">${icon('shield', 46)}<h3>Successful</h3><p>${message}</p><button class="primary wide" data-nav="home">Back to Home</button></div>
  `;
}

// ---------- Event binding ----------
function bindViewEvents() {
  if (state.view === 'home') {
    root.querySelector('[data-toggle-balance]')?.addEventListener('click', () => setState({ showBalance: !state.showBalance }));
  }

  if (state.view === 'profile') {
    root.querySelector('#logoutBtn')?.addEventListener('click', logout);
  }

  if (state.view === 'edit-profile') {
    root.querySelector('#peName')?.addEventListener('input', (e) => (state.profileEdit.fullName = e.target.value));
    root.querySelector('#pePhone')?.addEventListener('input', (e) => (state.profileEdit.phone = e.target.value));
    root.querySelector('#peSaveBtn')?.addEventListener('click', saveProfileDetails);
  }

  if (state.view === 'change-password') {
    root.querySelector('#pwNew')?.addEventListener('input', (e) => (state.pwChange.newPassword = e.target.value));
    root.querySelector('#pwConfirm')?.addEventListener('input', (e) => (state.pwChange.confirmPassword = e.target.value));
    root.querySelector('#pwSaveBtn')?.addEventListener('click', changePassword);
  }

  if (state.view === 'fund') {
    root.querySelector('#fundBtn')?.addEventListener('click', () => startFunding(root.querySelector('#fundAmount')?.value));
    root.querySelector('#refreshBalanceBtn')?.addEventListener('click', loadProfile);
  }

  if (state.view === 'data') {
    root.querySelector('#dpPhone')?.addEventListener('input', (e) => (state.dp.phone = e.target.value));
    root.querySelector('#dpPin')?.addEventListener('input', (e) => (state.dp.pin = e.target.value.replace(/\D/g, '')));
    root.querySelector('#dpNetwork')?.addEventListener('change', (e) => onPickNetwork(e.target.value));
    root.querySelector('#dpType')?.addEventListener('change', (e) => onPickDataType(e.target.value));
    root.querySelector('#dpPlan')?.addEventListener('change', (e) => onPickPlan(e.target.value));
    root.querySelector('#dpSubmit')?.addEventListener('click', submitDataPurchase);
  }

  if (state.view === 'airtime') {
    root.querySelector('#atPhone')?.addEventListener('input', (e) => (state.at.phone = e.target.value));
    root.querySelector('#atAmount')?.addEventListener('input', (e) => (state.at.amount = e.target.value));
    root.querySelector('#atPin')?.addEventListener('input', (e) => (state.at.pin = e.target.value.replace(/\D/g, '')));
    root.querySelector('#atNetwork')?.addEventListener('change', (e) => onPickAtNetwork(e.target.value));
    root.querySelector('#atSubmit')?.addEventListener('click', submitAirtimePurchase);
  }

  if (state.view === 'tv') {
    root.querySelector('#tvProvider')?.addEventListener('change', (e) => onPickTvProvider(e.target.value));
    root.querySelector('#tvSmartcard')?.addEventListener('input', (e) => (state.tv.smartcard = e.target.value));
    root.querySelector('#tvPhone')?.addEventListener('input', (e) => (state.tv.phone = e.target.value));
    root.querySelector('#tvVerifyBtn')?.addEventListener('click', verifySmartcard);
    root.querySelector('#tvPlan')?.addEventListener('change', (e) => onPickTvPlan(e.target.value));
    root.querySelector('#tvPin')?.addEventListener('input', (e) => (state.tv.pin = e.target.value.replace(/\D/g, '')));
    root.querySelector('#tvSubmit')?.addEventListener('click', submitTvPurchase);
  }

  if (state.view === 'electricity') {
    root.querySelector('#elDisco')?.addEventListener('change', (e) => onPickDisco(e.target.value));
    root.querySelector('#elMeter')?.addEventListener('input', (e) => (state.elec.meterNo = e.target.value));
    root.querySelector('#elVerifyBtn')?.addEventListener('click', verifyMeter);
    root.querySelector('#elPhone')?.addEventListener('input', (e) => (state.elec.phone = e.target.value));
    root.querySelector('#elAmount')?.addEventListener('input', (e) => (state.elec.amount = e.target.value));
    root.querySelector('#elPin')?.addEventListener('input', (e) => (state.elec.pin = e.target.value.replace(/\D/g, '')));
    root.querySelector('#elSubmit')?.addEventListener('click', submitElectricityPurchase);
  }

  if (state.view === 'withdrawal') {
    root.querySelector('#wdAmount')?.addEventListener('input', (e) => (state.wd.amount = e.target.value));
    root.querySelector('#wdBank')?.addEventListener('change', (e) => onPickBank(e.target.value));
    root.querySelector('#wdAccNum')?.addEventListener('input', (e) => onAccountNumberInput(e.target.value));
    root.querySelector('#wdPin')?.addEventListener('input', (e) => (state.wd.pin = e.target.value.replace(/\D/g, '')));
    root.querySelector('#wdSubmit')?.addEventListener('click', submitWithdrawal);
  }

  if (state.view === 'airtime-cash') {
    root.querySelector('#acNetwork')?.addEventListener('change', (e) => (state.ac.network = e.target.value));
    root.querySelector('#acAmount')?.addEventListener('input', (e) => (state.ac.amount = e.target.value));
    root.querySelector('#acSender')?.addEventListener('input', (e) => (state.ac.senderNumber = e.target.value));
    root.querySelector('#acSubmit')?.addEventListener('click', submitAirtimeCash);
  }

  if (state.view === 'edu-pin') {
    root.querySelector('#eduType')?.addEventListener('change', (e) => onPickEduType(e.target.value));
    root.querySelector('#eduQty')?.addEventListener('input', (e) => setEdu({ quantity: e.target.value }));
    root.querySelector('#eduPhone')?.addEventListener('input', (e) => (state.edu.phone = e.target.value));
    root.querySelector('#eduPin')?.addEventListener('input', (e) => (state.edu.pin = e.target.value.replace(/\D/g, '')));
    root.querySelector('#eduSubmit')?.addEventListener('click', submitEduPurchase);
  }

  if (state.view === 'referral') {
    root.querySelector('#refCopyBtn')?.addEventListener('click', () => {
      const input = root.querySelector('#refLink');
      input.select();
      navigator.clipboard?.writeText(input.value);
      setState({ notice: 'Referral link copied!' });
    });
  }
}

// ---------- Boot ----------
initAuth();
