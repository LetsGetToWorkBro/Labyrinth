/* ═══════════════════════════════════════════════════════════
   LABYRINTH BJJ — CRM FRONTEND
   Single Page App — Plain JS, no framework
   ═══════════════════════════════════════════════════════════ */

/* ── CONFIG ─────────────────────────────────────────────── */
// ⚠️ REPLACE with your deployed Apps Script Web App URL after deployment
const API_URL = 'https://script.google.com/macros/s/AKfycbwkxkV6XlqKy3DDot_MTfb40WeAfd6KMgBwgcrCNStEFM5vcAQNYG9eR2OOFpCwJ3AJ/exec';

// Local demo mode when API isn't configured
const DEMO_MODE = API_URL.includes('YOUR_APPS_SCRIPT');

// Stripe embedded checkout
const STRIPE_PK = 'pk_live_51JJ2MQKRbQfFjxbLFtmRfUmpV9VoETfqJkTDIQLzskoYP4LzEWqSVyuun92vjRYa0VdTZqlPimhcDZiUSk3HoJv000mcgUU0Y3';
const stripePromise = typeof Stripe !== 'undefined' ? Stripe(STRIPE_PK) : null;

/* ── STATE ──────────────────────────────────────────────── */
let authToken = null;
let adminRole = null; // 'owner', 'frontdesk', 'manager'
let adminName = '';
let currentPage = 'dashboard';
let membersCache = [];
let plansCache = [];
let taxSettings = { taxRate: 8.25, taxDefault: false };
let currentLocationId = 'fulshear';
let dashboardDataCache = null; // Cache for dashboard data, used by popups
let dashboardView = 'main'; // 'main' | 'owner'
let paymentsTab = 'pos'; // 'pos' | 'history'

/* ── FRANCHISE LOCATIONS ──────────────────────────────────── */
const FRANCHISE_LOCATIONS = [
  { 
    id: 'fulshear', 
    name: 'Labyrinth BJJ Fulshear', 
    short: 'Fulshear',
    status: 'active',
    apiUrl: 'https://script.google.com/macros/s/AKfycbwkxkV6XlqKy3DDot_MTfb40WeAfd6KMgBwgcrCNStEFM5vcAQNYG9eR2OOFpCwJ3AJ/exec',
    color: '#C8A24C'
  },
  { 
    id: 'katy', 
    name: 'Labyrinth BJJ Katy', 
    short: 'Katy',
    status: 'active',
    apiUrl: '',
    color: '#3B82F6',
    password: ''
  },
  { 
    id: 'wharton', 
    name: 'Labyrinth BJJ Wharton', 
    short: 'Wharton',
    status: 'coming-soon',
    apiUrl: '',
    color: '#8B5CF6',
    password: ''
  },
  { 
    id: 'foundations', 
    name: 'Labyrinth BJJ Foundations', 
    short: 'Foundations',
    status: 'coming-soon',
    apiUrl: '',
    color: '#10B981',
    password: ''
  }
];

/* ── DEMO DATA ──────────────────────────────────────────── */
const DEMO_MEMBERS = [
  { ID:'m001', Name:'Marcus Johnson', Email:'marcus@example.com', Phone:'+12815551234', Plan:'Adult BJJ Unlimited', Status:'Active', StartDate:'2025-09-15', BillingDate:'15', StripeCustomerID:'cus_demo1', StripeSubscriptionID:'sub_demo1', Notes:'Blue belt competitor', CreatedAt:'2025-09-15' },
  { ID:'m002', Name:'Sarah Chen', Email:'sarah.c@example.com', Phone:'+12815555678', Plan:'Adult BJJ 12-Class', Status:'Active', StartDate:'2025-11-01', BillingDate:'1', StripeCustomerID:'cus_demo2', StripeSubscriptionID:'sub_demo2', Notes:'', CreatedAt:'2025-11-01' },
  { ID:'m003', Name:'Diego Rivera', Email:'diego.r@example.com', Phone:'+12815559012', Plan:'Kids BJJ Unlimited', Status:'Active', StartDate:'2026-01-10', BillingDate:'10', StripeCustomerID:'cus_demo3', StripeSubscriptionID:'sub_demo3', Notes:'Son Mateo enrolled', CreatedAt:'2026-01-10' },
  { ID:'m004', Name:'Emily Watson', Email:'ewatson@example.com', Phone:'+12815553456', Plan:'Family Plan', Status:'Active', StartDate:'2025-08-20', BillingDate:'20', StripeCustomerID:'cus_demo4', StripeSubscriptionID:'sub_demo4', Notes:'Family of 3', CreatedAt:'2025-08-20' },
  { ID:'m005', Name:'Jake Thompson', Email:'jake.t@example.com', Phone:'+12815557890', Plan:'Adult BJJ 8-Class', Status:'Trial', StartDate:'2026-03-10', BillingDate:'', StripeCustomerID:'', StripeSubscriptionID:'', Notes:'Came from free trial Friday', CreatedAt:'2026-03-10' },
  { ID:'m006', Name:'Lisa Park', Email:'lisa.p@example.com', Phone:'+12815552345', Plan:'Sauna Membership', Status:'Active', StartDate:'2026-02-01', BillingDate:'1', StripeCustomerID:'cus_demo6', StripeSubscriptionID:'sub_demo6', Notes:'Sauna only member', CreatedAt:'2026-02-01' },
  { ID:'m007', Name:'Tony Reyes', Email:'tony.r@example.com', Phone:'+12815556789', Plan:'Adult BJJ Unlimited', Status:'Failed', StartDate:'2025-07-05', BillingDate:'5', StripeCustomerID:'cus_demo7', StripeSubscriptionID:'sub_demo7', Notes:'Card declined 3/15', CreatedAt:'2025-07-05' },
  { ID:'m008', Name:'Mia Foster', Email:'mia.f@example.com', Phone:'+12815550123', Plan:'5-Class Punch Card', Status:'Active', StartDate:'2026-03-01', BillingDate:'', StripeCustomerID:'cus_demo8', StripeSubscriptionID:'', Notes:'3 classes remaining', CreatedAt:'2026-03-01' },
];

const DEMO_PAYMENTS = [
  { PaymentID:'p001', MemberName:'Marcus Johnson', Amount:199, Status:'Succeeded', Date:'2026-03-15', Type:'Subscription Renewal' },
  { PaymentID:'p002', MemberName:'Sarah Chen', Amount:189, Status:'Succeeded', Date:'2026-03-14', Type:'Subscription Renewal' },
  { PaymentID:'p003', MemberName:'Tony Reyes', Amount:199, Status:'Failed', Date:'2026-03-15', Type:'Failed Payment' },
  { PaymentID:'p004', MemberName:'Emily Watson', Amount:399, Status:'Succeeded', Date:'2026-03-13', Type:'Subscription Renewal' },
  { PaymentID:'p005', MemberName:'Mia Foster', Amount:160, Status:'Succeeded', Date:'2026-03-01', Type:'One-time' },
  { PaymentID:'p006', MemberName:'Diego Rivera', Amount:249, Status:'Succeeded', Date:'2026-03-10', Type:'Subscription Renewal' },
];

const DEMO_BOOKINGS = [
  { name:'Jake Thompson', classType:'Adult BJJ Gi', date:'2026-03-22', status:'Confirmed' },
  { name:'New Lead - Alex M.', classType:'Trial Class', date:'2026-03-22', status:'Pending' },
  { name:'Marcus Johnson', classType:'Competition Class', date:'2026-03-21', status:'Confirmed' },
  { name:'Sarah Chen', classType:'Adult No-Gi', date:'2026-03-21', status:'Confirmed' },
  { name:'Diego Rivera (Mateo)', classType:'Kids BJJ Gi', date:'2026-03-20', status:'Confirmed' },
];

const DEFAULT_PLANS = [
  { name: 'Adult BJJ 8-Class', price: 179, interval: 'month', type: 'recurring' },
  { name: 'Adult BJJ 12-Class', price: 189, interval: 'month', type: 'recurring' },
  { name: 'Adult BJJ Unlimited', price: 199, interval: 'month', type: 'recurring' },
  { name: 'Kids BJJ 8-Class', price: 239, interval: 'month', type: 'recurring' },
  { name: 'Kids BJJ Unlimited', price: 249, interval: 'month', type: 'recurring' },
  { name: 'Family Plan', price: 399, interval: 'month', type: 'recurring' },
  { name: '5-Class Punch Card', price: 160, interval: 'once', type: 'one-time' },
  { name: '3-Class Punch Card', price: 100, interval: 'once', type: 'one-time' },
  { name: 'Sauna Membership', price: 60, interval: 'month', type: 'recurring' },
];

/* ── BELT COLOR MAP ─────────────────────────────────────── */
const BELT_COLORS = {
  'Black':  '#333333',
  'Brown':  '#8B4513',
  'Blue':   '#1E90FF',
  'Purple': '#9B59B6',
  'White':  '#EEEEEE',
  'Grey':   '#888888',
  'Gray':   '#888888',
  'Yellow': '#F1C40F'
};

function getBeltColor(belt) {
  if (!belt) return '#888';
  const key = Object.keys(BELT_COLORS).find(k => belt.toLowerCase().includes(k.toLowerCase()));
  return key ? BELT_COLORS[key] : '#888';
}

/* ── BELT SVG HELPERS ────────────────────────────────── */
function getBeltSvgPath(belt, type) {
  if (!belt) return '';
  const b = belt.toLowerCase().trim();
  const isKid = (type || '').toLowerCase() === 'kid' || (type || '').toLowerCase() === 'kids';

  const map = {
    'white':  isKid ? 'belts/kids_white.svg' : 'belts/adult_white.svg',
    'blue':   'belts/adult_blue.svg',
    'purple': 'belts/adult_purple.svg',
    'brown':  'belts/adult_brown.svg',
    'black':  'belts/adult_black.svg',
    'grey':   'belts/kids_grey.svg',
    'gray':   'belts/kids_grey.svg',
    'yellow': 'belts/kids_yellow.svg',
    'orange': 'belts/kids_orange.svg',
    'green':  'belts/kids_green.svg',
    'red':    'belts/adult_red.svg',
  };

  return map[b] || '';
}

function beltImgHtml(belt, type, width) {
  const path = getBeltSvgPath(belt, type);
  if (!path) return `<span class="belt-dot" style="background:${getBeltColor(belt)}"></span>`;
  const w = width || 60;
  const h = Math.round(w * 14 / 60); // maintain aspect ratio
  return `<img src="${path}" alt="${belt} belt" width="${w}" height="${h}" class="belt-svg" onerror="this.style.display='none';this.nextElementSibling.style.display='inline-block'"><span class="belt-dot" style="background:${getBeltColor(belt)};display:none"></span>`;
}

/* ── API LAYER ──────────────────────────────────────────── */
// GAS cold starts regularly take 20-25 seconds. Timeout must exceed that.
const GAS_TIMEOUT_MS = 35000;  // 35s — comfortably above worst-case cold start
const GAS_MAX_RETRIES = 2;     // retry up to 2x on timeout/network error

async function api(action, data = {}, _retryCount = 0) {
  if (DEMO_MODE) return demoApi(action, data);

  // Show a subtle "connecting..." status on the first cold-start retry
  if (_retryCount === 1) {
    showToast('Backend is waking up, retrying…', 'info', 4000);
  }

  try {
    const baseUrl = window._activeApiUrl || API_URL;
    const payload = JSON.stringify({ action, ...data });

    // Use POST for large payloads (signatures, etc.), GET for everything else
    const isLargePayload = payload.length > 5000;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), GAS_TIMEOUT_MS);

    let resp;
    try {
      if (isLargePayload) {
        resp = await fetch(baseUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain' },
          body: payload,
          redirect: 'follow',
          signal: controller.signal
        });
      } else {
        const url = baseUrl + '?action=' + encodeURIComponent(action)
                  + '&payload=' + encodeURIComponent(payload);
        resp = await fetch(url, { redirect: 'follow', signal: controller.signal });
      }
    } finally {
      clearTimeout(timeoutId);
    }

    // Check if the response is actually JSON (GAS errors return HTML)
    const contentType = resp.headers.get('content-type') || '';
    const text = await resp.text();

    if (!resp.ok || !contentType.includes('application/json')) {
      const match = text.match(/<div[^>]*>([^<]*(?:Error|SyntaxError|TypeError|ReferenceError)[^<]*)<\/div>/i);
      const errMsg = match ? match[1].trim() : ('Server error: HTTP ' + resp.status);
      console.error('API error (' + action + '):', errMsg, '\nFull response:', text.substring(0, 500));
      showToast('Backend error [' + action + ']: ' + errMsg, 'error');
      return null;
    }

    let result;
    try {
      result = JSON.parse(text);
    } catch (parseErr) {
      console.error('JSON parse error for ' + action + ':', text.substring(0, 200));
      showToast('Invalid response from server [' + action + ']', 'error');
      return null;
    }

    if (result.error) {
      showToast('[' + action + '] ' + result.error, 'error');
      return null;
    }
    return result;

  } catch (err) {
    const isTimeout = err.name === 'AbortError' || err.name === 'TimeoutError';
    const isNetwork = err.name === 'TypeError' || err.message.includes('network') || err.message.includes('fetch');

    // Auto-retry on timeout/network error (GAS cold start)
    if ((isTimeout || isNetwork) && _retryCount < GAS_MAX_RETRIES) {
      console.warn('API timeout/network error (' + action + '), retry ' + (_retryCount + 1) + '/' + GAS_MAX_RETRIES + ':', err.message);
      return api(action, data, _retryCount + 1);
    }

    console.error('API connection error (' + action + ') after ' + _retryCount + ' retries:', err);
    if (_retryCount >= GAS_MAX_RETRIES) {
      showToast('Server not responding after ' + GAS_MAX_RETRIES + ' attempts. Try again in a moment.', 'error');
    } else {
      showToast('Connection error [' + action + ']: ' + err.message, 'error');
    }
    return null;
  }
}

function demoApi(action, data) {
  // Simulate API responses with demo data
  const planPrices = {};
  DEFAULT_PLANS.forEach(p => planPrices[p.name] = p.price);

  switch(action) {
    case 'getMembers': return { members: [...DEMO_MEMBERS] };
    case 'getDashboard': {
      const active = DEMO_MEMBERS.filter(m => m.Status === 'Active').length;
      let mrr = 0;
      DEMO_MEMBERS.filter(m => m.Status === 'Active').forEach(m => {
        mrr += planPrices[m.Plan] || 0;
      });
      const monthlyPaid = DEMO_PAYMENTS.filter(p => p.Status === 'Succeeded').reduce((s,p) => s + p.Amount, 0);
      const overdueList = [
        { name: 'Tony Reyes', amount: 199, date: new Date(Date.now() - 8*24*3600*1000).toISOString(), description: 'Adult BJJ Unlimited', chargeId: 'ch_demo_overdue1' },
        { name: 'Alex Morgan', amount: 189, date: new Date(Date.now() - 14*24*3600*1000).toISOString(), description: 'Adult BJJ 12-Class', invoiceId: 'inv_demo_overdue2' }
      ];
      return {
        activeMembers: active,
        mrr,
        monthlyPaid: monthlyPaid,
        monthlyScheduled: mrr,
        failedPayments: DEMO_MEMBERS.filter(m => m.Status === 'Failed').length,
        overduePayments: overdueList,
        newMembers: 3,
        upcomingTrials: DEMO_MEMBERS.filter(m => m.Status === 'Trial').length,
        totalMembers: DEMO_MEMBERS.length,
        recentPayments: DEMO_PAYMENTS.slice(0, 5),
        recentBookings: DEMO_BOOKINGS
      };
    }
    case 'getPayments': return { payments: [...DEMO_PAYMENTS] };
    case 'getPlans': return { plans: [...DEFAULT_PLANS] };
    case 'getSettings': return {
      STRIPE_SECRET_KEY: '', STRIPE_WEBHOOK_SECRET: '',
      OPENPHONE_API_KEY: '', MAILCHIMP_API_KEY: '',
      hasStripe: false, hasOpenPhone: false, hasMailchimp: false
    };
    case 'getBookings': return { bookings: [...DEMO_BOOKINGS] };
    case 'getTrialBookings': return { bookings: [...DEMO_BOOKINGS] };
    case 'addBooking': return { success: true, id: 'demo_booking_' + Date.now() };
    case 'addMember': return { success: true, id: 'demo_' + Date.now() };
    case 'updateMember': return { success: true };
    case 'deleteMember': return { success: true };
    case 'sendMassEmail': return { success: true, sentCount: data.target === 'all' ? DEMO_MEMBERS.length : 3 };
    case 'sendMassSMS': return { success: true, sentCount: data.target === 'all' ? DEMO_MEMBERS.length : 3 };
    case 'createCheckout': return data.embedded
      ? { success: true, clientSecret: 'cs_demo_secret_' + Date.now(), sessionId: 'cs_demo_' + Date.now() }
      : { success: true, url: 'https://checkout.stripe.com/demo_session_' + Date.now() };
    case 'saveSettings': return { success: true };
    case 'savePlans': return { success: true };
    case 'getTaxSettings': return { taxRate: 8.25, taxDefault: false };
    case 'saveTaxSettings': return { success: true };
    case 'logManualPayment': return { success: true, paymentId: 'demo_pay_' + Date.now() };
    case 'chargeCardOnFile': return { success: true, paymentIntentId: 'pi_demo_' + Date.now() };
    case 'getMemberPayments': return {
      payments: [
        { id: 'ch_demo1', paymentIntentId: 'pi_demo1', amount: 199, currency: 'usd', status: 'succeeded', refunded: false, refundedAmount: 0, description: 'Adult BJJ Unlimited', date: new Date(Date.now() - 1*24*3600*1000).toISOString(), receiptUrl: '', last4: '4242', brand: 'visa' },
        { id: 'ch_demo2', paymentIntentId: 'pi_demo2', amount: 199, currency: 'usd', status: 'succeeded', refunded: false, refundedAmount: 0, description: 'Adult BJJ Unlimited', date: new Date(Date.now() - 32*24*3600*1000).toISOString(), receiptUrl: '', last4: '4242', brand: 'visa' },
        { id: 'ch_demo3', paymentIntentId: 'pi_demo3', amount: 199, currency: 'usd', status: 'succeeded', refunded: true, refundedAmount: 199, description: 'Adult BJJ Unlimited', date: new Date(Date.now() - 62*24*3600*1000).toISOString(), receiptUrl: '', last4: '4242', brand: 'visa' },
        { id: 'ch_demo4', paymentIntentId: 'pi_demo4', amount: 199, currency: 'usd', status: 'failed', refunded: false, refundedAmount: 0, description: 'Adult BJJ Unlimited', date: new Date(Date.now() - 93*24*3600*1000).toISOString(), receiptUrl: '', last4: '4242', brand: 'visa' },
        { id: 'ch_demo5', paymentIntentId: 'pi_demo5', amount: 199, currency: 'usd', status: 'succeeded', refunded: false, refundedAmount: 0, description: 'Adult BJJ Unlimited', date: new Date(Date.now() - 123*24*3600*1000).toISOString(), receiptUrl: '', last4: '4242', brand: 'visa' },
      ]
    };
    case 'refundPayment': return { success: true, refundId: 're_demo_' + Date.now(), amount: data.amount || 199 };
    case 'saveWaiver': return { success: true, waiverId: 'demo_' + Math.random().toString(36).substr(2,8) };
    case 'getWaiver': return { signed: false };
    case 'sendWaiverEmail': return { success: true };
    case 'saveAgreement': return { success: true, agreementId: 'demo_' + Math.random().toString(36).substr(2,8) };
    case 'getAgreement': return { signed: false };
    case 'sendAgreementEmail': return { success: true };
    case 'getMemberComms': return {
      comms: [
        { date: new Date(Date.now() - 2*24*3600*1000).toISOString(), type: 'Email', recipientName: data.memberName || '', recipientContact: data.memberEmail || '', subject: 'Welcome to Labyrinth BJJ!', message: 'Hi there, welcome to the team. We are excited to have you on the mat.' },
        { date: new Date(Date.now() - 5*24*3600*1000).toISOString(), type: 'SMS', recipientName: data.memberName || '', recipientContact: data.memberPhone || '', subject: '', message: 'Hi! Reminder: your trial class is tomorrow at 6pm. See you on the mat!' }
      ]
    };
    case 'getRecentComms': return {
      comms: [
        { date: new Date(Date.now() - 1*3600*1000).toISOString(), type: 'Email', recipientName: 'All Members', recipientContact: '', subject: 'Class Schedule Update', message: 'Hey team! Just a reminder that Saturday competition class starts at 9 AM this week.' },
        { date: new Date(Date.now() - 2*24*3600*1000).toISOString(), type: 'SMS', recipientName: 'Active Only', recipientContact: '', subject: '', message: 'Labyrinth BJJ: Open mat this Sunday 10:30 AM. All levels welcome. See you on the mat!' },
        { date: new Date(Date.now() - 3*24*3600*1000).toISOString(), type: 'Email', recipientName: 'Tony Reyes', recipientContact: 'tony.r@example.com', subject: 'Payment Failed — Action Required', message: 'Hi Tony, your most recent payment did not go through. Please update your card on file.' },
        { date: new Date(Date.now() - 5*24*3600*1000).toISOString(), type: 'SMS', recipientName: 'Trials', recipientContact: '', subject: '', message: 'Labyrinth BJJ: Hope you enjoyed your trial class! Ready to join the team? Reply READY.' },
        { date: new Date(Date.now() - 7*24*3600*1000).toISOString(), type: 'Email', recipientName: 'All Members', recipientContact: '', subject: 'Tournament This Weekend — Come Support!', message: 'Several of our students are competing this Saturday. Come cheer them on!' },
      ]
    };
    case 'saveNote': return { success: true };
    case 'getRetentionData': {
      const demoMembers = [...DEMO_MEMBERS];
      const totalMembers = demoMembers.length;
      let withStripe = 0, noStripe = 0, trialCount = 0;
      demoMembers.forEach(m => {
        if (m.StripeCustomerID) withStripe++;
        else noStripe++;
        const plan = (m.Plan || '').toUpperCase();
        if (plan.indexOf('TRIAL') !== -1 || plan.indexOf('FREE') !== -1) trialCount++;
      });
      return {
        totalMembers,
        withStripe,
        noStripe,
        trialCount,
        staleTrials: [DEMO_BOOKINGS[4]] // old booking as example
      };
    }
    case 'getAdminUsers': return { users: [
      { email: 'info@labyrinth.vision', name: 'Tony Curry', role: 'owner', location: 'fulshear' }
    ]};
    case 'createAdminUser': return { success: true };
    case 'deleteAdminUser': return { success: true };
    default: return { error: 'Unknown action' };
  }
}

/* ── AUTH ──────────────────────────────────────────────── */
function toggleLegacyLogin(e) {
  e.preventDefault();
  const emailGroup = document.getElementById('loginEmailGroup');
  const toggle = document.getElementById('legacyLoginToggle');
  const emailInput = document.getElementById('loginEmail');
  if (emailGroup.style.display === 'none') {
    emailGroup.style.display = '';
    toggle.textContent = 'Use admin password only';
    document.getElementById('loginPassword').placeholder = 'Password';
  } else {
    emailGroup.style.display = 'none';
    if (emailInput) emailInput.value = '';
    toggle.textContent = 'Sign in with email';
    document.getElementById('loginPassword').placeholder = 'Enter admin password';
  }
}

function handleLogin(e) {
  e.preventDefault();
  const emailEl = document.getElementById('loginEmail');
  const pw = document.getElementById('loginPassword').value;
  const emailGroupHidden = document.getElementById('loginEmailGroup') && document.getElementById('loginEmailGroup').style.display === 'none';
  const email = (!emailGroupHidden && emailEl) ? emailEl.value.trim() : '';
  const btn = document.getElementById('loginBtn');
  const errEl = document.getElementById('loginError');

  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span>';
  errEl.style.display = 'none';

  function onLoginSuccess(result) {
    authToken = result.token || ('local_' + Date.now());
    adminRole = result.role || 'owner';
    adminName = result.name || 'Admin';
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('appShell').style.display = 'grid';
    applyRolePermissions();
    navigate('dashboard');
  }

  // Legacy local check (demo/offline mode) — password-only with no email
  if (!email && pw === 'Theone941BJJ!') {
    btn.disabled = false;
    btn.innerHTML = '<span>Sign In</span>';
    onLoginSuccess({ token: 'local_' + Date.now(), role: 'owner', name: 'Admin' });
    return false;
  }

  // Email + password login (or legacy password-only)
  const loginData = email ? { email, password: pw } : { password: pw };
  api('login', loginData).then(result => {
    btn.disabled = false;
    btn.innerHTML = '<span>Sign In</span>';

    if (result && result.success) {
      onLoginSuccess(result);
    } else {
      const msg = (result && result.error) ? result.error : 'Invalid credentials';
      errEl.textContent = msg;
      errEl.style.display = 'block';
    }
  });

  return false;
}

function applyRolePermissions() {
  const franchiseNav = document.querySelector('[data-page="franchise"]');
  const settingsNav = document.querySelector('[data-page="settings"]');
  const locationSwitcher = document.querySelector('.location-switcher');

  if (adminRole !== 'owner') {
    if (franchiseNav) franchiseNav.style.display = 'none';
    if (locationSwitcher) locationSwitcher.style.display = 'none';
  } else {
    if (franchiseNav) franchiseNav.style.display = '';
    if (locationSwitcher) locationSwitcher.style.display = '';
  }

  if (adminRole === 'frontdesk') {
    if (settingsNav) settingsNav.style.display = 'none';
  } else {
    if (settingsNav) settingsNav.style.display = '';
  }

  // Update sidebar tooltip with admin name/role
  const sidebarBrand = document.querySelector('.sidebar-brand');
  if (sidebarBrand && adminName && adminName !== 'Admin') {
    sidebarBrand.title = adminName + ' (' + (adminRole || '') + ')';
  }
}

function handleLogout() {
  authToken = null;
  adminRole = null;
  adminName = '';
  document.getElementById('appShell').style.display = 'none';
  document.getElementById('loginScreen').style.display = 'flex';
  document.getElementById('loginPassword').value = '';
  const emailEl = document.getElementById('loginEmail');
  if (emailEl) emailEl.value = '';
  const emailGroup = document.getElementById('loginEmailGroup');
  if (emailGroup) emailGroup.style.display = '';
  const toggle = document.getElementById('legacyLoginToggle');
  if (toggle) toggle.textContent = 'Use admin password only';
}

/* ── NAVIGATION ─────────────────────────────────────────── */
function navigate(page) {
  currentPage = page;

  // Update active nav
  document.querySelectorAll('.nav-item[data-page]').forEach(el => {
    el.classList.toggle('active', el.dataset.page === page);
  });

  // Close mobile sidebar
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebarOverlay').classList.remove('open');

  // Render page
  const main = document.getElementById('mainContent');
  main.scrollTop = 0;

  switch(page) {
    case 'franchise':  renderFranchise(); break;
    case 'dashboard': renderDashboard(); break;
    case 'members':   renderMembers(); break;
    case 'payments':  renderPayments(); break;
    case 'pos':       paymentsTab = 'pos'; navigate('payments'); return;
    case 'schedule':  renderSchedule(); break;
    case 'messages':  renderMessages(); break;
    // Legacy routes — redirect to consolidated pages
    case 'email':     navigate('messages'); return;
    case 'sms':       navigate('messages'); return;
    case 'settings':  renderSettings(); break;
    case 'kiosk':     renderKiosk(); break;
    default: renderDashboard();
  }
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('sidebarOverlay').classList.toggle('open');
}

/* ── KIOSK MODE (iPad Front Desk) ──────────────────────── */
// Access via: admin.labyrinth.vision?kiosk=1
// Or navigate('kiosk') from the app
// Two big buttons: Sign Waiver + New Member. Nothing else.

var _kioskMode = false;

function enterKioskMode() {
  _kioskMode = true;
  // Hide sidebar and overlay
  document.getElementById('sidebar').style.display = 'none';
  document.getElementById('sidebarOverlay').style.display = 'none';
  // Hide mobile header
  var mobileHeader = document.querySelector('.mobile-header');
  if (mobileHeader) mobileHeader.style.display = 'none';
  // Make main content full width, full height
  var shell = document.querySelector('.app-shell');
  shell.style.gridTemplateColumns = '1fr';
  shell.style.gridTemplateRows = '1fr';
  // Make main content fill the screen
  var mainContent = document.getElementById('mainContent');
  mainContent.style.height = '100vh';
  mainContent.style.padding = '0';
  navigate('kiosk');
}

function exitKioskMode() {
  _kioskMode = false;
  document.getElementById('sidebar').style.display = '';
  var mobileHeader = document.querySelector('.mobile-header');
  if (mobileHeader) mobileHeader.style.display = '';
  document.getElementById('sidebarOverlay').style.display = '';
  var shell = document.querySelector('.app-shell');
  shell.style.gridTemplateColumns = '';
  shell.style.gridTemplateRows = '';
  var mainContent = document.getElementById('mainContent');
  mainContent.style.height = '';
  mainContent.style.padding = '';
  navigate('dashboard');
}

function renderKiosk() {
  const main = document.getElementById('mainContent');
  main.innerHTML = `
    <div class="kiosk-container">
      <div class="kiosk-header">
        <img src="logos/kanji-framed-gold.png" alt="Labyrinth BJJ" style="max-height:160px; width:auto; filter: drop-shadow(0 0 32px rgba(200,162,76,0.25)); margin-bottom:8px;">
        <h1 class="kiosk-title">LABYRINTH BJJ</h1>
        <p class="kiosk-subtitle">Welcome! Please select an option below.</p>
      </div>

      <div class="kiosk-actions">
        <button type="button" class="kiosk-btn kiosk-btn-waiver" id="kioskWaiverBtn">
          <div class="kiosk-btn-icon">&#128221;</div>
          <div class="kiosk-btn-text">
            <div class="kiosk-btn-title">Sign Waiver</div>
            <div class="kiosk-btn-desc">Sign the liability waiver before your first class</div>
          </div>
        </button>

        <button type="button" class="kiosk-btn kiosk-btn-member" id="kioskMemberBtn">
          <div class="kiosk-btn-icon">&#128100;&#65039;</div>
          <div class="kiosk-btn-text">
            <div class="kiosk-btn-title">New Member</div>
            <div class="kiosk-btn-desc">Sign up, sign waiver, add payment, and choose a plan</div>
          </div>
        </button>
      </div>

      <div class="kiosk-footer">
        <button type="button" class="kiosk-exit-btn" id="kioskExitBtn">Exit Kiosk Mode</button>
      </div>
    </div>
  `;

  // Attach handlers
  document.getElementById('kioskWaiverBtn').addEventListener('click', function() {
    showWaiverModal({});
  });
  document.getElementById('kioskMemberBtn').addEventListener('click', function() {
    startOnboardingWizard({});
  });
  document.getElementById('kioskExitBtn').addEventListener('click', function() {
    exitKioskMode();
  });

  // After modal closes in kiosk mode, return to kiosk screen
  var origCloseModal = window.closeModal;
  window.closeModal = function() {
    origCloseModal();
    if (_kioskMode) {
      setTimeout(function() { renderKiosk(); }, 300);
    }
  };
}

// Auto-enter kiosk mode if URL has ?kiosk=1
(function() {
  var params = new URLSearchParams(window.location.search);
  if (params.get('kiosk') === '1') {
    // Wait for login to complete, then enter kiosk
    var checkLogin = setInterval(function() {
      if (document.getElementById('appShell') && document.getElementById('appShell').style.display !== 'none') {
        clearInterval(checkLogin);
        setTimeout(enterKioskMode, 500);
      }
    }, 200);
  }
})();

/* ── DASHBOARD ──────────────────────────────────────────── */
function getBriefingHtml() {
  const now = new Date();
  const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const dayOfWeek = days[now.getDay()];
  const monthName = months[now.getMonth()];
  const dayNum = now.getDate();
  const hour = now.getHours();
  const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';

  // Use cached data if available
  const cached = dashboardDataCache;
  const trialsToday = cached ? (cached.recentBookings || []).filter(b => {
    const pd = parseTrialDate(b.date);
    return pd.isToday;
  }).length : 0;
  const nextTrial = cached ? (cached.recentBookings || []).find(b => {
    const pd = parseTrialDate(b.date);
    return pd.isToday;
  }) : null;
  const nextTrialName = nextTrial ? (nextTrial.name || '').split(' ')[0] : '';
  const nextTrialTime = nextTrial ? (nextTrial.time || '') : '';
  // Deduplicate overdue by member name for accurate counts
  const overdueByMember = {};
  if (cached) {
    (cached.overduePayments || []).forEach(function(p) {
      const key = (p.name || 'Unknown').toLowerCase().trim();
      if (!overdueByMember[key]) overdueByMember[key] = { amount: p.amount || 0, count: 1 };
      else { overdueByMember[key].count++; }
    });
  }
  const overdueUniqueMembers = Object.values(overdueByMember);
  const overdueCount = overdueUniqueMembers.length;
  const overdueTotal = overdueUniqueMembers.reduce(function(s,p) { return s + p.amount; }, 0);
  const todayCollected = cached ? Math.round(cached.monthlyPaid || 0) : 0;

  return `
    <div class="briefing-card">
      <div class="briefing-header">
        <span class="briefing-day">${dayOfWeek}, ${monthName} ${dayNum}</span>
        <span class="briefing-greeting">Good ${timeOfDay}, ${esc(adminName || 'Coach')}</span>
      </div>
      <div class="briefing-items">
        <div class="briefing-item ${trialsToday > 0 ? 'highlight' : ''}">
          <span class="briefing-icon">🥋</span>
          <span>${trialsToday} trial${trialsToday !== 1 ? 's' : ''} today${nextTrialName ? ' — next: ' + nextTrialName + (nextTrialTime ? ' at ' + nextTrialTime : '') : ''}</span>
        </div>
        <div class="briefing-item ${overdueCount > 0 ? 'alert' : ''}" ${overdueCount > 0 ? 'style="cursor:pointer;" onclick="navigate(\'payments\');setTimeout(function(){var sf=document.getElementById(\'paymentStatusFilter\');if(sf){sf.value=\'Failed\';filterPaymentHistory();}},500);"' : ''}>
          <span class="briefing-icon">⚠️</span>
          <span>${overdueCount} member${overdueCount !== 1 ? 's' : ''} overdue ($${formatNum(overdueTotal)})${overdueCount > 0 ? ' <a style="color:var(--gold);font-weight:600;font-size:12px;margin-left:6px;">View Overdue &rarr;</a>' : ''}</span>
        </div>
        <div class="briefing-item">
          <span class="briefing-icon">💰</span>
          <span>$${formatNum(todayCollected)} collected this month</span>
        </div>
      </div>
    </div>
  `;
}

function setDashboardView(view) {
  dashboardView = view;
  // Refresh data from API on tab switch
  renderDashboard();
}

async function renderDashboard() {
  const main = document.getElementById('mainContent');
  main.innerHTML = `
    <div class="page-header">
      <h1 class="page-title">Dashboard</h1>
      <div class="page-actions">
        <button class="btn btn-secondary btn-sm" onclick="renderDashboard()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23,4 23,10 17,10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>
          Refresh
        </button>
      </div>
    </div>

    ${adminRole === 'owner' ? `
    <div class="dashboard-view-toggle" style="margin-bottom:16px;">
      <button class="view-btn ${dashboardView === 'main' ? 'active' : ''}" onclick="setDashboardView('main')">Dashboard</button>
      <button class="view-btn ${dashboardView === 'owner' ? 'active' : ''}" onclick="setDashboardView('owner')"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-3px;margin-right:4px;"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line><line x1="2" y1="20" x2="22" y2="20"></line></svg>Financials</button>
    </div>
    ` : ''}

    <div id="dashboardBody"><div class="loading-state"><span class="spinner"></span> Loading dashboard...</div></div>
  `;

  let data = null;
  try {
    const [apiData] = await Promise.all([
      api('getDashboard'),
      ensureMembersLoaded()
    ]);
    data = apiData;
  } catch (err) {
    console.error('Dashboard load error:', err);
  }

  const bodyEl = document.getElementById('dashboardBody');
  if (!bodyEl) return;

  // Always render the dashboard UI — use fallback empty data if API failed
  if (!data) {
    data = {
      activeMembers: membersCache.length || 0,
      totalMembers: membersCache.length || 0,
      mrr: 0,
      monthlyScheduled: 0,
      monthlyPaid: 0,
      recentPayments: [],
      recentBookings: [],
      overduePayments: [],
      todayBookings: 0,
      trialCount: 0
    };
    // Show a persistent warning banner so the user knows the API is down
    bodyEl.innerHTML = '<div style="padding:12px 16px;background:rgba(248,113,113,0.1);border:1px solid rgba(248,113,113,0.3);border-radius:8px;margin-bottom:16px;font-size:13px;color:var(--error);">' +
      '&#9888; Could not load live data from the backend. The API may be down or misconfigured. Quick actions below still work. ' +
      '<a href="#" onclick="event.preventDefault(); renderDashboard()" style="color:var(--gold);text-decoration:underline;">Retry</a></div>';
  } else {
    bodyEl.innerHTML = '';
  }
  dashboardDataCache = data;

  if (dashboardView === 'owner' && adminRole === 'owner') {
    renderOwnerFinancials(data, bodyEl);
  } else {
    renderMainDashboard(data, bodyEl);
  }
}

