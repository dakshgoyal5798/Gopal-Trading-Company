/**
 * Gopal Trading Company – Frontend Application
 * Vanilla JS SPA – handles routing, API calls, and UI rendering
 */

// ════════════════════════════════════════════════════════════
// CONFIGURATION
// ════════════════════════════════════════════════════════════
const API_BASE = '/api'; // adjust if backend is on a different port: 'http://localhost:5000/api'

// ════════════════════════════════════════════════════════════
// STATE
// ════════════════════════════════════════════════════════════
let currentUser = null;
let selectedFile = null;
let allUserOrders = [];
let currentOrderIdForModal = null;

// ════════════════════════════════════════════════════════════
// INIT
// ════════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  initAuth();
  initRouter();
  initScrollAnimations();
  setMinDeliveryDate();
});

function initRouter() {
  const hash = window.location.hash;
  if (hash.startsWith('#reset/')) {
    const token = hash.split('/')[1];
    if (token) {
      window.resetToken = token;
      showPage('reset');
      return;
    }
  }
  showPage('home');
}

// ════════════════════════════════════════════════════════════
// AUTH STATE
// ════════════════════════════════════════════════════════════
function initAuth() {
  const token = localStorage.getItem('gtc_token');
  const user  = localStorage.getItem('gtc_user');
  if (token && user) {
    try {
      currentUser = JSON.parse(user);
      updateNavForUser();
    } catch(e) {
      logout();
    }
  }
}

function updateNavForUser() {
  const loggedIn = !!currentUser;
  const isAdmin  = currentUser?.role === 'admin';
  
  const getLinks = (isMob) => `
    <a href="#" class="nav-link" onclick="showPage('home')"><i data-lucide="home"></i> Home</a>
    ${!loggedIn ? `
      <a href="#" class="nav-link" onclick="showPage('login')"><i data-lucide="log-in"></i> Login</a>
      <a href="#" class="nav-link btn btn-green btn-sm" onclick="showPage('signup')" style="color:white;margin-left:8px;"><i data-lucide="user-plus"></i> Sign Up</a>
    ` : `
      ${isAdmin ? `
        <a href="/admin.html" class="nav-link" ${isMob?'':'target="_blank"'}><i data-lucide="shield"></i> Admin Panel</a>
      ` : `
        <a href="#" class="nav-link" onclick="showPage('dashboard')"><i data-lucide="layout-dashboard"></i> Dashboard</a>
      `}
      <a href="#" class="nav-link" onclick="logout()" style="color:var(--red)"><i data-lucide="log-out"></i> Logout</a>
    `}
  `;

  const navLinks = el('navLinks');
  const mobLinks = el('mobileMenu');
  if (navLinks) navLinks.innerHTML = getLinks(false);
  if (mobLinks) mobLinks.innerHTML = getLinks(true);

  if (window.lucide) {
    lucide.createIcons();
  }
}

function authGuard(action) {
  if (!currentUser) {
    showPage('login');
    showToast('Please log in to continue.', 'error');
    return;
  }
  showPage('dashboard');
  if (action === 'upload' || action === 'order') {
    switchDash('neworder');
  }
}

// ════════════════════════════════════════════════════════════
// PAGE ROUTING
// ════════════════════════════════════════════════════════════
function showPage(name) {
  // Admin panel is a separate file
  if (name === 'admin') {
    window.location.href = '/admin.html';
    return;
  }

  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const target = document.getElementById(`page-${name}`);
  if (target) {
    target.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Load data when entering specific pages
    if (name === 'dashboard' && currentUser) {
      switchDash('overview');
    } else if (name === 'login' && currentUser) {
      // Already logged in
      showPage(currentUser.role === 'admin' ? 'admin' : 'dashboard');
    }
  }
  closeMobileMenu();
}

// ════════════════════════════════════════════════════════════
// NAVIGATION
// ════════════════════════════════════════════════════════════
function toggleMobileMenu() {
  el('mobileMenu').classList.toggle('open');
}
function closeMobileMenu() {
  el('mobileMenu').classList.remove('open');
}

function toggleMobSidebar() {
  const mob = el('mobSidebar');
  const overlay = el('mobSidebarOverlay');
  if (mob) mob.classList.toggle('open');
  if (overlay) overlay.classList.toggle('open');
}
function toggleMobAdminSidebar() {
  if (el('mobAdminSidebar')) el('mobAdminSidebar').classList.toggle('open');
}

