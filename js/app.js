/*************************************************************
 * Client-side logic — เรียก Backend ผ่าน fetch() (REST/JSON API)
 * ใช้ได้ทั้งตอน host จริงบน GitHub Pages และตอน preview local
 * (ถ้ายังไม่ตั้งค่า CONFIG.API_URL จะใช้ Mock Data แทนอัตโนมัติ)
 *************************************************************/
let currentUser = { userId: 'guest', displayName: 'ผู้เยี่ยมชม', pictureUrl: '' };
let charts = { status: null, dept: null };

function isApiConfigured() {
  return CONFIG.API_URL && CONFIG.API_URL.indexOf('YOUR_') !== 0;
}
function isLiffConfigured() {
  return CONFIG.LIFF_ID && CONFIG.LIFF_ID.indexOf('YOUR_') !== 0;
}

// ============ MOCK DATA (ใช้เมื่อยังไม่ได้ตั้งค่า API_URL) ============
const MOCK_DEPARTMENTS = ['ฝ่ายวิชาการ','ฝ่ายบัญชีและการเงิน','สาขาวิชาการบัญชี','สาขาวิชาเทคโนโลยีธุรกิจดิจิทัล/สารสนเทศ'];
const MOCK_TECHNICIANS = ['ช่างสมชาย','ช่างวิภา','ช่างประเสริฐ'];
const MOCK_EQUIPMENT   = ['เครื่องปริ้นเตอร์','โปรเจกเตอร์','คอมพิวเตอร์','เครื่องปรับอากาศ'];
const MOCK_REQUESTS = [
  { ticketId:'REQ-20260810101500', date:new Date(2026,7,10), fullName:'สมหญิง ใจดี', department:'ฝ่ายวิชาการ', equipment:'เครื่องปริ้นเตอร์', urgency:'สูง', detail:'พิมพ์งานไม่ออก', status:'รอดำเนินการ', technician:'', imageUrl:'' },
  { ticketId:'REQ-20260809091200', date:new Date(2026,7,9), fullName:'อนันต์ พงษ์', department:'สาขาวิชาการบัญชี', equipment:'โปรเจกเตอร์', urgency:'ปานกลาง', detail:'ภาพเบลอ มืด', status:'เสร็จสิ้น', technician:'ช่างสมชาย', imageUrl:'' },
  { ticketId:'REQ-20260808150000', date:new Date(2026,7,8), fullName:'กมลชนก แสง', department:'ฝ่ายบัญชีและการเงิน', equipment:'คอมพิวเตอร์', urgency:'ปกติ', detail:'เปิดเครื่องไม่ติด', status:'กำลังดำเนินการ', technician:'ช่างวิภา', imageUrl:'' }
];

function mockServer(action, payload) {
  return new Promise((resolve) => {
    setTimeout(() => {
      switch (action) {
        case 'getDashboardData': {
          const stats = { total: MOCK_REQUESTS.length,
            pending: MOCK_REQUESTS.filter(r => r.status !== 'เสร็จสิ้น').length,
            done: MOCK_REQUESTS.filter(r => r.status === 'เสร็จสิ้น').length };
          const byStatus = {}, byDept = {};
          MOCK_REQUESTS.forEach(r => { byStatus[r.status]=(byStatus[r.status]||0)+1; byDept[r.department]=(byDept[r.department]||0)+1; });
          resolve({ requests: MOCK_REQUESTS, stats, byStatus, byDept });
          break;
        }
        case 'getMasterData':
          resolve({ departments: MOCK_DEPARTMENTS, technicians: MOCK_TECHNICIANS, equipment: MOCK_EQUIPMENT, users: [] });
          break;
        case 'submitMaintenanceRequest':
          resolve({ success: true, ticketId: 'REQ-MOCK' + Date.now() });
          break;
        case 'updateRequestStatus':
        case 'addMasterItem':
        case 'deleteMasterItem':
          resolve({ success: true });
          break;
        case 'generateReportPdf':
          resolve({ success: false, error: 'การนำออก PDF ใช้ได้เฉพาะเมื่อเชื่อมต่อ API จริงเท่านั้น (ยังไม่ได้ตั้งค่า CONFIG.API_URL)' });
          break;
        default:
          resolve(null);
      }
    }, 400);
  });
}

// ============ เรียก Backend จริงผ่าน fetch() ============
// ใช้ Content-Type: text/plain เพื่อให้เป็น "simple request" ตามกติกา CORS
// (เลี่ยง preflight OPTIONS ที่ Apps Script เว็บแอปไม่รองรับ)
async function callServer(action, payload) {
  if (!isApiConfigured()) {
    return mockServer(action, payload);
  }
  try {
    const res = await fetch(CONFIG.API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action, payload: payload || {} })
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return await res.json();
  } catch (err) {
    defaultErrorHandler(err);
    throw err;
  }
}