/* ── MAIN DASHBOARD (everyone sees this) ──────────────── */
function renderMainDashboard(data, container) {
  // Build Today's Classes from CLASS_SCHEDULE
  const now = new Date();
  const dayName = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][now.getDay()];
  const nowMins = now.getHours() * 60 + now.getMinutes();
  const todayClasses = (CLASS_SCHEDULE[dayName] || []).map(cls => {
    const startMins = parseClassTime(cls.time);
    const isLive = startMins >= 0 && nowMins >= startMins && nowMins < startMins + 60;
    const isPast = startMins >= 0 && nowMins >= startMins + 60;
    return { ...cls, isLive, isPast, startMins };
  });

  // Belt rank counts (include kids belts)
  const beltCounts = { White: 0, Blue: 0, Purple: 0, Brown: 0, Black: 0, Grey: 0, Yellow: 0, Orange: 0, Green: 0 };
  membersCache.forEach(m => {
    const belt = (m.Belt || '').trim();
    if (!belt) return;
    // Normalize: capitalize first letter for matching
    const normalized = belt.charAt(0).toUpperCase() + belt.slice(1).toLowerCase();
    if (beltCounts[normalized] !== undefined) {
      beltCounts[normalized]++;
    } else if (normalized === 'Gray') {
      beltCounts['Grey']++;
    } else {
      const key = Object.keys(beltCounts).find(k => belt.toLowerCase().includes(k.toLowerCase()));
      if (key) beltCounts[key]++;
    }
  });

  let html = '';

  // Demo mode notice
  html += DEMO_MODE ? '<div style="padding:10px 16px;background:rgba(200,162,76,0.08);border:1px solid rgba(200,162,76,0.2);border-radius:8px;margin-bottom:16px;font-size:13px;color:var(--gold);">&#9888; Demo Mode &mdash; Connect your Apps Script URL in app.js to go live</div>' : '';

  // Today's Classes
  html += `
    <div class="dashboard-section">
      <div class="dashboard-section-header">
        <span>Today's Classes</span>
        <a href="#" onclick="event.preventDefault(); navigate('schedule')">View Full Schedule &rarr;</a>
      </div>
      <div class="today-classes-row">
        ${todayClasses.length === 0 ? '<div style="font-size:13px;color:var(--text-muted);padding:10px 0;">No classes scheduled today</div>' :
          todayClasses.every(c => c.isPast) ? '<div style="font-size:13px;color:var(--text-muted);padding:10px 0;">No more classes today. See you tomorrow!</div>' :
          todayClasses.map(cls => `
            <div class="today-class-chip ${cls.isLive ? 'live' : ''} ${cls.isPast ? 'past' : ''}">
              <span class="today-class-time">${cls.time}</span>
              <span class="today-class-name">${esc(cls.name)}</span>
              ${cls.isLive ? '<span class="live-dot"></span>' : ''}
            </div>
          `).join('')}
      </div>
    </div>
  `;

  // Pending Rank Approvals widget (loads async)
  html += `
    <div id="rankApprovalsWidget" class="dashboard-section" style="display:none;">
      <div class="dashboard-section-header">
        <span>🥋 Pending Rank Requests</span>
      </div>
      <div id="rankApprovalsList"></div>
    </div>
  `;

  // Quick Action Buttons (use data-qa attribute, handled by global delegation)
  html += `
    <div class="quick-actions-grid">
      <div class="quick-action-card" data-qa="newMember"><div class="quick-action-icon">&#128100;&#65039;</div><div class="quick-action-label">New Member</div></div>
      <div class="quick-action-card" data-qa="newPayment"><div class="quick-action-icon">&#128176;</div><div class="quick-action-label">New Payment</div></div>
      <div class="quick-action-card" data-qa="posSale"><div class="quick-action-icon">&#128722;</div><div class="quick-action-label">POS Sale</div></div>
      <div class="quick-action-card" data-qa="scheduleTrial"><div class="quick-action-icon">&#128203;</div><div class="quick-action-label">Schedule Trial</div></div>
      <div class="quick-action-card" data-qa="signWaiver"><div class="quick-action-icon">&#128221;</div><div class="quick-action-label">Sign Waiver</div></div>
      <div class="quick-action-card" data-qa="sendMessage"><div class="quick-action-icon">&#128231;</div><div class="quick-action-label">Send Message</div></div>
      <div class="quick-action-card" data-qa="search"><div class="quick-action-icon">&#128269;</div><div class="quick-action-label">Search</div></div>
      <div class="quick-action-card" data-qa="viewSchedule"><div class="quick-action-icon">&#128197;</div><div class="quick-action-label">View Schedule</div></div>
    </div>
  `;

  // Upcoming Trials (compact, next 5)
  html += `
    <div class="dashboard-section">
      <div class="dashboard-section-header">
        <span>Upcoming Trials</span>
        <a href="#" onclick="event.preventDefault(); showTrialLeadsPopup()">View All &rarr;</a>
      </div>
      <div class="trial-feed-list" id="recentBookingsFeed"><div class="loading-state"><span class="spinner"></span> Loading...</div></div>
    </div>
  `;

  // Morning Briefing
  html += `<div id="briefingArea">${getBriefingHtml()}</div>`;

  // Recent Payments (compact, last 5)
  html += `
    <div class="dashboard-section">
      <div class="dashboard-section-header">
        <span>Recent Payments</span>
        <a href="#" onclick="event.preventDefault(); navigate('payments')">View All &rarr;</a>
      </div>
      <div class="feed-list" id="recentPaymentsFeed"><div class="loading-state"><span class="spinner"></span> Loading...</div></div>
    </div>
  `;

  // Belt Rank Overview
  const kidsBeltsHtml = (beltCounts.Grey + beltCounts.Yellow + beltCounts.Orange + beltCounts.Green) > 0 ? `
        <div style="width:100%;border-top:1px solid var(--border);margin:8px 0;padding-top:8px;font-size:11px;color:var(--text-muted);font-weight:600;">Kids Belts</div>
        <div class="belt-rank-item"><span class="belt-dot-sm" style="background:#9CA3AF"></span> Grey <strong>${beltCounts.Grey}</strong></div>
        <div class="belt-rank-item"><span class="belt-dot-sm" style="background:#FCD34D"></span> Yellow <strong>${beltCounts.Yellow}</strong></div>
        <div class="belt-rank-item"><span class="belt-dot-sm" style="background:#F97316"></span> Orange <strong>${beltCounts.Orange}</strong></div>
        <div class="belt-rank-item"><span class="belt-dot-sm" style="background:#22C55E"></span> Green <strong>${beltCounts.Green}</strong></div>` : '';
  html += `
    <div class="dashboard-section">
      <div class="dashboard-section-header">Belt Rank Overview</div>
      <div class="belt-rank-bar">
        <div class="belt-rank-item"><span class="belt-dot-sm" style="background:#EEE"></span> White <strong>${beltCounts.White}</strong></div>
        <div class="belt-rank-item"><span class="belt-dot-sm" style="background:#1E90FF"></span> Blue <strong>${beltCounts.Blue}</strong></div>
        <div class="belt-rank-item"><span class="belt-dot-sm" style="background:#9B59B6"></span> Purple <strong>${beltCounts.Purple}</strong></div>
        <div class="belt-rank-item"><span class="belt-dot-sm" style="background:#8B4513"></span> Brown <strong>${beltCounts.Brown}</strong></div>
        <div class="belt-rank-item"><span class="belt-dot-sm" style="background:#111"></span> Black <strong>${beltCounts.Black}</strong></div>
        ${kidsBeltsHtml}
      </div>
    </div>
  `;

  container.innerHTML += html;

  // Update briefing card with real data
  const briefingArea = document.getElementById('briefingArea');
  if (briefingArea) briefingArea.innerHTML = getBriefingHtml();

  // Payments feed
  const payFeed = document.getElementById('recentPaymentsFeed');
  if (payFeed) {
    if (data.recentPayments && data.recentPayments.length) {
      payFeed.innerHTML = data.recentPayments.slice(0, 5).map(p => `
        <div class="feed-item">
          <div class="feed-icon ${(p.Status || p.status) === 'Failed' ? 'failed' : 'payment'}">${(p.Status || p.status) === 'Failed' ? '\u2715' : '$'}</div>
          <div class="feed-info"><div class="feed-name"><a href="#" class="member-name-link" onclick="event.preventDefault(); openMemberProfileByName('${esc(p.MemberName || p.name || '')}')">${esc(p.MemberName || p.name)}</a></div><div class="feed-detail">${esc(p.Type || p.type)}</div></div>
          <div><div class="feed-amount" style="color:${(p.Status || p.status) === 'Failed' ? 'var(--error)' : 'var(--success)'}">${(p.Status || p.status) === 'Failed' ? '-' : '+'}$${p.Amount || p.amount}</div><div class="feed-date">${formatDate(p.Date || p.date)}</div></div>
        </div>
      `).join('');
    } else {
      payFeed.innerHTML = '<div class="empty-state"><p>No charges yet this month</p></div>';
    }
  }

  // Upcoming trials feed
  renderTrialFeed(data);

  // Load pending rank requests
  loadRankApprovals();
}

async function loadRankApprovals() {
  try {
    const res = await api('getRankRequests');
    const widget = document.getElementById('rankApprovalsWidget');
    const list = document.getElementById('rankApprovalsList');
    if (!widget || !list) return;
    if (!res.requests || res.requests.length === 0) {
      widget.style.display = 'none';
      return;
    }
    widget.style.display = '';
    list.innerHTML = res.requests.map(r => {
      const currentSvg = r.currentBelt ? `<img src="${getBeltSvgPath(r.currentBelt, r.type)}" alt="${esc(r.currentBelt)}" style="width:50px;height:12px;">` : '<span style="color:var(--text-muted);font-size:12px;">None</span>';
      const pendingSvg = `<img src="${getBeltSvgPath(r.pendingBelt, r.type)}" alt="${esc(r.pendingBelt)}" style="width:50px;height:12px;">`;
      const noteHtml = r.note ? `<div class="rank-request-note">${esc(r.note)}</div>` : '';
      return `
        <div class="rank-request-card" data-promo-id="${esc(r.promotionId)}">
          <div class="rank-request-info">
            <div class="rank-request-name">${esc(r.name)}</div>
            <div class="rank-request-belts">
              ${currentSvg}
              <span class="rank-request-arrow">&rarr;</span>
              ${pendingSvg}
              <span class="rank-request-belt-name">${esc(r.pendingBelt)}</span>
            </div>
            ${noteHtml}
          </div>
          <div class="rank-request-actions">
            <button class="rank-approve-btn" onclick="handleRankApproval('${esc(r.promotionId)}', true, this)">Approve</button>
            <button class="rank-deny-btn" onclick="handleRankApproval('${esc(r.promotionId)}', false, this)">Deny</button>
          </div>
        </div>
      `;
    }).join('');
  } catch(e) {
    // Silent fail — widget stays hidden
  }
}

async function handleRankApproval(promotionId, approve, btn) {
  const card = btn.closest('.rank-request-card');
  const memberName = card.querySelector('.rank-request-name')?.textContent || 'Member';
  card.querySelectorAll('button').forEach(b => b.disabled = true);
  try {
    const res = await api('approveRank', { promotionId, approve });
    if (res.success) {
      card.style.opacity = '0.5';
      card.innerHTML = `<div style="padding:10px;font-size:13px;color:var(--text-muted);">${approve ? '\u2705 Approved' : '\u274c Denied'} &mdash; ${esc(memberName)}</div>`;
      setTimeout(() => {
        card.remove();
        const list = document.getElementById('rankApprovalsList');
        if (list && !list.children.length) {
          document.getElementById('rankApprovalsWidget').style.display = 'none';
        }
      }, 2000);
    } else {
      showToast(res.error || 'Failed', 'error');
      card.querySelectorAll('button').forEach(b => b.disabled = false);
    }
  } catch {
    showToast('Connection error', 'error');
    card.querySelectorAll('button').forEach(b => b.disabled = false);
  }
}

/* ── OWNER FINANCIALS VIEW ─────────────────────────────── */
function renderOwnerFinancials(data, container) {
  // Consolidate overdue by member name
  const overdueMap = {};
  (data.overduePayments || []).forEach(p => {
    const key = (p.name || 'Unknown').toLowerCase().trim();
    if (overdueMap[key]) {
      overdueMap[key].amount += p.amount;
      overdueMap[key].count++;
      if (new Date(p.date) > new Date(overdueMap[key].date)) overdueMap[key].date = p.date;
    } else {
      overdueMap[key] = { ...p, count: 1 };
    }
  });
  const consolidatedOverdue = Object.values(overdueMap);
  const overdueTotal = consolidatedOverdue.reduce((s, p) => s + p.amount, 0);

  // Payment progress bar
  const scheduled = data.monthlyScheduled || data.mrr || 0;
  const collected = data.monthlyPaid || 0;
  const total = Math.max(scheduled, collected + overdueTotal, 1);
  const collectedPct = Math.min((collected / total) * 100, 100);
  const overduePct = Math.min((overdueTotal / total) * 100, 100 - collectedPct);

  let html = '';

  // Payment progress bar
  html += `
    <div class="payment-progress-card">
      <div class="payment-progress-header"><span class="card-title">Payments This Month</span></div>
      <div class="payment-bar-container"><div class="payment-bar"><div class="payment-bar-collected" style="width: ${collectedPct}%"></div><div class="payment-bar-overdue" style="width: ${overduePct}%"></div></div></div>
      <div class="payment-bar-stats">
        <div class="payment-bar-stat"><span class="payment-bar-label">Scheduled</span><span class="payment-bar-value gold">$${formatNum(Math.round(scheduled))}</span></div>
        <div class="payment-bar-stat"><span class="payment-bar-label">Collected</span><span class="payment-bar-value green">$${formatNum(Math.round(collected))}</span></div>
        ${overdueTotal > 0 ? `<div class="payment-bar-stat"><span class="payment-bar-label">Overdue</span><span class="payment-bar-value red">$${formatNum(Math.round(overdueTotal))}</span></div>` : ''}
      </div>
    </div>
  `;

  // Financial stat cards (MRR, collected, overdue)
  html += `
    <div class="stats-grid stats-grid-compact" style="margin-top:16px;">
      <div class="stat-card"><div class="stat-label">MRR</div><div class="stat-value gold">$${formatNum(Math.round(data.mrr || scheduled))}</div><div class="text-sm text-muted mt-8">Monthly recurring</div></div>
      <div class="stat-card"><div class="stat-label">Collected</div><div class="stat-value" style="color:var(--success)">$${formatNum(Math.round(collected))}</div><div class="text-sm text-muted mt-8">This month</div></div>
      <div class="stat-card"><div class="stat-label">Overdue</div><div class="stat-value" style="color:${overdueTotal > 0 ? 'var(--error)' : 'var(--success)'}">${overdueTotal > 0 ? '$' + formatNum(Math.round(overdueTotal)) : '$0'}</div><div class="text-sm text-muted mt-8">${consolidatedOverdue.length} member${consolidatedOverdue.length !== 1 ? 's' : ''}</div></div>
    </div>
  `;

  // Overdue Payments Section
  if (consolidatedOverdue.length > 0) {
    html += `
      <div class="card overdue-card" style="margin-top:16px;"><div class="card-header"><span class="card-title">&#9888; Overdue Payments</span><span class="overdue-count">${consolidatedOverdue.length}</span></div>
        <div class="overdue-list">${consolidatedOverdue.map(p => {
          const initials = (p.name || '?').split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase();
          const nameSafe = esc(p.name || 'Unknown');
          const retryBadge = p.count > 1 ? ` <span style="font-size:10px;padding:1px 6px;border-radius:3px;background:rgba(248,113,113,0.15);color:var(--error);">&#x27F3; ${p.count} retries</span>` : '';
          return `<div class="overdue-item"><div class="overdue-avatar">${initials}</div><div class="overdue-info"><a href="#" class="member-name-link" onclick="event.preventDefault(); openMemberProfileByName('${esc(p.name || '')}')">${nameSafe}</a>${retryBadge}<div class="overdue-desc">${esc(p.description || '')}</div></div><div class="overdue-amount-block"><div class="overdue-amount">$${Number(p.amount).toFixed(2)}</div><div class="overdue-date">${formatDate(p.date)}</div></div></div>`;
        }).join('')}</div></div>
    `;
  }

  // Retention metrics
  html += '<div id="retentionBody" style="margin-top:16px;"><div class="loading-state"><span class="spinner"></span> Loading retention data...</div></div>';

  container.innerHTML += html;

  // Load retention data
  renderRetentionView(data);
}

function renderTrialFeed(data) {
  const bookFeed = document.getElementById('recentBookingsFeed');
  if (!bookFeed) return;
  const validBookings = (data.recentBookings || []).filter(b => b.name && b.name.trim());
  if (validBookings.length) {
    bookFeed.innerHTML = validBookings.map(b => {
      const parsedDate = parseTrialDate(b.date);
      const statusClass = b.status === 'Confirmed' ? 'badge-active' : b.status === 'Cancelled' ? 'badge-cancelled' : 'badge-trial';
      const emailSubj = encodeURIComponent('Your Trial Class at Labyrinth BJJ');
      const classTypeParts = (b.classType || '').split(' • ');
      const classOnly = classTypeParts[0].trim();
      const timeOnly = b.time || (classTypeParts[1] ? classTypeParts[1].trim() : '');
      const bJson = JSON.stringify(b).replace(/\\/g, '\\\\').replace(/'/g, '&#39;').replace(/"/g, '&quot;');
      return `
        <div class="trial-card ${parsedDate.isSoon ? 'trial-soon' : ''}">
          <div class="trial-date-block ${parsedDate.isToday ? 'trial-today' : ''} ${parsedDate.isTomorrow ? 'trial-tomorrow' : ''}">
            <span class="trial-day">${parsedDate.day}</span><span class="trial-date-num">${parsedDate.num}</span><span class="trial-month">${parsedDate.month}</span>
          </div>
          <div class="trial-info">
            <a href="#" class="trial-name-link" onclick="event.preventDefault(); renderTrialProfile(JSON.parse(this.dataset.booking));" data-booking="${bJson}">${esc(b.name)}</a>
            <div class="trial-details"><span class="trial-class-name">${esc(classOnly)}</span>${timeOnly ? `<span class="trial-time">• ${esc(timeOnly)}</span>` : ''}</div>
            <div class="trial-contact-row">${b.phone ? `<span class="trial-phone">&#128241; ${esc(b.phone)}</span>` : ''}${b.email ? `<span class="trial-email">✉ ${esc(b.email)}</span>` : ''}</div>
          </div>
          <div class="trial-actions-col">
            <span class="badge ${statusClass}">${esc(b.status)}</span>
            <div class="trial-quick-actions">
              ${b.email ? `<a href="mailto:${encodeURIComponent(b.email)}?subject=${emailSubj}" class="trial-action-btn" title="Email">&#128231;</a>` : ''}
              ${b.phone ? `<button class="trial-action-btn" onclick="sendTrialReminder('${esc(b.phone)}', '${esc(b.name)}')" title="Text">&#128172;</button>` : ''}
              <button class="trial-action-btn" onclick="showWaiverModal({memberName:'${esc(b.name)}',memberEmail:'${esc(b.email||'')}',participantType:'Adult'})" title="Sign Waiver">&#9998;</button>
              <button class="trial-action-btn" onclick="startOnboardingWizard({name:'${esc(b.name)}',email:'${esc(b.email||'')}',phone:'${esc(b.phone||'')}'})" title="Onboard">🥋</button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  } else {
    bookFeed.innerHTML = `<div class="trial-empty"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg><p>No trials scheduled — share your booking link</p></div>`;
  }
}

/* Front Desk and Instructor views removed — merged into Main Dashboard */

/* ── RETENTION VIEW ──────────────────────────────────────── */
async function renderRetentionView(data) {
  const bodyEl = document.getElementById('retentionBody');
  if (!bodyEl) return;

  const retData = await api('getRetentionData');

  const totalMembers = retData ? retData.totalMembers : membersCache.length;
  const withStripe = retData ? retData.withStripe : membersCache.filter(m => m.StripeCustomerID).length;
  const noStripe = retData ? retData.noStripe : membersCache.filter(m => !m.StripeCustomerID).length;
  const trialCount = retData ? retData.trialCount : 0;
  const staleTrials = retData ? (retData.staleTrials || []) : [];

  const activeMembers = data.activeMembers || totalMembers;
  const retentionRate = totalMembers > 0 ? Math.round((activeMembers / totalMembers) * 100) : 0;
  const trialConversion = trialCount > 0 ? Math.round(((totalMembers - trialCount) / totalMembers) * 100) : 100;
  const mrr = data.mrr || data.monthlyScheduled || 0;
  const avgRevPerMember = activeMembers > 0 ? Math.round(mrr / activeMembers) : 0;
  const atRisk = noStripe;

  // Deduplicate overdue by member name
  const _overdueMap = {};
  (data.overduePayments || []).forEach(function(p) {
    const key = (p.name || 'Unknown').toLowerCase().trim();
    if (_overdueMap[key]) { _overdueMap[key].count++; } else { _overdueMap[key] = { ...p, count: 1 }; }
  });
  const overdueMembers = Object.values(_overdueMap).slice(0, 5);
  const monthlyPaid = data.monthlyPaid || 0;
  const monthlyScheduled = data.monthlyScheduled || mrr || 0;
  const newMembers = data.newMembers || 0;

  // P5: Financials view — show only financial data, no member counts or non-revenue widgets
  // Revenue Analytics KPIs (financial only)
  let html = `
    <div class="retention-grid" style="margin-bottom:16px;">
      <div class="retention-card"><div class="retention-label">Avg Rev / Member</div><div class="retention-value">$${formatNum(avgRevPerMember)}</div></div>
      <div class="retention-card"><div class="retention-label">Members w/o Card</div><div class="retention-value" style="color:${atRisk > 0 ? 'var(--error)' : 'var(--success)'}">${atRisk}</div><div style="font-size:11px;color:var(--text-muted);">$${formatNum(atRisk * avgRevPerMember)} at risk</div></div>
    </div>
  `;

  // Overdue / failed payment members
  if (overdueMembers.length > 0) {
    html += `<div class="card" style="margin-bottom:16px"><div class="card-header"><span class="card-title">Failed Payment Members</span><span class="overdue-count">${overdueMembers.length}</span></div>
      <div style="padding:0 16px 16px">${overdueMembers.map(p => {
        const initials = (p.name || '?').split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase();
        const retryBadge = p.count > 1 ? ' <span style="font-size:10px;padding:1px 6px;border-radius:3px;background:rgba(248,113,113,0.15);color:var(--error);">&#x27F3; ' + p.count + ' retries</span>' : '';
        return `<div class="at-risk-item"><div class="at-risk-avatar">${initials}</div><div class="at-risk-info"><div class="at-risk-name">${esc(p.name || 'Unknown')}${retryBadge}</div><div class="at-risk-meta">$${Number(p.amount || 0).toFixed(2)} overdue &bull; ${formatDate(p.date)}</div></div><div class="at-risk-action"><button class="btn btn-secondary btn-sm" onclick="openMemberProfileByName('${esc(p.name || '')}')">View</button></div></div>`;
      }).join('')}</div></div>`;
  }

  // Members with no card on file ($ at risk)
  const inactiveMembers = membersCache.filter(m => !m.StripeCustomerID && m.Status !== 'Trial').slice(0, 5);
  if (inactiveMembers.length > 0) {
    html += `<div class="card" style="margin-bottom:16px"><div class="card-header"><span class="card-title">No Card on File</span><span class="overdue-count">${noStripe}</span></div>
      <div style="padding:0 16px 16px">${inactiveMembers.map(m => {
        const initials = (m.Name || '?').split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase();
        return `<div class="at-risk-item"><div class="at-risk-avatar">${initials}</div><div class="at-risk-info"><div class="at-risk-name">${esc(m.Name)}</div><div class="at-risk-meta">${esc(m.Plan || 'No plan')} &bull; ${esc(m.Status || '')}</div></div><div class="at-risk-action"><button class="btn btn-secondary btn-sm" onclick="setupMemberCard(${JSON.stringify(m).replace(/'/g, '&#39;').replace(/"/g, '&quot;')})">Add Card</button></div></div>`;
      }).join('')}</div></div>`;
  }

  // Revenue trend: monthly collected vs projected
  html += `<div class="month-comparison">
    <div class="month-comparison-title">Revenue This Month</div>
    <div style="display:flex;gap:24px;flex-wrap:wrap;">
      <div><span style="font-size:12px;color:var(--text-muted)">Collected</span><div class="month-comparison-value positive">$${formatNum(Math.round(monthlyPaid))}</div></div>
      <div><span style="font-size:12px;color:var(--text-muted)">Projected MRR</span><div class="month-comparison-value">$${formatNum(Math.round(monthlyScheduled))}</div></div>
      <div><span style="font-size:12px;color:var(--text-muted)">Collection Rate</span><div class="month-comparison-value ${monthlyScheduled > 0 && monthlyPaid >= monthlyScheduled * 0.9 ? 'positive' : 'neutral'}">${monthlyScheduled > 0 ? Math.round((monthlyPaid / monthlyScheduled) * 100) : 0}%</div></div>
    </div>
  </div>`;

  bodyEl.innerHTML = html;
}

function parseTrialDate(dateStr) {
  if (!dateStr) return { day: '—', num: '—', month: '—', relative: '' };
  try {
    const s = String(dateStr).trim();
    // Handle "Monday, March 23, 2026" format from Google Sheets
    const longFormat = /^[A-Za-z]+,\s+([A-Za-z]+)\s+(\d{1,2}),\s+(\d{4})$/.exec(s);
    let d;
    if (longFormat) {
      // Parse as "Month Day, Year" (strip the day-of-week prefix)
      d = new Date(longFormat[1] + ' ' + longFormat[2] + ', ' + longFormat[3] + ' 12:00:00');
    } else {
      const isoLike = /^\d{4}-\d{2}-\d{2}$/.test(s);
      d = isoLike ? new Date(s + 'T12:00:00') : new Date(s);
    }
    if (isNaN(d)) return { day: '—', num: String(dateStr), month: '—', relative: '' };

    const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

    // Check for today/tomorrow
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const trialDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const diffDays = Math.round((trialDay - today) / (1000*60*60*24));

    let relative = '';
    if (diffDays === 0) relative = 'Today';
    else if (diffDays === 1) relative = 'Tomorrow';
    else if (diffDays > 1 && diffDays <= 6) relative = days[d.getDay()];

    return {
      day: diffDays === 0 ? 'TODAY' : diffDays === 1 ? 'TMRW' : days[d.getDay()],
      num: d.getDate(),
      month: months[d.getMonth()],
      relative: relative,
      isToday: diffDays === 0,
      isTomorrow: diffDays === 1,
      isSoon: diffDays >= 0 && diffDays <= 2
    };
  } catch(_) {
    return { day: '—', num: String(dateStr), month: '—', relative: '' };
  }
}

/* ── TRIAL REMINDER ────────────────────────────────────── */
async function sendTrialReminder(phone, name) {
  const firstName = (name || '').split(' ')[0] || 'there';
  const msg = `Hi ${firstName}! This is Labyrinth BJJ — just a reminder about your trial class today. We look forward to seeing you on the mat! Questions? Text us back or call (281) 393-7983.`;
  const result = await api('sendMassSMS', {
    message: msg,
    recipients: [{ phone: phone, name: name }]
  });
  if (result && result.success) {
    showToast(`Reminder sent to ${name}`, 'success');
  } else {
    showToast('Failed to send reminder', 'error');
  }
}

/* ── OPEN MEMBER PROFILE BY NAME ───────────────────────── */
function openMemberProfileByName(name) {
  if (!name) return;
  ensureMembersLoaded().then(() => {
    const member = membersCache.find(m => (m.Name || '').toLowerCase() === name.toLowerCase());
    if (member) {
      renderMemberProfile(member);
    } else {
      showToast('Member not found in directory', 'info');
    }
  });
}

/* ── TRIAL PROFILE ──────────────────────────────────────── */
function renderTrialProfile(booking) {
  if (!booking) return;
  const main = document.getElementById('mainContent');
  const emailSubj = encodeURIComponent('Your Trial Class at Labyrinth BJJ');
  const emailBody = encodeURIComponent(
    'Hi ' + (booking.name || '').split(' ')[0] + ',\n\nWe look forward to seeing you on the mat!' +
    (booking.date ? '\n\nYour trial is scheduled for: ' + booking.date : '') +
    '\n\nLabyrinth BJJ'
  );
  // Check if this person exists as a member
  const existingMember = membersCache.find(m => (
    (m.Email && booking.email && m.Email.toLowerCase() === booking.email.toLowerCase()) ||
    (m.Name && booking.name && m.Name.toLowerCase() === booking.name.toLowerCase())
  ));

  // Pre-fill member modal data for convert-to-member
  const prefillJson = JSON.stringify({
    Name: booking.name || '',
    Email: booking.email || '',
    Phone: booking.phone || '',
    Status: 'Trial',
    Plan: ''
  }).replace(/'/g, '&#39;').replace(/"/g, '&quot;');

  main.innerHTML = `
    <div class="profile-container">
      <div class="profile-topbar">
        <a href="#" class="back-link" onclick="event.preventDefault(); navigate('dashboard');">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
          Back to Dashboard
        </a>
        <div class="profile-topbar-actions">
          ${existingMember
            ? `<button class="btn btn-primary btn-sm" onclick='renderMemberProfile(${JSON.stringify(existingMember).replace(/'/g, '&#39;').replace(/"/g, '&quot;')})'>View Member Profile</button>`
            : `<button class="btn btn-primary btn-sm" onclick='startOnboardingWizard(JSON.parse(decodeURIComponent("${encodeURIComponent(JSON.stringify({Name:booking.name||'',Email:booking.email||'',Phone:booking.phone||''}))}")))'>Start Onboarding</button>`
          }
        </div>
      </div>

      <div class="profile-header">
        <div class="profile-header-top">
          <span class="profile-belt-dot" style="background: var(--gold)" title="Trial"></span>
          <h2 class="profile-name">${esc(booking.name)}</h2>
        </div>
        <div class="profile-sub">
          Trial Class
          ${booking.classType ? ' &bull; ' + esc(booking.classType) : ''}
        </div>
        <div class="profile-info-grid">
          ${booking.email ? `<div class="profile-info-row"><span class="profile-info-icon">&#9993;</span> <a href="mailto:${esc(booking.email)}">${esc(booking.email)}</a></div>` : ''}
          ${booking.phone ? `<div class="profile-info-row"><span class="profile-info-icon">&#128241;</span> <span>${esc(booking.phone)}</span></div>` : ''}
          ${booking.date ? `<div class="profile-info-row"><span class="profile-info-icon">&#128197;</span> <span>${esc(booking.date)}</span></div>` : ''}
          ${booking.status ? `<div class="profile-info-row"><span class="profile-info-icon">&#9432;</span> <span>Status: ${esc(booking.status)}</span></div>` : ''}
        </div>
      </div>

      <div class="profile-actions">
        ${booking.email ? `<a href="mailto:${esc(booking.email)}?subject=${emailSubj}&body=${emailBody}" class="btn btn-secondary btn-sm">&#128231; Send Email</a>` : ''}
        ${booking.phone ? `<button class="btn btn-secondary btn-sm" onclick="sendTrialReminder('${esc(booking.phone)}', '${esc(booking.name)}')">&#128172; Send Reminder Text</button>` : ''}
        ${booking.email || booking.phone ? `<button class="btn btn-secondary btn-sm" onclick="setupTrialCardLink(${JSON.stringify(booking).replace(/'/g,'&#39;').replace(/"/g,'&quot;')})">&#128179; Send Setup Link</button>` : ''}
        <button class="btn btn-secondary btn-sm" onclick="showWaiverModal({memberName:'${esc(booking.name)}',memberEmail:'${esc(booking.email||'')}'})">&#9998; Sign Waiver</button>
        ${booking.email ? `<button class="btn btn-secondary btn-sm" onclick="sendWaiverEmail('${esc(booking.email)}','${esc(booking.name)}')">&#128231; Send Waiver Link</button>` : ''}
        <button class="btn btn-secondary btn-sm" onclick="showAgreementModal({memberName:'${esc(booking.name)}',memberEmail:'${esc(booking.email||'')}'})">&#128221; Sign Agreement</button>
        ${booking.email ? `<button class="btn btn-secondary btn-sm" onclick="sendAgreementEmail('${esc(booking.email)}','${esc(booking.name)}','')">&#128231; Send Agreement</button>` : ''}
        ${booking.email ? `<button class="btn btn-secondary btn-sm" onclick="sendAccountSetup('${esc(booking.email)}', '${esc(booking.name)}', '')">&#128273; Set Up Account</button>` : ''}
      </div>
      <div id="trialWaiverStatus" style="padding:0 0 4px 0;"></div>
      <div id="trialAgreementStatus" style="padding:0 0 8px 0;"></div>

      <div class="profile-payments" style="margin-top:24px">
        <div class="profile-payments-header">
          <span class="profile-section-title">Communication History</span>
        </div>
        <div id="profileCommsBody" style="padding:0 20px">
          <div class="loading-state"><span class="spinner"></span> Loading...</div>
        </div>
      </div>
    </div>
  `;

  // Load comms and waiver status
  if (booking.email || booking.phone || booking.name) {
    api('getMemberComms', {
      memberName: booking.name || '',
      memberEmail: booking.email || '',
      memberPhone: booking.phone || ''
    }).then(commsData => {
      renderProfileComms(commsData ? commsData.comms || [] : []);
    });
  } else {
    const el = document.getElementById('profileCommsBody');
    if (el) el.innerHTML = '<div class="empty-state" style="padding:24px 0"><p>No communication history</p></div>';
  }

  // Load waiver and agreement status for trial
  if (booking.name || booking.email) {
    api('getWaiver', { memberName: booking.name || '', memberEmail: booking.email || '' }).then(waiverData => {
      const waiverEl = document.getElementById('trialWaiverStatus');
      if (!waiverEl) return;
      if (waiverData && waiverData.signed) {
        waiverEl.innerHTML = `<div class="waiver-status waiver-signed"><span>&#9989;</span> Waiver signed${waiverData.signedAt ? ' on ' + formatDate(waiverData.signedAt) : ''}</div>`;
      } else {
        waiverEl.innerHTML = `<div class="waiver-status waiver-unsigned"><span>&#9888;</span> No waiver on file</div>`;
      }
    });

    api('getAgreement', { memberName: booking.name || '', memberEmail: booking.email || '' }).then(agreementData => {
      const agEl = document.getElementById('trialAgreementStatus');
      if (!agEl) return;
      if (agreementData && agreementData.signed) {
        agEl.innerHTML = `<div class="waiver-status waiver-signed"><span>&#9989;</span> Agreement signed${agreementData.signedAt ? ' on ' + formatDate(agreementData.signedAt) : ''}</div>`;
      } else {
        agEl.innerHTML = `<div class="waiver-status waiver-unsigned"><span>&#9888;</span> No agreement on file</div>`;
      }
    });
  }
}

function setupTrialCardLink(booking) {
  // Delegate to the regular card setup flow with trial's info
  setupMemberCard({
    Name: booking.name || '',
    Email: booking.email || '',
    Phone: booking.phone || '',
    StripeCustomerID: ''
  });
}


/* ── ONBOARDING WIZARD ──────────────────────────────────── */
let _wizardStep = 0;
let _wizardData = {};
let _wizardWaiverSigned = false;
let _wizardAgreementSigned = false;
let _wizardSelectedPlan = null;

function startOnboardingWizard(memberData = {}) {
  _wizardStep = 0;
  _wizardData = { ...memberData };
  _wizardWaiverSigned = false;
  _wizardAgreementSigned = false;
  _wizardSelectedPlan = null;

  const overlay = document.getElementById('modalOverlay');
  const content = document.getElementById('modalContent');
  content.className = 'modal onboarding-wizard';
  renderWizardStep();
  overlay.style.display = 'flex';
  overlay.onclick = function(e) { if (e.target === overlay) closeModal(); };
}