// ════════════════════════════════════════════════════════════
// AUTH ACTIONS
// ════════════════════════════════════════════════════════════
async function doSignup() {
  const name     = val('regName').trim();
  const phone    = val('regPhone').trim();
  const email    = val('regEmail').trim();
  const password = val('regPassword');

  if (!name || !phone || !email || !password) {
    return showToast('All fields are required.', 'error');
  }
  if (phone.length !== 10 || !/^[6-9]\d{9}$/.test(phone)) {
    return showToast('Enter a valid 10-digit Indian mobile number.', 'error');
  }
  if (password.length < 6) {
    return showToast('Password must be at least 6 characters.', 'error');
  }

  setLoading('signupBtn', true, '⏳ Creating Account...');
  try {
    const data = await apiPost('/auth/signup', { name, phone, email, password });
    if (data.success) {
      saveAuth(data.token, data.user);
      showToast(`Welcome to Gopal Trading, ${data.user.name}! 🎉`, 'success');
      showPage('dashboard');
    } else {
      showToast(data.message, 'error');
    }
  } catch(e) {
    showToast('Connection error. Please try again.', 'error');
  } finally {
    setLoading('signupBtn', false, '✨ Create Account');
  }
}

async function doLogin() {
  const email    = val('loginEmail').trim();
  const password = val('loginPassword');

  if (!email || !password) return showToast('Email and password are required.', 'error');

  setLoading('loginBtn', true, '⏳ Signing in...');
  try {
    const data = await apiPost('/auth/login', { email, password });
    if (data.success) {
      saveAuth(data.token, data.user);
      showToast(`Welcome back, ${data.user.name}!`, 'success');
      showPage(data.user.role === 'admin' ? 'admin' : 'dashboard');
    } else {
      showToast(data.message, 'error');
    }
  } catch(e) {
    showToast('Connection error. Please try again.', 'error');
  } finally {
    setLoading('loginBtn', false, '🔑 Login');
  }
}

async function doForgotPassword() {
  const email = val('forgotEmail').trim();
  if (!email) return showToast('Email is required.', 'error');

  setLoading('forgotBtn', true, '⏳ Processing...');
  try {
    const data = await apiPost('/auth/forgot', { email });
    if (data.success) {
      showToast(data.message, 'success');
      el('forgotEmail').value = '';
    } else {
      showToast(data.message, 'error');
    }
  } catch(e) {
    showToast('Connection error. Try again.', 'error');
  } finally {
    setLoading('forgotBtn', false, 'Send Reset Link');
  }
}

async function doResetPassword() {
  const password = val('resetPassword');
  const confirm  = val('resetConfirmPassword');
  const token    = window.resetToken;

  if (!password || !confirm) return showToast('All fields required.', 'error');
  if (password !== confirm) return showToast('Passwords do not match.', 'error');
  if (!token) return showToast('Missing reset token. Please request a new link.', 'error');

  setLoading('resetBtn', true, '⏳ Updating...');
  try {
    const data = await apiPut(`/auth/reset/${token}`, { password });
    if (data.success) {
      showToast(data.message, 'success');
      window.resetToken = null;
      window.location.hash = '';
      setTimeout(() => showPage('login'), 1500);
    } else {
      showToast(data.message, 'error');
    }
  } catch(e) {
    showToast('Connection error. Try again.', 'error');
  } finally {
    setLoading('resetBtn', false, 'Update Password');
  }
}

function showAdminLogin() {
  el('loginEmail').value = '';
  el('loginPassword').value = '';
  el('loginEmail').placeholder = 'admin@gopaltrading.com';
  el('loginPassword').placeholder = 'Admin password';
}

function saveAuth(token, user) {
  localStorage.setItem('gtc_token', token);
  localStorage.setItem('gtc_user', JSON.stringify(user));
  currentUser = user;
  updateNavForUser();
}

function logout() {
  localStorage.removeItem('gtc_token');
  localStorage.removeItem('gtc_user');
  currentUser = null;
  updateNavForUser();
  showPage('home');
  showToast('You have been logged out.', 'success');
}