function defaultErrorHandler(err) {
  Swal.fire({ icon: 'error', title: 'เชื่อมต่อ API ไม่ได้', text: err.message || String(err), confirmButtonColor: '#1f9d55' });
}

// ============ LIFF INIT ============
function initLiff() {
  if (typeof liff === 'undefined' || !isLiffConfigured()) { renderGuestUser(); return; }

  liff.init({ liffId: CONFIG.LIFF_ID }).then(() => {
    if (!liff.isLoggedIn()) { liff.login(); return; }
    return liff.getProfile();
  }).then(profile => {
    if (!profile) return;
    currentUser = { userId: profile.userId, displayName: profile.displayName, pictureUrl: profile.pictureUrl };
    document.getElementById('liffDisplayName').textContent = profile.displayName;
    if (profile.pictureUrl) document.getElementById('liffAvatar').src = profile.pictureUrl;
    document.getElementById('fullName').value = profile.displayName;
  }).catch((err) => {
    console.warn('LIFF init failed:', err);
    renderGuestUser();
  });
}

function renderGuestUser() {
  document.getElementById('liffDisplayName').textContent = currentUser.displayName;
}

// ============ TAB NAVIGATION ============
document.querySelectorAll('[data-tab]').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    document.querySelectorAll('[data-tab]').forEach(l => l.classList.remove('active'));
    link.classList.add('active');
    document.querySelectorAll('.tab-pane-view').forEach(p => p.classList.remove('active'));
    document.getElementById('tab-' + link.dataset.tab).classList.add('active');
    if (link.dataset.tab === 'dashboard') loadDashboard();
    if (link.dataset.tab === 'admin') loadAdmin();
  });
});

// ============ ฟอร์มแจ้งซ่อม: อัปโหลดรูปภาพ ============
const uploadBox = document.getElementById('uploadBox');
const imageInput = document.getElementById('imageInput');
const imagePreview = document.getElementById('imagePreview');
const imageBase64Input = document.getElementById('imageBase64');

uploadBox.addEventListener('click', () => imageInput.click());
imageInput.addEventListener('change', () => {
  const file = imageInput.files[0];
  if (!file) return;
  if (file.size > 5 * 1024 * 1024) {
    Swal.fire({ icon: 'warning', title: 'ไฟล์ใหญ่เกินไป', text: 'กรุณาเลือกรูปภาพขนาดไม่เกิน 5MB', confirmButtonColor: '#1f9d55' });
    return;
  }
  const reader = new FileReader();
  reader.onload = (e) => {
    imagePreview.src = e.target.result;
    imagePreview.style.display = 'block';
    imageBase64Input.value = e.target.result;
  };
  reader.readAsDataURL(file);
});