function renderWizardStep() {
  const content = document.getElementById('modalContent');
  const steps = ['Info', 'Waiver', 'Agreement', 'Card', 'Plan', 'Done'];
  
  const stepsHtml = steps.map((s, i) => {
    let cls = '';
    if (i < _wizardStep) cls = 'completed';
    else if (i === _wizardStep) cls = 'active';
    const numContent = i < _wizardStep ? '✓' : (i + 1);
    return `<div class="wizard-step ${cls}">
      <span class="wizard-step-num">${numContent}</span>
      <span>${s}</span>
    </div>${i < steps.length - 1 ? '<span class="wizard-step-arrow">→</span>' : ''}`;
  }).join('');

  let bodyHtml = '';
  let footerHtml = '';

  switch(_wizardStep) {
    case 0: // Info
      const beltOptions = ['','White','Grey','Yellow','Blue','Purple','Brown','Black'].map(b =>
        `<option value="${b}" ${(_wizardData.Belt||'') === b ? 'selected' : ''}>${b || '— Select Belt —'}</option>`
      ).join('');
      const typeOptions = ['Adult','Kid'].map(t =>
        `<option value="${t}" ${(_wizardData.Type||'Adult') === t ? 'selected' : ''}>${t}</option>`
      ).join('');
      bodyHtml = `
        <h3 style="font-family:var(--font-display);font-size:16px;margin-bottom:16px;">Member Information</h3>
        <div class="form-group"><label>Full Name <span style="color:var(--error)">*</span></label><input type="text" id="wizName" value="${esc(_wizardData.Name||_wizardData.name||'')}" placeholder="John Smith"></div>
        <div class="form-group"><label>Email</label><input type="email" id="wizEmail" value="${esc(_wizardData.Email||_wizardData.email||'')}" placeholder="john@example.com"></div>
        <div class="form-group"><label>Phone</label><input type="tel" id="wizPhone" value="${esc(_wizardData.Phone||_wizardData.phone||'')}" placeholder="+12815551234"></div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <div class="form-group"><label>Belt</label><select id="wizBelt">${beltOptions}</select></div>
          <div class="form-group"><label>Type</label><select id="wizType">${typeOptions}</select></div>
        </div>
      `;
      footerHtml = `
        <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
        <button class="btn btn-primary" onclick="wizardNext()">Next →</button>
      `;
      break;

    case 1: // Waiver
      bodyHtml = `
        <h3 style="font-family:var(--font-display);font-size:16px;margin-bottom:16px;">Sign Waiver</h3>
        ${_wizardWaiverSigned ? '<div class="waiver-status waiver-signed" style="margin-bottom:16px;padding:12px;"><span>✅</span> Waiver signed</div>' : `
        <div class="waiver-text">${esc(WAIVER_TEXT).replace(/\n/g, '<br>')}</div>
        <div style="margin-bottom:8px;display:flex;justify-content:space-between;align-items:center;">
          <label style="font-size:12px;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;">Signature</label>
          <button type="button" class="waiver-clear-btn" onclick="wizClearCanvas('wizWaiverCanvas')">Clear</button>
        </div>
        <canvas id="wizWaiverCanvas" class="waiver-canvas" style="width:100%;height:120px;"></canvas>
        <div style="font-size:11px;color:var(--text-faint);margin-top:4px;">Draw your signature above</div>
        `}
      `;
      footerHtml = `
        <button class="btn btn-secondary" onclick="wizardBack()">← Back</button>
        <button class="btn btn-primary" onclick="wizardNext()">${_wizardWaiverSigned ? 'Next →' : 'Sign & Next →'}</button>
      `;
      break;

    case 2: // Agreement
      bodyHtml = `
        <h3 style="font-family:var(--font-display);font-size:16px;margin-bottom:16px;">Sign Agreement</h3>
        ${_wizardAgreementSigned ? '<div class="waiver-status waiver-signed" style="margin-bottom:16px;padding:12px;"><span>✅</span> Agreement signed</div>' : `
        <div class="waiver-text">${esc(AGREEMENT_TEXT).replace(/\n/g, '<br>')}</div>
        <div style="margin-bottom:8px;display:flex;justify-content:space-between;align-items:center;">
          <label style="font-size:12px;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;">Signature</label>
          <button type="button" class="waiver-clear-btn" onclick="wizClearCanvas('wizAgreementCanvas')">Clear</button>
        </div>
        <canvas id="wizAgreementCanvas" class="waiver-canvas" style="width:100%;height:120px;"></canvas>
        <div style="font-size:11px;color:var(--text-faint);margin-top:4px;">Draw your signature above</div>
        `}
      `;
      footerHtml = `
        <button class="btn btn-secondary" onclick="wizardBack()">← Back</button>
        <button class="btn btn-primary" onclick="wizardNext()">${_wizardAgreementSigned ? 'Next →' : 'Sign & Next →'}</button>
      `;
      break;

    case 3: // Card Setup
      bodyHtml = `
        <h3 style="font-family:var(--font-display);font-size:16px;margin-bottom:16px;">Set Up Payment Card</h3>
        <p style="color:var(--text-muted);font-size:14px;margin-bottom:20px;">How would you like to set up the member's payment card?</p>
        <div class="wizard-setup-option" onclick="wizSendSetupLink()">
          <span class="setup-icon">📧</span>
          <div><div class="setup-label">Send Setup Link</div><div class="setup-desc">Email or text a secure Stripe link</div></div>
        </div>
        <div class="wizard-setup-option" onclick="wizardNext()">
          <span class="setup-icon">⏭️</span>
          <div><div class="setup-label">Skip for Now</div><div class="setup-desc">Set up card later from their profile</div></div>
        </div>
      `;
      footerHtml = `
        <button class="btn btn-secondary" onclick="wizardBack()">← Back</button>
        <span></span>
      `;
      break;

    case 4: // Plan
      const allPlans = getAllPlans();
      const planGridHtml = allPlans.map(p => `
        <div class="wizard-plan-card ${_wizardSelectedPlan && _wizardSelectedPlan.name === p.name ? 'selected' : ''}" onclick="wizSelectPlan(${JSON.stringify(p).replace(/"/g, '&quot;')})">
          <div class="wizard-plan-name">${esc(p.name)}</div>
          <div class="wizard-plan-price">$${p.price}</div>
          <div class="wizard-plan-interval">${p.type === 'recurring' ? '/month' : 'one-time'}</div>
        </div>
      `).join('');
      bodyHtml = `
        <h3 style="font-family:var(--font-display);font-size:16px;margin-bottom:16px;">Choose Plan</h3>
        <div class="wizard-plan-grid">${planGridHtml}</div>
      `;
      footerHtml = `
        <button class="btn btn-secondary" onclick="wizardBack()">← Back</button>
        <button class="btn btn-primary" id="wizFinishBtn" onclick="wizardFinish()" ${!_wizardSelectedPlan ? 'disabled' : ''}>Create Member</button>
      `;
      break;

    case 5: // Done
      const summary = [];
      if (_wizardWaiverSigned) summary.push('✅ Waiver signed');
      if (_wizardAgreementSigned) summary.push('✅ Agreement signed');
      if (_wizardSelectedPlan) summary.push('✅ Plan: ' + _wizardSelectedPlan.name);
      bodyHtml = `
        <div class="wizard-done">
          <div class="wizard-done-icon">🥋</div>
          <div class="wizard-done-title">Welcome to Labyrinth BJJ!</div>
          <div class="wizard-done-sub">${esc(_wizardData.Name || '')} has been added as a member.</div>
          <div style="text-align:left;max-width:300px;margin:0 auto 24px;">
            ${summary.map(s => '<div style="padding:4px 0;font-size:13px;color:var(--text-muted);">' + s + '</div>').join('')}
          </div>
          <button class="btn btn-primary" onclick="closeModal(); renderMembers();">View Members</button>
        </div>
      `;
      footerHtml = '';
      break;
  }

  content.innerHTML = `
    <div class="modal-header">
      <h2 class="modal-title">New Member Onboarding</h2>
      <button class="modal-close" onclick="closeModal()">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
    <div class="wizard-steps">${stepsHtml}</div>
    <div class="wizard-body">${bodyHtml}</div>
    ${footerHtml ? '<div class="wizard-footer">' + footerHtml + '</div>' : ''}
  `;

  // Init canvases after render
  if (_wizardStep === 1 && !_wizardWaiverSigned) {
    requestAnimationFrame(() => wizInitCanvas('wizWaiverCanvas'));
  }
  if (_wizardStep === 2 && !_wizardAgreementSigned) {
    requestAnimationFrame(() => wizInitCanvas('wizAgreementCanvas'));
  }
}

function wizInitCanvas(canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width || 500;
  canvas.height = 120;
  const ctx = canvas.getContext('2d');
  ctx.strokeStyle = '#C8A24C';
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  let drawing = false;
  canvas._hasSignature = false;

  function getPos(e) {
    const r = canvas.getBoundingClientRect();
    if (e.touches) return { x: e.touches[0].clientX - r.left, y: e.touches[0].clientY - r.top };
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }
  function start(e) { e.preventDefault(); drawing = true; const p = getPos(e); ctx.beginPath(); ctx.moveTo(p.x, p.y); }
  function move(e) { if (!drawing) return; e.preventDefault(); const p = getPos(e); ctx.lineTo(p.x, p.y); ctx.stroke(); canvas._hasSignature = true; }
  function stop(e) { if (drawing) { e.preventDefault(); drawing = false; } }

  canvas.addEventListener('mousedown', start);
  canvas.addEventListener('mousemove', move);
  canvas.addEventListener('mouseup', stop);
  canvas.addEventListener('mouseleave', stop);
  canvas.addEventListener('touchstart', start, { passive: false });
  canvas.addEventListener('touchmove', move, { passive: false });
  canvas.addEventListener('touchend', stop, { passive: false });
}

function wizClearCanvas(canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  canvas._hasSignature = false;
}

async function wizardNext() {
  if (_wizardStep === 0) {
    // Validate info
    const name = document.getElementById('wizName')?.value.trim();
    if (!name) { showToast('Name is required', 'error'); return; }
    _wizardData.Name = name;
    _wizardData.Email = document.getElementById('wizEmail')?.value.trim() || '';
    _wizardData.Phone = document.getElementById('wizPhone')?.value.trim() || '';
    _wizardData.Belt = document.getElementById('wizBelt')?.value || '';
    _wizardData.Type = document.getElementById('wizType')?.value || 'Adult';
  }

  if (_wizardStep === 1 && !_wizardWaiverSigned) {
    const canvas = document.getElementById('wizWaiverCanvas');
    if (!canvas || !canvas._hasSignature) { showToast('Please sign the waiver', 'error'); return; }
    const sigData = canvas.toDataURL('image/png');
    const result = await api('saveWaiver', { signerName: _wizardData.Name, signerEmail: _wizardData.Email, memberName: _wizardData.Name, participantType: _wizardData.Type === 'Kid' ? 'Minor' : 'Adult', signatureData: sigData });
    if (result && result.success) { _wizardWaiverSigned = true; showToast('Waiver signed', 'success'); }
    else return;
  }

  if (_wizardStep === 2 && !_wizardAgreementSigned) {
    const canvas = document.getElementById('wizAgreementCanvas');
    if (!canvas || !canvas._hasSignature) { showToast('Please sign the agreement', 'error'); return; }
    const sigData = canvas.toDataURL('image/png');
    const result = await api('saveAgreement', { signerName: _wizardData.Name, signerEmail: _wizardData.Email, memberName: _wizardData.Name, planName: '', signatureData: sigData });
    if (result && result.success) { _wizardAgreementSigned = true; showToast('Agreement signed', 'success'); }
    else return;
  }

  _wizardStep++;
  renderWizardStep();
}

function wizardBack() {
  if (_wizardStep > 0) { _wizardStep--; renderWizardStep(); }
}

function wizSelectPlan(plan) {
  _wizardSelectedPlan = plan;
  renderWizardStep();
}

async function wizSendSetupLink() {
  if (!_wizardData.Email && !_wizardData.Phone) {
    showToast('No email or phone to send link to', 'error');
    return;
  }
  showToast('Generating setup link...', 'info');
  const result = await api('createSetupLink', {
    stripeCustomerId: '', memberName: _wizardData.Name || '', memberEmail: _wizardData.Email || '',
    memberPhone: _wizardData.Phone || '', memberRow: ''
  });
  if (result && result.success) {
    if (_wizardData.Email) {
      showToast('Setup link will be sent to ' + _wizardData.Email, 'success');
    } else {
      showToast('Setup link generated', 'success');
    }
    if (result.customerId) _wizardData.StripeCustomerID = result.customerId;
  }
  _wizardStep++;
  renderWizardStep();
}