// ════════════════════════════════════════════════════════════
// DASHBOARD NAVIGATION
// ════════════════════════════════════════════════════════════
function switchDash(section) {
  document.querySelectorAll('.dash-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('#page-dashboard .sidebar-nav a').forEach(a => a.classList.remove('active'));
  document.querySelectorAll('#mobSidebar a').forEach(a => a.classList.remove('active'));

  const target = el(`ds-${section}`);
  if (target) target.classList.add('active');
  if (el(`nav-${section}`))     el(`nav-${section}`).classList.add('active');
  if (el(`mob-nav-${section}`)) el(`mob-nav-${section}`).classList.add('active');

  // close mobile sidebar
  const mob = el('mobSidebar');
  const overlay = el('mobSidebarOverlay');
  if (mob)     mob.classList.remove('open');
  if (overlay) overlay.classList.remove('open');

  if (section === 'myorders') loadAllUserOrders();
  if (section === 'profile')  loadProfileForm();
  if (section === 'overview') loadUserDashboard();
}

function switchAdmin(section) {
  document.querySelectorAll('#page-admin .dash-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('#page-admin .sidebar-nav a').forEach(a => a.classList.remove('active'));
  document.querySelectorAll('#mobAdminSidebar a').forEach(a => a.classList.remove('active'));

  el(`ads-${section}`).classList.add('active');
  const navId = `adm-nav-${section.replace('a','').toLowerCase()}`;
  if (el(`adm-nav-${section.slice(1)}`)) el(`adm-nav-${section.slice(1)}`).classList.add('active');

  el('mobAdminSidebar').classList.remove('open');

  if (section === 'aorders') loadAdminOrders();
  if (section === 'ausers')  loadAdminUsers();
  if (section === 'adash')   loadAdminDashboard();
}

// ════════════════════════════════════════════════════════════
// USER DASHBOARD LOAD
// ════════════════════════════════════════════════════════════
async function loadUserDashboard() {
  if (!currentUser) return;
  el('dashWelcomeName').textContent = currentUser.name.split(' ')[0];
  el('sidebarName').textContent  = currentUser.name;
  el('sidebarEmail').textContent = currentUser.email;
  el('sidebarAvatar').textContent = currentUser.name[0].toUpperCase();

  try {
    const data = await apiGet('/orders/user');
    if (!data.success) return;

    const orders = data.orders;
    allUserOrders = orders;

    // Update stats
    el('uStatTotal').textContent     = orders.length;
    el('uStatPending').textContent   = orders.filter(o => o.status === 'Pending').length;
    el('uStatDelivered').textContent = orders.filter(o => o.status === 'Delivered').length;

    // Recent orders table (last 5)
    el('recentOrdersTable').innerHTML = renderOrderTable(orders.slice(0, 5), false);
  } catch(e) {
    el('recentOrdersTable').innerHTML = '<p style="padding:20px;color:var(--red)">Failed to load orders.</p>';
  }
}

async function loadAllUserOrders(statusFilter = 'All') {
  el('allUserOrdersTable').innerHTML = '<div class="spinner"></div>';
  try {
    const data = await apiGet('/orders/user');
    if (!data.success) return;
    allUserOrders = data.orders;
    filterMyOrders(statusFilter);
  } catch(e) {
    el('allUserOrdersTable').innerHTML = '<p style="padding:20px;color:var(--red)">Failed to load orders.</p>';
  }
}

function filterMyOrders(status) {
  const filtered = status === 'All' ? allUserOrders : allUserOrders.filter(o => o.status === status);
  el('allUserOrdersTable').innerHTML = renderOrderTable(filtered, false);
}

// ════════════════════════════════════════════════════════════
// FILE UPLOAD
// ════════════════════════════════════════════════════════════
function switchUploadTab(tab) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  document.querySelector(`.tab-btn[onclick*="${tab}"]`).classList.add('active');
  el(`tab-${tab}`).classList.add('active');
}

function handleFileSelect(event) {
  const file = event.target.files[0];
  if (file) setSelectedFile(file);
}

function handleDragOver(event) {
  event.preventDefault();
  el('uploadZone').classList.add('dragover');
}

function handleDragLeave() {
  el('uploadZone').classList.remove('dragover');
}

function handleDrop(event) {
  event.preventDefault();
  el('uploadZone').classList.remove('dragover');
  const file = event.dataTransfer.files[0];
  if (file) setSelectedFile(file);
}

function setSelectedFile(file) {
  const allowed = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'text/plain'];
  if (!allowed.includes(file.type)) {
    showToast('Only PDF, JPG, PNG, and TXT files are allowed.', 'error');
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    showToast('File size must be under 5 MB.', 'error');
    return;
  }
  selectedFile = file;
  el('fileName').textContent = file.name;
  el('filePreview').classList.remove('hidden');
  el('uploadZone').style.opacity = '0.6';
}