// ============ ฟอร์มแจ้งซ่อม: Submit ============
let isSubmitting = false;
document.getElementById('repairForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  if (isSubmitting) return;

  const formObj = {
    userId: currentUser.userId,
    fullName: document.getElementById('fullName').value.trim(),
    department: document.getElementById('department').value,
    equipment: document.getElementById('equipment').value.trim(),
    urgency: document.getElementById('urgency').value,
    detail: document.getElementById('detail').value.trim(),
    imageBase64: imageBase64Input.value,
    fileName: imageInput.files[0] ? imageInput.files[0].name : ''
  };

  if (!formObj.fullName || !formObj.department || !formObj.equipment || !formObj.detail) {
    Swal.fire({ icon: 'warning', title: 'กรอกข้อมูลไม่ครบ', text: 'กรุณากรอกข้อมูลให้ครบทุกช่อง', confirmButtonColor: '#1f9d55' });
    return;
  }

  isSubmitting = true;
  const btn = document.getElementById('submitBtn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>กำลังส่ง...';

  Swal.fire({ title: 'กำลังบันทึกข้อมูล...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

  try {
    const res = await callServer('submitMaintenanceRequest', formObj);

    if (res && res.success) {
      Swal.fire({
        icon: 'success', title: 'แจ้งซ่อมสำเร็จ!',
        html: 'เลขที่ Ticket ของคุณคือ<br><b style="color:#1f9d55;font-size:1.2rem">' + res.ticketId + '</b>',
        confirmButtonColor: '#1f9d55'
      });
      document.getElementById('repairForm').reset();
      imagePreview.style.display = 'none';
      imageBase64Input.value = '';
      if (currentUser.displayName) document.getElementById('fullName').value = currentUser.displayName;
    } else {
      Swal.fire({ icon: 'error', title: 'ส่งไม่สำเร็จ', text: (res && res.error) || 'กรุณาลองใหม่อีกครั้ง', confirmButtonColor: '#1f9d55' });
    }
  } catch (err) {
    // defaultErrorHandler แสดง alert ให้แล้วใน callServer
  } finally {
    isSubmitting = false;
    btn.disabled = false;
    btn.innerHTML = '<i class="fa-solid fa-paper-plane me-1"></i>ส่งแจ้งซ่อม';
  }
});

// ============ DASHBOARD ============
async function loadDashboard() {
  try {
    const data = await callServer('getDashboardData');
    if (!data) return;
    document.getElementById('statTotal').textContent = data.stats.total;
    document.getElementById('statPending').textContent = data.stats.pending;
    document.getElementById('statDone').textContent = data.stats.done;
    renderStatusChart(data.byStatus);
    renderDeptChart(data.byDept);
    renderRequestTable(data.requests);
  } catch (err) { /* handled in callServer */ }
}

function renderStatusChart(byStatus) {
  const ctx = document.getElementById('chartStatus');
  const labels = Object.keys(byStatus);
  const values = Object.values(byStatus);
  const colors = labels.map(l => l === 'เสร็จสิ้น' ? '#1f9d55' : (l === 'กำลังดำเนินการ' ? '#3b82f6' : '#fd7e14'));
  if (charts.status) charts.status.destroy();
  charts.status = new Chart(ctx, {
    type: 'doughnut',
    data: { labels, datasets: [{ data: values, backgroundColor: colors, borderWidth: 2, borderColor: '#fff' }] },
    options: { plugins: { title: { display: true, text: 'สถานะงานซ่อม', font: { size: 15 } }, legend: { position: 'bottom' } } }
  });
}

function renderDeptChart(byDept) {
  const ctx = document.getElementById('chartDept');
  const labels = Object.keys(byDept);
  const values = Object.values(byDept);
  if (charts.dept) charts.dept.destroy();
  charts.dept = new Chart(ctx, {
    type: 'bar',
    data: { labels, datasets: [{ label: 'จำนวนแจ้งซ่อม', data: values, backgroundColor: '#fd7e14', borderRadius: 6 }] },
    options: {
      plugins: { title: { display: true, text: 'จำนวนซ่อมแยกตามฝ่าย/สาขา', font: { size: 15 } }, legend: { display: false } },
      scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }
    }
  });
}

function urgencyBadge(urgency) { return '<span class="badge-status badge-urgency-' + urgency + '">' + urgency + '</span>'; }
function statusBadge(status) {
  let cls = 'badge-pending';
  if (status === 'เสร็จสิ้น') cls = 'badge-done';
  if (status === 'กำลังดำเนินการ') cls = 'badge-progress';
  return '<span class="badge-status ' + cls + '">' + status + '</span>';
}

function renderRequestTable(requests) {
  const body = document.getElementById('requestTableBody');
  if (!requests.length) { body.innerHTML = '<tr><td colspan="8" class="text-center text-muted py-4">ยังไม่มีรายการแจ้งซ่อม</td></tr>'; return; }
  body.innerHTML = requests.map(r => `
    <tr>
      <td><b>${r.ticketId}</b></td>
      <td>${formatDate(r.date)}</td>
      <td>${r.fullName}</td>
      <td>${r.department}</td>
      <td>${r.equipment}</td>
      <td>${urgencyBadge(r.urgency)}</td>
      <td>${statusBadge(r.status)}</td>
      <td>${r.imageUrl ? '<a href="'+r.imageUrl+'" target="_blank"><i class="fa-solid fa-image text-success"></i></a>' : '-'}</td>
    </tr>`).join('');
}

function formatDate(d) {
  const date = new Date(d);
  if (isNaN(date)) return d;
  return date.toLocaleDateString('th-TH', { day:'2-digit', month:'2-digit', year:'numeric' });
}

// ============ ADMIN ============
let allRequestsCache = [];
let masterDataCache = {};

document.querySelectorAll('#adminSubTabs [data-admin]').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    document.querySelectorAll('#adminSubTabs [data-admin]').forEach(l => l.classList.remove('active'));
    link.classList.add('active');
    document.querySelectorAll('.admin-pane').forEach(p => p.classList.add('d-none'));
    document.getElementById('admin-' + link.dataset.admin).classList.remove('d-none');
  });
});

async function loadAdmin() {
  try {
    const data = await callServer('getDashboardData');
    if (data) { allRequestsCache = data.requests; renderAdminRequests(); }
  } catch (err) { /* handled */ }

  try {
    const data = await callServer('getMasterData');
    if (data) {
      masterDataCache = data;
      renderMasterList('technicianList', data.technicians, 'Technicians');
      renderMasterList('departmentList', data.departments, 'Departments');
      renderMasterList('equipmentList', data.equipment, 'Equipment');
      renderAdminRequests(); // re-render เพื่อให้ dropdown ช่างอัปเดต
    }
  } catch (err) { /* handled */ }
}