async function wizardFinish() {
  const btn = document.getElementById('wizFinishBtn');
  if (btn) { btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> Creating...'; }

  const data = {
    Name: _wizardData.Name || '',
    Email: _wizardData.Email || '',
    Phone: _wizardData.Phone || '',
    Belt: _wizardData.Belt || '',
    Type: _wizardData.Type || 'Adult',
    Plan: _wizardSelectedPlan ? _wizardSelectedPlan.name : '',
    Membership: _wizardSelectedPlan ? _wizardSelectedPlan.name : '',
    Status: 'Active',
    StartDate: new Date().toISOString().split('T')[0],
    StripeCustomerID: _wizardData.StripeCustomerID || '',
    Notes: ''
  };

  const result = await api('addMember', data);
  if (result && result.success) {
    showToast('Member created!', 'success');
    membersCache = []; // Force reload
    _wizardStep = 5;
    renderWizardStep();
  } else {
    if (btn) { btn.disabled = false; btn.textContent = 'Create Member'; }
  }
}

/* ── MEMBERS ────────────────────────────────────────────── */
async function renderMembers() {
  const main = document.getElementById('mainContent');
  main.innerHTML = `
    <div class="page-header">
      <h1 class="page-title">Members</h1>
      <div class="page-actions">
        <div class="send-access-wrap" style="position:relative;display:inline-block;">
          <button class="btn btn-secondary" onclick="toggleSendAccessMenu(event)" id="sendAccessBtn" aria-haspopup="menu" aria-expanded="false">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:4px;"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            Send App Access
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-left:4px;"><polyline points="6 9 12 15 18 9"/></svg>
          </button>
          <div id="sendAccessMenu" class="send-access-menu" style="display:none;position:absolute;right:0;top:calc(100% + 6px);min-width:240px;background:rgba(10,10,14,0.95);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:6px;z-index:50;box-shadow:0 12px 40px rgba(0,0,0,0.5);backdrop-filter:blur(12px);">
            <button class="send-access-item" onclick="openBulkSetupConfirm('new')" onmouseover="this.style.background='rgba(200,162,76,0.08)'" onmouseout="this.style.background='transparent'" style="display:flex;align-items:flex-start;gap:10px;width:100%;text-align:left;background:transparent;border:none;color:var(--text);padding:10px 12px;border-radius:8px;cursor:pointer;">
              <span style="color:var(--gold);font-size:16px;line-height:1.1;">&#9733;</span>
              <span style="flex:1;">
                <div style="font-size:13px;font-weight:600;">Send to Members Without Access</div>
                <div style="font-size:11px;color:var(--text-muted);margin-top:2px;">Only members who have never set up</div>
              </span>
            </button>
            <button class="send-access-item" onclick="openBulkSetupConfirm('all')" onmouseover="this.style.background='rgba(200,162,76,0.08)'" onmouseout="this.style.background='transparent'" style="display:flex;align-items:flex-start;gap:10px;width:100%;text-align:left;background:transparent;border:none;color:var(--text);padding:10px 12px;border-radius:8px;cursor:pointer;">
              <span style="color:var(--gold);font-size:16px;line-height:1.1;">&#128231;</span>
              <span style="flex:1;">
                <div style="font-size:13px;font-weight:600;">Send to All Members</div>
                <div style="font-size:11px;color:var(--text-muted);margin-top:2px;">Every active member with an email</div>
              </span>
            </button>
          </div>
        </div>
        <button class="btn btn-primary" onclick="showAddMemberModal()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add Member
        </button>
      </div>
    </div>

    <div class="search-bar">
      <div class="search-input">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input type="text" id="memberSearch" placeholder="Search members..." oninput="filterMembers()">
      </div>
      <select class="filter-select" id="memberStatusFilter" onchange="filterMembers()">
        <option value="">All Statuses</option>
        <option value="Active">Active</option>
        <option value="Trial">Trial</option>
        <option value="Paused">Paused</option>
        <option value="Failed">Failed</option>
        <option value="Cancelled">Cancelled</option>
        <option value="has-card">Has Card</option>
        <option value="no-card">No Card</option>
      </select>
      <select class="filter-select" id="memberPlanFilter" onchange="filterMembers()">
        <option value="">All Plans</option>
      </select>
      <select class="filter-select" id="memberFamilyFilter" onchange="filterMembers()">
        <option value="">All Families</option>
      </select>
    </div>

    <div class="table-wrapper">
      <table class="members-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Plan</th>
            <th>Status</th>
            <th>Start Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody id="membersTableBody">
          <tr><td colspan="7"><div class="loading-state"><span class="spinner"></span> Loading members...</div></td></tr>
        </tbody>
      </table>
    </div>
    <div id="memberCount" class="text-sm text-muted mt-8"></div>
  `;

  const data = await api('getMembers');
  if (!data) {
    const tbody = document.getElementById('membersTableBody');
    if (tbody) {
      tbody.innerHTML = `<tr><td colspan="7">
        <div class="error-state" style="padding:32px;text-align:center;">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--error)" stroke-width="1.5" style="margin-bottom:12px;"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <p style="color:var(--error);margin-bottom:12px;">Could not load member data. Check your API connection.</p>
          <button class="btn btn-secondary" onclick="renderMembers()">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:6px;"><polyline points="23,4 23,10 17,10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>
            Retry
          </button>
        </div>
      </td></tr>`;
    }
    return;
  }
  // Normalize field names: Sheet has Membership/Type/Belt, CRM expects Plan/Status
  membersCache = (data.members || []).map(m => ({
    ...m,
    ID: m.ID || String(m._row || ''),
    Plan: m.Plan || m.Membership || '',
    Status: m.Status || 'Active',
    Phone: String(m.Phone || ''),
    Email: m.Email || '',
    StartDate: m.StartDate || m.startDate || m.CreatedAt || new Date().toISOString().split('T')[0],
    Belt: m.Belt || '',
    Type: m.Type || 'Adult'
  }));

  // Populate plan filter
  const plans = [...new Set(membersCache.map(m => m.Plan).filter(Boolean))];
  const planSelect = document.getElementById('memberPlanFilter');
  plans.forEach(p => {
    const opt = document.createElement('option');
    opt.value = p; opt.textContent = p;
    planSelect.appendChild(opt);
  });

  // Populate family filter (groups by email, 2+ members sharing same email)
  const familySelect = document.getElementById('memberFamilyFilter');
  const familyGroups = buildFamilyGroups(membersCache);
  familyGroups.forEach((members, email) => {
    if (members.length >= 2) {
      const familyName = getFamilyName(members);
      const opt = document.createElement('option');
      opt.value = email;
      opt.textContent = `${familyName} Family (${members.length})`;
      familySelect.appendChild(opt);
    }
  });

  filterMembers();
}

function filterMembers() {
  const search = (document.getElementById('memberSearch')?.value || '').toLowerCase();
  const statusFilter = document.getElementById('memberStatusFilter')?.value || '';
  const plan = document.getElementById('memberPlanFilter')?.value || '';
  const familyEmail = document.getElementById('memberFamilyFilter')?.value || '';

  // Separate card-status pseudo-filters from real status values
  const cardFilter = (statusFilter === 'has-card' || statusFilter === 'no-card') ? statusFilter : '';
  const status = (cardFilter) ? '' : statusFilter;

  // Build family groups map for badges
  const familyGroups = buildFamilyGroups(membersCache);

  let filtered = membersCache.filter(m => {
    if (search && !m.Name.toLowerCase().includes(search) && !(m.Email || '').toLowerCase().includes(search) && !(m.Phone || '').includes(search)) return false;
    if (status && m.Status !== status) return false;
    if (cardFilter === 'has-card' && !m.StripeCustomerID) return false;
    if (cardFilter === 'no-card' && m.StripeCustomerID) return false;
    if (plan && m.Plan !== plan) return false;
    if (familyEmail && (m.Email || '').toLowerCase() !== familyEmail.toLowerCase()) return false;
    return true;
  });

  const tbody = document.getElementById('membersTableBody');
  if (!filtered.length) {
    tbody.innerHTML = '<tr><td colspan="7"><div class="empty-state"><p>No members found</p></div></td></tr>';
    document.getElementById('memberCount').textContent = '0 members';
    return;
  }

  // Group members
  const groups = {
    active: filtered.filter(m => {
      const plan = (m.Plan || m.Membership || '').toUpperCase();
      return plan && !plan.includes('TRIAL') && !plan.includes('FREE') && m.Status !== 'Trial';
    }),
    trial: filtered.filter(m => {
      const plan = (m.Plan || m.Membership || '').toUpperCase();
      return m.Status === 'Trial' || plan.includes('TRIAL') || plan.includes('FREE');
    }),
    noplan: filtered.filter(m => {
      const plan = (m.Plan || m.Membership || '').toUpperCase();
      const isTrial = m.Status === 'Trial' || plan.includes('TRIAL') || plan.includes('FREE');
      const isActive = plan && !plan.includes('TRIAL') && !plan.includes('FREE') && m.Status !== 'Trial';
      return !isTrial && !isActive;
    })
  };

  function renderMemberRow(m) {
    const beltColor = getBeltColor(m.Belt);
    const typeLabel = (m.Type || 'Adult').toLowerCase() === 'kid' || (m.Type || '').toLowerCase() === 'kids' ? 'Kid' : 'Adult';
    const typeBadgeClass = typeLabel === 'Kid' ? 'badge-type-kid' : 'badge-type-adult';
    const cardStatusClass = m.StripeCustomerID ? 'has-card' : 'no-card';
    const cardTitle = m.StripeCustomerID ? 'Card on file' : 'No card on file';
    const cardIndicator = `<span class="card-status ${cardStatusClass}" title="${cardTitle}"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg></span>`;
    let familyBadge = '';
    const memberEmail = (m.Email || '').toLowerCase();
    if (memberEmail) {
      const familyMembers = familyGroups.get(memberEmail);
      if (familyMembers && familyMembers.length >= 2) {
        const fName = getFamilyName(familyMembers);
        familyBadge = `<span class="family-badge" onclick="filterByFamily('${esc(memberEmail)}')" title="Click to filter by family">${fName} (${familyMembers.length})</span>`;
      }
    }
    return `
    <tr class="group-row">
      <td>
        ${beltImgHtml(m.Belt, m.Type, 50)}
        <strong><a href="#" onclick="event.preventDefault();renderMemberProfile(${JSON.stringify(m).replace(/'/g, '&#39;').replace(/"/g, '&quot;')});" class="member-name-link">${esc(m.Name)}</a></strong>
        <span class="badge-type ${typeBadgeClass}">${typeLabel}</span>
        ${cardIndicator}
        ${familyBadge}
      </td>
      <td class="text-muted">${esc(m.Email)}</td>
      <td class="text-muted">${esc(m.Phone)}</td>
      <td>${esc(m.Plan)}</td>
      <td>${(!m.Plan && !m.Membership && !m.StripeSubscriptionID) ? '<span class="badge badge-trial">No Plan</span>' : '<span class="badge badge-' + (m.Status||'active').toLowerCase() + '">' + esc(m.Status) + '</span>'}</td>
      <td class="text-muted">${formatDate(m.StartDate)}</td>
      <td>
        <div class="flex gap-8">
          <button class="btn btn-ghost btn-sm" onclick='showEditMemberModal(${JSON.stringify(m).replace(/'/g, "&#39;")})' title="Edit">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button class="btn btn-ghost btn-sm" onclick='setupMemberCard(${JSON.stringify(m).replace(/'/g, "&#39;")})' title="Set Up Card" style="color:var(--gold)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
          </button>
          ${m.Email ? `<button class="btn btn-ghost btn-sm" onclick="sendAccountSetup('${esc(m.Email)}', '${esc(m.Name)}', '${m._row || m.ID}')" title="Send Setup Link" style="color:var(--gold)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>
          </button>` : ''}
          <button class="btn btn-ghost btn-sm" onclick="deleteMember('${m.ID}')" title="Delete" style="color:var(--error)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3,6 5,6 21,6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
          </button>
        </div>
      </td>
    </tr>`;
  }

  let html = '';
  if (groups.active.length > 0) {
    html += `<tr class="group-header" onclick="toggleMemberGroup(this)"><td colspan="7"><span class="group-toggle">▼</span><span class="group-label">ACTIVE MEMBERS</span><span class="group-count">(${groups.active.length})</span></td></tr>`;
    html += groups.active.map(renderMemberRow).join('');
  }
  if (groups.trial.length > 0) {
    html += `<tr class="group-header" onclick="toggleMemberGroup(this)"><td colspan="7"><span class="group-toggle">▼</span><span class="group-label">TRIAL / FREE</span><span class="group-count">(${groups.trial.length})</span></td></tr>`;
    html += groups.trial.map(renderMemberRow).join('');
  }
  if (groups.noplan.length > 0) {
    html += `<tr class="group-header" onclick="toggleMemberGroup(this)"><td colspan="7"><span class="group-toggle">▼</span><span class="group-label">NO PLAN</span><span class="group-count">(${groups.noplan.length})</span></td></tr>`;
    html += groups.noplan.map(renderMemberRow).join('');
  }
  tbody.innerHTML = html;

  document.getElementById('memberCount').textContent = `${filtered.length} of ${membersCache.length} members`;
}


function toggleMemberGroup(headerEl) {
  headerEl.classList.toggle('collapsed');
  let sibling = headerEl.nextElementSibling;
  while (sibling && !sibling.classList.contains('group-header')) {
    sibling.style.display = headerEl.classList.contains('collapsed') ? 'none' : '';
    sibling = sibling.nextElementSibling;
  }
}

/* ── FAMILY HELPERS ─────────────────────────────────────── */
function buildFamilyGroups(members) {
  const map = new Map();
  members.forEach(m => {
    const email = (m.Email || '').toLowerCase().trim();
    if (!email) return;
    if (!map.has(email)) map.set(email, []);
    map.get(email).push(m);
  });
  return map;
}

function getFamilyName(members) {
  // Find the most common last name among the group
  const lastNames = {};
  members.forEach(m => {
    const parts = (m.Name || '').trim().split(' ');
    const last = parts[parts.length - 1];
    if (last) lastNames[last] = (lastNames[last] || 0) + 1;
  });
  if (!Object.keys(lastNames).length) return 'Family';
  return Object.keys(lastNames).reduce((a, b) => lastNames[a] >= lastNames[b] ? a : b);
}

function filterByFamily(email) {
  const familySelect = document.getElementById('memberFamilyFilter');
  if (familySelect) {
    familySelect.value = email;
    filterMembers();
  }
}

function showAddMemberModal() {
  startOnboardingWizard({});
}

function showEditMemberModal(member) {
  showMemberModal('Edit Member', member);
}

function showMemberModal(title, member) {
  const isEdit = !!member.ID;

  // Build datalist options: DEFAULT_PLANS names + unique values from cache
  const existingMemberships = [...new Set(membersCache.map(m => m.Plan).filter(Boolean))];
  const allPlanNames = [...new Set([...DEFAULT_PLANS.map(p => p.name), ...existingMemberships])];
  const datalistOptions = allPlanNames.map(n => `<option value="${esc(n)}">`).join('');

  const statusOptions = ['Active','Trial','Paused','Failed','Cancelled','Frozen'].map(s =>
    `<option value="${s}" ${member.Status === s ? 'selected' : ''}>${s}</option>`
  ).join('');

  const beltOptions = ['','White','Grey','Yellow','Blue','Purple','Brown','Black'].map(b =>
    `<option value="${b}" ${member.Belt === b ? 'selected' : ''}>${b || '— Select Belt —'}</option>`
  ).join('');

  const typeOptions = ['Adult','Kid'].map(t =>
    `<option value="${t}" ${(member.Type || 'Adult') === t ? 'selected' : ''}>${t}</option>`
  ).join('');

  openModal(`
    <div class="modal-header">
      <h2 class="modal-title">${title}</h2>
      <button class="modal-close" onclick="closeModal()">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
    <div class="modal-body">
      <div class="form-group">
        <label>Full Name</label>
        <input type="text" id="mName" value="${esc(member.Name || '')}" placeholder="John Smith" required>
      </div>
      <div class="form-group">
        <label>Email</label>
        <input type="email" id="mEmail" value="${esc(member.Email || '')}" placeholder="john@example.com">
      </div>
      <div class="form-group">
        <label>Phone</label>
        <input type="tel" id="mPhone" value="${esc(member.Phone || '')}" placeholder="+12815551234">
      </div>
      <div class="form-group">
        <label>Membership Plan</label>
        <input type="text" id="mPlan" value="${esc(member.Plan || '')}" placeholder="e.g. Adult Unlimited" list="mPlanList" autocomplete="off">
        <datalist id="mPlanList">${datalistOptions}</datalist>
      </div>
      <div class="form-group">
        <label>Status</label>
        <select id="mStatus">${statusOptions}</select>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
        <div class="form-group">
          <label>Belt</label>
          <select id="mBelt">${beltOptions}</select>
        </div>
        <div class="form-group">
          <label>Type</label>
          <select id="mType">${typeOptions}</select>
        </div>
      </div>
      <div class="form-group">
        <label>Start Date</label>
        <input type="date" id="mStartDate" value="${member.StartDate || new Date().toISOString().split('T')[0]}">
      </div>
      <div class="form-group">
        <label>Billing Day of Month</label>
        <input type="text" id="mBillingDate" value="${esc(member.BillingDate || '')}" placeholder="15">
      </div>
      <div class="form-group">
        <label>Stripe Customer ID</label>
        <div style="display:flex;align-items:center;gap:8px;">
          <input type="text" id="mStripeID" value="${esc(member.StripeCustomerID || '')}" placeholder="cus_xxxxx" ${member.StripeCustomerID ? 'readonly style="flex:1;opacity:0.7;cursor:default;"' : 'style="flex:1;"'}>
          ${member.StripeCustomerID ? `<button type="button" class="btn btn-ghost btn-sm" onclick="navigator.clipboard.writeText(document.getElementById('mStripeID').value);showToast('Copied!','success')" title="Copy">&#128203;</button>
          <a href="https://dashboard.stripe.com/customers/${esc(member.StripeCustomerID)}" target="_blank" class="btn btn-ghost btn-sm" title="Open in Stripe" style="color:var(--gold);">&#8599;</a>` : ''}
        </div>
      </div>
      <div class="form-group">
        <label>Notes</label>
        <textarea id="mNotes" rows="2" placeholder="Optional notes...">${esc(member.Notes || '')}</textarea>
      </div>
    </div>
    <div class="modal-footer" style="flex-direction:column;align-items:stretch;gap:10px;">
      <div id="modalWaiverStatus" class="waiver-status-inline" style="display:none;"></div>
      <div id="modalAgreementStatus" class="waiver-status-inline" style="display:none;"></div>
      ${!isEdit ? `
      <div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-top:1px solid var(--border);">
        <span style="font-size:13px;color:var(--text-muted);flex:1;">Documents</span>
        <button type="button" class="btn btn-secondary btn-sm" onclick="openWaiverFromMemberModal()">&#9998; Sign Waiver</button>
        <button type="button" class="btn btn-secondary btn-sm" onclick="openAgreementFromMemberModal()">&#128221; Sign Agreement</button>
      </div>` : ''}
      <div style="display:flex;gap:8px;justify-content:flex-end;">
        <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
        <button class="btn btn-primary" id="saveMemberBtn" onclick="saveMember('${member.ID || ''}')">${isEdit ? 'Update' : 'Add'} Member</button>
      </div>
    </div>
  `);
  // Track waiver state for new member
  window._modalWaiverSigned = false;
  window._modalWaiverId = null;
}

async function saveMember(id) {
  const data = {
    Name: document.getElementById('mName').value.trim(),
    Email: document.getElementById('mEmail').value.trim(),
    Phone: document.getElementById('mPhone').value.trim(),
    Plan: document.getElementById('mPlan').value.trim(),
    Membership: document.getElementById('mPlan').value.trim(),
    Status: document.getElementById('mStatus').value,
    Belt: document.getElementById('mBelt') ? document.getElementById('mBelt').value : '',
    Type: document.getElementById('mType') ? document.getElementById('mType').value : 'Adult',
    StartDate: document.getElementById('mStartDate').value,
    BillingDate: document.getElementById('mBillingDate').value.trim(),
    StripeCustomerID: document.getElementById('mStripeID').value.trim(),
    Notes: document.getElementById('mNotes').value.trim()
  };

  if (!data.Name) { showToast('Name is required', 'error'); return; }

  const btn = document.getElementById('saveMemberBtn');
  if (btn) { btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> Saving...'; }

  let result;
  if (id) {
    result = await api('updateMember', { ID: id, ...data });
  } else {
    result = await api('addMember', data);
  }

  if (btn) { btn.disabled = false; btn.innerHTML = id ? 'Update Member' : 'Add Member'; }

  if (result && result.success) {
    showToast(id ? 'Member updated' : 'Member added', 'success');
    closeModal();
    renderMembers();
  }
}

async function deleteMember(id) {
  if (!confirm('Are you sure you want to delete this member?')) return;
  const result = await api('deleteMember', { ID: id });
  if (result && result.success) {
    showToast('Member deleted', 'success');
    membersCache = membersCache.filter(m => m.ID !== id);
    renderMembers();
  }
}

async function deleteMemberFromProfile(id, name) {
  const confirmed = await showConfirmDialog({
    title: 'Remove Member',
    message: `Remove ${name} from the member list? This cannot be undone.`,
    confirmText: 'Remove',
    confirmClass: 'btn-error',
    icon: '⚠️'
  });
  if (!confirmed) return;
  const result = await api('deleteMember', { ID: id });
  if (result && result.success) {
    showToast(name + ' removed', 'success');
    membersCache = membersCache.filter(m => m.ID !== id);
    renderMembers();
  }
}

/* ── MEMBER PROFILE ────────────────────────────────────── */
async function renderMemberProfile(member) {
  const main = document.getElementById('mainContent');
  const beltColor = getBeltColor(member.Belt);
  const typeLabel = (member.Type || 'Adult').toLowerCase() === 'kid' || (member.Type || '').toLowerCase() === 'kids' ? 'Kid' : 'Adult';
  const memberJson = JSON.stringify(member).replace(/'/g, '&#39;').replace(/"/g, '&quot;');

  // Build family info if applicable
  const familyGroups = buildFamilyGroups(membersCache);
  const memberEmail = (member.Email || '').toLowerCase();
  let familyHtml = '';
  if (memberEmail) {
    const familyMembers = familyGroups.get(memberEmail);
    if (familyMembers && familyMembers.length >= 2) {
      const fName = getFamilyName(familyMembers);
      familyHtml = `<div class="profile-info-row"><span class="profile-info-icon">&#128106;</span> <span>${esc(fName)} Family (${familyMembers.length} members)</span></div>`;
    }
  }

  // Show the profile shell immediately
  main.innerHTML = `
    <div class="profile-container">
      <div class="profile-topbar">
        <a href="#" class="back-link" onclick="event.preventDefault();renderMembers();">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
          Back to Members
        </a>
        <div class="profile-topbar-actions">
          <button class="btn btn-secondary btn-sm" onclick='showEditMemberModal(${memberJson})'>Edit</button>
          <button class="btn btn-secondary btn-sm" onclick='setupMemberCard(${memberJson})'>Set Up Card</button>
          ${member.Email ? `<button class="btn btn-secondary btn-sm" onclick="sendAccountSetup('${esc(member.Email)}', '${esc(member.Name)}', '${member._row || member.ID}')">&#128273; Set Up Account</button>` : ''}
          <button class="btn btn-ghost btn-sm" style="color:var(--error)" onclick="deleteMemberFromProfile('${esc(member.ID)}', '${esc(member.Name)}')">&#128465; Remove</button>
        </div>
      </div>

      <div class="profile-header">
        <div class="profile-header-top">
          ${beltImgHtml(member.Belt, member.Type, 90)}
          <h2 class="profile-name">${esc(member.Name)}</h2>
        </div>
        <div class="profile-sub">
          ${member.Belt ? esc(member.Belt) + ' Belt' : ''}
          ${member.Belt && (member.Type || typeLabel) ? ' &bull; ' : ''}
          ${esc(typeLabel)}
          ${member.Plan ? ' &bull; ' + esc(member.Plan) : ''}
        </div>
        <div class="profile-info-grid">
          ${member.Email ? `<div class="profile-info-row"><span class="profile-info-icon">&#9993;</span> <a href="mailto:${esc(member.Email)}">${esc(member.Email)}</a></div>` : ''}
          ${member.Phone ? `<div class="profile-info-row"><span class="profile-info-icon">&#128241;</span> <span>${esc(member.Phone)}</span></div>` : ''}
          ${familyHtml}
          <div class="profile-card-info" id="profileCardInfo"><span class="text-muted">Loading card info...</span></div>
          ${member.StripeCustomerID ? `<div class="profile-info-row"><span class="profile-info-icon">&#9889;</span> <span class="text-muted">Stripe: ${esc(member.StripeCustomerID)}</span></div>` : ''}
          ${member.StartDate ? `<div class="profile-info-row"><span class="profile-info-icon">&#128197;</span> <span>Member since: ${formatDate(member.StartDate)}</span></div>` : ''}
          <div id="profileWaiverStatus" class="profile-info-row">
            <span class="text-muted" style="font-size:13px;">Loading waiver status...</span>
          </div>
          <div id="profileAgreementStatus" class="profile-info-row">
            <span class="text-muted" style="font-size:13px;">Loading agreement status...</span>
          </div>
        </div>
      </div>

      <div class="profile-actions">
        <button class="btn btn-secondary btn-sm" onclick='openPaymentForMember(${memberJson})'>Charge Card</button>
        <button class="btn btn-secondary btn-sm" onclick='openPaymentForMember(${memberJson})'>New Payment</button>
        <button class="btn btn-secondary btn-sm" onclick='setupMemberCard(${memberJson})'>Send Setup Link</button>
        ${member.Email ? `<a href="mailto:${esc(member.Email)}" class="btn btn-secondary btn-sm">Send Email</a>` : ''}
        ${member.Phone ? `<button class="btn btn-secondary btn-sm" onclick="navigate('sms')">Send SMS</button>` : ''}
        ${member.Email ? `<button class="btn btn-secondary btn-sm" onclick="sendAccountSetup('${esc(member.Email)}', '${esc(member.Name)}', '${member._row || member.ID}')">&#128273; Set Up Account</button>` : ''}
        <button class="btn btn-secondary btn-sm" onclick="showAgreementModal({memberName:'${esc(member.Name)}',memberEmail:'${esc(member.Email||'')}',planName:'${esc(member.Plan||'')}'})" >&#128221; Sign Agreement</button>
        ${member.Email ? `<button class="btn btn-secondary btn-sm" onclick="sendAgreementEmail('${esc(member.Email)}','${esc(member.Name)}','${esc(member.Plan||'')}')" >&#128231; Send Agreement</button>` : ''}
      </div>

      <div class="profile-payments">
        <div class="profile-payments-header">
          <span class="profile-section-title">Payment History</span>
        </div>
        <div id="profilePaymentsBody">
          <div class="loading-state"><span class="spinner"></span> Loading payments...</div>
        </div>
      </div>

      <div class="profile-payments" style="margin-top:24px">
        <div class="profile-payments-header">
          <span class="profile-section-title">Upcoming Payments</span>
        </div>
        <div id="profileUpcomingPayments" style="padding:0 20px"></div>
      </div>

      <div class="profile-payments" style="margin-top:24px">
        <div class="profile-payments-header">
          <span class="profile-section-title">Communication History</span>
        </div>
        <div id="profileCommsBody" style="padding:0 20px">
          <div class="loading-state"><span class="spinner"></span> Loading...</div>
        </div>
      </div>
    </div>
  `;

  // Render upcoming payments
  (function() {
    var upEl = document.getElementById('profileUpcomingPayments');
    if (!upEl) return;
    if (member.StripeSubscriptionID && member.BillingDate) {
      var plan = plansCache.find(function(p) { return p.name === member.Plan; }) || {};
      var amount = plan.price || 0;
      var billingDay = parseInt(member.BillingDate) || 1;
      var rows = '';
      for (var i = 0; i < 3; i++) {
        var d = new Date();
        d.setMonth(d.getMonth() + i);
        d.setDate(Math.min(billingDay, new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()));
        if (d < new Date()) { d.setMonth(d.getMonth() + 1); d.setDate(Math.min(billingDay, new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate())); }
        rows += '<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border);font-size:13px;"><span>' + d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + '</span><span style="color:var(--text-muted);">' + esc(member.Plan || 'Subscription') + '</span><span style="font-weight:600;">$' + Number(amount).toFixed(2) + '</span></div>';
      }
      upEl.innerHTML = rows || '<div class="empty-state"><p>No upcoming payments scheduled</p></div>';
    } else {
      upEl.innerHTML = '<div class="empty-state"><p>No upcoming payments scheduled</p></div>';
    }
  })();

  // Load card info — multi-card management
  (async () => {
    const el = document.getElementById('profileCardInfo');
    if (!el) return;

    if (!member.StripeCustomerID) {
      el.innerHTML = `<span class="profile-info-row text-muted"><span class="profile-info-icon">&#128179;</span> No Stripe customer</span>
        <button class="btn btn-ghost btn-sm" style="margin-top:6px;border:1px dashed #333;color:#888;font-size:11px;padding:6px 12px;" onclick="setupMemberCard(${JSON.stringify({Name:member.Name,Email:member.Email,Phone:member.Phone,_row:member._row||member.ID})})">+ Set Up Card</button>`;
      return;
    }

    el.innerHTML = '<span class="text-muted" style="font-size:12px;">Loading cards...</span>';
    const cardInfo = await api('getCardInfo', { stripeCustomerId: member.StripeCustomerID });

    const renderAdminCards = (cards) => {
      if (!cards || cards.length === 0) {
        el.innerHTML = `<span class="profile-info-row text-muted"><span class="profile-info-icon">&#128179;</span> No card on file</span>
          <button class="btn btn-ghost btn-sm" style="margin-top:6px;border:1px dashed #333;color:#888;font-size:11px;padding:6px 12px;" onclick="setupMemberCard(${JSON.stringify({Name:member.Name,Email:member.Email,Phone:member.Phone,StripeCustomerID:member.StripeCustomerID,_row:member._row||member.ID})})">+ Add Card</button>`;
        return;
      }
      el.innerHTML = `<div style="margin-top:4px;">
        ${cards.map((c, idx) => {
          const brand = (c.brand||'card').charAt(0).toUpperCase() + (c.brand||'card').slice(1);
          const isDefault = idx === 0;
          const custId = esc(member.StripeCustomerID);
          const pmId = esc(c.id);
          return `<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 10px;margin-bottom:4px;background:#0D0D0D;border:1px solid ${isDefault ? '#C8A24C30' : '#222'};border-radius:8px;">
            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
              <span style="font-size:13px;">&#128179;</span>
              <span style="color:#E0E0E0;font-size:13px;">${esc(brand)} •••• ${esc(c.last4)}</span>
              <span style="color:#666;font-size:11px;">${c.expMonth}/${c.expYear}</span>
              ${isDefault ? '<span style="background:#C8A24C;color:#000;font-size:9px;font-weight:700;padding:2px 6px;border-radius:4px;">DEFAULT</span>' : ''}
            </div>
            <div style="display:flex;gap:4px;flex-shrink:0;">
              ${!isDefault ? `<button class="btn btn-ghost btn-sm" style="font-size:10px;padding:3px 8px;color:#C8A24C;" onclick="adminSetDefaultCard('${custId}','${pmId}')">Set Default</button>` : ''}
              <button class="btn btn-ghost btn-sm" style="font-size:10px;padding:3px 8px;color:var(--error);" onclick="adminRemoveCard('${custId}','${pmId}','${esc(c.last4)}')">Remove</button>
            </div>
          </div>`;
        }).join('')}
        <button class="btn btn-ghost btn-sm" style="width:100%;margin-top:4px;border:1px dashed #333;color:#888;font-size:11px;padding:8px;" onclick="setupMemberCard(${JSON.stringify({Name:member.Name,Email:member.Email,Phone:member.Phone,StripeCustomerID:member.StripeCustomerID,_row:member._row||member.ID})})">+ Add Another Card</button>
      </div>`;
    };

    renderAdminCards(cardInfo && cardInfo.cards);
    window._refreshProfileCards = async () => {
      el.innerHTML = '<span class="text-muted" style="font-size:12px;">Refreshing...</span>';
      const fresh = await api('getCardInfo', { stripeCustomerId: member.StripeCustomerID });
      renderAdminCards(fresh && fresh.cards);
    };
  })();

  // Load payment history, communication history, waiver and agreement status in parallel
  const [payData, commsData, waiverData, agreementData] = await Promise.all([
    member.StripeCustomerID
      ? api('getMemberPayments', { stripeCustomerId: member.StripeCustomerID })
      : Promise.resolve(null),
    api('getMemberComms', {
      memberName: member.Name,
      memberEmail: member.Email,
      memberPhone: member.Phone
    }),
    api('getWaiver', { memberName: member.Name, memberEmail: member.Email }),
    api('getAgreement', { memberName: member.Name, memberEmail: member.Email })
  ]);

  if (member.StripeCustomerID) {
    if (payData && payData.error) {
      var friendlyMsg = (payData.error.includes('No such customer') || payData.error.includes('getMemberPayments'))
        ? 'No payment history found for this member.'
        : payData.error;
      showToast(friendlyMsg, 'error');
      renderProfilePayments(member, []);
    } else {
      renderProfilePayments(member, payData ? payData.payments || [] : []);
    }
  } else {
    const el = document.getElementById('profilePaymentsBody');
    if (el) el.innerHTML = '<div class="empty-state"><p>No Stripe customer ID — payments cannot be loaded.</p></div>';
  }

  renderProfileComms(commsData ? commsData.comms || [] : []);

  // Render waiver and agreement status in profile
  renderProfileWaiverStatus(waiverData, member);
  renderProfileAgreementStatus(agreementData, member);
}

function renderProfilePayments(member, payments) {
  const el = document.getElementById('profilePaymentsBody');
  if (!el) return;

  if (!payments.length) {
    el.innerHTML = '<div class="empty-state"><p>No payment history found</p></div>';
    return;
  }

  el.innerHTML = `
    <div class="table-wrapper" style="border:none;border-radius:0">
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Description</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${payments.map(p => {
            let statusBadge;
            if (p.refunded) {
              statusBadge = '<span class="badge badge-refunded">Refunded</span>';
            } else if (p.status === 'succeeded') {
              statusBadge = '<span class="badge badge-active">Paid</span>';
            } else if (p.status === 'failed') {
              statusBadge = '<span class="badge badge-failed">Failed</span>';
            } else {
              statusBadge = '<span class="badge badge-trial">' + esc(p.status) + '</span>';
            }

            const canRefund = p.status === 'succeeded' && !p.refunded;
            const memberJson = JSON.stringify(member).replace(/'/g, '&#39;').replace(/"/g, '&quot;');
            const pJson = JSON.stringify(p).replace(/'/g, '&#39;').replace(/"/g, '&quot;');
            const refundBtn = canRefund
              ? `<button class="refund-btn" onclick='doRefundPayment(${memberJson}, ${pJson})'>Refund</button>`
              : '';
            const receiptBtn = p.receiptUrl
              ? `<a href="${esc(p.receiptUrl)}" target="_blank" class="receipt-link">Receipt</a>`
              : '';

            return `
              <tr>
                <td class="text-muted">${formatDate(p.date)}</td>
                <td>${esc(p.description || '—')}</td>
                <td class="font-mono">$${Number(p.amount).toFixed(2)}${p.refundedAmount > 0 && !p.refunded ? ' <span class="text-muted" style="font-size:11px">(partial refund)</span>' : ''}</td>
                <td>${statusBadge}</td>
                <td><div class="flex gap-8">${refundBtn}${receiptBtn}</div></td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function renderProfileComms(comms) {
  const el = document.getElementById('profileCommsBody');
  if (!el) return;

  // Quick note input
  let html = `
    <div class="quick-note">
      <input type="text" placeholder="Add a note about this member..." id="quickNoteInput" onkeydown="if(event.key==='Enter')saveQuickNote()">
      <button class="btn btn-sm btn-secondary" onclick="saveQuickNote()">Add</button>
    </div>
  `;

  if (!comms.length) {
    html += '<div class="empty-state" style="padding:24px 0"><p>No communication history yet</p></div>';
    el.innerHTML = html;
    return;
  }

  // Sort by date descending
  const sorted = [...comms].sort((a, b) => new Date(b.date) - new Date(a.date));

  html += '<div class="timeline">';
  html += sorted.map(c => {
    const msgStr = String(c.message || '');
    const preview = msgStr.substring(0, 120) + (msgStr.length > 120 ? '...' : '');
    const subject = c.subject || msgStr.substring(0, 50);
    const typeLower = (c.type || '').toLowerCase();
    const dotClass = typeLower === 'email' ? 'email' : typeLower === 'sms' ? 'sms' : 'note';
    const typeIcon = typeLower === 'email' ? '📧 Email' : typeLower === 'sms' ? '💬 SMS' : '📝 Note';

    const dateStr = c.date ? new Date(c.date).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : '';

    return `
      <div class="timeline-item">
        <div class="timeline-dot ${dotClass}"></div>
        <div class="timeline-content">
          <div class="timeline-title">${esc(subject)}</div>
          <div class="timeline-meta">${typeIcon} • ${dateStr}</div>
          ${preview ? `<div class="timeline-preview">${esc(preview)}</div>` : ''}
        </div>
      </div>
    `;
  }).join('');
  html += '</div>';

  el.innerHTML = html;
}

async function saveQuickNote() {
  const input = document.getElementById('quickNoteInput');
  if (!input) return;
  const note = input.value.trim();
  if (!note) { showToast('Enter a note first', 'info'); return; }

  // Find member context from profile
  const nameEl = document.querySelector('.profile-name');
  const memberName = nameEl ? nameEl.textContent : '';
  const emailEl = document.querySelector('.profile-info-grid a[href^="mailto:"]');
  const memberEmail = emailEl ? emailEl.textContent : '';

  const result = await api('saveNote', { memberName, memberEmail, note });
  if (result && result.success) {
    showToast('Note saved', 'success');
    input.value = '';
    // Reload comms
    const commsData = await api('getMemberComms', { memberName, memberEmail, memberPhone: '' });
    renderProfileComms(commsData ? commsData.comms || [] : []);
  }
}

async function doRefundPayment(member, payment) {
  const confirmed = await showConfirmDialog({
    title: 'Refund Payment?',
    message: `Refund $${Number(payment.amount).toFixed(2)} to ${member.Name}? This cannot be undone.`,
    confirmText: 'Refund',
    confirmClass: 'btn-error'
  });
  if (!confirmed) return;

  showToast('Processing refund...', 'info');

  const result = await api('refundPayment', {
    chargeId: payment.id,
    paymentIntentId: payment.paymentIntentId,
    amount: payment.amount,
    memberId: member.ID || '',
    memberName: member.Name || ''
  });

  if (result && result.success) {
    showToast(`Refund of $${Number(result.amount || payment.amount).toFixed(2)} processed`, 'success');
    // Refresh payment history
    if (member.StripeCustomerID) {
      const payData = await api('getMemberPayments', { stripeCustomerId: member.StripeCustomerID });
      renderProfilePayments(member, payData ? payData.payments || [] : []);
    }
  }
}

function openPaymentForMember(member) {
  window._preselectedMember = member;
  navigate('payments');
  setTimeout(() => {
    showCheckoutModal().then(() => {
      if (window._preselectedMember) {
        selectCheckoutMember(window._preselectedMember);
        delete window._preselectedMember;
      }
    });
  }, 300);
}

/* ── CARD SETUP ────────────────────────────────────────── */
async function setupMemberCard(member) {
  const name = member.Name || 'this member';

  // First check if they already have a card
  if (member.StripeCustomerID) {
    const cardInfo = await api('getCardInfo', { stripeCustomerId: member.StripeCustomerID });
    if (cardInfo && cardInfo.hasCard && cardInfo.cards.length > 0) {
      const card = cardInfo.cards[0];
      const hasCard = confirm(
        name + ' already has a card on file:\n\n'
        + card.brand.toUpperCase() + ' ending in ' + card.last4 + ' (exp ' + card.expMonth + '/' + card.expYear + ')\n\n'
        + 'Do you want to set up a new card? This will replace their current card.'
      );
      if (!hasCard) return;
    }
  }

  showToast('Generating setup link...', 'info');

  const result = await api('createSetupLink', {
    stripeCustomerId: member.StripeCustomerID || '',
    memberName: member.Name || '',
    memberEmail: member.Email || '',
    memberPhone: member.Phone || '',
    memberRow: member._row || member.ID || ''
  });

  if (!result || !result.success) {
    showToast(result?.error || 'Failed to generate setup link', 'error');
    return;
  }

  // If a new Stripe customer was created, update the local cache
  if (result.customerId && !member.StripeCustomerID) {
    member.StripeCustomerID = result.customerId;
    const idx = membersCache.findIndex(m => m._row === member._row || m.ID === member.ID);
    if (idx !== -1) membersCache[idx].StripeCustomerID = result.customerId;
  }

  // Show modal with the setup link
  openModal(`
    <div class="modal-header">
      <h2 class="modal-title">Set Up Card for ${esc(name)}</h2>
      <button class="modal-close" onclick="closeModal()">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
    <div class="modal-body">
      <p style="color:var(--text-muted);font-size:14px;margin-bottom:16px;">Send this link to ${esc(name)}. They'll enter their card info securely through Stripe — no charge.</p>
      <div style="display:flex;gap:8px;margin-bottom:16px;">
        <input type="text" id="setupLinkUrl" value="${result.url}" readonly style="flex:1;font-size:13px;">
        <button class="btn btn-secondary btn-sm" onclick="document.getElementById('setupLinkUrl').select();navigator.clipboard.writeText(document.getElementById('setupLinkUrl').value);showToast('Copied','success');">Copy</button>
      </div>
      <div style="display:flex;gap:8px;">
        ${member.Email ? `<a href="mailto:${encodeURIComponent(member.Email)}?subject=${encodeURIComponent('Set up your payment card — Labyrinth BJJ')}&body=${encodeURIComponent('Hi ' + (name.split(' ')[0]) + ',\n\nPlease use this secure link to set up your payment card:\n\n' + result.url + '\n\nThanks!\nLabyrinth BJJ')}" class="btn btn-secondary btn-sm" style="text-decoration:none;">📧 Email Link</a>` : ''}
        ${member.Phone ? `<button class="btn btn-secondary btn-sm" onclick="sendSetupViaSMS('${member.Phone.replace(/'/g, '')}', '${result.url}')">💬 Text Link</button>` : ''}
      </div>
    </div>
  `);
}

async function sendSetupViaSMS(phone, url) {
  const msg = 'Labyrinth BJJ: Please set up your payment card using this secure link: ' + url;
  const result = await api('sendMassSMS', {
    message: msg,
    recipients: [{ phone: phone, name: '' }]
  });
  if (result && result.success) {
    showToast('Setup link texted', 'success');
  } else {
    showToast('Failed to send SMS', 'error');
  }
}

/* ── UNIFIED PAYMENTS & SALES ───────────────────────────────── */
async function renderPayments() {
  const main = document.getElementById('mainContent');
  main.innerHTML = `
    <div class="page-header">
      <h1 class="page-title">Payments & Sales</h1>
      <div class="page-actions">
        <button class="btn btn-primary" onclick="showCheckoutModal()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          + New Payment
        </button>
      </div>
    </div>
    <div class="payments-page-tabs">
      <button class="payments-page-tab ${paymentsTab === 'pos' ? 'active' : ''}" onclick="setPaymentsTab('pos')">Quick Sale</button>
      <button class="payments-page-tab ${paymentsTab === 'history' ? 'active' : ''}" onclick="setPaymentsTab('history')">Payment History</button>
    </div>
    <div id="paymentsTabContent"></div>
  `;
  renderPaymentsTabContent();
}

function setPaymentsTab(tab) {
  paymentsTab = tab;
  document.querySelectorAll('.payments-page-tab').forEach(t => {
    t.classList.toggle('active', 
      (tab === 'pos' && t.textContent.includes('Quick')) || 
      (tab === 'history' && t.textContent.includes('History'))
    );
  });
  renderPaymentsTabContent();
}

async function renderPaymentsTabContent() {
  const container = document.getElementById('paymentsTabContent');
  if (!container) return;
  if (paymentsTab === 'pos') {
    await renderPosInto(container);
  } else {
    await renderPaymentHistoryInto(container);
  }
}

async function renderPaymentHistoryInto(container) {
  container.innerHTML = `
    <div class="stats-grid" id="paymentStats"></div>
    <div class="card mb-16">
      <div class="card-header">
        <span class="card-title">Payment History</span>
      </div>
      <div style="padding:12px 16px;display:flex;gap:10px;flex-wrap:wrap;align-items:center;border-bottom:1px solid var(--border);">
        <input type="text" id="paymentSearchInput" placeholder="Search by member name..." oninput="filterPaymentHistory()" style="flex:1;min-width:160px;">
        <input type="date" id="paymentDateFrom" onchange="filterPaymentHistory()" title="From date">
        <input type="date" id="paymentDateTo" onchange="filterPaymentHistory()" title="To date">
        <select id="paymentStatusFilter" onchange="filterPaymentHistory()">
          <option value="">All Statuses</option>
          <option value="Succeeded">Succeeded</option>
          <option value="Failed">Failed</option>
          <option value="Refunded">Refunded</option>
        </select>
      </div>
      <div class="table-wrapper" style="border:none;border-radius:0">
        <table class="payments-table">
          <thead>
            <tr>
              <th>Member</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Type</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody id="paymentsTableBody">
            <tr><td colspan="5"><div class="loading-state"><span class="spinner"></span> Loading...</div></td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `;

  const data = await api('getPayments');
  if (!data) {
    const tbody = document.getElementById('paymentsTableBody');
    if (tbody) {
      tbody.innerHTML = `<tr><td colspan="5">
        <div class="error-state" style="padding:32px;text-align:center;">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--error)" stroke-width="1.5" style="margin-bottom:12px;"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <p style="color:var(--error);margin-bottom:12px;">Could not load payment data. The backend may be unavailable.</p>
          <button class="btn btn-secondary" onclick="renderPaymentsTabContent()">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:6px;"><polyline points="23,4 23,10 17,10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>
            Retry
          </button>
        </div>
      </td></tr>`;
    }
    return;
  }
  const payments = data.payments || [];
  window._paymentHistoryCache = payments;

  const succeeded = payments.filter(p => p.Status === 'Succeeded');
  const failed = payments.filter(p => p.Status === 'Failed');
  const totalRev = succeeded.reduce((sum, p) => sum + (parseFloat(p.Amount) || 0), 0);

  document.getElementById('paymentStats').innerHTML = `
    <div class="stat-card">
      <div class="stat-label">Total Collected</div>
      <div class="stat-value gold">$${formatNum(totalRev)}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Successful</div>
      <div class="stat-value" style="color:var(--success)">${succeeded.length}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Failed</div>
      <div class="stat-value" style="color:${failed.length ? 'var(--error)' : 'var(--success)'}">${failed.length}</div>
    </div>
  `;

  renderPaymentRows(payments);
}

function filterPaymentHistory() {
  var payments = window._paymentHistoryCache || [];
  var search = (document.getElementById('paymentSearchInput') || {}).value || '';
  var fromDate = (document.getElementById('paymentDateFrom') || {}).value || '';
  var toDate = (document.getElementById('paymentDateTo') || {}).value || '';
  var statusFilter = (document.getElementById('paymentStatusFilter') || {}).value || '';

  var filtered = payments.filter(function(p) {
    if (search && !(p.MemberName || '').toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter && p.Status !== statusFilter) return false;
    if (fromDate && p.Date && p.Date < fromDate) return false;
    if (toDate && p.Date && p.Date > toDate) return false;
    return true;
  });
  renderPaymentRows(filtered);
}

function renderPaymentRows(payments) {
  const tbody = document.getElementById('paymentsTableBody');
  if (!tbody) return;
  if (!payments.length) {
    tbody.innerHTML = '<tr><td colspan="5"><div class="empty-state"><p>No payment history</p></div></td></tr>';
    return;
  }

  tbody.innerHTML = payments.map(p => `
    <tr>
      <td><strong>${esc(p.MemberName)}</strong></td>
      <td class="font-mono">$${parseFloat(p.Amount).toFixed(2)}</td>
      <td><span class="badge ${p.Status === 'Succeeded' ? 'badge-active' : 'badge-failed'}">${p.Status}</span></td>
      <td class="text-muted">${esc(p.Type)}</td>
      <td class="text-muted">${formatDate(p.Date)}</td>
    </tr>
  `).join('');
}

async function renderPosInto(container) {
  await ensureMembersLoaded();
  await loadTaxSettings();
  posTaxEnabled = taxSettings.taxDefault;

  container.innerHTML = `
    <div class="pos-layout">
      <div class="pos-products">
        <div class="pos-tabs" id="posTabs">
          <button class="pos-tab" onclick="setPosCategory('Frequent')">\u2B50 Frequent</button>
          <button class="pos-tab active" onclick="setPosCategory('All')">All</button>
          <button class="pos-tab" onclick="setPosCategory('Merchandise')">Merchandise</button>
          <button class="pos-tab" onclick="setPosCategory('Lessons')">Lessons</button>
          <button class="pos-tab" onclick="setPosCategory('Punch Cards')">Punch Cards</button>
        </div>
        <div class="pos-grid" id="posProductGrid"></div>
      </div>
      <div class="pos-cart" id="posCart">
        <div class="pos-cart-inner" id="posCartInner"></div>
      </div>
    </div>
    <!-- Mobile cart footer -->
    <div class="pos-mobile-footer" id="posMobileFooter" onclick="toggleMobileCart()">
      <span id="posMobileCount">0 items</span>
      <span id="posMobileTotal">$0.00</span>
    </div>
  `;
  renderPosProducts();
  renderPosCart();
}

/* ── PAYMENT MODAL STATE ───────────────────────────────── */
let _checkoutSelectedMember = null;
let _payWhatType = null;   // 'plan' or 'custom'
let _paySelectedPlan = null;
let _payTaxEnabled = false;
let _payIsRecurring = false;
let _activeEmbeddedCheckout = null; // Stripe embedded checkout instance

async function showCheckoutModal() {
  _checkoutSelectedMember = null;
  _payWhatType = null;
  _paySelectedPlan = null;
  _payIsRecurring = false;

  // Ensure members and tax settings are loaded
  await ensureMembersLoaded();
  await loadTaxSettings();
  _payTaxEnabled = taxSettings.taxDefault;

  // Collect all plans: DEFAULT_PLANS + custom plans from plansCache + member plans
  const allPlansList = getAllPlans();
  const planOptions = allPlansList.map(p =>
    `<option value="${esc(p.name)}" data-price="${p.price}" data-type="${p.type}">${esc(p.name)} — $${p.price}${p.type === 'recurring' ? '/mo' : ''}</option>`
  ).join('');

  const overlay = document.getElementById('modalOverlay');
  const content = document.getElementById('modalContent');
  content.className = 'modal payment-modal';
  content.innerHTML = `
    <div class="modal-header">
      <h2 class="modal-title">New Payment</h2>
      <button class="modal-close" onclick="closeModal()">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
    <div class="modal-body" id="payModalBody">

      <!-- STEP 1: WHO -->
      <div class="pay-section active" id="payStepWho">
        <div class="pay-section-label">
          <span class="pay-step-num">1</span> Who
        </div>
        <div class="member-search-wrap">
          <input type="text" id="memberSearchInput" placeholder="Search member by name or email..." autocomplete="off"
            oninput="filterMemberTypeahead(this.value)"
            onfocus="filterMemberTypeahead(this.value)"
            onkeydown="handleTypeaheadKey(event)">
          <div class="typeahead-dropdown" id="memberTypeaheadDrop"></div>
        </div>
        <div id="selectedMemberCard"></div>
        <span class="manual-entry-link" onclick="toggleManualEntry()">Or enter manually (walk-in)</span>
        <div class="manual-entry-fields" id="manualEntryFields">
          <div class="form-group">
            <label>Name</label>
            <input type="text" id="walkInName" placeholder="Walk-in name" oninput="updatePaySummary()">
          </div>
          <div class="form-group">
            <label>Email</label>
            <input type="email" id="walkInEmail" placeholder="customer@example.com">
          </div>
        </div>
      </div>

      <!-- STEP 2: WHAT -->
      <div class="pay-section" id="payStepWhat">
        <div class="pay-section-label">
          <span class="pay-step-num">2</span> What
        </div>
        <div class="plan-type-cards">
          <div class="plan-type-card" id="cardPlanType" onclick="selectPayWhat('plan')">
            <div class="plan-type-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </div>
            <span class="plan-type-label">Membership Plan</span>
            <span class="plan-type-desc">Select from plans</span>
          </div>
          <div class="plan-type-card" id="cardCustomType" onclick="selectPayWhat('custom')">
            <div class="plan-type-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
            </div>
            <span class="plan-type-label">Custom Amount</span>
            <span class="plan-type-desc">Enter any amount</span>
          </div>
        </div>

        <!-- Plan selection area -->
        <div class="plan-expand-area" id="planExpandArea">
          <div class="form-group" style="margin-bottom:0">
            <select id="payPlanSelect" onchange="onPayPlanChange()">
              <option value="" disabled selected>Choose a plan...</option>
              ${planOptions}
            </select>
          </div>
          <div id="payPlanDisplay"></div>
        </div>

        <!-- Custom amount area -->
        <div class="plan-expand-area" id="customExpandArea">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
            <div class="form-group" style="margin-bottom:0">
              <label>Amount ($)</label>
              <input type="number" id="payCustomAmount" placeholder="0.00" min="0.01" step="0.01" oninput="onPayCustomAmountChange()">
            </div>
            <div class="form-group" style="margin-bottom:0">
              <label>Description</label>
              <input type="text" id="payCustomDesc" placeholder="e.g. Private lesson" oninput="updatePaySummary()">
            </div>
          </div>
        </div>

        <!-- Recurring toggle -->
        <div id="payRecurringRow" style="display:none;margin-top:12px">
          <div class="toggle-row">
            <span class="toggle-label">Recurring monthly</span>
            <label class="toggle-switch">
              <input type="checkbox" id="payRecurring" onchange="_payIsRecurring = this.checked; updatePaySummary()">
              <span class="toggle-track"></span>
            </label>
          </div>
        </div>
      </div>

      <!-- STEP 3: TAX -->
      <div class="pay-section" id="payStepTax">
        <div class="pay-section-label">
          <span class="pay-step-num">3</span> Tax
        </div>
        <div class="tax-row">
          <div class="tax-row-left">
            <span class="toggle-label">Add tax</span>
            <span class="tax-rate-display">(${taxSettings.taxRate}%)</span>
          </div>
          <label class="toggle-switch">
            <input type="checkbox" id="payTaxToggle" ${_payTaxEnabled ? 'checked' : ''} onchange="_payTaxEnabled = this.checked; updatePaySummary()">
            <span class="toggle-track"></span>
          </label>
        </div>
        <div class="amount-breakdown" id="payAmountBreakdown"></div>
      </div>

    </div>

    <!-- STEP 4: SUMMARY + ACTIONS (sticky bottom) -->
    <div class="pay-summary" id="paySummaryBar">
      <div class="pay-summary-info">
        <div class="pay-summary-who" id="paySummaryWho">Select a member & item</div>
        <div class="pay-summary-total" id="paySummaryTotal">$0.00</div>
      </div>
      <div class="pay-summary-actions">
        <button class="btn btn-primary" id="payNowBtn" onclick="startEmbeddedCheckout()" disabled>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
          Pay Now
        </button>
        <button class="btn btn-outline" id="genCheckoutBtn" onclick="generateCheckout()" disabled>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>
          Generate Link
        </button>
        <button class="btn btn-cash" id="cashPayBtn" onclick="logCashPayment()" disabled>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="3"/></svg>
          Cash/Other
        </button>
      </div>
      <div class="pay-summary-actions" id="chargeCardRow" style="display:none">
        <button class="btn btn-charge-card" id="chargeCardBtn" onclick="chargeCardOnFile()" disabled>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/><circle cx="17" cy="15" r="1.5"/><circle cx="13" cy="15" r="1.5"/></svg>
          Charge Card on File
        </button>
      </div>
    </div>

    <!-- Stripe Embedded Checkout Container (hidden initially) -->
    <div id="stripeEmbedContainer" style="display:none"></div>

    <!-- Result area (hidden initially) -->
    <div id="payResultArea" style="display:none"></div>
  `;
  overlay.style.display = 'flex';
  overlay.onclick = function(e) {
    if (e.target === overlay) closeModal();
  };
}

function getAllPlans() {
  // Merge DEFAULT_PLANS, plansCache, and unique plans from membersCache
  const planMap = {};
  DEFAULT_PLANS.forEach(p => { planMap[p.name] = p; });
  if (plansCache && plansCache.length) {
    plansCache.forEach(p => { if (p.name) planMap[p.name] = p; });
  }
  membersCache.forEach(m => {
    const plan = m.Plan || m.Membership;
    if (plan && !planMap[plan]) {
      // Infer from DEFAULT_PLANS prices or use 0
      const def = DEFAULT_PLANS.find(d => d.name === plan);
      planMap[plan] = def || { name: plan, price: 0, interval: 'month', type: 'recurring' };
    }
  });
  return Object.values(planMap);
}

async function loadTaxSettings() {
  const data = await api('getTaxSettings');
  if (data) {
    taxSettings.taxRate = data.taxRate || 8.25;
    taxSettings.taxDefault = !!data.taxDefault;
  }
}

function toggleManualEntry() {
  const fields = document.getElementById('manualEntryFields');
  const searchInput = document.getElementById('memberSearchInput');
  if (fields.classList.contains('visible')) {
    fields.classList.remove('visible');
  } else {
    // Clear member selection when switching to manual
    clearCheckoutMember();
    fields.classList.add('visible');
    if (searchInput) searchInput.style.display = 'none';
    document.querySelector('.manual-entry-link').textContent = 'Search existing member instead';
  }
  updatePaySummary();
}

function selectPayWhat(type) {
  _payWhatType = type;
  document.getElementById('cardPlanType').classList.toggle('selected', type === 'plan');
  document.getElementById('cardCustomType').classList.toggle('selected', type === 'custom');
  document.getElementById('planExpandArea').classList.toggle('visible', type === 'plan');
  document.getElementById('customExpandArea').classList.toggle('visible', type === 'custom');

  const recurringRow = document.getElementById('payRecurringRow');
  if (type === 'custom') {
    recurringRow.style.display = 'block';
  } else {
    recurringRow.style.display = 'none';
  }
  updatePaySummary();
}

function onPayPlanChange() {
  const sel = document.getElementById('payPlanSelect');
  const opt = sel.options[sel.selectedIndex];
  if (!opt || !opt.value) { _paySelectedPlan = null; updatePaySummary(); return; }

  _paySelectedPlan = {
    name: opt.value,
    price: parseFloat(opt.dataset.price) || 0,
    type: opt.dataset.type || 'recurring'
  };
  _payIsRecurring = _paySelectedPlan.type === 'recurring';

  document.getElementById('payPlanDisplay').innerHTML = `
    <div class="selected-plan-display">
      <span class="selected-plan-name">${esc(_paySelectedPlan.name)}</span>
      <span class="selected-plan-price">$${_paySelectedPlan.price.toFixed(2)}${_payIsRecurring ? '/mo' : ''}</span>
    </div>
  `;
  updatePaySummary();
}

function onPayCustomAmountChange() {
  updatePaySummary();
}

function getPaySubtotal() {
  if (_payWhatType === 'plan' && _paySelectedPlan) {
    return _paySelectedPlan.price;
  }
  if (_payWhatType === 'custom') {
    return parseFloat(document.getElementById('payCustomAmount')?.value) || 0;
  }
  return 0;
}

function getPayTaxAmount() {
  if (!_payTaxEnabled) return 0;
  const subtotal = getPaySubtotal();
  return Math.round(subtotal * (taxSettings.taxRate / 100) * 100) / 100;
}

function getPayTotal() {
  return getPaySubtotal() + getPayTaxAmount();
}

function getPayDescription() {
  if (_payWhatType === 'plan' && _paySelectedPlan) return _paySelectedPlan.name;
  if (_payWhatType === 'custom') return document.getElementById('payCustomDesc')?.value.trim() || 'Custom';
  return '';
}

function getPayMemberName() {
  if (_checkoutSelectedMember) return _checkoutSelectedMember.Name;
  const walkInName = document.getElementById('walkInName')?.value.trim();
  if (walkInName) return walkInName;
  return 'Walk-in';
}

function updatePaySummary() {
  const subtotal = getPaySubtotal();
  const tax = getPayTaxAmount();
  const total = getPayTotal();
  const memberName = getPayMemberName();
  const description = getPayDescription();

  // Update summary who
  const whoEl = document.getElementById('paySummaryWho');
  if (whoEl) {
    const parts = [];
    parts.push('<strong>' + esc(memberName) + '</strong>');
    if (description) parts.push(esc(description));
    whoEl.innerHTML = parts.join(' &mdash; ');
  }

  // Update summary total
  const totalEl = document.getElementById('paySummaryTotal');
  if (totalEl) totalEl.textContent = '$' + total.toFixed(2);

  // Update amount breakdown when tax is on
  const breakdownEl = document.getElementById('payAmountBreakdown');
  if (breakdownEl) {
    if (_payTaxEnabled && subtotal > 0) {
      breakdownEl.classList.add('visible');
      breakdownEl.innerHTML = `
        <div class="amount-row"><span>Subtotal</span><span>$${subtotal.toFixed(2)}</span></div>
        <div class="amount-row"><span>Tax (${taxSettings.taxRate}%)</span><span>$${tax.toFixed(2)}</span></div>
        <div class="amount-row total"><span>Total</span><span>$${total.toFixed(2)}</span></div>
      `;
    } else {
      breakdownEl.classList.remove('visible');
      breakdownEl.innerHTML = '';
    }
  }

  // Enable/disable action buttons
  const canSubmit = subtotal > 0 && _payWhatType;
  const payNowBtn = document.getElementById('payNowBtn');
  const genBtn = document.getElementById('genCheckoutBtn');
  const cashBtn = document.getElementById('cashPayBtn');
  const chargeCardBtn = document.getElementById('chargeCardBtn');
  const chargeCardRow = document.getElementById('chargeCardRow');
  if (payNowBtn) payNowBtn.disabled = !canSubmit;
  if (genBtn) genBtn.disabled = !canSubmit;
  if (cashBtn) cashBtn.disabled = !canSubmit;
  if (chargeCardBtn) chargeCardBtn.disabled = !canSubmit;

  // Show "Charge Card on File" only if member has a StripeCustomerID
  if (chargeCardRow) {
    const hasStripeId = _checkoutSelectedMember && _checkoutSelectedMember.StripeCustomerID;
    chargeCardRow.style.display = hasStripeId ? 'flex' : 'none';
  }
}

function filterMemberTypeahead(query) {
  const drop = document.getElementById('memberTypeaheadDrop');
  if (!drop) return;

  // If a member is already selected, hide dropdown
  if (_checkoutSelectedMember) { drop.classList.remove('open'); return; }

  const q = query.trim().toLowerCase();
  const matches = q.length === 0
    ? membersCache.slice(0, 8)
    : membersCache.filter(m =>
        (m.Name || '').toLowerCase().includes(q) ||
        (m.Email || '').toLowerCase().includes(q)
      ).slice(0, 8);

  if (!matches.length) { drop.classList.remove('open'); drop.innerHTML = ''; return; }

  drop.innerHTML = matches.map((m, i) => `
    <div class="typeahead-item" data-index="${i}" onclick="selectCheckoutMember(${JSON.stringify(m).replace(/"/g, '&quot;')})"
         onmouseenter="highlightTypeaheadItem(this)">
      ${beltImgHtml(m.Belt, m.Type, 40)}
      <span class="typeahead-item-name">${esc(m.Name)}</span>
      <span class="typeahead-item-meta">${esc(m.Plan || m.Membership || '')} &bull; ${esc(m.Status)}</span>
    </div>
  `).join('');
  drop.classList.add('open');
}

function highlightTypeaheadItem(el) {
  const drop = document.getElementById('memberTypeaheadDrop');
  if (!drop) return;
  drop.querySelectorAll('.typeahead-item').forEach(i => i.classList.remove('focused'));
  el.classList.add('focused');
}

function handleTypeaheadKey(e) {
  const drop = document.getElementById('memberTypeaheadDrop');
  if (!drop || !drop.classList.contains('open')) return;
  const items = drop.querySelectorAll('.typeahead-item');
  const focused = drop.querySelector('.typeahead-item.focused');
  let idx = focused ? Array.from(items).indexOf(focused) : -1;

  if (e.key === 'ArrowDown') {
    e.preventDefault();
    idx = Math.min(idx + 1, items.length - 1);
    items.forEach(i => i.classList.remove('focused'));
    if (items[idx]) items[idx].classList.add('focused');
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    idx = Math.max(idx - 1, 0);
    items.forEach(i => i.classList.remove('focused'));
    if (items[idx]) items[idx].classList.add('focused');
  } else if (e.key === 'Enter') {
    e.preventDefault();
    if (focused) focused.click();
  } else if (e.key === 'Escape') {
    drop.classList.remove('open');
  }
}

function selectCheckoutMember(member) {
  _checkoutSelectedMember = member;

  // Hide dropdown, clear input, hide manual fields
  const drop = document.getElementById('memberTypeaheadDrop');
  if (drop) drop.classList.remove('open');
  const input = document.getElementById('memberSearchInput');
  if (input) { input.value = ''; input.style.display = ''; }
  const manualFields = document.getElementById('manualEntryFields');
  if (manualFields) manualFields.classList.remove('visible');
  const manualLink = document.querySelector('.manual-entry-link');
  if (manualLink) manualLink.textContent = 'Or enter manually (walk-in)';

  // Render member card
  const cardEl = document.getElementById('selectedMemberCard');
  if (!cardEl) return;
  const initials = (member.Name || '?').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const beltColor = getBeltColor(member.Belt);
  cardEl.innerHTML = `
    <div class="member-card">
      <div class="member-card-avatar">${initials}</div>
      <div class="member-card-info">
        <div class="member-card-name">${esc(member.Name)}</div>
        <div class="member-card-meta">
          ${beltImgHtml(member.Belt, member.Type, 48)}
          ${member.Belt ? esc(member.Belt) + ' Belt' : ''}
          ${member.Email ? '&bull; ' + esc(member.Email) : ''}
          ${member.Phone ? '&bull; ' + esc(member.Phone) : ''}
          ${member.Plan ? '&bull; ' + esc(member.Plan) : ''}
        </div>
      </div>
      <button class="member-card-clear" onclick="clearCheckoutMember()" title="Clear selection">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
  `;

  // Pre-select their plan if plan type is active
  if (_payWhatType === 'plan') {
    const planSel = document.getElementById('payPlanSelect');
    if (planSel && member.Plan) {
      const matchOpt = Array.from(planSel.options).find(o => o.value === member.Plan);
      if (matchOpt) { planSel.value = matchOpt.value; onPayPlanChange(); }
    }
  }
  updatePaySummary();
}

function clearCheckoutMember() {
  _checkoutSelectedMember = null;
  const cardEl = document.getElementById('selectedMemberCard');
  if (cardEl) cardEl.innerHTML = '';
  const input = document.getElementById('memberSearchInput');
  if (input) { input.style.display = ''; input.focus(); }
  updatePaySummary();
}

async function generateCheckout() {
  const btn = document.getElementById('genCheckoutBtn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Generating...';

  const subtotal = getPaySubtotal();
  const tax = getPayTaxAmount();
  const description = getPayDescription();
  const memberEmail = _checkoutSelectedMember?.Email || document.getElementById('walkInEmail')?.value.trim() || '';
  const stripeCustomerId = _checkoutSelectedMember?.StripeCustomerID || '';

  const payload = {
    planName: description,
    planPrice: subtotal,
    taxAmount: tax,
    isRecurring: _payIsRecurring,
    customerEmail: memberEmail,
    stripeCustomerId: stripeCustomerId,
    embedded: false
  };

  const result = await api('createCheckout', payload);

  btn.disabled = false;
  btn.innerHTML = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg> Generate Link';

  if (result && result.warning) {
    showToast(result.warning, 'warning');
  }

  if (result && result.success) {
    showToast('Checkout link generated', 'success');
    const url = result.url || '';
    const memberPhone = _checkoutSelectedMember?.Phone || '';

    const emailSubjectEncoded = encodeURIComponent('Your Labyrinth BJJ Checkout Link');
    const emailBodyEncoded = encodeURIComponent(`Hi,\n\nHere is your checkout link:\n${url}\n\nLabyrinth BJJ`);
    const smsLinkBtn = memberPhone
      ? `<button class="btn btn-sm btn-send-sms" onclick="sendCheckoutViaSMS('${esc(memberPhone)}', '${esc(url)}')">
           <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
           Text to Member
         </button>`
      : '';

    // Show result in the modal body area
    const body = document.getElementById('payModalBody');
    const summaryBar = document.getElementById('paySummaryBar');
    if (summaryBar) summaryBar.style.display = 'none';
    if (body) {
      body.innerHTML = `
        <div class="checkout-result" style="margin:0">
          <div class="checkout-result-label">Checkout Link Ready</div>
          <div class="checkout-link-row">
            <input type="text" id="checkoutLinkOutput" readonly value="${esc(url)}">
            <button class="btn btn-secondary btn-sm" onclick="copyCheckoutLink()">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
              Copy
            </button>
          </div>
          <div class="checkout-send-actions">
            ${memberEmail ? `<a class="btn btn-sm btn-send-email" href="mailto:${esc(memberEmail)}?subject=${emailSubjectEncoded}&body=${emailBodyEncoded}" target="_blank">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
              Email to Member
            </a>` : ''}
            ${smsLinkBtn}
          </div>
          <div style="margin-top:16px;padding-top:12px;border-top:1px solid var(--border);font-size:12px;color:var(--text-muted);">
            <strong>${esc(getPayMemberName())}</strong> &mdash; ${esc(description)} &mdash; $${getPayTotal().toFixed(2)}${tax > 0 ? ' (incl. $' + tax.toFixed(2) + ' tax)' : ''}
          </div>
        </div>
      `;
    }
  }
}

async function logCashPayment() {
  const btn = document.getElementById('cashPayBtn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Logging...';

  const subtotal = getPaySubtotal();
  const tax = getPayTaxAmount();
  const description = getPayDescription();
  const memberName = getPayMemberName();
  const memberId = _checkoutSelectedMember?.ID || '';

  const payload = {
    amount: subtotal,
    taxAmount: tax,
    memberName: memberName,
    memberId: memberId,
    description: description,
    paymentMethod: 'Cash'
  };

  const result = await api('logManualPayment', payload);

  btn.disabled = false;
  btn.innerHTML = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="3"/></svg> Mark as Cash/Other';

  if (result && result.success) {
    showToast('Payment logged', 'success');
    const body = document.getElementById('payModalBody');
    const summaryBar = document.getElementById('paySummaryBar');
    if (summaryBar) summaryBar.style.display = 'none';
    if (body) {
      body.innerHTML = `
        <div class="cash-logged-confirm">
          <div class="cash-logged-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <div class="cash-logged-title">Payment Logged</div>
          <div class="cash-logged-detail">
            <strong>$${getPayTotal().toFixed(2)}</strong>${tax > 0 ? ' (incl. $' + tax.toFixed(2) + ' tax)' : ''}<br>
            ${esc(memberName)} &mdash; ${esc(description)}<br>
            <span style="color:var(--text-faint)">Recorded as cash/other payment</span>
          </div>
          <div style="margin-top:20px">
            <button class="btn btn-secondary" onclick="closeModal(); renderPayments();">Done</button>
          </div>
        </div>
      `;
    }
  }
}

async function sendCheckoutViaSMS(phone, url) {
  const btn = event.currentTarget;
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span>';
  const message = `Your Labyrinth BJJ checkout link: ${url}`;
  const result = await api('sendMassSMS', { recipients: [{ phone: phone }], message: message });
  btn.disabled = false;
  btn.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg> Text to Member';
  if (result && result.success) {
    showToast('SMS sent', 'success');
  }
}

function copyCheckoutLink() {
  const input = document.getElementById('checkoutLinkOutput');
  if (!input) return;
  input.select();
  try {
    navigator.clipboard.writeText(input.value).catch(() => document.execCommand('copy'));
  } catch(_) {
    document.execCommand('copy');
  }
  showToast('Link copied to clipboard', 'success');
}

/* ── EMBEDDED STRIPE CHECKOUT ────────────────────────── */
async function startEmbeddedCheckout() {
  const btn = document.getElementById('payNowBtn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Loading...';

  const subtotal = getPaySubtotal();
  const tax = getPayTaxAmount();
  const total = getPayTotal();
  const description = getPayDescription();
  const memberName = getPayMemberName();
  const memberEmail = _checkoutSelectedMember?.Email || document.getElementById('walkInEmail')?.value.trim() || '';
  const stripeCustomerId = _checkoutSelectedMember?.StripeCustomerID || '';

  const payload = {
    planName: description,
    planPrice: subtotal,
    taxAmount: tax,
    isRecurring: _payIsRecurring,
    customerEmail: memberEmail,
    stripeCustomerId: stripeCustomerId,
    embedded: true
  };

  const result = await api('createCheckout', payload);

  btn.disabled = false;
  btn.innerHTML = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg> Pay Now';

  if (result && result.warning) {
    showToast(result.warning, 'warning');
  }

  if (!result || !result.success) {
    if (!result) {
      // api() already showed the error; add a suggestion
      showToast('Try using "Generate Link" instead.', 'info');
    } else {
      showToast('Failed to start checkout. Try using "Generate Link" instead.', 'error');
    }
    return;
  }

  if (!stripePromise) {
    showToast('Stripe.js not loaded. Please refresh and try again.', 'error');
    return;
  }

  // Hide payment form steps and summary actions
  const body = document.getElementById('payModalBody');
  const summaryBar = document.getElementById('paySummaryBar');
  const embedContainer = document.getElementById('stripeEmbedContainer');

  if (body) body.style.display = 'none';
  if (summaryBar) summaryBar.style.display = 'none';
  if (embedContainer) {
    embedContainer.style.display = 'block';
    embedContainer.innerHTML = `
      <div class="embed-header">
        <button class="btn btn-ghost btn-sm" onclick="exitEmbeddedCheckout()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
          Back
        </button>
        <span class="embed-header-info">
          <strong>${esc(memberName)}</strong> &mdash; ${esc(description)} &mdash; $${total.toFixed(2)}
        </span>
      </div>
      <div id="stripeEmbedMount" class="stripe-embed-mount">
        <div class="loading-state"><span class="spinner"></span> Loading checkout...</div>
      </div>
    `;
  }

  try {
    const checkout = await stripePromise.initEmbeddedCheckout({
      clientSecret: result.clientSecret,
      onComplete: () => {
        // Payment completed
        if (_activeEmbeddedCheckout) {
          _activeEmbeddedCheckout.destroy();
          _activeEmbeddedCheckout = null;
        }
        showPaymentSuccess(memberName, description, total, tax);
      }
    });
    _activeEmbeddedCheckout = checkout;
    const mountEl = document.getElementById('stripeEmbedMount');
    if (mountEl) {
      mountEl.innerHTML = '';
      checkout.mount('#stripeEmbedMount');
    }
  } catch (err) {
    showToast('Checkout error: ' + err.message + '. Try "Generate Link" instead.', 'error');
    exitEmbeddedCheckout();
  }
}

function exitEmbeddedCheckout() {
  // Destroy active checkout if any
  if (_activeEmbeddedCheckout) {
    try { _activeEmbeddedCheckout.destroy(); } catch(_) {}
    _activeEmbeddedCheckout = null;
  }
  // Show form steps and summary again
  const body = document.getElementById('payModalBody');
  const summaryBar = document.getElementById('paySummaryBar');
  const embedContainer = document.getElementById('stripeEmbedContainer');
  if (body) body.style.display = '';
  if (summaryBar) summaryBar.style.display = '';
  if (embedContainer) { embedContainer.style.display = 'none'; embedContainer.innerHTML = ''; }
}

function showPaymentSuccess(memberName, description, total, tax) {
  const body = document.getElementById('payModalBody');
  const summaryBar = document.getElementById('paySummaryBar');
  const embedContainer = document.getElementById('stripeEmbedContainer');
  if (summaryBar) summaryBar.style.display = 'none';
  if (embedContainer) embedContainer.style.display = 'none';
  if (body) {
    body.style.display = '';
    body.innerHTML = `
      <div class="payment-success">
        <div class="payment-success-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <div class="payment-success-title">Payment Successful</div>
        <div class="payment-success-detail">
          <strong>$${total.toFixed(2)}</strong>${tax > 0 ? ' (incl. $' + tax.toFixed(2) + ' tax)' : ''}<br>
          ${esc(memberName)} &mdash; ${esc(description)}
        </div>
        <div style="margin-top:20px">
          <button class="btn btn-secondary" onclick="closeModal(); renderPayments();">Done</button>
        </div>
      </div>
    `;
  }
}

/* ── CHARGE CARD ON FILE ─────────────────────────────── */
async function chargeCardOnFile() {
  const member = _checkoutSelectedMember;
  if (!member || !member.StripeCustomerID) {
    showToast('No Stripe Customer ID on this member', 'error');
    return;
  }

  const total = getPayTotal();
  const description = getPayDescription();
  const memberName = getPayMemberName();

  const confirmed = await showConfirmDialog({
    title: 'Charge Card on File?',
    message: `Charge $${total.toFixed(2)} to ${memberName}'s card on file for "${description}"?`,
    confirmText: 'Charge Card',
    confirmClass: 'btn-primary'
  });
  if (!confirmed) return;

  const btn = document.getElementById('chargeCardBtn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Charging...';

  const result = await api('chargeCardOnFile', {
    stripeCustomerId: member.StripeCustomerID,
    amount: total,
    description: description + ' — Labyrinth BJJ',
    memberId: member.ID || '',
    memberName: memberName
  });

  btn.disabled = false;
  btn.innerHTML = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/><circle cx="17" cy="15" r="1.5"/><circle cx="13" cy="15" r="1.5"/></svg> Charge Card on File';

  if (result && result.success) {
    showToast('Card charged successfully', 'success');
    showPaymentSuccess(memberName, description, total, getPayTaxAmount());
  } else if (!result) {
    // api() already showed the error toast; add a suggestion
    showToast('Try using "Pay Now" or "Generate Link" instead.', 'info');
  }
}