function removeFile() {
  selectedFile = null;
  el('fileInput').value = '';
  el('filePreview').classList.add('hidden');
  el('uploadZone').style.opacity = '1';
}

// ════════════════════════════════════════════════════════════
// SUBMIT ORDER
// ════════════════════════════════════════════════════════════
async function submitOrder() {
  if (!currentUser) return showPage('login');

  const textList   = val('textListInput').trim();
  const address    = val('deliveryAddress').trim();
  const deliveryDate = val('deliveryDate');
  const timeSlot   = val('timeSlot');

  const activeTab = document.querySelector('.tab-btn.active').textContent.includes('Upload') ? 'upload' : 'type';

  if (activeTab === 'upload' && !selectedFile && !textList) {
    return showToast('Please upload a file or type your grocery list.', 'error');
  }
  if (activeTab === 'type' && !textList) {
    return showToast('Please type your grocery list.', 'error');
  }
  if (!address) return showToast('Delivery address is required.', 'error');
  if (!deliveryDate) return showToast('Please select a delivery date.', 'error');
  if (!timeSlot) return showToast('Please select a delivery time slot.', 'error');

  const formData = new FormData();
  if (selectedFile) formData.append('requirementFile', selectedFile);
  formData.append('textList', textList);
  formData.append('address', address);
  formData.append('deliveryDate', deliveryDate);
  formData.append('timeSlot', timeSlot);

  setLoading('submitOrderBtn', true, '⏳ Submitting...');
  try {
    const token = localStorage.getItem('gtc_token');
    const res = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    });
    const data = await res.json();
    if (data.success) {
      showToast('🎉 Order placed! We will confirm shortly.', 'success');
      // Reset form
      el('textListInput').value = '';
      el('deliveryAddress').value = '';
      el('deliveryDate').value = '';
      el('timeSlot').value = '';
      removeFile();
      setMinDeliveryDate();
      switchDash('myorders');
    } else {
      showToast(data.message, 'error');
    }
  } catch(e) {
    showToast('Failed to submit order. Please try again.', 'error');
  } finally {
    setLoading('submitOrderBtn', false, '🛒 Submit Order Request');
  }
}

function setMinDeliveryDate() {
  const inp = el('deliveryDate');
  if (inp) {
    const today = new Date().toISOString().split('T')[0];
    inp.min = today;
  }
}

// ════════════════════════════════════════════════════════════
// PROFILE
// ════════════════════════════════════════════════════════════
function loadProfileForm() {
  if (!currentUser) return;
  el('profileName').value    = currentUser.name || '';
  el('profilePhone').value   = currentUser.phone || '';
  el('profileEmail').value   = currentUser.email || '';
  el('profileAddress').value = currentUser.address || '';
}

async function saveProfile() {
  const name    = val('profileName').trim();
  const phone   = val('profilePhone').trim();
  const address = val('profileAddress').trim();

  if (!name || !phone) return showToast('Name and phone are required.', 'error');

  try {
    const data = await apiPut('/auth/profile', { name, phone, address });
    if (data.success) {
      currentUser = data.user;
      localStorage.setItem('gtc_user', JSON.stringify(data.user));
      el('sidebarName').textContent = data.user.name;
      el('dashWelcomeName').textContent = data.user.name.split(' ')[0];
      showToast('Profile updated successfully!', 'success');
    } else {
      showToast(data.message, 'error');
    }
  } catch(e) {
    showToast('Update failed. Try again.', 'error');
  }
}

async function changePassword() {
  const current  = val('currentPassword');
  const newPass  = val('newPassword');
  if (!current || !newPass) return showToast('Both password fields are required.', 'error');
  if (newPass.length < 6) return showToast('New password must be at least 6 characters.', 'error');

  try {
    const data = await apiPut('/auth/password', { currentPassword: current, newPassword: newPass });
    if (data.success) {
      showToast('Password changed successfully!', 'success');
      el('currentPassword').value = '';
      el('newPassword').value = '';
    } else {
      showToast(data.message, 'error');
    }
  } catch(e) {
    showToast('Failed. Try again.', 'error');
  }
}