function renderAdminRequests() {
  const body = document.getElementById('adminRequestBody');
  if (!allRequestsCache.length) { body.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-3">ไม่มีรายการ</td></tr>'; return; }
  body.innerHTML = allRequestsCache.map(r => `
    <tr>
      <td><b>${r.ticketId}</b></td>
      <td>${r.fullName}</td>
      <td>${r.equipment}</td>
      <td>
        <select class="form-select form-select-sm" data-ticket="${r.ticketId}" data-field="status">
          <option ${r.status==='รอดำเนินการ'?'selected':''}>รอดำเนินการ</option>
          <option ${r.status==='กำลังดำเนินการ'?'selected':''}>กำลังดำเนินการ</option>
          <option ${r.status==='เสร็จสิ้น'?'selected':''}>เสร็จสิ้น</option>
        </select>
      </td>
      <td>
        <select class="form-select form-select-sm" data-ticket="${r.ticketId}" data-field="technician">
          <option value="">-- เลือกช่าง --</option>
          ${(masterDataCache.technicians||[]).map(t => `<option ${t===r.technician?'selected':''}>${t}</option>`).join('')}
        </select>
      </td>
      <td><button class="btn btn-sm btn-brand save-status-btn" data-ticket="${r.ticketId}"><i class="fa-solid fa-floppy-disk"></i></button></td>
    </tr>`).join('');

  document.querySelectorAll('.save-status-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const ticket = btn.dataset.ticket;
      const status = document.querySelector(`select[data-ticket="${ticket}"][data-field="status"]`).value;
      const technician = document.querySelector(`select[data-ticket="${ticket}"][data-field="technician"]`).value;
      try {
        await callServer('updateRequestStatus', { ticketId: ticket, status, technician });
        Swal.fire({ toast:true, position:'top-end', icon:'success', title:'บันทึกสำเร็จ', showConfirmButton:false, timer:1500 });
      } catch (err) { /* handled */ }
    });
  });
}

function renderMasterList(elId, items, sheetName) {
  const el = document.getElementById(elId);
  if (!items.length) { el.innerHTML = '<p class="text-muted small">ยังไม่มีข้อมูล</p>'; return; }
  el.innerHTML = items.map((item, idx) => `
    <div class="master-item">
      <span>${item}</span>
      <button class="btn btn-sm btn-outline-danger del-master-btn" data-sheet="${sheetName}" data-row="${idx+2}">
        <i class="fa-solid fa-trash"></i>
      </button>
    </div>`).join('');

  el.querySelectorAll('.del-master-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      try {
        await callServer('deleteMasterItem', { sheetName: btn.dataset.sheet, rowIndex: parseInt(btn.dataset.row) });
        loadAdmin();
      } catch (err) { /* handled */ }
    });
  });
}

function bindAddMaster(btnId, inputId, sheetName) {
  document.getElementById(btnId).addEventListener('click', async () => {
    const input = document.getElementById(inputId);
    const value = input.value.trim();
    if (!value) return;
    try {
      await callServer('addMasterItem', { sheetName, value });
      input.value = '';
      loadAdmin();
    } catch (err) { /* handled */ }
  });
}
bindAddMaster('addTechnicianBtn', 'newTechnician', 'Technicians');
bindAddMaster('addDepartmentBtn', 'newDepartment', 'Departments');
bindAddMaster('addEquipmentBtn', 'newEquipment', 'Equipment');

// ============ ADMIN: ส่งออก PDF ============
document.getElementById('exportPdfBtn').addEventListener('click', async () => {
  Swal.fire({ title: 'กำลังสร้างรายงาน PDF...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
  try {
    const res = await callServer('generateReportPdf');
    if (res && res.success) {
      const link = document.createElement('a');
      link.href = 'data:application/pdf;base64,' + res.base64;
      link.download = res.fileName;
      link.click();
      Swal.fire({ icon: 'success', title: 'สร้างรายงานสำเร็จ', confirmButtonColor: '#1f9d55' });
    } else {
      Swal.fire({ icon: 'info', title: 'ไม่สามารถสร้าง PDF ได้', text: (res && res.error) || '', confirmButtonColor: '#1f9d55' });
    }
  } catch (err) { /* handled */ }
});

// ============ แจ้งเตือนถ้ายังไม่ได้ตั้งค่า API ============
function showConfigBanner() {
  if (isApiConfigured()) return;
  const banner = document.createElement('div');
  banner.className = 'alert alert-warning text-center mb-0 rounded-0';
  banner.innerHTML = '⚠️ ยังไม่ได้ตั้งค่า <code>CONFIG.API_URL</code> ใน <code>js/config.js</code> — ตอนนี้กำลังแสดงข้อมูลจำลอง (Mock Data) เท่านั้น';
  document.body.prepend(banner);
}

// ============ INIT ============
window.addEventListener('load', () => {
  showConfigBanner();
  initLiff();
  loadDashboard();
});