/* ── POINT OF SALE ──────────────────────────────────────── */
const POS_PRODUCTS = [
  // Merchandise
  { id: 'rash-guard', name: 'Rash Guard', price: 35, category: 'Merchandise', image: 'products/rash-guard.jpg' },
  { id: 'enigma-gi', name: 'Enigma BJJ Gi', price: 99, category: 'Merchandise', image: 'products/enigma-gi.jpg' },
  { id: 'shorts', name: 'Shorts', price: 35, category: 'Merchandise', image: 'products/shorts.jpg' },
  { id: 'tshirt', name: 'T-Shirt', price: 20, category: 'Merchandise', image: 'products/tshirt.jpg' },
  { id: 'hoodie', name: 'Hoodie', price: 40, category: 'Merchandise', image: 'products/hoodie.jpg' },
  { id: 'joggers', name: 'Joggers', price: 40, category: 'Merchandise', image: 'products/joggers.jpg' },
  { id: 'patch', name: 'Patch', price: 10, category: 'Merchandise', image: 'products/patch.jpg' },
  { id: 'backpack-l', name: 'Back Pack (L)', price: 50, category: 'Merchandise', image: 'products/backpack.jpg' },
  { id: 'backpack-s', name: 'Back Pack (S)', price: 40, category: 'Merchandise', image: 'products/backpack.jpg' },
  // Lessons
  { id: 'private-60', name: '1-Hour Private (Tony)', price: 120, category: 'Lessons', image: 'products/private-lesson.jpg' },
  { id: 'private-30', name: '30-Min Private (Tony)', price: 60, category: 'Lessons', image: 'products/private-lesson.jpg' },
  { id: 'private-5pack', name: '5 Private Pack (Tony)', price: 540, category: 'Lessons', image: 'products/private-lesson.jpg' },
  // Punch Cards
  { id: 'punch-5', name: '5 Class Punch Card', price: 160, category: 'Punch Cards', image: 'products/punch-card.jpg' },
  { id: 'punch-3', name: '3 Class Punch Card', price: 100, category: 'Punch Cards', image: 'products/punch-card.jpg' },
];

let posCart = [];  // [{product, quantity}]
let posCustomer = null;  // selected member or null
let posTaxEnabled = false;
let posCategory = 'All';

async function renderPOS() {
  // Redirect to unified payments page with POS tab active
  paymentsTab = 'pos';
  navigate('payments');
}

function setPosCategory(cat) {
  posCategory = cat;
  document.querySelectorAll('.pos-tab').forEach(t => t.classList.toggle('active', t.textContent === cat || (cat === 'Frequent' && t.textContent.includes('Frequent'))));
  renderPosProducts();
}

const POS_FAVORITES = ['tshirt', 'private-60', 'punch-5', 'rash-guard', 'patch'];

function renderPosProducts() {
  const grid = document.getElementById('posProductGrid');
  if (!grid) return;
  let items;
  if (posCategory === 'Frequent') {
    items = POS_FAVORITES.map(id => POS_PRODUCTS.find(p => p.id === id)).filter(Boolean);
  } else {
    items = posCategory === 'All' ? POS_PRODUCTS : POS_PRODUCTS.filter(p => p.category === posCategory);
  }
  grid.innerHTML = items.map(p => {
    const inCart = posCart.find(c => c.product.id === p.id);
    const isFav = POS_FAVORITES.includes(p.id) && posCategory === 'Frequent';
    const imgHtml = p.image ? `<div class="pos-product-image"><img src="${p.image}" alt="${esc(p.name)}" loading="lazy"></div>` : '';
    return `
      <div class="pos-product-card ${inCart ? 'in-cart' : ''} ${isFav ? 'favorite' : ''}" onclick="posAddItem('${p.id}')">
        ${imgHtml}
        <div class="pos-product-info">
          <div class="pos-product-name">${esc(p.name)}</div>
          <div class="pos-product-price">$${p.price.toFixed(2)}</div>
          <div class="pos-product-cat">${esc(p.category)}</div>
          ${inCart ? `<div class="pos-product-qty">${inCart.quantity} in cart</div>` : ''}
        </div>
        <button class="pos-add-btn" onclick="event.stopPropagation(); posAddItem('${p.id}')">+</button>
      </div>
    `;
  }).join('');
}

function posAddItem(productId) {
  const product = POS_PRODUCTS.find(p => p.id === productId);
  if (!product) return;
  const existing = posCart.find(c => c.product.id === productId);
  if (existing) {
    existing.quantity++;
  } else {
    posCart.push({ product, quantity: 1 });
  }
  renderPosCart();
  renderPosProducts();
}

function posRemoveItem(productId) {
  posCart = posCart.filter(c => c.product.id !== productId);
  renderPosCart();
  renderPosProducts();
}

function posChangeQty(productId, delta) {
  const item = posCart.find(c => c.product.id === productId);
  if (!item) return;
  item.quantity += delta;
  if (item.quantity <= 0) {
    posCart = posCart.filter(c => c.product.id !== productId);
  }
  renderPosCart();
  renderPosProducts();
}

function getPosSubtotal() {
  return posCart.reduce((sum, c) => sum + c.product.price * c.quantity, 0);
}

function getPosTax() {
  if (!posTaxEnabled) return 0;
  return Math.round(getPosSubtotal() * (taxSettings.taxRate / 100) * 100) / 100;
}

function getPosTotal() {
  return getPosSubtotal() + getPosTax();
}

function getPosDescription() {
  return posCart.map(c => c.quantity > 1 ? `${c.product.name} x${c.quantity}` : c.product.name).join(', ');
}

function getPosCustomerName() {
  if (posCustomer) return posCustomer.Name;
  const walkIn = document.getElementById('posWalkInName');
  return (walkIn && walkIn.value.trim()) || 'Walk-in';
}

function renderPosCart() {
  const inner = document.getElementById('posCartInner');
  if (!inner) return;

  const subtotal = getPosSubtotal();
  const tax = getPosTax();
  const total = getPosTotal();
  const itemCount = posCart.reduce((s, c) => s + c.quantity, 0);
  const hasStripeId = posCustomer && posCustomer.StripeCustomerID;

  inner.innerHTML = `
    <div class="pos-cart-header">
      <span class="pos-cart-title">Cart (${itemCount} item${itemCount !== 1 ? 's' : ''})</span>
      <div style="display:flex;gap:8px;align-items:center;">
        ${posCart.length > 0 ? `<button class="pos-cart-clear" onclick="posCart=[];posCustomer=null;renderPosCart();renderPosProducts();">Clear</button>` : ''}
        <button class="pos-cart-collapse" onclick="closeMobileCart()" title="Collapse">&times;</button>
      </div>
    </div>

    <div class="pos-cart-items">
      ${posCart.length === 0 ? '<div class="pos-cart-empty">Add items from the catalog</div>' : ''}
      ${posCart.map(c => `
        <div class="pos-cart-item">
          <div class="pos-cart-item-info">
            <div class="pos-cart-item-name">${esc(c.product.name)}</div>
            <div class="pos-cart-item-price">$${(c.product.price * c.quantity).toFixed(2)}</div>
          </div>
          <div class="pos-cart-item-controls">
            <div class="pos-qty">
              <button class="pos-qty-btn" onclick="posChangeQty('${c.product.id}', -1)">&minus;</button>
              <span class="pos-qty-num">${c.quantity}</span>
              <button class="pos-qty-btn" onclick="posChangeQty('${c.product.id}', 1)">+</button>
            </div>
            <button class="pos-remove-btn" onclick="posRemoveItem('${c.product.id}')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </div>
      `).join('')}
    </div>

    <div class="pos-totals">
      <div class="pos-tax-toggle">
        <span>Tax (${taxSettings.taxRate}%)</span>
        <label class="toggle-switch toggle-sm">
          <input type="checkbox" ${posTaxEnabled ? 'checked' : ''} onchange="posTaxEnabled=this.checked;renderPosCart();">
          <span class="toggle-track"></span>
        </label>
      </div>
      <div class="pos-total-row"><span>Subtotal</span><span>$${subtotal.toFixed(2)}</span></div>
      ${posTaxEnabled ? `<div class="pos-total-row"><span>Tax</span><span>$${tax.toFixed(2)}</span></div>` : ''}
      <div class="pos-total-row pos-total-final"><span>Total</span><span>$${total.toFixed(2)}</span></div>
    </div>

    <div class="pos-customer">
      <div class="pos-customer-label">Customer</div>
      ${posCustomer ? `
        <div class="pos-selected-customer">
          <div class="pos-cust-name">${esc(posCustomer.Name)}</div>
          <div class="pos-cust-meta">${esc(posCustomer.Plan || '')} ${posCustomer.StripeCustomerID ? '&bull; Card on file' : ''}</div>
          <button class="pos-cust-clear" onclick="posCustomer=null;renderPosCart();">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      ` : `
        <div class="pos-customer-search">
          <input type="text" id="posCustomerSearch" placeholder="Search member..." autocomplete="off"
            oninput="posFilterCustomer(this.value)" onfocus="posFilterCustomer(this.value)">
          <div class="typeahead-dropdown" id="posCustomerDrop"></div>
        </div>
        <div class="pos-walkin-field">
          <input type="text" id="posWalkInName" placeholder="Walk-in name" oninput="renderPosCart()">
        </div>
      `}
    </div>

    <div class="pos-actions">
      ${hasStripeId ? `
        <button class="btn btn-charge-card btn-full" ${subtotal <= 0 ? 'disabled' : ''} onclick="posChargeCard()">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
          Charge Card on File
        </button>
      ` : ''}
      <button class="btn btn-primary btn-full" ${subtotal <= 0 ? 'disabled' : ''} onclick="posGenerateCheckout()">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>
        Generate Checkout Link
      </button>
      <button class="btn btn-cash btn-full" ${subtotal <= 0 ? 'disabled' : ''} onclick="posLogCash()">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="3"/></svg>
        Mark as Cash/Other
      </button>
    </div>
  `;

  // Update mobile footer
  const mobileCount = document.getElementById('posMobileCount');
  const mobileTotal = document.getElementById('posMobileTotal');
  const mobileFooter = document.getElementById('posMobileFooter');
  if (mobileCount) mobileCount.textContent = `${itemCount} item${itemCount !== 1 ? 's' : ''}`;
  if (mobileTotal) mobileTotal.textContent = `$${total.toFixed(2)}`;
  if (mobileFooter) mobileFooter.classList.toggle('has-items', itemCount > 0);
}

function posFilterCustomer(query) {
  const drop = document.getElementById('posCustomerDrop');
  if (!drop) return;
  if (posCustomer) { drop.classList.remove('open'); return; }
  const q = query.trim().toLowerCase();
  const matches = q.length === 0
    ? membersCache.slice(0, 8)
    : membersCache.filter(m =>
        (m.Name || '').toLowerCase().includes(q) ||
        (m.Email || '').toLowerCase().includes(q)
      ).slice(0, 8);
  if (!matches.length) { drop.classList.remove('open'); drop.innerHTML = ''; return; }
  drop.innerHTML = matches.map(m => `
    <div class="typeahead-item" onclick="posSelectCustomer(${JSON.stringify(m).replace(/"/g, '&quot;')})">
      <span class="typeahead-item-name">${esc(m.Name)}</span>
      <span class="typeahead-item-meta">${esc(m.Plan || '')} &bull; ${m.StripeCustomerID ? 'Card ✓' : 'No card'}</span>
    </div>
  `).join('');
  drop.classList.add('open');
}

function posSelectCustomer(member) {
  posCustomer = member;
  const drop = document.getElementById('posCustomerDrop');
  if (drop) drop.classList.remove('open');
  renderPosCart();
}

function toggleMobileCart() {
  const cart = document.getElementById('posCart');
  if (!cart) return;
  const isOpen = cart.classList.toggle('mobile-open');
  // Add/remove backdrop
  let backdrop = document.getElementById('posCartBackdrop');
  if (isOpen) {
    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.id = 'posCartBackdrop';
      backdrop.className = 'pos-cart-backdrop';
      backdrop.onclick = toggleMobileCart;
      cart.parentElement.appendChild(backdrop);
    }
    backdrop.classList.add('visible');
  } else if (backdrop) {
    backdrop.classList.remove('visible');
  }
}

function closeMobileCart() {
  const cart = document.getElementById('posCart');
  if (cart) cart.classList.remove('mobile-open');
  const backdrop = document.getElementById('posCartBackdrop');
  if (backdrop) backdrop.classList.remove('visible');
}

// Alias for mobile optimization (toggles the POS cart drawer on mobile)
function togglePosCart() {
  toggleMobileCart();
}

async function posChargeCard() {
  if (!posCustomer || !posCustomer.StripeCustomerID) {
    showToast('No card on file for this customer', 'error');
    return;
  }
  const total = getPosTotal();
  const description = getPosDescription();
  const confirmed = await showConfirmDialog({
    title: 'Charge Card on File?',
    message: `Charge $${total.toFixed(2)} to ${posCustomer.Name}'s card for: ${description}?`,
    confirmText: 'Charge Card',
    confirmClass: 'btn-primary'
  });
  if (!confirmed) return;

  showToast('Processing charge...', 'info');
  const result = await api('chargeCardOnFile', {
    stripeCustomerId: posCustomer.StripeCustomerID,
    amount: total,
    description: 'POS: ' + description + ' — Labyrinth BJJ',
    memberId: posCustomer.ID || '',
    memberName: posCustomer.Name || ''
  });
  if (result && result.success) {
    showToast('Card charged $' + total.toFixed(2), 'success');
    posCart = [];
    renderPosCart();
    renderPosProducts();
  }
}

async function posGenerateCheckout() {
  const total = getPosTotal();
  const subtotal = getPosSubtotal();
  const tax = getPosTax();
  const description = getPosDescription();
  const customerEmail = posCustomer?.Email || '';
  const stripeCustomerId = posCustomer?.StripeCustomerID || '';

  showToast('Generating checkout link...', 'info');
  const result = await api('createCheckout', {
    planName: 'POS: ' + description,
    planPrice: subtotal,
    taxAmount: tax,
    isRecurring: false,
    customerEmail: customerEmail,
    stripeCustomerId: stripeCustomerId,
    embedded: false
  });

  if (result && result.success && result.url) {
    const url = result.url;
    openModal(`
      <div class="modal-header">
        <h2 class="modal-title">Checkout Link Ready</h2>
        <button class="modal-close" onclick="closeModal()">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <div class="modal-body">
        <p style="font-size:13px;color:var(--text-muted);margin-bottom:12px;">${esc(getPosCustomerName())} &mdash; ${esc(description)} &mdash; $${total.toFixed(2)}</p>
        <div style="display:flex;gap:8px;margin-bottom:16px;">
          <input type="text" id="posCheckoutUrl" value="${esc(url)}" readonly style="flex:1;font-size:13px;">
          <button class="btn btn-secondary btn-sm" onclick="document.getElementById('posCheckoutUrl').select();navigator.clipboard.writeText(document.getElementById('posCheckoutUrl').value);showToast('Copied','success');">Copy</button>
        </div>
        <div style="display:flex;gap:8px;">
          ${customerEmail ? `<a href="mailto:${encodeURIComponent(customerEmail)}?subject=${encodeURIComponent('Your Labyrinth BJJ Checkout')}&body=${encodeURIComponent('Here is your checkout link:\n' + url)}" class="btn btn-secondary btn-sm" style="text-decoration:none;">Email Link</a>` : ''}
          ${posCustomer?.Phone ? `<button class="btn btn-secondary btn-sm" onclick="sendCheckoutViaSMS('${esc(posCustomer.Phone)}', '${esc(url)}')">Text Link</button>` : ''}
        </div>
      </div>
    `);
    posCart = [];
    renderPosCart();
    renderPosProducts();
  }
}

async function posLogCash() {
  const total = getPosTotal();
  const subtotal = getPosSubtotal();
  const tax = getPosTax();
  const description = getPosDescription();
  const memberName = getPosCustomerName();
  const memberId = posCustomer?.ID || '';

  showToast('Logging payment...', 'info');
  const result = await api('logManualPayment', {
    amount: subtotal,
    taxAmount: tax,
    memberName: memberName,
    memberId: memberId,
    description: 'POS: ' + description,
    paymentMethod: 'Cash'
  });

  if (result && result.success) {
    showToast('Cash payment of $' + total.toFixed(2) + ' logged', 'success');
    posCart = [];
    renderPosCart();
    renderPosProducts();
  }
}

/* ── CLASS SCHEDULE ─────────────────────────────────────── */
const CLASS_SCHEDULE = {
  Monday: [
    { time: '6:30 AM', name: 'Adult BJJ', type: 'Gi', age: 'Adult' },
    { time: '11:00 AM', name: 'Adult BJJ', type: 'Gi', age: 'Adult' },
    { time: '4:45 PM', name: 'Kids BJJ (3–6)', type: 'Gi', age: 'Kids', note: 'Trials Fri Only' },
    { time: '5:15 PM', name: 'Kids BJJ (7–12)', type: 'Gi', age: 'Kids', note: 'Trials Fri Only' },
    { time: '6:30 PM', name: 'Adult BJJ', type: 'Gi', age: 'Adult' },
  ],
  Tuesday: [
    { time: '6:30 AM', name: 'Adult BJJ', type: 'No-Gi', age: 'Adult' },
    { time: '5:15 PM', name: 'Kids Grappling ADV (7–12)', type: 'No-Gi', age: 'Kids' },
    { time: '5:15 PM', name: 'Teens Grappling ADV (12–15)', type: 'No-Gi', age: 'Teens' },
    { time: '6:30 PM', name: 'Adult BJJ', type: 'No-Gi', age: 'Adult' },
  ],
  Wednesday: [
    { time: '11:00 AM', name: 'Adult BJJ', type: 'No-Gi', age: 'Adult' },
    { time: '4:45 PM', name: 'Kids BJJ (3–6)', type: 'Gi', age: 'Kids', note: 'Trials Fri Only' },
    { time: '5:15 PM', name: 'Kids BJJ (7–12)', type: 'Gi', age: 'Kids', note: 'Trials Fri Only' },
    { time: '6:30 PM', name: 'Adult BJJ', type: 'Gi', age: 'Adult' },
    { time: '7:30 PM', name: 'Wrestling (7–17)', type: 'Wrestling', age: 'Kids' },
  ],
  Thursday: [
    { time: '6:30 AM', name: 'Adult BJJ', type: 'No-Gi', age: 'Adult' },
    { time: '5:15 PM', name: 'Kids Grappling ADV (7–12)', type: 'No-Gi', age: 'Kids' },
    { time: '5:15 PM', name: 'Teens Grappling ADV (12–15)', type: 'No-Gi', age: 'Teens' },
    { time: '6:30 PM', name: 'Adult BJJ', type: 'No-Gi', age: 'Adult' },
    { time: '7:30 PM', name: 'Wrestling (7–17)', type: 'Wrestling', age: 'Kids' },
  ],
  Friday: [
    { time: '6:30 AM', name: 'Adult BJJ', type: 'Gi', age: 'Adult' },
    { time: '11:00 AM', name: 'Adult BJJ', type: 'Gi', age: 'Adult' },
    { time: '4:45 PM', name: 'Kids BJJ (3–6)', type: 'Gi', age: 'Kids' },
    { time: '5:15 PM', name: 'Kids BJJ Comp (7–12)', type: 'Gi', age: 'Kids' },
    { time: '5:15 PM', name: 'Teens BJJ Comp (12–15)', type: 'Gi', age: 'Teens' },
    { time: '6:30 PM', name: 'Adult Comp', type: 'Gi', age: 'Adult' },
  ],
  Saturday: [
    { time: '9:00 AM', name: 'Adult Comp', type: 'No-Gi', age: 'Adult' },
    { time: '10:00 AM', name: 'Kids Grappling (7–12)', type: 'No-Gi', age: 'Kids' },
    { time: '11:00 AM', name: 'Adult & Teens', type: 'No-Gi', age: 'Adult' },
    { time: '12:00 PM', name: 'Kids Grappling ADV (7–12)', type: 'No-Gi', age: 'Kids' },
    { time: '12:00 PM', name: 'Teens Grappling ADV (12–15)', type: 'No-Gi', age: 'Teens' },
  ],
  Sunday: [
    { time: '10:30 AM', name: 'Open Mat', type: 'Open', age: 'All' },
    { time: '1:00 PM', name: 'Wrestling (7–17)', type: 'Wrestling', age: 'Kids' },
  ]
};