// ════════════════════════════════════════════════════════════
// ADMIN DASHBOARD
// ════════════════════════════════════════════════════════════
async function loadAdminDashboard() {
  try {
    const data = await apiGet('/admin/dashboard');
    if (!data.success) return;
    const s = data.stats;

    el('aStatUsers').textContent     = s.totalUsers;
    el('aStatOrders').textContent    = s.totalOrders;
    el('aStatPending').textContent   = s.pendingOrders;
    el('aStatDelivered').textContent = s.deliveredOrders;

    // Recent orders table
    el('adminRecentOrders').innerHTML = renderOrderTable(s.recentOrders, true);

    // Bar chart (last 7 days)
    renderBarChart(s.dailyOrders);

    // Status breakdown
    renderPieLegend(s.statusBreakdown);
  } catch(e) {
    console.error('Admin dashboard error:', e);
  }
}

function renderBarChart(dailyOrders) {
  if (!dailyOrders || dailyOrders.length === 0) {
    el('adminBarChart').innerHTML = '<p style="color:var(--gray-600);font-size:13px">No data yet.</p>';
    return;
  }
  const max = Math.max(...dailyOrders.map(d => d.count), 1);
  el('adminBarChart').innerHTML = dailyOrders.map(d => {
    const h = Math.round((d.count / max) * 72);
    const label = d._id.slice(5); // MM-DD
    return `
      <div class="bar-item">
        <div class="bar-fill" style="height:${h}px" title="${d.count} orders"></div>
        <div class="bar-label">${label}</div>
      </div>
    `;
  }).join('');
}

function renderPieLegend(statusBreakdown) {
  if (!statusBreakdown || statusBreakdown.length === 0) {
    el('adminPieLegend').innerHTML = '<p style="color:var(--gray-600);font-size:13px">No data yet.</p>';
    return;
  }
  const colors = {
    Pending: '#856404', Accepted: '#0c5460',
    'Out for Delivery': '#004085', Delivered: '#155724', Rejected: '#721c24'
  };
  const bg = {
    Pending: '#fff3cd', Accepted: '#d1ecf1',
    'Out for Delivery': '#cce5ff', Delivered: '#d4edda', Rejected: '#f8d7da'
  };
  el('adminPieLegend').innerHTML = statusBreakdown.map(s => `
    <div class="pie-row">
      <div class="pie-dot" style="background:${bg[s._id] || '#eee'};border:2px solid ${colors[s._id] || '#999'}"></div>
      <span style="color:${colors[s._id] || '#333'};font-weight:600">${s._id}</span>
      <span style="margin-left:auto;font-weight:700">${s.count}</span>
    </div>
  `).join('');
}

async function loadAdminOrders() {
  const search = el('adminOrderSearch')?.value || '';
  const status = el('adminStatusFilter')?.value || 'All';
  el('adminOrdersTable').innerHTML = '<div class="spinner"></div>';
  try {
    const data = await apiGet(`/orders?status=${status}&search=${encodeURIComponent(search)}`);
    if (!data.success) return;
    el('adminOrdersTable').innerHTML = renderOrderTable(data.orders, true);
  } catch(e) {
    el('adminOrdersTable').innerHTML = '<p style="padding:20px;color:var(--red)">Failed to load orders.</p>';
  }
}

async function loadAdminUsers() {
  const search = el('adminUserSearch')?.value || '';
  el('adminUsersTable').innerHTML = '<div class="spinner"></div>';
  try {
    const data = await apiGet(`/admin/users?search=${encodeURIComponent(search)}`);
    if (!data.success) return;
    if (data.users.length === 0) {
      el('adminUsersTable').innerHTML = `<div class="empty-state"><div class="big">👥</div><p>No customers found.</p></div>`;
      return;
    }
    el('adminUsersTable').innerHTML = `
      <table>
        <thead><tr>
          <th>Name</th><th>Email</th><th>Phone</th>
          <th>Joined</th><th>Status</th><th>Action</th>
        </tr></thead>
        <tbody>
          ${data.users.map(u => `
            <tr>
              <td><strong>${u.name}</strong></td>
              <td>${u.email}</td>
              <td>${u.phone}</td>
              <td>${formatDate(u.createdAt)}</td>
              <td><span class="badge ${u.isActive ? 'badge-delivered' : 'badge-rejected'}">
                ${u.isActive ? 'Active' : 'Inactive'}
              </span></td>
              <td>
                <button class="btn btn-sm ${u.isActive ? 'btn-outline-red' : 'btn-outline-green'}"
                  onclick="toggleUser('${u._id}')">
                  ${u.isActive ? 'Deactivate' : 'Activate'}
                </button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  } catch(e) {
    el('adminUsersTable').innerHTML = '<p style="padding:20px;color:var(--red)">Failed to load users.</p>';
  }
}

async function toggleUser(userId) {
  try {
    const data = await apiPut(`/admin/users/${userId}/toggle`, {});
    showToast(data.message, 'success');
    loadAdminUsers();
  } catch(e) {
    showToast('Failed to update user.', 'error');
  }
}

// ════════════════════════════════════════════════════════════
// ORDER TABLE RENDERER
// ════════════════════════════════════════════════════════════
function renderOrderTable(orders, isAdmin) {
  if (!orders || orders.length === 0) {
    return `<div class="empty-state">
      <div class="big">📦</div>
      <p>No orders found.</p>
      ${!isAdmin ? '<button class="btn btn-green btn-sm" style="margin-top:12px" onclick="switchDash(\'neworder\')">+ Place First Order</button>' : ''}
    </div>`;
  }
  return `
    <table>
      <thead><tr>
        <th>Order ID</th>
        ${isAdmin ? '<th>Customer</th>' : ''}
        <th>Address</th>
        <th>Delivery</th>
        <th>Status</th>
        <th>Action</th>
      </tr></thead>
      <tbody>
        ${orders.map(o => `
          <tr>
            <td><strong>${o.orderId || ('GT-' + o._id.slice(-5))}</strong><br>
              <span style="font-size:11px;color:var(--gray-600)">${formatDate(o.createdAt)}</span>
            </td>
            ${isAdmin ? `<td>
              <strong>${o.userId?.name || 'Unknown'}</strong><br>
              <span style="font-size:12px;color:var(--gray-600)">${o.userId?.phone || ''}</span>
            </td>` : ''}
            <td style="max-width:180px;font-size:13px">${truncate(o.address, 60)}</td>
            <td>
              <span style="font-size:13px">${formatDate(o.deliveryDate)}</span><br>
              <span style="font-size:11px;color:var(--gray-600)">${formatSlot(o.timeSlot)}</span>
            </td>
            <td>${statusBadge(o.status)}</td>
            <td>
              <button class="btn btn-sm btn-outline-green" onclick="viewOrder('${o._id}')">View</button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

// ════════════════════════════════════════════════════════════
// ORDER DETAIL MODAL
// ════════════════════════════════════════════════════════════
async function viewOrder(orderId) {
  currentOrderIdForModal = orderId;
  el('orderModal').classList.add('open');
  el('modalBody').innerHTML = '<div class="spinner"></div>';
  el('modalFooter').innerHTML = '';

  try {
    const data = await apiGet(`/orders/${orderId}`);
    if (!data.success) {
      el('modalBody').innerHTML = '<p style="color:var(--red)">Failed to load order details.</p>';
      return;
    }
    const o = data.order;
    const isAdmin = currentUser?.role === 'admin';

    el('modalBody').innerHTML = `
      <div class="detail-row">
        <label>Order ID</label>
        <p><strong>${o.orderId || ('GT-' + o._id.slice(-5))}</strong></p>
      </div>
      ${isAdmin ? `
      <div class="detail-row">
        <label>Customer</label>
        <p><strong>${o.userId?.name}</strong> | ${o.userId?.email} | ${o.userId?.phone}</p>
      </div>` : ''}
      <div class="detail-row">
        <label>Status</label>
        <p>${statusBadge(o.status)}</p>
      </div>
      <div class="detail-row">
        <label>Delivery Address</label>
        <p>${o.address}</p>
      </div>
      <div class="detail-row">
        <label>Delivery Date & Time</label>
        <p>${formatDate(o.deliveryDate)} &nbsp;•&nbsp; ${formatSlot(o.timeSlot)}</p>
      </div>
      ${o.fileUrl ? `
      <div class="detail-row">
        <label>Uploaded File</label>
        <p><a href="${o.fileUrl}" target="_blank">📄 ${o.fileName || 'View File'}</a></p>
      </div>` : ''}
      ${o.textList ? `
      <div class="detail-row">
        <label>Grocery List</label>
        <pre style="background:var(--gray-50);border:1px solid var(--gray-100);border-radius:8px;padding:12px;font-size:13px;white-space:pre-wrap;font-family:var(--font-body)">${o.textList}</pre>
      </div>` : ''}
      ${o.adminNote ? `
      <div class="detail-row">
        <label>Admin Note</label>
        <p>${o.adminNote}</p>
      </div>` : ''}
      <div class="detail-row">
        <label>Order Placed On</label>
        <p>${formatDateTime(o.createdAt)}</p>
      </div>
    `;

    // Admin controls
    if (isAdmin) {
      el('modalFooter').innerHTML = `
        <div style="width:100%">
          <div class="form-group" style="margin-bottom:12px">
            <label style="font-size:12px;font-weight:600;color:var(--gray-600)">UPDATE STATUS</label>
            <select class="form-control" id="modalStatusSelect" style="margin-top:4px">
              ${['Pending','Accepted','Out for Delivery','Delivered','Rejected']
                .map(s => `<option value="${s}" ${s===o.status?'selected':''}>${s}</option>`).join('')}
            </select>
          </div>
          <div class="form-group" style="margin-bottom:12px">
            <input type="text" class="form-control" id="modalNote" placeholder="Admin note (optional)" value="${o.adminNote || ''}" />
          </div>
          <div style="display:flex;gap:10px">
            <button class="btn btn-green" onclick="updateOrderStatus('${o._id}')">✅ Update Status</button>
            <button class="btn btn-outline-red btn-sm" onclick="closeModal()">Cancel</button>
          </div>
        </div>
      `;
    }
  } catch(e) {
    el('modalBody').innerHTML = '<p style="color:var(--red)">Failed to load order.</p>';
  }
}

async function updateOrderStatus(orderId) {
  const status    = el('modalStatusSelect').value;
  const adminNote = el('modalNote').value.trim();
  try {
    const data = await apiPut(`/orders/${orderId}`, { status, adminNote });
    if (data.success) {
      showToast(data.message, 'success');
      closeModal();
      loadAdminOrders();
      loadAdminDashboard();
    } else {
      showToast(data.message, 'error');
    }
  } catch(e) {
    showToast('Failed to update.', 'error');
  }
}

function closeModal() {
  el('orderModal').classList.remove('open');
  currentOrderIdForModal = null;
}

// Close modal on backdrop click
el('orderModal')?.addEventListener('click', (e) => {
  if (e.target === el('orderModal')) closeModal();
});

// ════════════════════════════════════════════════════════════
// CONTACT FORM
// ════════════════════════════════════════════════════════════
async function sendContact() {
  const name = val('contactName').trim();
  const contact = val('contactContact').trim();
  const msg = val('contactMsg').trim();
  if (!name || !contact || !msg) {
    return showToast('Please fill all fields.', 'error');
  }
  
  setLoading('contactBtn', true, '⏳ Sending...');
  try {
    const data = await apiPost('/contact', { name, phoneOrEmail: contact, message: msg });
    if (data.success) {
      showToast(`Thank you, ${name}! We'll get back to you soon. 📬`, 'success');
      el('contactName').value = '';
      el('contactContact').value = '';
      el('contactMsg').value = '';
    } else {
      showToast(data.message || 'Failed to send message.', 'error');
    }
  } catch (error) {
    showToast('Connection error. Please try again.', 'error');
  } finally {
    setLoading('contactBtn', false, 'Send Message');
    el('contactBtn').innerHTML = '<i data-lucide="send" style="width:18px;height:18px;"></i> Send Message';
    if(window.lucide) lucide.createIcons();
  }
}

// ════════════════════════════════════════════════════════════
// API HELPERS
// ════════════════════════════════════════════════════════════
async function apiPost(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  return res.json();
}

async function apiGet(path) {
  const token = localStorage.getItem('gtc_token');
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return res.json();
}

async function apiPut(path, body) {
  const token = localStorage.getItem('gtc_token');
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(body)
  });
  return res.json();
}