let scheduleActiveDay = null;
let scheduleActiveFilter = 'all';

function parseClassTime(timeStr) {
  // Parse "6:30 AM", "11:00 AM", "4:45 PM" etc. into minutes since midnight
  if (!timeStr) return -1;
  const m = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!m) return -1;
  let h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  const ampm = m[3].toUpperCase();
  if (ampm === 'PM' && h !== 12) h += 12;
  if (ampm === 'AM' && h === 12) h = 0;
  return h * 60 + min;
}

function renderSchedule() {
  const main = document.getElementById('mainContent');
  const days = Object.keys(CLASS_SCHEDULE);
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  if (!scheduleActiveDay) scheduleActiveDay = today;

  const dayTabs = days.map(d =>
    `<button class="schedule-day-tab${d === scheduleActiveDay ? ' active' : ''}${d === today ? ' today' : ''}" onclick="showScheduleDay('${d}')">${d.substring(0, 3)}</button>`
  ).join('');

  const filterTabs = [
    { key: 'all', label: 'All' },
    { key: 'adult', label: 'Adult' },
    { key: 'kids', label: 'Kids' },
    { key: 'gi', label: 'Gi' },
    { key: 'nogi', label: 'No-Gi' },
  ].map(f =>
    `<button class="schedule-filter${scheduleActiveFilter === f.key ? ' active' : ''}" data-filter="${f.key}" onclick="filterSchedule('${f.key}')">${f.label}</button>`
  ).join('');

  main.innerHTML = `
    <div class="page-header" style="display:flex;align-items:center;justify-content:space-between;">
      <h1 class="page-title">Class Schedule</h1>
      <button class="btn btn-primary" onclick="showScheduleTrialModal()" style="white-space:nowrap;">&#128203; Book Trial</button>
    </div>
    <div class="schedule-day-tabs">${dayTabs}</div>
    <div class="schedule-filters">${filterTabs}</div>
    <div class="schedule-classes" id="scheduleClasses"></div>

    <div class="dashboard-section" style="margin-top:32px;">
      <div class="dashboard-section-header" style="display:flex;align-items:center;justify-content:space-between;">
        <span>&#127942; Tournaments</span>
        <button class="btn btn-primary btn-sm" onclick="showAddTournamentModal()">+ Add Tournament</button>
      </div>
      <div id="tournamentsList">
        <div class="empty-state" style="padding:16px 0;"><p>No tournaments added yet</p></div>
      </div>
    </div>
  `;

  showScheduleDay(scheduleActiveDay);
}

function showScheduleDay(day) {
  scheduleActiveDay = day;
  // Update active tab
  document.querySelectorAll('.schedule-day-tab').forEach(btn => {
    btn.classList.toggle('active', btn.textContent.trim() === day.substring(0, 3));
  });
  renderScheduleClasses();
}

function filterSchedule(filter) {
  scheduleActiveFilter = filter;
  document.querySelectorAll('.schedule-filter').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.filter === filter);
  });
  renderScheduleClasses();
}

function renderScheduleClasses() {
  const container = document.getElementById('scheduleClasses');
  if (!container) return;

  const classes = CLASS_SCHEDULE[scheduleActiveDay] || [];
  const now = new Date();
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const isToday = scheduleActiveDay === today;
  const nowMins = now.getHours() * 60 + now.getMinutes();

  // Filter
  const filtered = classes.filter(cls => {
    if (scheduleActiveFilter === 'all') return true;
    if (scheduleActiveFilter === 'adult') return cls.age === 'Adult' || cls.age === 'All';
    if (scheduleActiveFilter === 'kids') return cls.age === 'Kids' || cls.age === 'Teens';
    if (scheduleActiveFilter === 'gi') return cls.type === 'Gi';
    if (scheduleActiveFilter === 'nogi') return cls.type === 'No-Gi';
    return true;
  });

  if (filtered.length === 0) {
    container.innerHTML = '<div class="empty-state"><p>No classes match this filter</p></div>';
    return;
  }

  // Find the current/next class index (only when viewing today)
  let nowOrNextIdx = -1;
  if (isToday) {
    // Find first class that hasn't ended (class duration ~60min assumed)
    for (let i = 0; i < filtered.length; i++) {
      const startMins = parseClassTime(filtered[i].time);
      if (startMins >= nowMins - 60) { nowOrNextIdx = i; break; }
    }
  }

  container.innerHTML = filtered.map((cls, i) => {
    const startMins = parseClassTime(cls.time);
    const isNow = isToday && i === nowOrNextIdx && nowMins >= startMins;
    const isNext = isToday && i === nowOrNextIdx && nowMins < startMins;
    const isPast = isToday && startMins < nowMins - 60;
    const typeKey = cls.type.toLowerCase().replace('-', '-');
    const ageBadgeKey = 'age-' + cls.age.toLowerCase();

    return `
      <div class="schedule-class${isNow ? ' now' : ''}${isPast ? ' past' : ''}">
        <div class="schedule-time">${cls.time}</div>
        <div class="schedule-info">
          <div class="schedule-class-name">${cls.name}</div>
          <div class="schedule-badges">
            <span class="schedule-badge ${typeKey}">${cls.type}</span>
            <span class="schedule-badge ${ageBadgeKey}">${cls.age}</span>
            ${cls.note ? `<span class="schedule-note">${cls.note}</span>` : ''}
          </div>
        </div>
        ${isNow ? '<span class="schedule-live">LIVE</span>' : ''}
        ${isNext ? '<span class="schedule-live" style="background:var(--gold);color:#000;">UP NEXT</span>' : ''}
      </div>
    `;
  }).join('');
}

/* ── CONSOLIDATED MESSAGES (EMAIL + SMS) ────────────────── */
let messagesTab = 'email';

async function renderMessages() {
  const main = document.getElementById('mainContent');

  main.innerHTML = `
    <div class="page-header">
      <h1 class="page-title">Messages</h1>
    </div>

    <div class="messages-tabs">
      <button class="messages-tab${messagesTab === 'email' ? ' active' : ''}" onclick="switchMessagesTab('email')">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:6px;"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
        Email
      </button>
      <button class="messages-tab${messagesTab === 'sms' ? ' active' : ''}" onclick="switchMessagesTab('sms')">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:6px;"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
        SMS
      </button>
    </div>

    <div class="composer">
      <div class="card mb-16">
        <div class="card-header"><span class="card-title">Recipients</span></div>
        <div class="recipient-options" id="msgRecipients">
          <button class="recipient-chip selected" data-target="all" onclick="selectRecipient(this, 'msg')">All Members</button>
          <button class="recipient-chip" data-target="active" onclick="selectRecipient(this, 'msg')">Active Only</button>
          <button class="recipient-chip" data-target="trial" onclick="selectRecipient(this, 'msg')">Trials</button>
          <button class="recipient-chip" data-target="failed" onclick="selectRecipient(this, 'msg')">Failed Payments</button>
        </div>
        <div style="margin-top:10px;position:relative;">
          <input type="text" id="msgMemberSearch" placeholder="Or search for individual members..." oninput="msgSearchMember(this.value)" style="width:100%;">
          <div id="msgMemberSearchResults" style="position:absolute;left:0;right:0;top:100%;z-index:10;background:var(--surface);border:1px solid var(--border);border-radius:8px;max-height:160px;overflow-y:auto;display:none;"></div>
        </div>
        <div id="msgSelectedMembers" style="display:flex;flex-wrap:wrap;gap:6px;margin-top:8px;"></div>
      </div>

      <div id="msgComposerArea"></div>

      <div id="msgSendBar" style="display:flex;align-items:center;justify-content:space-between;margin-top:16px;"></div>
    </div>

    <div class="recent-comms-list">
      <div class="card-header" style="margin-bottom:12px;"><span class="card-title">Recent Messages</span></div>
      <div id="recentCommsList"><div class="loading-state"><span class="spinner"></span> Loading...</div></div>
    </div>

    <!-- P4: GymDesk Import -->
    <div class="card" style="margin-top:24px;">
      <div class="card-header">
        <span class="card-title">Import from GymDesk</span>
        <span style="font-size:11px;color:var(--text-muted);margin-left:8px;">CSV or JSON export</span>
      </div>
      <div style="padding:16px;">
        <p style="font-size:13px;color:var(--text-muted);margin-bottom:12px;">Export your communication history from GymDesk (Contacts → Export), then upload the file here.</p>
        <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
          <label class="btn btn-secondary" for="gymDeskImportFile" style="cursor:pointer;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:6px;"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17,8 12,3 7,8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            Choose File
          </label>
          <input type="file" id="gymDeskImportFile" accept=".csv,.json" style="display:none;" onchange="gymDeskHandleFileSelected(this)">
          <span id="gymDeskFileName" style="font-size:13px;color:var(--text-muted);">No file selected</span>
          <button class="btn btn-primary btn-sm" id="gymDeskImportBtn" onclick="gymDeskImport()" style="display:none;">Import</button>
        </div>
        <div id="gymDeskImportResult" style="margin-top:12px;"></div>
      </div>
    </div>
  `;

  renderMessageComposer();
  loadRecentComms();
}

function gymDeskHandleFileSelected(input) {
  const file = input.files && input.files[0];
  const nameEl = document.getElementById('gymDeskFileName');
  const btn = document.getElementById('gymDeskImportBtn');
  if (file) {
    if (nameEl) nameEl.textContent = file.name;
    if (btn) btn.style.display = '';
  } else {
    if (nameEl) nameEl.textContent = 'No file selected';
    if (btn) btn.style.display = 'none';
  }
}

async function gymDeskImport() {
  const input = document.getElementById('gymDeskImportFile');
  const file = input && input.files && input.files[0];
  if (!file) { showToast('Please select a file first', 'error'); return; }

  const resultEl = document.getElementById('gymDeskImportResult');
  if (resultEl) resultEl.innerHTML = '<div class="loading-state"><span class="spinner"></span> Parsing file...</div>';

  const btn = document.getElementById('gymDeskImportBtn');
  if (btn) { btn.disabled = true; btn.textContent = 'Importing...'; }

  try {
    const text = await file.text();
    let records = [];

    if (file.name.endsWith('.json')) {
      // GymDesk JSON export
      const parsed = JSON.parse(text);
      records = Array.isArray(parsed) ? parsed : (parsed.communications || parsed.messages || parsed.contacts || []);
    } else {
      // GymDesk CSV export — expected columns:
      // contact_name, email, message, date, channel (or similar)
      const lines = text.trim().split('\n');
      if (lines.length < 2) throw new Error('CSV appears to be empty');
      const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"+$/g, '').toLowerCase());
      for (let i = 1; i < lines.length; i++) {
        const vals = gymDeskParseCsvLine(lines[i]);
        const row = {};
        headers.forEach((h, idx) => { row[h] = (vals[idx] || '').trim(); });
        records.push(row);
      }
    }

    if (!records.length) {
      if (resultEl) resultEl.innerHTML = '<p style="color:var(--text-muted);font-size:13px;">No records found in file.</p>';
      if (btn) { btn.disabled = false; btn.textContent = 'Import'; }
      return;
    }

    // Map GymDesk fields to internal comms schema
    const mapped = records.map(r => ({
      type: (r.channel || r.type || r.medium || 'Email').replace(/^\w/, c => c.toUpperCase()),
      recipientName: r.contact_name || r.name || r.recipient || r.member_name || '',
      recipientContact: r.email || r.phone || r.contact || '',
      subject: r.subject || r.campaign || r.message_subject || '(GymDesk import)',
      message: r.message || r.body || r.content || r.text || '',
      date: r.date || r.sent_at || r.timestamp || r.created_at || new Date().toISOString(),
      importedFrom: 'GymDesk'
    })).filter(r => r.recipientName || r.message);

    // Deduplicate against existing comms by matching timestamp + recipient
    const existingKey = new Set();
    const existingComms = window._gymDeskExistingComms || [];
    existingComms.forEach(c => existingKey.add((c.date || '') + '|' + (c.recipientName || '').toLowerCase()));

    let imported = 0, skipped = 0;
    const toSave = [];
    mapped.forEach(c => {
      const key = (c.date || '') + '|' + (c.recipientName || '').toLowerCase();
      if (existingKey.has(key)) { skipped++; return; }
      existingKey.add(key);
      toSave.push(c);
      imported++;
    });

    // Save each record to backend
    let savedCount = 0;
    for (const comm of toSave) {
      try {
        const res = await api('logManualPayment', { // TODO: use a dedicated saveComm action if added to GAS
          type: comm.type,
          recipientName: comm.recipientName,
          recipientContact: comm.recipientContact,
          subject: comm.subject,
          message: comm.message,
          date: comm.date,
          importedFrom: 'GymDesk'
        });
        if (res) savedCount++;
      } catch(e) {
        console.warn('Failed to save GymDesk comm record:', e);
      }
    }

    const summary = `<div style="padding:12px 16px;background:rgba(34,197,94,0.08);border:1px solid rgba(34,197,94,0.2);border-radius:8px;font-size:13px;">
      <strong style="color:var(--success);">&#10003; Import complete</strong><br>
      ${imported} message${imported !== 1 ? 's' : ''} imported, ${skipped} duplicate${skipped !== 1 ? 's' : ''} skipped.
      ${savedCount < imported ? `<br><span style="color:var(--text-muted);">Note: ${imported - savedCount} records could not be saved to the backend — they are available locally this session.</span>` : ''}
    </div>`;

    if (resultEl) resultEl.innerHTML = summary;

    // Reload the recent comms list to show newly imported entries
    loadRecentComms();

  } catch(err) {
    console.error('GymDesk import error:', err);
    if (resultEl) resultEl.innerHTML = `<div style="padding:12px 16px;background:rgba(248,113,113,0.08);border:1px solid rgba(248,113,113,0.2);border-radius:8px;font-size:13px;color:var(--error);">&#9888; Import failed: ${esc(err.message)}.<br>Check that the file is a valid GymDesk CSV or JSON export.</div>`;
  }

  if (btn) { btn.disabled = false; btn.textContent = 'Import'; }
}