// ════════════════════════════════════════════════════════════
// UI UTILITIES
// ════════════════════════════════════════════════════════════
function el(id)  { return document.getElementById(id); }
function val(id) { return (document.getElementById(id)?.value || ''); }

function showToast(message, type = 'default') {
  const toast = el('toast');
  toast.textContent = message;
  toast.className = 'show';
  if (type === 'success') toast.classList.add('toast-success');
  if (type === 'error')   toast.classList.add('toast-error');
  clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(() => {
    toast.className = '';
  }, 4000);
}

function setLoading(btnId, loading, text) {
  const btn = el(btnId);
  if (!btn) return;
  btn.disabled = loading;
  btn.textContent = text;
}

function formatDate(dateStr) {
  if (!dateStr) return '–';
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatDateTime(dateStr) {
  if (!dateStr) return '–';
  return new Date(dateStr).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

function formatSlot(slot) {
  const map = {
    '9am-12pm': '9:00 AM – 12:00 PM',
    '12pm-3pm': '12:00 PM – 3:00 PM',
    '3pm-6pm':  '3:00 PM – 6:00 PM',
    '6pm-9pm':  '6:00 PM – 9:00 PM'
  };
  return map[slot] || slot || '–';
}

function truncate(str, n) {
  if (!str) return '–';
  return str.length > n ? str.slice(0, n) + '...' : str;
}

function statusBadge(status) {
  const cls = {
    'Pending':          'badge-pending',
    'Accepted':         'badge-accepted',
    'Out for Delivery': 'badge-outfordelivery',
    'Delivered':        'badge-delivered',
    'Rejected':         'badge-rejected'
  };
  return `<span class="badge ${cls[status] || ''}">${status || '–'}</span>`;
}

// ════════════════════════════════════════════════════════════
// GSAP ANIMATIONS
// ════════════════════════════════════════════════════════════
function initScrollAnimations() {
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
  gsap.registerPlugin(ScrollTrigger);

  // ── Navbar shrink on scroll ──────────────────────────────
  ScrollTrigger.create({
    start: 'top -60',
    onEnter:  () => gsap.to('#navbar', { backgroundColor: 'var(--white)', boxShadow: 'var(--shadow)', backdropFilter: 'none', duration: 0.3 }),
    onLeaveBack: () => gsap.to('#navbar', { backgroundColor: 'var(--glass-bg)', boxShadow: 'none', backdropFilter: 'var(--glass-blur)', duration: 0.3 })
  });

  // ── Hero section entrance ────────────────────────────────
  const heroTl = gsap.timeline({ delay: 0.1 });
  heroTl
    .fromTo('.gsap-fade', { opacity: 0, y: 30 }, { opacity: 1, y: 0, stagger: 0.15, duration: 0.6, ease: 'power2.out' })
    .fromTo('.gsap-hero-title', { opacity: 0, scale: 0.95 }, { opacity: 1, scale: 1, duration: 0.8, ease: 'back.out(1.2)' }, '-=0.4')
    .fromTo('.gsap-slide-left', { opacity: 0, x: 50 }, { opacity: 1, x: 0, duration: 0.8, ease: 'power3.out' }, '-=0.6');

  // Animate hero stat counters
  animateCounters();

  // ── Scroll reveals ───────────────────────────────────────
  document.querySelectorAll('.gsap-up').forEach(el => {
    gsap.fromTo(el, { opacity: 0, y: 40 }, {
      scrollTrigger: { trigger: el, start: 'top 85%' },
      opacity: 1, y: 0, duration: 0.7, ease: 'power2.out'
    });
  });

  // ── Staggered Lists ──────────────────────────────────────
  ['.services-grid', '.steps-grid', '.testimonials-grid'].forEach(selector => {
    const parent = document.querySelector(selector);
    if (!parent) return;
    gsap.fromTo(parent.querySelectorAll('.gsap-stagger'), 
      { opacity: 0, y: 30 }, 
      { scrollTrigger: { trigger: parent, start: 'top 80%' }, opacity: 1, y: 0, stagger: 0.15, duration: 0.6, ease: 'power2.out' }
    );
  });
}

// Animate the hero stat numbers counting up from 0
function animateCounters() {
  const counters = [
    { el: '.stat-card:nth-child(1) .num', target: 2500, suffix: '+', label: 'Customers' },
    { el: '.stat-card:nth-child(2) .num', target: 5000, suffix: '+', label: 'Items' },
    { el: '.stat-card:nth-child(3) .num', target: 25,   suffix: '+', label: 'Years' },
    { el: '.stat-card:nth-child(4) .num', target: 4.8,  suffix: '★', label: 'Rating', decimals: 1 }
  ];
  counters.forEach(({ el, target, suffix, decimals }) => {
    const node = document.querySelector(el);
    if (!node) return;
    const obj = { val: 0 };
    gsap.to(obj, {
      val: target, duration: 2, delay: 0.8, ease: 'power1.inOut',
      onUpdate: () => {
        node.textContent = (decimals ? obj.val.toFixed(decimals) : Math.floor(obj.val).toLocaleString('en-IN')) + suffix;
      }
    });
  });
}