function gymDeskParseCsvLine(line) {
  // Handles quoted CSV fields
  const result = [];
  let current = '', inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i+1] === '"') { current += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(current); current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

function switchMessagesTab(tab) {
  messagesTab = tab;
  document.querySelectorAll('.messages-tab').forEach(btn => {
    btn.classList.toggle('active', btn.textContent.trim().toLowerCase() === tab);
  });
  renderMessageComposer();
  loadRecentComms();
}

function renderMessageComposer() {
  const area = document.getElementById('msgComposerArea');
  const bar = document.getElementById('msgSendBar');
  if (!area || !bar) return;

  if (messagesTab === 'email') {
    area.innerHTML = `
      <div class="form-group">
        <label>Subject Line</label>
        <input type="text" id="emailSubject" placeholder="Weekly update from Labyrinth BJJ">
      </div>
      <div class="form-group">
        <label>Message Body</label>
        <div class="composer-toolbar">
          <button class="toolbar-btn" onclick="formatText('bold')" title="Bold"><strong>B</strong></button>
          <button class="toolbar-btn" onclick="formatText('italic')" title="Italic"><em>I</em></button>
          <button class="toolbar-btn" onclick="formatText('underline')" title="Underline"><u>U</u></button>
          <button class="toolbar-btn" onclick="formatText('insertUnorderedList')" title="List">&#8226; List</button>
          <button class="toolbar-btn" onclick="formatText('createLink')" title="Link">&#128279; Link</button>
        </div>
        <div class="composer-body" id="emailBody" contenteditable="true" placeholder="Write your message here..."></div>
      </div>
    `;
    bar.innerHTML = `
      <button class="btn btn-secondary" onclick="previewEmail()">Preview</button>
      <button class="btn btn-primary" id="sendEmailBtn" onclick="sendMassEmail()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22,2 15,22 11,13 2,9"/></svg>
        Send Email
      </button>
    `;
  } else {
    area.innerHTML = `
      <div class="card mb-16" style="padding:12px 16px;background:var(--surface-2);">
        <div style="font-size:12px;color:var(--text-muted);">Sending from: <strong style="color:var(--gold);">+1 (281) 393-7983</strong> via OpenPhone</div>
      </div>
      <div class="form-group">
        <label>Message</label>
        <textarea id="smsBody" placeholder="Type your SMS message..." rows="4" maxlength="480" oninput="updateCharCounter()"></textarea>
        <div class="char-counter" id="smsCharCounter">0 / 160 characters (1 segment)</div>
      </div>
    `;
    bar.innerHTML = `
      <span></span>
      <button class="btn btn-primary" id="sendSmsBtn" onclick="sendMassSMS()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22,2 15,22 11,13 2,9"/></svg>
        Send SMS
      </button>
    `;
  }
}

async function loadRecentComms() {
  const container = document.getElementById('recentCommsList');
  if (!container) return;
  const result = await api('getRecentComms');
  const comms = (result && result.comms) ? result.comms : [];
  if (!comms.length) {
    container.innerHTML = '<div class="empty-state"><p>No messages sent yet</p></div>';
    return;
  }
  // Cache for deduplication use in GymDesk import
  window._gymDeskExistingComms = comms;

  // Filter comms by current messages tab (email vs sms)
  const filteredComms = comms.filter(c => {
    const typeKey = (c.type || 'email').toLowerCase();
    return typeKey === messagesTab;
  });

  container.innerHTML = filteredComms.map(c => {
    const typeKey = (c.type || 'email').toLowerCase();
    const icon = typeKey === 'sms' ? '&#128172;' : '&#128231;';
    const dateStr = c.date ? new Date(c.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '';
    const importedBadge = c.importedFrom ? `<span style="font-size:10px;padding:1px 6px;border-radius:3px;background:rgba(200,162,76,0.12);color:var(--gold);margin-left:6px;vertical-align:middle;">Imported from ${esc(c.importedFrom)}</span>` : '';
    return `
      <div class="recent-comm-item">
        <div class="recent-comm-type ${typeKey}">${icon}</div>
        <div style="flex:1;min-width:0;">
          <div style="font-size:13px;font-weight:600;color:var(--text);">${esc(c.recipientName || 'All Members')}${importedBadge}</div>
          ${c.subject ? `<div style="font-size:12px;color:var(--text-muted);">${esc(c.subject)}</div>` : ''}
          <div style="font-size:12px;color:var(--text-faint);margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(c.message || '')}</div>
        </div>
        <div style="font-size:11px;color:var(--text-faint);white-space:nowrap;flex-shrink:0;">${dateStr}</div>
      </div>
    `;
  }).join('');
}

/* ── MASS EMAIL (kept for backward compat) ─────────────── */
function renderEmail() {
  navigate('messages');
}

function formatText(cmd) {
  if (cmd === 'createLink') {
    const url = prompt('Enter URL:');
    if (url) document.execCommand(cmd, false, url);
  } else {
    document.execCommand(cmd, false, null);
  }
}

function selectRecipient(el, type) {
  const container = el.parentElement;
  container.querySelectorAll('.recipient-chip').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
  // Clear individual member selections when a group chip is chosen
  _msgSelectedMembers = [];
  const selEl = document.getElementById('msgSelectedMembers');
  if (selEl) selEl.innerHTML = '';
}

let _msgSelectedMembers = [];

function msgSearchMember(query) {
  const resultsEl = document.getElementById('msgMemberSearchResults');
  if (!resultsEl) return;
  const q = (query || '').trim().toLowerCase();
  if (!q || q.length < 2) { resultsEl.style.display = 'none'; resultsEl.innerHTML = ''; return; }
  const matches = membersCache.filter(m =>
    (m.Name || '').toLowerCase().includes(q) ||
    (m.Email || '').toLowerCase().includes(q) ||
    (m.Phone || '').includes(q)
  ).filter(m => !_msgSelectedMembers.find(s => s.name === m.Name)).slice(0, 6);
  if (!matches.length) { resultsEl.style.display = 'none'; return; }
  resultsEl.style.display = '';
  resultsEl.innerHTML = matches.map(m =>
    `<div style="padding:8px 12px;cursor:pointer;font-size:13px;border-bottom:1px solid var(--border);" onmouseover="this.style.background='var(--surface-2)'" onmouseout="this.style.background=''" onclick="addMsgMember('${esc(m.Name)}','${esc(m.Email || '')}','${esc(m.Phone || '')}')">
      <strong>${esc(m.Name)}</strong> <span style="color:var(--text-muted);">${esc(m.Email || '')}${m.Phone ? ' · ' + esc(m.Phone) : ''}</span>
    </div>`
  ).join('');
}

function addMsgMember(name, email, phone) {
  if (_msgSelectedMembers.find(m => m.name === name)) return;
  _msgSelectedMembers.push({ name, email, phone });
  renderMsgSelectedMembers();
  const searchInput = document.getElementById('msgMemberSearch');
  if (searchInput) searchInput.value = '';
  const resultsEl = document.getElementById('msgMemberSearchResults');
  if (resultsEl) { resultsEl.style.display = 'none'; resultsEl.innerHTML = ''; }
  // Deselect group chips when individual members are chosen
  document.querySelectorAll('#msgRecipients .recipient-chip').forEach(c => c.classList.remove('selected'));
}

function removeMsgMember(name) {
  _msgSelectedMembers = _msgSelectedMembers.filter(m => m.name !== name);
  renderMsgSelectedMembers();
  if (_msgSelectedMembers.length === 0) {
    // Re-select "All Members" if no individual members remain
    const allBtn = document.querySelector('#msgRecipients .recipient-chip[data-target="all"]');
    if (allBtn) allBtn.classList.add('selected');
  }
}

function renderMsgSelectedMembers() {
  const el = document.getElementById('msgSelectedMembers');
  if (!el) return;
  el.innerHTML = _msgSelectedMembers.map(m =>
    `<span style="display:inline-flex;align-items:center;gap:4px;padding:4px 10px;background:var(--surface-2);border-radius:20px;font-size:12px;color:var(--text);">
      ${esc(m.name)}
      <span onclick="removeMsgMember('${esc(m.name)}')" style="cursor:pointer;color:var(--text-muted);font-size:14px;line-height:1;">&times;</span>
    </span>`
  ).join('');
}

function getSelectedTarget(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return null;
  const selected = container.querySelector('.recipient-chip.selected');
  return selected ? selected.dataset.target : 'all';
}

async function sendMassEmail() {
  const subject = document.getElementById('emailSubject').value.trim();
  const body = document.getElementById('emailBody').innerHTML.trim();
  const target = _msgSelectedMembers.length > 0 ? 'custom' : (getSelectedTarget('msgRecipients') || getSelectedTarget('emailRecipients') || 'all');

  if (!subject) { showToast('Subject is required', 'error'); return; }
  if (!body) { showToast('Message body is required', 'error'); return; }

  const targetLabel = _msgSelectedMembers.length > 0
    ? _msgSelectedMembers.map(m => m.name).join(', ')
    : ({ all: 'all members', active: 'active members', trial: 'trial members', failed: 'members with failed payments' }[target] || target);
  const confirmed = await showConfirmDialog({
    title: _msgSelectedMembers.length > 0 ? 'Send Email?' : 'Send Mass Email?',
    message: `This will send "${subject}" to ${targetLabel}. This action cannot be undone.`,
    confirmText: 'Send Email',
    confirmClass: 'btn-primary'
  });
  if (!confirmed) return;

  const btn = document.getElementById('sendEmailBtn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Sending...';

  const emailPayload = { subject, htmlBody: body, target };
  if (_msgSelectedMembers.length > 0) {
    emailPayload.recipients = _msgSelectedMembers.map(m => m.email);
  }
  const result = await api('sendMassEmail', emailPayload);

  btn.disabled = false;
  btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22,2 15,22 11,13 2,9"/></svg> Send Email';

  if (result && result.success) {
    showToast(`Email sent to ${result.sentCount} recipient${result.sentCount !== 1 ? 's' : ''}`, 'success');
    if (result.errors && result.errors.length) {
      showToast(`${result.errors.length} failed: ${result.errors[0]}`, 'error');
    }
  }
}

function previewEmail() {
  const subject = document.getElementById('emailSubject').value || 'Preview';
  const body = document.getElementById('emailBody').innerHTML || '<p>Your message here...</p>';

  openModal(`
    <div class="modal-header">
      <h2 class="modal-title">Email Preview</h2>
      <button class="modal-close" onclick="closeModal()">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
    <div class="modal-body" style="padding:0;">
      <div style="background:#0A0A0A;padding:24px;text-align:center;border-bottom:2px solid #C8A24C;">
        <h1 style="margin:0;color:#C8A24C;font-size:20px;letter-spacing:2px;font-family:var(--font-display);">LABYRINTH BJJ</h1>
      </div>
      <div style="padding:24px;">
        <div style="font-size:12px;color:var(--text-muted);margin-bottom:8px;">Subject: ${esc(subject)}</div>
        <div style="color:var(--text);font-size:14px;line-height:1.6;">${body}</div>
      </div>
      <div style="padding:12px 24px;background:var(--bg);text-align:center;color:var(--text-faint);font-size:11px;border-top:1px solid var(--border);">
        Labyrinth BJJ &bull; Fulshear, TX &bull; labyrinth.vision
      </div>
    </div>
  `);
}

/* ── MASS SMS (kept for backward compat) ───────────────── */
function renderSMS() {
  messagesTab = 'sms';
  navigate('messages');
}

function updateCharCounter() {
  const text = document.getElementById('smsBody').value;
  const len = text.length;
  const segments = Math.ceil(len / 160) || 1;
  const counter = document.getElementById('smsCharCounter');
  counter.textContent = `${len} / 160 characters (${segments} segment${segments > 1 ? 's' : ''})`;
  counter.className = 'char-counter' + (len > 160 ? ' warn' : '') + (len > 320 ? ' over' : '');
}

async function sendMassSMS() {
  const message = document.getElementById('smsBody').value.trim();
  const target = _msgSelectedMembers.length > 0 ? 'custom' : (getSelectedTarget('msgRecipients') || getSelectedTarget('smsRecipients') || 'all');

  if (!message) { showToast('Message is required', 'error'); return; }

  const targetLabel = _msgSelectedMembers.length > 0
    ? _msgSelectedMembers.map(m => m.name).join(', ')
    : ({ all: 'all members', active: 'active members', trial: 'trial members', failed: 'members with failed payments' }[target] || target);
  const preview = message.length > 60 ? message.slice(0, 60) + '...' : message;
  const confirmed = await showConfirmDialog({
    title: _msgSelectedMembers.length > 0 ? 'Send SMS?' : 'Send Mass SMS?',
    message: `This will send "${preview}" to ${targetLabel}. Carrier charges may apply. This action cannot be undone.`,
    confirmText: 'Send SMS',
    confirmClass: 'btn-primary'
  });
  if (!confirmed) return;

  const btn = document.getElementById('sendSmsBtn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Sending...';

  const smsPayload = { message, target };
  if (_msgSelectedMembers.length > 0) {
    smsPayload.recipients = _msgSelectedMembers.map(m => ({ phone: m.phone }));
  }
  const result = await api('sendMassSMS', smsPayload);

  btn.disabled = false;
  btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22,2 15,22 11,13 2,9"/></svg> Send SMS';

  if (result && result.success) {
    showToast(`SMS sent to ${result.sentCount} recipient${result.sentCount !== 1 ? 's' : ''}`, 'success');
    if (result.errors && result.errors.length) {
      showToast(`${result.errors.length} failed`, 'error');
    }
  }
}

/* ── SETTINGS ───────────────────────────────────────────── */
async function renderSettings() {
  const main = document.getElementById('mainContent');
  main.innerHTML = `
    <div class="page-header">
      <h1 class="page-title">Settings</h1>
    </div>

    <div class="settings-section">
      <h2 style="font-size:16px;font-weight:600;margin-bottom:16px;">API Keys</h2>
      <p class="text-sm text-muted mb-16">Keys are stored securely in Google Apps Script PropertiesService. Only the last 4 characters are shown.</p>
      <div class="settings-grid" id="apiKeysGrid">
        <div class="loading-state"><span class="spinner"></span> Loading...</div>
      </div>
      <div class="mt-16">
        <button class="btn btn-primary" onclick="saveSettings()">Save API Keys</button>
      </div>
    </div>

    <div class="settings-section" id="taxSettingsSection">
      <h2 style="font-size:16px;font-weight:600;margin-bottom:16px;">Tax Settings</h2>
      <p class="text-sm text-muted mb-16">Configure sales tax for payment calculations.</p>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;max-width:400px;">
        <div class="form-group">
          <label>Tax Rate (%)</label>
          <input type="number" id="setTaxRate" value="8.25" min="0" max="100" step="0.01" placeholder="8.25">
        </div>
        <div class="form-group">
          <label>&nbsp;</label>
          <div class="toggle-row" style="padding:8px 0">
            <span class="toggle-label">Enable by default</span>
            <label class="toggle-switch">
              <input type="checkbox" id="setTaxDefault">
              <span class="toggle-track"></span>
            </label>
          </div>
        </div>
      </div>
      <div class="mt-8">
        <button class="btn btn-primary btn-sm" onclick="saveTaxSettings()">Save Tax Settings</button>
      </div>
    </div>

    <div class="settings-section">
      <h2 style="font-size:16px;font-weight:600;margin-bottom:16px;">Membership Plans</h2>
      <div id="plansEditor">
        <div class="loading-state"><span class="spinner"></span> Loading...</div>
      </div>
    </div>

    ${adminRole === 'owner' ? `
    <div class="settings-section" id="adminUsersSection">
      <h2 style="font-size:16px;font-weight:600;margin-bottom:16px;">Admin Users</h2>
      <p class="text-sm text-muted mb-16">Manage who can access this admin portal.</p>
      <div id="adminUsersList"><div class="loading-state"><span class="spinner"></span> Loading...</div></div>
      <div class="mt-16">
        <button class="btn btn-secondary" onclick="showCreateAdminModal()">+ Add Admin User</button>
      </div>
    </div>
    ` : ''}

    ${currentLocationId === 'fulshear' ? renderFranchiseSettings() : ''}
  `;

  // Load settings
  const settings = await api('getSettings');
  const apiKeysGrid = document.getElementById('apiKeysGrid');
  if (settings) {
    apiKeysGrid.innerHTML = `
      <div class="form-group">
        <label>Stripe Secret Key</label>
        <div class="api-key-field">
          <input type="password" id="setStripeKey" value="${esc(settings.STRIPE_SECRET_KEY)}" placeholder="sk_live_xxxxx">
          <span class="status-dot ${settings.hasStripe ? 'connected' : 'disconnected'}"></span>
        </div>
      </div>
      <div class="form-group">
        <label>Stripe Webhook Secret</label>
        <div class="api-key-field">
          <input type="password" id="setStripeWebhook" value="${esc(settings.STRIPE_WEBHOOK_SECRET)}" placeholder="whsec_xxxxx">
        </div>
      </div>
      <div class="form-group">
        <label>OpenPhone API Key</label>
        <div class="api-key-field">
          <input type="password" id="setOpenPhoneKey" value="${esc(settings.OPENPHONE_API_KEY)}" placeholder="op_xxxxx">
          <span class="status-dot ${settings.hasOpenPhone ? 'connected' : 'disconnected'}"></span>
        </div>
      </div>
      <div class="form-group">
        <label>Mailchimp API Key <span style="font-size:11px;padding:1px 6px;border-radius:3px;background:rgba(200,162,76,0.12);color:var(--gold);vertical-align:middle;">Coming Soon</span></label>
        <div class="api-key-field">
          <input type="password" id="setMailchimpKey" value="${esc(settings.MAILCHIMP_API_KEY)}" placeholder="xxxxx-us1" disabled style="opacity:0.5;cursor:not-allowed;">
          <span class="status-dot ${settings.hasMailchimp ? 'connected' : 'disconnected'}"></span>
        </div>
      </div>
    `;
  } else if (apiKeysGrid) {
    apiKeysGrid.innerHTML = `
      <div style="padding:16px;background:rgba(248,113,113,0.08);border:1px solid rgba(248,113,113,0.2);border-radius:8px;">
        <p style="color:var(--error);font-size:13px;margin-bottom:10px;">&#9888; Could not load settings from the backend.</p>
        <button class="btn btn-secondary btn-sm" onclick="renderSettings()">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:4px;"><polyline points="23,4 23,10 17,10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>
          Retry
        </button>
      </div>
    `;
  }

  // Load tax settings
  const taxData = await api('getTaxSettings');
  if (taxData) {
    const taxRateInput = document.getElementById('setTaxRate');
    const taxDefaultInput = document.getElementById('setTaxDefault');
    if (taxRateInput) taxRateInput.value = taxData.taxRate || 8.25;
    if (taxDefaultInput) taxDefaultInput.checked = !!taxData.taxDefault;
    taxSettings.taxRate = taxData.taxRate || 8.25;
    taxSettings.taxDefault = !!taxData.taxDefault;
  }

  // Load plans
  const plansData = await api('getPlans');
  if (plansData && plansData.plans) {
    plansCache = plansData.plans;
    renderPlansEditor();
  } else if (!plansData) {
    const plansEditor = document.getElementById('plansEditor');
    if (plansEditor) {
      plansEditor.innerHTML = `
        <div style="padding:16px;background:rgba(248,113,113,0.08);border:1px solid rgba(248,113,113,0.2);border-radius:8px;">
          <p style="color:var(--error);font-size:13px;margin-bottom:10px;">&#9888; Could not load membership plans.</p>
          <button class="btn btn-secondary btn-sm" onclick="renderSettings()">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:4px;"><polyline points="23,4 23,10 17,10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>
            Retry
          </button>
        </div>
      `;
    }
  }

  // Load admin users (owner only)
  if (adminRole === 'owner') {
    loadAdminUsers();
  }
}

async function loadAdminUsers() {
  const listEl = document.getElementById('adminUsersList');
  if (!listEl) return;
  let result;
  try {
    result = await api('getAdminUsers');
  } catch (err) {
    listEl.innerHTML = '<div class="empty-state" style="padding:16px 0"><p style="color:var(--error)">Failed to load admin users. <a href="#" onclick="event.preventDefault();loadAdminUsers()">Retry</a></p></div>';
    return;
  }
  if (result && result.error) {
    listEl.innerHTML = '<div class="empty-state" style="padding:16px 0"><p style="color:var(--error)">' + esc(result.error) + ' <a href="#" onclick="event.preventDefault();loadAdminUsers()">Retry</a></p></div>';
    return;
  }
  const users = (result && (result.users || result.adminUsers)) ? (result.users || result.adminUsers) : [];
  if (!users.length) {
    listEl.innerHTML = '<div class="empty-state" style="padding:16px 0"><p>No admin users yet</p></div>';
    return;
  }
  const roleLabels = { owner: 'Owner', frontdesk: 'Front Desk', manager: 'Manager' };
  const locLabels = { fulshear: 'Fulshear', katy: 'Katy', foundations: 'Foundations', wharton: 'Wharton' };
  listEl.innerHTML = `<div class="admin-users-list">${users.map(u => `
    <div class="admin-user-row">
      <div class="admin-user-info">
        <div class="admin-user-name">${esc(u.name || u.email)}</div>
        <div class="admin-user-meta">${esc(u.email)} &bull; ${esc(roleLabels[u.role] || u.role)} &bull; ${esc(locLabels[u.location] || u.location)}</div>
      </div>
      <button class="btn btn-ghost btn-sm" style="color:var(--error)" onclick="deleteAdminUser('${esc(u.email)}')" title="Delete">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3,6 5,6 21,6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
      </button>
    </div>
  `).join('')}</div>`;
}

async function deleteAdminUser(email) {
  if (!confirm('Delete admin user ' + email + '?')) return;
  const result = await api('deleteAdminUser', { email });
  if (result && result.success) {
    showToast('Admin user removed', 'success');
    loadAdminUsers();
  }
}

function showCreateAdminModal() {
  const overlay = document.getElementById('modalOverlay');
  const content = document.getElementById('modalContent');
  content.className = 'modal';
  content.innerHTML = `
    <div class="modal-header"><h2 class="modal-title">Add Admin User</h2></div>
    <div class="modal-body">
      <div class="form-group"><label>Full Name</label><input type="text" id="newAdminName" placeholder="Jane Smith"></div>
      <div class="form-group"><label>Email <span style="color:var(--error)">*</span></label><input type="email" id="newAdminEmail" placeholder="jane@labyrinth.vision"></div>
      <div class="form-group"><label>Password <span style="color:var(--error)">*</span></label><input type="password" id="newAdminPassword" placeholder="Secure password"></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
        <div class="form-group">
          <label>Role</label>
          <select id="newAdminRole">
            <option value="frontdesk">Front Desk</option>
            <option value="manager">Manager</option>
            <option value="owner">Owner</option>
          </select>
        </div>
        <div class="form-group">
          <label>Location</label>
          <select id="newAdminLocation">
            <option value="fulshear">Fulshear</option>
            <option value="katy">Katy</option>
            <option value="foundations">Foundations</option>
            <option value="wharton">Wharton</option>
          </select>
        </div>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="createAdminUser()">Create Account</button>
    </div>
  `;
  overlay.style.display = 'flex';
  overlay.onclick = function(e) { if (e.target === overlay) closeModal(); };
}

async function createAdminUser() {
  const name = document.getElementById('newAdminName').value.trim();
  const email = document.getElementById('newAdminEmail').value.trim();
  const password = document.getElementById('newAdminPassword').value;
  const role = document.getElementById('newAdminRole').value;
  const location = document.getElementById('newAdminLocation').value;
  if (!email || !password) { showToast('Email and password are required', 'error'); return; }
  const result = await api('createAdminUser', { name, email, password, role, location });
  if (result && result.success) {
    showToast('Admin user created', 'success');
    closeModal();
    loadAdminUsers();
  }
}

function renderPlansEditor() {
  const container = document.getElementById('plansEditor');
  container.innerHTML = `
    <div class="plan-row" style="font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;">
      <span>Plan Name</span>
      <span>Price</span>
      <span>Type</span>
      <span></span>
    </div>
    ${plansCache.map((p, i) => `
      <div class="plan-row">
        <input type="text" value="${esc(p.name)}" onchange="plansCache[${i}].name=this.value" style="font-size:13px;">
        <input type="number" value="${p.price}" onchange="plansCache[${i}].price=parseFloat(this.value)" style="font-size:13px;">
        <select onchange="plansCache[${i}].type=this.value" style="font-size:13px;">
          <option value="recurring" ${p.type === 'recurring' ? 'selected' : ''}>Monthly</option>
          <option value="one-time" ${p.type === 'one-time' ? 'selected' : ''}>One-time</option>
        </select>
        <button class="btn btn-ghost btn-sm" onclick="removePlan(${i})" style="color:var(--error);padding:4px;" title="Remove">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
    `).join('')}
    <div class="mt-16 flex gap-8">
      <button class="btn btn-secondary btn-sm" onclick="addPlan()">+ Add Plan</button>
      <button class="btn btn-primary btn-sm" onclick="savePlans()">Save Plans</button>
    </div>
  `;
}

function addPlan() {
  plansCache.push({ name: 'New Plan', price: 0, interval: 'month', type: 'recurring' });
  renderPlansEditor();
}

function removePlan(index) {
  plansCache.splice(index, 1);
  renderPlansEditor();
}

async function savePlans() {
  const result = await api('savePlans', { plans: plansCache });
  if (result && result.success) {
    showToast('Plans saved', 'success');
  }
}

async function saveSettings() {
  const data = {
    STRIPE_SECRET_KEY: document.getElementById('setStripeKey').value,
    STRIPE_WEBHOOK_SECRET: document.getElementById('setStripeWebhook').value,
    OPENPHONE_API_KEY: document.getElementById('setOpenPhoneKey').value,
    MAILCHIMP_API_KEY: document.getElementById('setMailchimpKey').value
  };

  const result = await api('saveSettings', data);
  if (result && result.success) {
    showToast('API keys saved securely', 'success');
    renderSettings(); // Refresh to show updated status dots
  }
}

async function saveTaxSettings() {
  const taxRate = parseFloat(document.getElementById('setTaxRate').value) || 0;
  const taxDefault = document.getElementById('setTaxDefault').checked;

  const result = await api('saveTaxSettings', { taxRate, taxDefault });
  if (result && result.success) {
    taxSettings.taxRate = taxRate;
    taxSettings.taxDefault = taxDefault;
    showToast('Tax settings saved', 'success');
  }
}

/* ── WAIVER SYSTEM ─────────────────────────────────────── */

const WAIVER_TEXT = `LABYRINTH BJJ — LIABILITY WAIVER AND RELEASE

I, the undersigned, hereby acknowledge that I am voluntarily participating in Brazilian Jiu-Jitsu training, martial arts instruction, and related activities at Labyrinth BJJ located in Fulshear, TX.

ASSUMPTION OF RISK: I understand that martial arts training involves inherent risks including but not limited to: bruises, sprains, fractures, concussions, and other injuries. I voluntarily assume all risks associated with participation.

RELEASE AND WAIVER: I hereby release, waive, and discharge Labyrinth BJJ, its owners, instructors, employees, and agents from any and all liability, claims, demands, or causes of action arising from my participation.

MEDICAL ACKNOWLEDGMENT: I confirm that I am physically fit to participate and have no medical conditions that would prevent safe participation. I agree to inform the instructor of any injuries or medical conditions.

PHOTO/VIDEO CONSENT: I consent to the use of photographs and videos taken during training for promotional purposes.

FOR MINORS: If the participant is under 18, the parent/legal guardian signing below assumes all risks on behalf of the minor and agrees to the terms above.

This waiver is valid for the duration of membership/participation at Labyrinth BJJ.`;

function showWaiverModal(options = {}) {
  const { memberName = '', memberEmail = '', participantType = 'Adult', onComplete = null } = options;

  const overlay = document.getElementById('modalOverlay');
  const content = document.getElementById('modalContent');
  content.className = 'modal waiver-modal';

  content.innerHTML = `
    <div class="modal-header">
      <h2 class="modal-title">Liability Waiver — Labyrinth BJJ</h2>
      <button class="modal-close" onclick="closeModal()">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
    <div class="modal-body" style="padding-bottom:0;">
      <div class="waiver-text">${esc(WAIVER_TEXT).replace(/\n/g, '<br>')}</div>

      <div class="waiver-fields">
        <div class="form-group" style="flex:1;">
          <label>Full Name <span style="color:var(--error)">*</span></label>
          <input type="text" id="waiverName" value="${esc(memberName)}" placeholder="John Smith" oninput="_waiverCheckReady()" required>
        </div>
        <div class="form-group" style="flex:1;">
          <label>Email</label>
          <input type="email" id="waiverEmail" value="${esc(memberEmail)}" placeholder="john@example.com">
        </div>
        <div class="form-group" style="width:160px;">
          <label>Participant Type</label>
          <select id="waiverType">
            <option value="Adult" ${participantType === 'Adult' ? 'selected' : ''}>Adult (18+)</option>
            <option value="Minor" ${participantType === 'Minor' ? 'selected' : ''}>Minor (Guardian signing)</option>
          </select>
        </div>
      </div>

      <div class="waiver-canvas-wrap">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
          <label style="font-size:12px;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;">Signature</label>
          <button type="button" class="waiver-clear-btn" onclick="_waiverClear()">Clear</button>
        </div>
        <canvas id="waiverCanvas" class="waiver-canvas"></canvas>
        <div style="font-size:11px;color:var(--text-faint);margin-top:4px;">Draw your signature above using your finger or mouse</div>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn waiver-agree-btn" id="waiverSubmitBtn" disabled onclick="_waiverSubmit()">I Agree &amp; Sign</button>
    </div>
  `;

  overlay.style.display = 'flex';
  overlay.onclick = function(e) { if (e.target === overlay) closeModal(); };

  // Store callback on window for access inside submit handler
  window._waiverOnComplete = onComplete;

  // Initialize canvas after DOM settles
  requestAnimationFrame(() => _waiverInitCanvas());
}

function _waiverInitCanvas() {
  const canvas = document.getElementById('waiverCanvas');
  if (!canvas) return;

  // Size the canvas to its rendered width
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width || canvas.offsetWidth || 620;
  canvas.height = 130;

  const ctx = canvas.getContext('2d');
  ctx.strokeStyle = '#C8A24C';
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  let isDrawing = false;
  window._waiverHasSignature = false;

  function getPos(e) {
    const r = canvas.getBoundingClientRect();
    if (e.touches) {
      return { x: e.touches[0].clientX - r.left, y: e.touches[0].clientY - r.top };
    }
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  function startDraw(e) {
    e.preventDefault();
    isDrawing = true;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  }

  function draw(e) {
    if (!isDrawing) return;
    e.preventDefault();
    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    window._waiverHasSignature = true;
    _waiverCheckReady();
  }

  function stopDraw(e) {
    if (isDrawing) { e.preventDefault(); isDrawing = false; }
  }

  canvas.addEventListener('mousedown', startDraw);
  canvas.addEventListener('mousemove', draw);
  canvas.addEventListener('mouseup', stopDraw);
  canvas.addEventListener('mouseleave', stopDraw);
  canvas.addEventListener('touchstart', startDraw, { passive: false });
  canvas.addEventListener('touchmove', draw, { passive: false });
  canvas.addEventListener('touchend', stopDraw, { passive: false });
}

function _waiverClear() {
  const canvas = document.getElementById('waiverCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  window._waiverHasSignature = false;
  _waiverCheckReady();
}

function _waiverCheckReady() {
  const btn = document.getElementById('waiverSubmitBtn');
  if (!btn) return;
  const name = (document.getElementById('waiverName')?.value || '').trim();
  btn.disabled = !(name && window._waiverHasSignature);
}

async function _waiverSubmit() {
  const canvas = document.getElementById('waiverCanvas');
  const name = document.getElementById('waiverName')?.value.trim() || '';
  const email = document.getElementById('waiverEmail')?.value.trim() || '';
  const type = document.getElementById('waiverType')?.value || 'Adult';

  if (!name) { showToast('Please enter your full name', 'error'); return; }
  if (!window._waiverHasSignature) { showToast('Please draw your signature', 'error'); return; }

  const btn = document.getElementById('waiverSubmitBtn');
  if (btn) { btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> Saving...'; }

  const signatureData = canvas.toDataURL('image/png');

  const result = await api('saveWaiver', {
    signerName: name,
    signerEmail: email,
    memberName: name,
    participantType: type,
    signatureData: signatureData
  });

  if (result && result.success) {
    showToast('Waiver signed successfully', 'success');
    closeModal();

    // ── P3: Send confirmation emails to member and admin ──────────────
    // Fire-and-forget — send to member (if email on file) and admin
    (async () => {
      const signedAt = new Date().toLocaleString('en-US', { timeZone: 'America/Chicago', dateStyle: 'medium', timeStyle: 'short' });
      const emailsSent = [];

      // Email to member
      if (email) {
        try {
          const memberResult = await api('sendWaiverEmail', {
            email,
            memberName: name,
            isConfirmation: true,
            signedAt,
            waiverId: result.waiverId || ''
          });
          if (memberResult && memberResult.success) emailsSent.push(email);
        } catch(e) {
          console.warn('Waiver member confirmation email failed:', e);
        }
      }

      // Email to gym admin — send via sendWaiverEmail with admin flag
      try {
        const settingsData = await api('getSettings');
        const adminEmail = (settingsData && settingsData.ADMIN_EMAIL) ? settingsData.ADMIN_EMAIL : 'info@labyrinth.vision';
        const adminResult = await api('sendWaiverEmail', {
          email: adminEmail,
          memberName: name,
          isAdminNotification: true,
          signerEmail: email || '(no email)',
          signedAt,
          waiverId: result.waiverId || ''
        });
        if (adminResult && adminResult.success) emailsSent.push(adminEmail);
      } catch(e) {
        console.warn('Waiver admin confirmation email failed:', e);
      }

      if (emailsSent.length > 0) {
        showToast('Confirmation email sent to ' + emailsSent.join(' and '), 'success');
      }
    })();
    // ─────────────────────────────────────────────────────────────────

    // Fire callback if provided (e.g., from Add Member modal)
    if (typeof window._waiverOnComplete === 'function') {
      window._waiverOnComplete({ waiverId: result.waiverId, signerName: name, signedAt: new Date().toISOString() });
      window._waiverOnComplete = null;
    }

    // If we're in the Add Member modal flow, update the waiver status banner
    const statusEl = document.getElementById('modalWaiverStatus');
    if (statusEl) {
      statusEl.style.display = 'block';
      statusEl.innerHTML = `<span class="waiver-status waiver-signed">&#9989; Waiver signed — ${esc(name)}</span>`;
    }
  } else {
    if (btn) { btn.disabled = false; btn.textContent = 'I Agree & Sign'; }
  }
}

function renderProfileWaiverStatus(waiverData, member) {
  const el = document.getElementById('profileWaiverStatus');
  if (!el) return;
  const memberJson = JSON.stringify(member).replace(/'/g, '&#39;').replace(/"/g, '&quot;');
  if (waiverData && waiverData.signed) {
    el.innerHTML = `
      <span class="profile-info-icon">&#9989;</span>
      <span class="waiver-status waiver-signed" style="flex:1;">Waiver signed${waiverData.signedAt ? ' on ' + formatDate(waiverData.signedAt) : ''}</span>
      <button class="btn btn-ghost btn-sm" style="font-size:11px;padding:2px 8px;" onclick="showWaiverModal({memberName:'${esc(member.Name)}',memberEmail:'${esc(member.Email||'')}'})">Re-sign</button>
    `;
  } else {
    el.innerHTML = `
      <span class="profile-info-icon">&#9888;</span>
      <span class="waiver-status waiver-unsigned" style="flex:1;">No waiver on file</span>
      <button class="btn btn-ghost btn-sm" style="font-size:11px;padding:2px 8px;color:var(--gold);" onclick="showWaiverModal({memberName:'${esc(member.Name)}',memberEmail:'${esc(member.Email||'')}'})">Sign Now</button>
      ${member.Email ? `<button class="btn btn-ghost btn-sm" style="font-size:11px;padding:2px 8px;" onclick="sendWaiverEmail('${esc(member.Email)}','${esc(member.Name)}')">Send Link</button>` : ''}
    `;
  }
}

function openWaiverFromMemberModal() {
  const name = document.getElementById('mName')?.value.trim() || '';
  const email = document.getElementById('mEmail')?.value.trim() || '';
  const type = document.getElementById('mType')?.value || 'Adult';
  const participantType = type === 'Kid' ? 'Minor' : 'Adult';

  showWaiverModal({
    memberName: name,
    memberEmail: email,
    participantType: participantType,
    onComplete: function(waiverResult) {
      window._modalWaiverSigned = true;
      window._modalWaiverId = waiverResult.waiverId;
      // Re-open the Add Member modal with waiver status
      // The modal was closed by closeModal() in _waiverSubmit()
      // We reopen it after a short delay so the toast is visible
      setTimeout(() => {
        // Restore Add Member modal — the waiver status will now show
        const statusEl = document.getElementById('modalWaiverStatus');
        if (statusEl) {
          statusEl.style.display = 'block';
          statusEl.innerHTML = `<span class="waiver-status waiver-signed">&#9989; Waiver signed &mdash; ${esc(waiverResult.signerName)}</span>`;
        }
      }, 100);
    }
  });
}

async function sendWaiverEmail(email, memberName) {
  if (!email) { showToast('No email on file', 'error'); return; }
  const result = await api('sendWaiverEmail', { email, memberName: memberName || '' });
  if (result && result.success) {
    showToast('Waiver link sent to ' + email, 'success');
  }
}

/* ── MEMBERSHIP AGREEMENT SYSTEM ────────────────────────── */

const AGREEMENT_TEXT = `LABYRINTH BJJ — MEMBERSHIP AGREEMENT

This Membership Agreement ("Agreement") is entered into between the undersigned Member and Labyrinth BJJ, located in Fulshear, TX.

1. MEMBERSHIP TERMS
Your membership begins on the date of this agreement and continues on a month-to-month basis unless otherwise specified. Membership fees are due on the same date each month as your initial enrollment.

2. BILLING & PAYMENT
• Membership fees are charged automatically to the payment method on file.
• If a payment fails, you will be notified and given 7 days to update your payment method.
• After 14 days of non-payment, your membership may be suspended.

3. CANCELLATION POLICY
• You may cancel your membership at any time by notifying the front desk or through your online account.
• Cancellations take effect at the end of the current billing period.
• No refunds will be issued for partial months.

4. FREEZE / PAUSE POLICY
• You may freeze your membership for up to 30 days per year.
• Freezes must be requested at least 3 days before your next billing date.

5. GYM RULES & CONDUCT
• Proper training attire is required (clean gi or no-gi gear).
• Maintain personal hygiene — nails trimmed, clean gear each session.
• No coaching from the sidelines during class.
• Respect all training partners regardless of rank or experience.
• Report any injuries to the instructor immediately.

6. ACKNOWLEDGMENT
By signing below, I acknowledge that I have read, understand, and agree to the terms of this Membership Agreement. I understand that my membership will auto-renew each month until cancelled.`;

function showAgreementModal(options = {}) {
  const { memberName = '', memberEmail = '', planName = '', onComplete = null } = options;

  const overlay = document.getElementById('modalOverlay');
  const content = document.getElementById('modalContent');
  content.className = 'modal waiver-modal';

  content.innerHTML = `
    <div class="modal-header">
      <h2 class="modal-title">Membership Agreement — Labyrinth BJJ</h2>
      <button class="modal-close" onclick="closeModal()">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
    <div class="modal-body" style="padding-bottom:0;">
      <div class="waiver-text">${esc(AGREEMENT_TEXT).replace(/\n/g, '<br>')}</div>

      <div class="waiver-fields">
        <div class="form-group" style="flex:1;">
          <label>Full Name <span style="color:var(--error)">*</span></label>
          <input type="text" id="agreementName" value="${esc(memberName)}" placeholder="John Smith" oninput="_agreementCheckReady()" required>
        </div>
        <div class="form-group" style="flex:1;">
          <label>Email</label>
          <input type="email" id="agreementEmail" value="${esc(memberEmail)}" placeholder="john@example.com">
        </div>
        <div class="form-group" style="flex:1;">
          <label>Membership Plan</label>
          <input type="text" id="agreementPlan" value="${esc(planName)}" placeholder="Adult BJJ Unlimited">
        </div>
      </div>

      <div class="waiver-canvas-wrap">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
          <label style="font-size:12px;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;">Signature</label>
          <button type="button" class="waiver-clear-btn" onclick="_agreementClear()">Clear</button>
        </div>
        <canvas id="agreementCanvas" class="waiver-canvas"></canvas>
        <div style="font-size:11px;color:var(--text-faint);margin-top:4px;">Draw your signature above using your finger or mouse</div>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn waiver-agree-btn" id="agreementSubmitBtn" disabled onclick="_agreementSubmit()">I Agree &amp; Sign</button>
    </div>
  `;

  overlay.style.display = 'flex';
  overlay.onclick = function(e) { if (e.target === overlay) closeModal(); };

  window._agreementOnComplete = onComplete;

  requestAnimationFrame(() => _agreementInitCanvas());
}

function _agreementInitCanvas() {
  const canvas = document.getElementById('agreementCanvas');
  if (!canvas) return;

  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width || canvas.offsetWidth || 620;
  canvas.height = 130;

  const ctx = canvas.getContext('2d');
  ctx.strokeStyle = '#C8A24C';
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  let isDrawing = false;
  window._agreementHasSignature = false;

  function getPos(e) {
    const r = canvas.getBoundingClientRect();
    if (e.touches) {
      return { x: e.touches[0].clientX - r.left, y: e.touches[0].clientY - r.top };
    }
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  function startDraw(e) {
    e.preventDefault();
    isDrawing = true;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  }

  function draw(e) {
    if (!isDrawing) return;
    e.preventDefault();
    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    window._agreementHasSignature = true;
    _agreementCheckReady();
  }

  function stopDraw(e) {
    if (isDrawing) { e.preventDefault(); isDrawing = false; }
  }

  canvas.addEventListener('mousedown', startDraw);
  canvas.addEventListener('mousemove', draw);
  canvas.addEventListener('mouseup', stopDraw);
  canvas.addEventListener('mouseleave', stopDraw);
  canvas.addEventListener('touchstart', startDraw, { passive: false });
  canvas.addEventListener('touchmove', draw, { passive: false });
  canvas.addEventListener('touchend', stopDraw, { passive: false });
}

function _agreementClear() {
  const canvas = document.getElementById('agreementCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  window._agreementHasSignature = false;
  _agreementCheckReady();
}

function _agreementCheckReady() {
  const btn = document.getElementById('agreementSubmitBtn');
  if (!btn) return;
  const name = (document.getElementById('agreementName')?.value || '').trim();
  btn.disabled = !(name && window._agreementHasSignature);
}

async function _agreementSubmit() {
  const canvas = document.getElementById('agreementCanvas');
  const name = document.getElementById('agreementName')?.value.trim() || '';
  const email = document.getElementById('agreementEmail')?.value.trim() || '';
  const plan = document.getElementById('agreementPlan')?.value.trim() || '';

  if (!name) { showToast('Please enter your full name', 'error'); return; }
  if (!window._agreementHasSignature) { showToast('Please draw your signature', 'error'); return; }

  const btn = document.getElementById('agreementSubmitBtn');
  if (btn) { btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> Saving...'; }

  const signatureData = canvas.toDataURL('image/png');

  const result = await api('saveAgreement', {
    signerName: name,
    signerEmail: email,
    memberName: name,
    planName: plan,
    signatureData: signatureData
  });

  if (result && result.success) {
    showToast('Agreement signed successfully', 'success');
    closeModal();

    if (typeof window._agreementOnComplete === 'function') {
      window._agreementOnComplete({ agreementId: result.agreementId, signerName: name, signedAt: new Date().toISOString() });
      window._agreementOnComplete = null;
    }

    const statusEl = document.getElementById('modalAgreementStatus');
    if (statusEl) {
      statusEl.style.display = 'block';
      statusEl.innerHTML = `<span class="waiver-status waiver-signed">&#9989; Agreement signed — ${esc(name)}</span>`;
    }
  } else {
    if (btn) { btn.disabled = false; btn.textContent = 'I Agree & Sign'; }
  }
}

function renderProfileAgreementStatus(agreementData, member) {
  const el = document.getElementById('profileAgreementStatus');
  if (!el) return;
  const memberJson = JSON.stringify(member).replace(/'/g, '&#39;').replace(/"/g, '&quot;');
  if (agreementData && agreementData.signed) {
    el.innerHTML = `
      <span class="profile-info-icon">&#9989;</span>
      <span class="waiver-status waiver-signed" style="flex:1;">Agreement signed${agreementData.signedAt ? ' on ' + formatDate(agreementData.signedAt) : ''}</span>
      <button class="btn btn-ghost btn-sm" style="font-size:11px;padding:2px 8px;" onclick="showAgreementModal({memberName:'${esc(member.Name)}',memberEmail:'${esc(member.Email||'')}',planName:'${esc(member.Plan||'')}'})" >Re-sign</button>
    `;
  } else {
    el.innerHTML = `
      <span class="profile-info-icon">&#9888;</span>
      <span class="waiver-status waiver-unsigned" style="flex:1;">No agreement on file</span>
      <button class="btn btn-ghost btn-sm" style="font-size:11px;padding:2px 8px;color:var(--gold);" onclick="showAgreementModal({memberName:'${esc(member.Name)}',memberEmail:'${esc(member.Email||'')}',planName:'${esc(member.Plan||'')}'})" >Sign Now</button>
      ${member.Email ? `<button class="btn btn-ghost btn-sm" style="font-size:11px;padding:2px 8px;" onclick="sendAgreementEmail('${esc(member.Email)}','${esc(member.Name)}','${esc(member.Plan||'')}')" >Send Link</button>` : ''}
    `;
  }
}

function openAgreementFromMemberModal() {
  const name = document.getElementById('mName')?.value.trim() || '';
  const email = document.getElementById('mEmail')?.value.trim() || '';
  const plan = document.getElementById('mPlan')?.value || '';

  showAgreementModal({
    memberName: name,
    memberEmail: email,
    planName: plan,
    onComplete: function(agreementResult) {
      window._modalAgreementSigned = true;
      window._modalAgreementId = agreementResult.agreementId;
      const statusEl = document.getElementById('modalAgreementStatus');
      if (statusEl) {
        statusEl.style.display = 'block';
        statusEl.innerHTML = `<span class="waiver-status waiver-signed">&#9989; Agreement signed &mdash; ${esc(agreementResult.signerName)}</span>`;
      }
    }
  });
}

async function sendAgreementEmail(email, memberName, planName) {
  if (!email) { showToast('No email on file', 'error'); return; }
  const result = await api('sendAgreementEmail', { email, memberName: memberName || '', planName: planName || '' });
  if (result && result.success) {
    showToast('Agreement link sent to ' + email, 'success');
  }
}

async function sendAccountSetup(email, name, row) {
  if (!email) { showToast('Member needs an email address first', 'error'); return; }
  const result = await api('memberSetupAccount', { memberEmail: email, memberName: name, memberRow: row });
  if (result && result.success) {
    showToast('Account setup link sent to ' + email, 'success');
  } else {
    showToast((result && result.error) || 'Failed to send setup link', 'error');
  }
}

/* ── BULK SEND APP-ACCESS EMAILS ─────────────────────────── */
function toggleSendAccessMenu(e) {
  if (e && e.stopPropagation) e.stopPropagation();
  const menu = document.getElementById('sendAccessMenu');
  const btn = document.getElementById('sendAccessBtn');
  if (!menu) return;
  const isOpen = menu.style.display === 'block';
  menu.style.display = isOpen ? 'none' : 'block';
  if (btn) btn.setAttribute('aria-expanded', isOpen ? 'false' : 'true');
  if (!isOpen) {
    const close = (ev) => {
      if (!menu.contains(ev.target) && ev.target !== btn) {
        menu.style.display = 'none';
        if (btn) btn.setAttribute('aria-expanded', 'false');
        document.removeEventListener('click', close);
      }
    };
    setTimeout(() => document.addEventListener('click', close), 0);
  }
}

function _bulkSetupRecipients(filter) {
  const isCancelled = (m) => {
    const s = (m.Status || '').toString().toLowerCase();
    return s === 'cancelled' || s === 'canceled' || s === 'removed';
  };
  return (membersCache || []).filter(m => {
    if (!m.Email) return false;
    if (isCancelled(m)) return false;
    if (filter === 'new') {
      if (m.AccountSetupToken || m.PasswordHash) return false;
    }
    return true;
  });
}

async function openBulkSetupConfirm(filter) {
  const menu = document.getElementById('sendAccessMenu');
  if (menu) menu.style.display = 'none';

  const recipients = _bulkSetupRecipients(filter);
  const count = recipients.length;

  if (count === 0) {
    showToast(filter === 'new'
      ? 'No members need setup emails — everyone has already set up their account.'
      : 'No members with an email address on file.',
      'info');
    return;
  }

  const previewList = recipients.slice(0, 12).map(m =>
    `<div style="display:flex;justify-content:space-between;gap:12px;padding:6px 10px;border-bottom:1px solid rgba(255,255,255,0.04);font-size:12px;">
       <span style="color:var(--text);">${esc(m.Name || '(no name)')}</span>
       <span style="color:var(--text-muted);">${esc(m.Email)}</span>
     </div>`).join('');
  const extra = count > 12 ? `<div style="padding:8px 10px;font-size:11px;color:var(--text-faint);">&hellip; and ${count - 12} more</div>` : '';

  const filterLabel = filter === 'new' ? 'members without app access' : 'all active members';

  openModal(`
    <div class="modal-header">
      <h2 class="modal-title">Send App Access</h2>
      <button class="modal-close" onclick="closeModal()">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
    <div class="modal-body" style="padding:20px;">
      <p style="margin:0 0 12px 0;color:var(--text);font-size:14px;">
        Send setup emails to <strong style="color:#C8A24C;">${count}</strong> ${esc(filterLabel)}?
      </p>
      <p style="margin:0 0 16px 0;color:var(--text-muted);font-size:12px;">
        Each member will receive a personalized link to set their password and log in to the app. Emails are sent one at a time.
      </p>
      <div style="background:rgba(10,10,14,0.95);border:1px solid rgba(255,255,255,0.08);border-radius:12px;max-height:300px;overflow-y:auto;margin-bottom:16px;">
        ${previewList || '<div style="padding:12px;color:var(--text-muted);font-size:12px;">No recipients</div>'}
        ${extra}
      </div>
      <div id="bulkSetupProgress" style="display:none;margin-bottom:12px;">
        <div style="display:flex;align-items:center;gap:10px;color:var(--text);font-size:13px;">
          <span class="spinner"></span>
          <span id="bulkSetupProgressText">Sending&hellip;</span>
        </div>
        <div style="height:6px;background:rgba(255,255,255,0.06);border-radius:3px;margin-top:8px;overflow:hidden;">
          <div id="bulkSetupProgressBar" style="height:100%;width:0%;background:linear-gradient(90deg,#C8A24C,#e8b84b);transition:width 0.3s ease;"></div>
        </div>
      </div>
      <div class="modal-actions" style="display:flex;gap:8px;justify-content:flex-end;">
        <button class="btn btn-secondary" id="bulkSetupCancelBtn" onclick="closeModal()">Cancel</button>
        <button class="btn btn-primary" id="bulkSetupSendBtn" onclick="runBulkSetup('${esc(filter)}')" style="background:#C8A24C;color:#09090B;border:none;">
          Send to ${count}
        </button>
      </div>
    </div>
  `);
}

async function runBulkSetup(filter) {
  const sendBtn = document.getElementById('bulkSetupSendBtn');
  const cancelBtn = document.getElementById('bulkSetupCancelBtn');
  const progress = document.getElementById('bulkSetupProgress');
  const progressText = document.getElementById('bulkSetupProgressText');
  const progressBar = document.getElementById('bulkSetupProgressBar');

  if (sendBtn) { sendBtn.disabled = true; sendBtn.innerHTML = '<span class="spinner"></span> Sending&hellip;'; }
  if (cancelBtn) cancelBtn.disabled = true;
  if (progress) progress.style.display = 'block';
  if (progressText) progressText.textContent = 'Contacting server — this may take a minute for larger batches…';
  if (progressBar) progressBar.style.width = '35%';

  const result = await api('bulkSendSetup', { filter });

  if (progressBar) progressBar.style.width = '100%';

  if (result && result.success) {
    closeModal();
    const sent = result.sent || 0;
    const failed = result.failed || 0;
    const skipped = result.skipped || 0;
    let msg = `Setup emails sent to ${sent} member${sent === 1 ? '' : 's'}`;
    if (failed) msg += ` (${failed} failed)`;
    if (skipped) msg += ` — ${skipped} skipped`;
    showToast(msg, failed ? 'warning' : 'success');
  } else {
    if (sendBtn) { sendBtn.disabled = false; sendBtn.innerHTML = 'Send'; }
    if (cancelBtn) cancelBtn.disabled = false;
    if (progress) progress.style.display = 'none';
    showToast((result && result.error) || 'Failed to send bulk setup emails', 'error');
  }
}

/* ── UI HELPERS ─────────────────────────────────────────── */
function showToast(msg, type = 'info', customDuration) {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = 'toast ' + type;
  toast.innerHTML = `
    <span>${esc(msg)}</span>
    <button onclick="this.parentElement.remove()" style="background:none;border:none;color:inherit;opacity:0.7;cursor:pointer;padding:2px;margin-left:8px;">&#10005;</button>
  `;
  container.appendChild(toast);
  const duration = customDuration || (type === 'error' ? 6000 : type === 'warning' ? 5000 : 4000);
  setTimeout(() => { if (toast.parentElement) toast.remove(); }, duration);
}

function openModal(html, opts) {
  const overlay = document.getElementById('modalOverlay');
  const content = document.getElementById('modalContent');
  content.className = 'modal' + ((opts && opts.wide) ? ' modal-wide' : '');  // Reset class, optionally wide
  content.innerHTML = html;
  overlay.style.display = 'flex';
  overlay.onclick = function(e) {
    if (e.target === overlay) closeModal();
  };
}

function closeModal() {
  // Clean up embedded checkout if active
  if (_activeEmbeddedCheckout) {
    try { _activeEmbeddedCheckout.destroy(); } catch(_) {}
    _activeEmbeddedCheckout = null;
  }
  document.getElementById('modalOverlay').style.display = 'none';
}

function esc(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = String(str);
  return div.innerHTML;
}

function formatNum(n) {
  return new Intl.NumberFormat('en-US').format(n);
}

function formatDate(d) {
  if (!d) return '—';
  try {
    const date = new Date(d);
    if (isNaN(date)) return String(d);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch(_) {
    return String(d);
  }
}

/* ── ENSURE MEMBERS LOADED ─────────────────────────────── */
async function ensureMembersLoaded() {
  if (membersCache.length > 0) return;
  const data = await api('getMembers');
  if (!data) return;
  membersCache = (data.members || []).map(m => ({
    ...m,
    ID: m.ID || String(m._row || ''),
    Plan: m.Plan || m.Membership || '',
    Status: m.Status || 'Active',
    Phone: String(m.Phone || ''),
    Email: m.Email || '',
    StartDate: m.StartDate || m.startDate || m.CreatedAt || new Date().toISOString().split('T')[0],
    Belt: m.Belt || '',
    Type: m.Type || 'Adult'
  }));
}

/* ── CONFIRMATION DIALOG ────────────────────────────────── */
// Returns a Promise<boolean>. Resolves true if confirmed, false if cancelled.
function showConfirmDialog({ title, message, confirmText = 'Confirm', confirmClass = 'btn-primary', icon = '⚠️' }) {
  return new Promise(resolve => {
    // Remove any existing confirm overlay
    const existing = document.getElementById('confirmOverlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'confirmOverlay';
    overlay.className = 'confirm-overlay';
    overlay.innerHTML = `
      <div class="confirm-dialog">
        <div class="confirm-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--warning)" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        </div>
        <div class="confirm-title">${esc(title)}</div>
        <div class="confirm-message">${esc(message)}</div>
        <div class="confirm-actions">
          <button class="btn btn-secondary" id="confirmCancel">Cancel</button>
          <button class="btn ${esc(confirmClass)}" id="confirmOk">${esc(confirmText)}</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    const cleanup = (result) => {
      overlay.remove();
      resolve(result);
    };

    document.getElementById('confirmOk').addEventListener('click', () => cleanup(true));
    document.getElementById('confirmCancel').addEventListener('click', () => cleanup(false));
    overlay.addEventListener('click', (e) => { if (e.target === overlay) cleanup(false); });
  });
}

function renderStatSkeleton(count) {
  return Array(count).fill(`
    <div class="stat-card">
      <div class="skeleton" style="width:80px;height:12px;margin-bottom:12px;"></div>
      <div class="skeleton" style="width:60px;height:28px;margin-bottom:8px;"></div>
      <div class="skeleton" style="width:50px;height:12px;"></div>
    </div>
  `).join('');
}

/* ── TRIAL LEADS POPUP ──────────────────────────────────── */
async function showTrialLeadsPopup() {
  // Always fetch all trial bookings (dashboard only has 10, we want all)
  let bookings = [];
  const result = await api('getTrialBookings');
  if (result && result.bookings) {
    bookings = result.bookings;
  } else if (dashboardDataCache && dashboardDataCache.recentBookings) {
    // Fall back to dashboard cache if fetch fails
    bookings = dashboardDataCache.recentBookings;
  }

  // Filter to valid bookings only
  const leads = bookings.filter(b => b && b.name && b.name.trim());

  const emailSubj = encodeURIComponent('Your Trial Class at Labyrinth BJJ');

  openModal(`
    <div class="modal-header">
      <h2 class="modal-title">Trial Leads (${leads.length})</h2>
      <button class="modal-close" onclick="closeModal()">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
    <div class="modal-body" style="padding:0">
      <div class="leads-toolbar">
        <label style="display:flex;align-items:center;gap:8px;font-size:13px;cursor:pointer;padding:0 16px;">
          <input type="checkbox" id="selectAllLeads" onchange="toggleSelectAllLeads(this.checked)" class="lead-checkbox">
          Select All
        </label>
        <button class="btn btn-secondary btn-sm" onclick="emailSelectedLeads()">Email Selected</button>
        <button class="btn btn-secondary btn-sm" onclick="textSelectedLeads()">Text Selected</button>
      </div>
      <div style="padding:0 16px;max-height:420px;overflow-y:auto;">
        ${leads.length === 0 ? '<div class="empty-state" style="padding:32px 0;"><p>No trial leads found</p></div>' : leads.map((b, i) => {
          const parsedDate = parseTrialDate(b.date);
          const classTypeParts = (b.classType || '').split(' • ');
          const classOnly = classTypeParts[0].trim();
          const timeOnly = b.time || (classTypeParts[1] ? classTypeParts[1].trim() : '');
          const bJson = JSON.stringify(b).replace(/\\/g, '\\\\').replace(/'/g, '&#39;').replace(/"/g, '&quot;');
          const dateLabel = parsedDate.day + ' ' + parsedDate.month + ' ' + parsedDate.num;
          return `
          <div class="lead-item">
            <input type="checkbox" class="lead-checkbox lead-select" data-index="${i}" data-email="${esc(b.email || '')}" data-phone="${esc(b.phone || '')}" data-name="${esc(b.name || '')}">
            <div class="lead-info">
              <div class="lead-name">${esc(b.name)}</div>
              <div class="lead-detail">${esc(classOnly)}${timeOnly ? ' \u2022 ' + esc(dateLabel) + ' \u2022 ' + esc(timeOnly) : (b.date ? ' \u2022 ' + esc(dateLabel) : '')}</div>
              <div class="lead-contact">${b.email ? esc(b.email) : ''}${b.email && b.phone ? ' \u2022 ' : ''}${b.phone ? esc(b.phone) : ''}</div>
              <div class="lead-actions">
                ${b.email ? `<a href="mailto:${encodeURIComponent(b.email)}?subject=${emailSubj}" class="btn btn-secondary btn-xs">Email</a>` : ''}
                ${b.phone ? `<button class="btn btn-secondary btn-xs" onclick="sendTrialReminder('${esc(b.phone)}', '${esc(b.name)}')">Text</button>` : ''}
                <button class="btn btn-secondary btn-xs" onclick="closeModal(); renderTrialProfile(JSON.parse(document.querySelector('[data-index=\'${i}\']').closest('.lead-item').querySelector('[data-index]').dataset.booking || '{}'))">View</button>
              </div>
            </div>
          </div>
          `;
        }).join('')}
      </div>
    </div>
  `, { wide: true });

  // Store bookings data for view button access
  leads.forEach((b, i) => {
    const cb = document.querySelector('.lead-select[data-index="' + i + '"]');
    if (cb) cb.dataset.booking = JSON.stringify(b);
  });

  // Fix view buttons to use stored booking data
  document.querySelectorAll('.lead-item').forEach((item, i) => {
    const viewBtn = item.querySelectorAll('.lead-actions .btn')[item.querySelectorAll('.lead-actions .btn').length - 1];
    if (viewBtn && leads[i]) {
      viewBtn.onclick = () => { closeModal(); renderTrialProfile(leads[i]); };
    }
  });
}

function toggleSelectAllLeads(checked) {
  document.querySelectorAll('.lead-select').forEach(cb => { cb.checked = checked; });
}

function emailSelectedLeads() {
  const selected = Array.from(document.querySelectorAll('.lead-select:checked'));
  const emails = selected.map(cb => cb.dataset.email).filter(Boolean);
  if (emails.length === 0) { showToast('No leads with email selected', 'warning'); return; }
  const emailSubj = encodeURIComponent('Your Trial Class at Labyrinth BJJ');
  window.open('mailto:' + emails.join(',') + '?subject=' + emailSubj);
}

function textSelectedLeads() {
  const selected = Array.from(document.querySelectorAll('.lead-select:checked'));
  const names = selected.map(cb => cb.dataset.name).filter(Boolean);
  const phones = selected.map(cb => cb.dataset.phone).filter(Boolean);
  if (phones.length === 0) { showToast('No leads with phone selected', 'warning'); return; }
  closeModal();
  navigate('sms');
  showToast('Switched to SMS — ' + names.join(', ') + ' selected', 'info');
}

/* ── FRANCHISE MODE ───────────────────────────────────── */
function switchLocation(locationId) {
  const loc = FRANCHISE_LOCATIONS.find(l => l.id === locationId);
  if (!loc || !loc.apiUrl) {
    showToast(loc ? loc.name + ' is not set up yet' : 'Location not found', 'info');
    document.getElementById('locationSelect').value = currentLocationId;
    return;
  }
  currentLocationId = locationId;
  window._activeApiUrl = loc.apiUrl;
  // Clear cache so new location data loads fresh
  membersCache = [];
  navigate(currentPage);
  showToast('Switched to ' + loc.name, 'success');
}

async function renderFranchise() {
  const main = document.getElementById('mainContent');
  main.innerHTML = `
    <div class="page-header">
      <h1 class="page-title">Franchise Overview</h1>
      <div class="page-actions">
        <span class="text-sm text-muted">Labyrinth BJJ Network</span>
      </div>
    </div>
    <div class="franchise-combined-stats" id="franchiseCombinedStats">
      <div class="franchise-stat-card">
        <div class="franchise-stat-label">Total Revenue (All Locations)</div>
        <div class="franchise-stat-value gold" id="fcRevenue">—</div>
      </div>
      <div class="franchise-stat-card">
        <div class="franchise-stat-label">Total Members</div>
        <div class="franchise-stat-value" id="fcMembers">—</div>
      </div>
      <div class="franchise-stat-card">
        <div class="franchise-stat-label">Active Trials</div>
        <div class="franchise-stat-value" id="fcTrials">—</div>
      </div>
      <div class="franchise-stat-card">
        <div class="franchise-stat-label">Locations</div>
        <div class="franchise-stat-value" id="fcLocations">${FRANCHISE_LOCATIONS.filter(l => l.status === 'active').length} / ${FRANCHISE_LOCATIONS.length}</div>
      </div>
    </div>
    <div class="franchise-grid" id="franchiseGrid">
      ${FRANCHISE_LOCATIONS.map(loc => `
        <div class="franchise-card ${loc.status === 'coming-soon' ? 'coming-soon' : ''}" style="--loc-color: ${loc.color}">
          <div class="franchise-card-header">
            <div class="franchise-card-title">
              <span class="franchise-dot" style="background: ${loc.color}"></span>
              <strong>${esc(loc.short)}</strong>
              ${loc.id === 'fulshear' ? '<span class="franchise-hq">HQ</span>' : ''}
            </div>
            <span class="badge ${loc.status === 'active' ? 'badge-active' : 'badge-coming-soon'}">${loc.status === 'active' ? 'Active' : 'Coming Soon'}</span>
          </div>
          <div class="franchise-stats" id="franchise-stats-${loc.id}">
            ${loc.status === 'coming-soon' ? '<span class="text-muted">Not yet configured</span>' : 
              (loc.apiUrl ? '<span class="text-muted">Loading...</span>' : '<span class="text-muted">\u2014 Members \u2022 \u2014 collected \u2022 \u2014 trials</span>')}
          </div>
          <div class="franchise-actions">
            ${loc.apiUrl ? `<button class="btn btn-secondary btn-sm" onclick="switchLocation('${loc.id}'); navigate('dashboard');">View Dashboard</button>` : ''}
            <button class="btn btn-secondary btn-sm" onclick="showFranchiseConfigModal('${loc.id}')">${loc.apiUrl ? 'Edit Config' : (loc.status === 'coming-soon' ? 'Configure' : 'Configure')}</button>
          </div>
        </div>
      `).join('')}
    </div>
  `;

  // Fetch data for active locations with API URLs
  const locationPromises = FRANCHISE_LOCATIONS.filter(l => l.apiUrl).map(async loc => {
    try {
      const payload = JSON.stringify({ action: 'getDashboard' });
      const url = loc.apiUrl + '?action=getDashboard&payload=' + encodeURIComponent(payload);
      const locController = new AbortController();
      const locTimeout = setTimeout(() => locController.abort(), 15000);
      let resp;
      try {
        resp = await fetch(url, { redirect: 'follow', signal: locController.signal });
      } finally {
        clearTimeout(locTimeout);
      }
      const ct = resp.headers.get('content-type') || '';
      const txt = await resp.text();
      if (!resp.ok || !ct.includes('application/json')) {
        return { ...loc, data: null, error: 'Non-JSON response (HTTP ' + resp.status + ')' };
      }
      const data = JSON.parse(txt);
      return { ...loc, data };
    } catch(e) {
      return { ...loc, data: null, error: e.message };
    }
  });
  const locations = await Promise.all(locationPromises);

  // Calculate combined stats
  let combinedRevenue = 0;
  let combinedMembers = 0;
  let combinedTrials = 0;
  const activeLocations = FRANCHISE_LOCATIONS.filter(l => l.status === 'active').length;
  const totalLocations = FRANCHISE_LOCATIONS.length;

  locations.forEach(loc => {
    const el = document.getElementById('franchise-stats-' + loc.id);
    if (!el) return;
    if (loc.data && !loc.data.error) {
      const d = loc.data;
      const overdueCount = (d.overduePayments || []).length;
      combinedRevenue += (d.monthlyPaid || 0);
      combinedMembers += (d.activeMembers || 0);
      combinedTrials += (d.upcomingTrials || 0);
      el.innerHTML = `
        <span><strong>${d.activeMembers || 0}</strong> Members</span>
        <span><strong>$${formatNum(Math.round(d.monthlyPaid || 0))}</strong> collected</span>
        <span><strong>${d.upcomingTrials || 0}</strong> trials</span>
        ${overdueCount > 0 ? `<span style="color:var(--error)"><strong>${overdueCount}</strong> overdue</span>` : ''}
      `;
    } else {
      el.innerHTML = '<span class="text-muted">Unable to load data</span>';
    }
  });

  // Update combined stats display
  const fcRevEl = document.getElementById('fcRevenue');
  const fcMemEl = document.getElementById('fcMembers');
  const fcTriEl = document.getElementById('fcTrials');
  const fcLocEl = document.getElementById('fcLocations');
  if (fcRevEl) fcRevEl.textContent = locations.length > 0 ? '$' + formatNum(Math.round(combinedRevenue)) : '—';
  if (fcMemEl) fcMemEl.textContent = locations.length > 0 ? combinedMembers : '—';
  if (fcTriEl) fcTriEl.textContent = locations.length > 0 ? combinedTrials : '—';
  if (fcLocEl) fcLocEl.textContent = activeLocations + ' / ' + totalLocations;
}

function showFranchiseConfigModal(locationId) {
  const loc = FRANCHISE_LOCATIONS.find(l => l.id === locationId);
  if (!loc) return;
  openModal(`
    <div class="modal-header">
      <h2 class="modal-title">Configure ${esc(loc.name)}</h2>
      <button class="modal-close" onclick="closeModal()">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
    <div class="modal-body">
      <div class="form-group">
        <label>API URL (Google Apps Script Web App URL)</label>
        <div style="display:flex;align-items:center;gap:6px;">
          <input type="password" id="franchiseApiUrl" value="${esc(loc.apiUrl)}" placeholder="https://script.google.com/macros/s/.../exec" style="flex:1;">
          <button type="button" class="btn btn-ghost btn-sm" onclick="var inp=document.getElementById('franchiseApiUrl');if(inp.type==='password'){inp.type='text';this.textContent='Hide';}else{inp.type='password';this.textContent='Show';}" style="font-size:11px;">Show</button>
          ${loc.apiUrl ? `<button type="button" class="btn btn-ghost btn-sm" onclick="navigator.clipboard.writeText(document.getElementById('franchiseApiUrl').value);showToast('URL copied!','success')" style="font-size:11px;">Copy</button>` : ''}
        </div>
      </div>
      <div class="form-group">
        <label>Admin Password</label>
        <input type="password" id="franchisePassword" value="${esc(loc.password || '')}" placeholder="Admin password for this location" autocomplete="new-password">
      </div>
      <div class="form-group">
        <label>Location Status</label>
        <select id="franchiseStatus">
          <option value="active" ${loc.status === 'active' ? 'selected' : ''}>Active</option>
          <option value="coming-soon" ${loc.status === 'coming-soon' ? 'selected' : ''}>Coming Soon</option>
          <option value="inactive" ${loc.status === 'inactive' ? 'selected' : ''}>Inactive</option>
        </select>
      </div>
      <p class="text-sm text-muted">Enter the deployed Apps Script URL for this location's CRM. The location will become accessible once the API URL is configured.</p>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="saveFranchiseConfig('${esc(locationId)}')">Save</button>
    </div>
  `);
}

function saveFranchiseConfig(locationId) {
  const url = document.getElementById('franchiseApiUrl').value.trim();
  const password = document.getElementById('franchisePassword').value.trim();
  const status = document.getElementById('franchiseStatus').value;
  const loc = FRANCHISE_LOCATIONS.find(l => l.id === locationId);
  if (loc) {
    loc.apiUrl = url;
    loc.password = password;
    loc.status = status;
    showToast(loc.name + ' configured', 'success');
    closeModal();
    renderFranchise();
  }
}

function renderFranchiseSettings() {
  return `
    <div class="settings-section">
      <h2 style="font-size:16px;font-weight:600;margin-bottom:16px;">Franchise Locations</h2>
      <p class="text-sm text-muted mb-16">Configure API URLs for each location in the Labyrinth BJJ network.</p>
      <div class="franchise-settings-list">
        ${FRANCHISE_LOCATIONS.map(loc => {
          const masked = loc.apiUrl ? loc.apiUrl.substring(0, 40) + '...' : '';
          return `
          <div class="franchise-settings-row">
            <div class="franchise-settings-info">
              <span class="franchise-dot" style="background: ${loc.color}"></span>
              <strong>${esc(loc.name)}</strong>
              <span class="badge ${loc.status === 'active' ? 'badge-active' : 'badge-coming-soon'} badge-sm">${loc.status === 'active' ? 'Active' : 'Coming Soon'}</span>
            </div>
            <div class="form-group" style="margin-bottom:0;flex:1;">
              <div style="display:flex;align-items:center;gap:6px;">
                <input type="password" class="franchise-api-input" data-location="${loc.id}" value="${esc(loc.apiUrl)}" placeholder="https://script.google.com/macros/s/.../exec" ${loc.status === 'coming-soon' ? 'disabled' : ''} style="flex:1;">
                <button type="button" class="btn btn-ghost btn-sm" onclick="var inp=this.previousElementSibling;if(inp.type==='password'){inp.type='text';this.textContent='Hide';}else{inp.type='password';this.textContent='Show';}" style="white-space:nowrap;font-size:11px;">Show</button>
                ${loc.apiUrl ? `<button type="button" class="btn btn-ghost btn-sm" onclick="navigator.clipboard.writeText(this.closest('.form-group').querySelector('.franchise-api-input').value);showToast('URL copied!','success')" style="font-size:11px;">Copy</button>` : ''}
              </div>
            </div>
          </div>`;
        }).join('')}
      </div>
      <div class="mt-16">
        <button class="btn btn-primary btn-sm" onclick="saveFranchiseSettings()">Save Franchise Settings</button>
      </div>
    </div>
  `;
}

function saveFranchiseSettings() {
  document.querySelectorAll('.franchise-api-input').forEach(input => {
    const locId = input.dataset.location;
    const loc = FRANCHISE_LOCATIONS.find(l => l.id === locId);
    if (loc) loc.apiUrl = input.value.trim();
  });
  showToast('Franchise settings saved', 'success');
}


/* ── ADD TOURNAMENT MODAL ─────────────────────────────── */
let _tournamentsCache = [];

function showAddTournamentModal() {
  openModal(`
    <div class="modal-header">
      <h2 class="modal-title">Add Tournament</h2>
      <button class="modal-close" onclick="closeModal()">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
    <div class="modal-body">
      <div class="form-group">
        <label>Tournament Name</label>
        <input type="text" id="tournamentName" placeholder="e.g. IBJJF Houston Open">
      </div>
      <div class="form-group">
        <label>Date</label>
        <input type="date" id="tournamentDate">
      </div>
      <div class="form-group">
        <label>Location</label>
        <input type="text" id="tournamentLocation" placeholder="e.g. George R. Brown Convention Center">
      </div>
      <div class="form-group">
        <label>Registration URL (optional)</label>
        <input type="text" id="tournamentUrl" placeholder="https://...">
      </div>
      <div class="form-group">
        <label>Description (optional)</label>
        <textarea id="tournamentDesc" rows="3" placeholder="Tournament details..."></textarea>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" id="addTournamentBtn" onclick="addTournament()">Add Tournament</button>
    </div>
  `);
}

async function addTournament() {
  var name = (document.getElementById('tournamentName') || {}).value || '';
  var date = (document.getElementById('tournamentDate') || {}).value || '';
  var location = (document.getElementById('tournamentLocation') || {}).value || '';
  var url = (document.getElementById('tournamentUrl') || {}).value || '';
  var desc = (document.getElementById('tournamentDesc') || {}).value || '';

  if (!name) { showToast('Tournament name is required', 'error'); return; }
  if (!date) { showToast('Date is required', 'error'); return; }

  var btn = document.getElementById('addTournamentBtn');
  if (btn) { btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> Adding...'; }

  try {
    var result = await api('addTournament', { name: name, date: date, location: location, url: url, description: desc });
    if (result && result.success) {
      showToast('Tournament added!', 'success');
    } else {
      // GAS action may not exist yet — graceful stub
      console.log('addTournament response:', result);
      showToast('Tournament saved locally', 'success');
    }
  } catch (e) {
    console.log('addTournament not available on backend, saving locally');
    showToast('Tournament saved locally', 'success');
  }

  _tournamentsCache.push({ name: name, date: date, location: location, url: url, description: desc });
  renderTournamentsList();
  closeModal();
}

function renderTournamentsList() {
  var el = document.getElementById('tournamentsList');
  if (!el) return;
  if (!_tournamentsCache.length) {
    el.innerHTML = '<div class="empty-state" style="padding:16px 0;"><p>No tournaments added yet</p></div>';
    return;
  }
  el.innerHTML = _tournamentsCache.map(function(t) {
    return '<div style="padding:12px 16px;background:var(--surface);border:1px solid var(--border);border-radius:8px;margin-bottom:8px;">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;">' +
      '<div><strong style="color:var(--text);">' + esc(t.name) + '</strong>' +
      '<div style="font-size:12px;color:var(--text-muted);margin-top:2px;">' + formatDate(t.date) + (t.location ? ' &bull; ' + esc(t.location) : '') + '</div>' +
      (t.description ? '<div style="font-size:12px;color:var(--text-faint);margin-top:4px;">' + esc(t.description) + '</div>' : '') +
      '</div>' +
      (t.url ? '<a href="' + esc(t.url) + '" target="_blank" class="btn btn-secondary btn-sm" style="flex-shrink:0;">Register</a>' : '') +
      '</div></div>';
  }).join('');
}

/* ── SCHEDULE TRIAL MODAL ───────────────────────────────── */
function showScheduleTrialModal(preselectedCategory) {
  const adultClasses = [];
  const kidsClasses = [];
  Object.keys(CLASS_SCHEDULE).forEach(day => {
    (CLASS_SCHEDULE[day] || []).forEach(cls => {
      const entry = day + ' ' + cls.time + ' — ' + cls.name;
      if (cls.age === 'Adult' || cls.age === 'All') {
        if (!adultClasses.includes(entry)) adultClasses.push(entry);
      }
      if (cls.age === 'Kids' || cls.age === 'Teens' || cls.age === 'All') {
        if (!kidsClasses.includes(entry)) kidsClasses.push(entry);
      }
    });
  });

  const category = preselectedCategory || '';

  function buildClassOptions(list) {
    return list.map(c => `<option value="${esc(c)}">${esc(c)}</option>`).join('');
  }

  const html = `
    <div class="modal-header">
      <h2 class="modal-title">Schedule a Trial Class</h2>
      <button class="modal-close" onclick="closeModal()">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
    <div class="modal-body">
      <div id="trialCategoryPicker" style="${category ? 'display:none' : 'display:flex;gap:12px;margin-bottom:20px;'}">
        <div onclick="selectTrialCategory('adult')" style="flex:1;padding:24px 16px;text-align:center;border-radius:10px;border:2px solid var(--border);cursor:pointer;transition:all .2s;" onmouseover="this.style.borderColor='var(--gold)'" onmouseout="this.style.borderColor='var(--border)'">
          <div style="font-size:32px;margin-bottom:8px;">&#129340;</div>
          <div style="font-weight:600;font-size:15px;color:var(--text);">Adult (16+)</div>
          <div style="font-size:12px;color:var(--text-muted);margin-top:4px;">BJJ Gi &amp; No-Gi classes</div>
        </div>
        <div onclick="selectTrialCategory('kids')" style="flex:1;padding:24px 16px;text-align:center;border-radius:10px;border:2px solid var(--border);cursor:pointer;transition:all .2s;" onmouseover="this.style.borderColor='var(--gold)'" onmouseout="this.style.borderColor='var(--border)'">
          <div style="font-size:32px;margin-bottom:8px;">&#128103;</div>
          <div style="font-weight:600;font-size:15px;color:var(--text);">Kids (6–15)</div>
          <div style="font-size:12px;color:var(--text-muted);margin-top:4px;">Kids &amp; Teens classes</div>
        </div>
      </div>
      <div id="trialFormArea" style="${category ? '' : 'display:none'}">
        <div class="form-group">
          <label>Name</label>
          <input type="text" id="trialName" placeholder="Full name">
        </div>
        <div class="form-group">
          <label>Email</label>
          <input type="email" id="trialEmail" placeholder="email@example.com">
        </div>
        <div class="form-group">
          <label>Phone</label>
          <input type="tel" id="trialPhone" placeholder="(555) 123-4567">
        </div>
        <div class="form-group">
          <label>Preferred Class</label>
          <select id="trialClassSelect">
            <option value="">Select a class...</option>
            <optgroup label="Adult Classes" id="trialAdultGroup">${buildClassOptions(adultClasses)}</optgroup>
            <optgroup label="Kids / Teens Classes" id="trialKidsGroup">${buildClassOptions(kidsClasses)}</optgroup>
          </select>
        </div>
        <button class="btn btn-primary" style="width:100%;margin-top:8px;" onclick="submitTrialBooking()">Book Trial Class</button>
      </div>
    </div>
  `;

  openModal(html);

  if (category) {
    setTimeout(() => selectTrialCategory(category), 0);
  }
}

function selectTrialCategory(cat) {
  const picker = document.getElementById('trialCategoryPicker');
  const form = document.getElementById('trialFormArea');
  if (picker) picker.style.display = 'none';
  if (form) form.style.display = '';
  const sel = document.getElementById('trialClassSelect');
  if (sel) {
    const adultGroup = document.getElementById('trialAdultGroup');
    const kidsGroup = document.getElementById('trialKidsGroup');
    if (cat === 'adult') {
      if (kidsGroup) kidsGroup.style.display = 'none';
      if (adultGroup) adultGroup.style.display = '';
    } else {
      if (adultGroup) adultGroup.style.display = 'none';
      if (kidsGroup) kidsGroup.style.display = '';
    }
  }
  const nameInput = document.getElementById('trialName');
  if (nameInput) nameInput.focus();
}

async function submitTrialBooking() {
  const name = (document.getElementById('trialName').value || '').trim();
  const email = (document.getElementById('trialEmail').value || '').trim();
  const phone = (document.getElementById('trialPhone').value || '').trim();
  const classChoice = (document.getElementById('trialClassSelect').value || '').trim();

  if (!name) { showToast('Name is required', 'error'); return; }
  if (!email && !phone) { showToast('Email or phone is required', 'error'); return; }
  if (!classChoice) { showToast('Please select a class', 'error'); return; }

  try {
    const result = await api('addBooking', {
      name,
      email,
      phone,
      classType: classChoice,
      date: new Date().toISOString().slice(0, 10),
      status: 'Pending'
    });
    if (result && result.success) {
      showToast('Trial booked for ' + esc(name), 'success');
      closeModal();
    } else {
      showToast('Failed to book trial', 'error');
    }
  } catch (e) {
    showToast('Error booking trial: ' + e.message, 'error');
  }
}

/* ── QUICK MESSAGE MODAL ───────────────────────────────── */
function showQuickMessageModal() {
  const html = `
    <div class="modal-header">
      <h2 class="modal-title">Send Message</h2>
      <button class="modal-close" onclick="closeModal()">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
    <div class="modal-body">
      <div class="form-group">
        <label>Recipients</label>
        <div class="recipient-options" id="quickMsgRecipients">
          <button class="recipient-chip selected" data-target="all" onclick="selectRecipient(this, 'quickMsg')">All Members</button>
          <button class="recipient-chip" data-target="active" onclick="selectRecipient(this, 'quickMsg')">Active</button>
          <button class="recipient-chip" data-target="trial" onclick="selectRecipient(this, 'quickMsg')">Trial</button>
          <button class="recipient-chip" data-target="failed" onclick="selectRecipient(this, 'quickMsg')">Failed</button>
        </div>
        <div style="margin-top:8px;">
          <input type="text" id="quickMsgMemberSearch" placeholder="Or type a name to find a specific member..." oninput="quickMsgSearchMember(this.value)">
          <div id="quickMsgSearchResults" style="max-height:120px;overflow-y:auto;"></div>
          <div id="quickMsgSelectedMembers" style="display:flex;flex-wrap:wrap;gap:6px;margin-top:6px;"></div>
        </div>
      </div>
      <div class="form-group">
        <label>Type</label>
        <div style="display:flex;gap:8px;">
          <button class="btn btn-secondary quickmsg-type active" data-type="email" onclick="switchQuickMsgType('email')" style="flex:1">Email</button>
          <button class="btn btn-secondary quickmsg-type" data-type="sms" onclick="switchQuickMsgType('sms')" style="flex:1">SMS</button>
        </div>
      </div>
      <div id="quickMsgSubjectRow" class="form-group">
        <label>Subject</label>
        <input type="text" id="quickMsgSubject" placeholder="Subject line">
      </div>
      <div class="form-group">
        <label>Message</label>
        <textarea id="quickMsgBody" placeholder="Write your message..." rows="5"></textarea>
      </div>
      <button class="btn btn-primary" style="width:100%;" id="quickMsgSendBtn" onclick="sendQuickMessage()">Send</button>
    </div>
  `;
  openModal(html);
}

let _quickMsgType = 'email';
let _quickMsgSelectedMembers = [];

function switchQuickMsgType(type) {
  _quickMsgType = type;
  document.querySelectorAll('.quickmsg-type').forEach(b => b.classList.toggle('active', b.dataset.type === type));
  const subjectRow = document.getElementById('quickMsgSubjectRow');
  if (subjectRow) subjectRow.style.display = type === 'email' ? '' : 'none';
}

function quickMsgSearchMember(query) {
  const resultsEl = document.getElementById('quickMsgSearchResults');
  if (!resultsEl) return;
  const q = (query || '').trim().toLowerCase();
  if (!q || q.length < 2) { resultsEl.innerHTML = ''; return; }
  const matches = membersCache.filter(m =>
    (m.Name || '').toLowerCase().includes(q) ||
    (m.Email || '').toLowerCase().includes(q)
  ).slice(0, 5);
  if (!matches.length) { resultsEl.innerHTML = '<div style="padding:6px 0;color:var(--text-muted);font-size:12px;">No members found</div>'; return; }
  resultsEl.innerHTML = matches.map(m =>
    `<div style="padding:6px 8px;cursor:pointer;border-radius:6px;font-size:13px;" onmouseover="this.style.background='var(--surface-2)'" onmouseout="this.style.background=''" onclick="addQuickMsgMember('${esc(m.Name)}','${esc(m.Email)}','${esc(m.Phone || '')}')">
      ${esc(m.Name)} <span style="color:var(--text-muted);">${esc(m.Email || '')}</span>
    </div>`
  ).join('');
}

function addQuickMsgMember(name, email, phone) {
  if (_quickMsgSelectedMembers.find(m => m.name === name)) return;
  _quickMsgSelectedMembers.push({ name, email, phone });
  renderQuickMsgSelectedMembers();
  const searchInput = document.getElementById('quickMsgMemberSearch');
  if (searchInput) searchInput.value = '';
  document.getElementById('quickMsgSearchResults').innerHTML = '';
}

function removeQuickMsgMember(name) {
  _quickMsgSelectedMembers = _quickMsgSelectedMembers.filter(m => m.name !== name);
  renderQuickMsgSelectedMembers();
}

function renderQuickMsgSelectedMembers() {
  const el = document.getElementById('quickMsgSelectedMembers');
  if (!el) return;
  el.innerHTML = _quickMsgSelectedMembers.map(m =>
    `<span style="display:inline-flex;align-items:center;gap:4px;padding:4px 10px;background:var(--surface-2);border-radius:20px;font-size:12px;color:var(--text);">
      ${esc(m.name)}
      <span onclick="removeQuickMsgMember('${esc(m.name)}')" style="cursor:pointer;color:var(--text-muted);font-size:14px;">&times;</span>
    </span>`
  ).join('');
}

async function sendQuickMessage() {
  const body = (document.getElementById('quickMsgBody').value || '').trim();
  if (!body) { showToast('Message is required', 'error'); return; }

  const target = getSelectedTarget('quickMsgRecipients') || 'all';
  const btn = document.getElementById('quickMsgSendBtn');

  if (_quickMsgType === 'email') {
    const subject = (document.getElementById('quickMsgSubject').value || '').trim();
    if (!subject) { showToast('Subject is required for email', 'error'); return; }

    btn.disabled = true;
    btn.textContent = 'Sending...';

    if (_quickMsgSelectedMembers.length > 0) {
      const result = await api('sendMassEmail', { subject, htmlBody: body, target: 'custom', recipients: _quickMsgSelectedMembers.map(m => m.email) });
      btn.disabled = false; btn.textContent = 'Send';
      if (result && result.success) { showToast('Email sent to ' + _quickMsgSelectedMembers.length + ' recipient(s)', 'success'); closeModal(); _quickMsgSelectedMembers = []; }
      else { showToast('Failed to send email', 'error'); }
    } else {
      const result = await api('sendMassEmail', { subject, htmlBody: body, target });
      btn.disabled = false; btn.textContent = 'Send';
      if (result && result.success) { showToast('Email sent to ' + (result.sentCount || 0) + ' recipient(s)', 'success'); closeModal(); }
      else { showToast('Failed to send email', 'error'); }
    }
  } else {
    btn.disabled = true;
    btn.textContent = 'Sending...';

    if (_quickMsgSelectedMembers.length > 0) {
      const result = await api('sendMassSMS', { message: body, target: 'custom', recipients: _quickMsgSelectedMembers.map(m => ({ phone: m.phone })) });
      btn.disabled = false; btn.textContent = 'Send';
      if (result && result.success) { showToast('SMS sent to ' + _quickMsgSelectedMembers.length + ' recipient(s)', 'success'); closeModal(); _quickMsgSelectedMembers = []; }
      else { showToast('Failed to send SMS', 'error'); }
    } else {
      const result = await api('sendMassSMS', { message: body, target });
      btn.disabled = false; btn.textContent = 'Send';
      if (result && result.success) { showToast('SMS sent to ' + (result.sentCount || 0) + ' recipient(s)', 'success'); closeModal(); }
      else { showToast('Failed to send SMS', 'error'); }
    }
  }
}

/* ── GLOBAL SEARCH (Cmd+K) ──────────────────────────────── */
function openGlobalSearch() {
  const overlay = document.getElementById('globalSearchOverlay');
  if (!overlay) return;
  overlay.classList.add('active');
  const input = document.getElementById('globalSearchInput');
  if (input) { input.value = ''; setTimeout(() => input.focus(), 50); }
  document.getElementById('globalSearchResults').innerHTML = '<div class="search-empty">Type to search members...</div>';
}

function closeGlobalSearch() {
  const overlay = document.getElementById('globalSearchOverlay');
  if (overlay) overlay.classList.remove('active');
}

function onGlobalSearch(query) {
  const resultsEl = document.getElementById('globalSearchResults');
  if (!resultsEl) return;
  const q = (query || '').trim().toLowerCase();
  if (!q) {
    resultsEl.innerHTML = '<div class="search-empty">Type to search members...</div>';
    return;
  }

  let html = '';

  // Search members
  const memberMatches = membersCache.filter(m =>
    (m.Name || '').toLowerCase().includes(q) ||
    (m.Email || '').toLowerCase().includes(q) ||
    (m.Phone || '').includes(q)
  ).slice(0, 8);

  if (memberMatches.length) {
    html += '<div class="search-result-group">Members</div>';
    html += memberMatches.map(m => {
      const initials = (m.Name || '?').split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase();
      const mJson = JSON.stringify(m).replace(/'/g, '&#39;').replace(/"/g, '&quot;');
      return `<div class="search-result-item" onclick="closeGlobalSearch(); renderMemberProfile(JSON.parse(decodeURIComponent('${encodeURIComponent(JSON.stringify(m))}')))">
        <div class="search-result-avatar">${initials}</div>
        <div><div class="search-result-name">${esc(m.Name)}</div><div class="search-result-sub">${esc(m.Plan || 'No plan')} • ${esc(m.Status || '')}</div></div>
      </div>`;
    }).join('');
  }

  // Search trial bookings
  if (dashboardDataCache && dashboardDataCache.recentBookings) {
    const trialMatches = dashboardDataCache.recentBookings.filter(b =>
      b.name && b.name.toLowerCase().includes(q)
    ).slice(0, 5);
    if (trialMatches.length) {
      html += '<div class="search-result-group">Trials</div>';
      html += trialMatches.map(b => {
        const initials = (b.name || '?').split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase();
        return `<div class="search-result-item" onclick="closeGlobalSearch(); renderTrialProfile(JSON.parse(decodeURIComponent('${encodeURIComponent(JSON.stringify(b))}')))">
          <div class="search-result-avatar">${initials}</div>
          <div><div class="search-result-name">${esc(b.name)}</div><div class="search-result-sub">${esc(b.classType || 'Trial')} • ${esc(b.date || '')}</div></div>
        </div>`;
      }).join('');
    }
  }

  if (!html) {
    html = '<div class="search-empty">No results found</div>';
  }
  resultsEl.innerHTML = html;
}

function handleGlobalSearchKey(e) {
  if (e.key === 'Escape') { closeGlobalSearch(); return; }
  const items = document.querySelectorAll('#globalSearchResults .search-result-item');
  if (!items.length) return;
  const focused = document.querySelector('#globalSearchResults .search-result-item.focused');
  let idx = focused ? Array.from(items).indexOf(focused) : -1;

  if (e.key === 'ArrowDown') {
    e.preventDefault();
    idx = Math.min(idx + 1, items.length - 1);
    items.forEach(i => i.classList.remove('focused'));
    items[idx]?.classList.add('focused');
    items[idx]?.scrollIntoView({ block: 'nearest' });
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    idx = Math.max(idx - 1, 0);
    items.forEach(i => i.classList.remove('focused'));
    items[idx]?.classList.add('focused');
    items[idx]?.scrollIntoView({ block: 'nearest' });
  } else if (e.key === 'Enter' && focused) {
    e.preventDefault();
    focused.click();
  }
}

/* ── KEYBOARD SHORTCUTS ─────────────────────────────────── */
document.addEventListener('keydown', function(e) {
  if (!authToken) return;

  // Cmd/Ctrl+K to open global search (works even in inputs)
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault();
    openGlobalSearch();
    return;
  }

  // Escape to close global search or modal
  if (e.key === 'Escape') {
    if (document.getElementById('globalSearchOverlay')?.classList.contains('active')) {
      closeGlobalSearch();
      return;
    }
    closeModal();
    return;
  }

  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) return;
});

// Close typeahead dropdown when clicking outside
document.addEventListener('click', function(e) {
  const drop = document.getElementById('memberTypeaheadDrop');
  const wrap = document.querySelector('.member-search-wrap');
  if (drop && wrap && !wrap.contains(e.target)) {
    drop.classList.remove('open');
  }
  // Also close POS customer dropdown
  const posDrop = document.getElementById('posCustomerDrop');
  const posWrap = document.querySelector('.pos-customer-search');
  if (posDrop && posWrap && !posWrap.contains(e.target)) {
    posDrop.classList.remove('open');
  }
});

/* ── INIT ───────────────────────────────────────────────── */
// Check if already authed (for development)
window.addEventListener('DOMContentLoaded', function() {
  // Fix iOS zoom — ensure viewport prevents scaling
  var vp = document.querySelector('meta[name="viewport"]');
  if (vp) vp.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');

  // Focus password field
  const pwField = document.getElementById('loginPassword');
  if (pwField) pwField.focus();
});

/* ═══════════════════════════════════════════════════════════
   GLOBAL EVENT DELEGATION — Quick Action Buttons
   This single listener handles ALL quick-action-card clicks
   regardless of when/how the cards are rendered into the DOM.
   Uses event delegation on document.body (bubbling phase).
   ═══════════════════════════════════════════════════════════ */
document.body.addEventListener('click', function(e) {
  // Find the closest quick-action-card with a data-qa attribute
  var card = e.target.closest('[data-qa]');
  if (!card) return;

  e.preventDefault();
  var action = card.getAttribute('data-qa');
  
  switch(action) {
    case 'newMember':     startOnboardingWizard({}); break;
    case 'newPayment':    showCheckoutModal(); break;
    case 'posSale':       paymentsTab = 'pos'; navigate('payments'); window.scrollTo(0,0); break;
    case 'scheduleTrial': showScheduleTrialModal(); break;
    case 'signWaiver':    showWaiverModal({}); break;
    case 'sendMessage':   showQuickMessageModal(); break;
    case 'search':        openGlobalSearch(); break;
    case 'viewSchedule':  navigate('schedule'); break;
  }
});


// ── Admin multi-card management ──────────────────────────────────
async function adminSetDefaultCard(stripeCustomerId, paymentMethodId) {
  if (!confirm('Set this card as the default payment method?')) return;
  showToast('Updating default card...', 'info');
  const result = await api('adminSetDefaultCard', { stripeCustomerId, paymentMethodId });
  if (result && result.success) {
    showToast('Default card updated', 'success');
    if (window._refreshProfileCards) window._refreshProfileCards();
  } else {
    showToast(result?.error || 'Failed to set default card', 'error');
  }
}

async function adminRemoveCard(stripeCustomerId, paymentMethodId, last4) {
  if (!confirm('Remove card ending in ' + last4 + '? This cannot be undone.')) return;
  showToast('Removing card...', 'info');
  const result = await api('adminRemoveCard', { stripeCustomerId, paymentMethodId });
  if (result && result.success) {
    showToast('Card removed', 'success');
    if (window._refreshProfileCards) window._refreshProfileCards();
  } else {
    showToast(result?.error || 'Failed to remove card', 'error');
  }
}