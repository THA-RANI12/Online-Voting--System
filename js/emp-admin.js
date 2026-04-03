// js/emp-admin.js — Employee Management Admin Logic

/* ── Boot ──────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
    if (!getEmpAdminPasscode()) {
        showEmpPasscodeSetup();
    } else if (sessionStorage.getItem('empAdminAuth') === '1') {
        unlockEmpDashboard();
    }
});

function showEmpPasscodeSetup() {
    document.getElementById('empLoginTitle').textContent    = 'Set Admin Passcode';
    document.getElementById('empLoginSubtitle').textContent = 'First time setup — create a secure passcode to protect this dashboard.';
    document.getElementById('empConfirmWrap').style.display = 'block';
    document.getElementById('empLoginBtn').textContent      = 'Set Passcode & Unlock';
}

/* ── Login / Auth ──────────────────────────────────────── */
function checkEmpAdminPassword() {
    const p       = document.getElementById('empAdminPass').value;
    const confirm = document.getElementById('empAdminPassConfirm').value;
    const err     = document.getElementById('empAdminErr');
    err.style.display = 'none';

    if (!getEmpAdminPasscode()) {
        if (p.length < 4) {
            showErr(err, 'Passcode must be at least 4 characters.'); return;
        }
        if (p !== confirm) {
            showErr(err, 'Passcodes do not match.'); return;
        }
        saveEmpAdminPasscode(p);
        sessionStorage.setItem('empAdminAuth', '1');
        unlockEmpDashboard();
        return;
    }

    if (p === getEmpAdminPasscode()) {
        sessionStorage.setItem('empAdminAuth', '1');
        unlockEmpDashboard();
    } else {
        showErr(err, 'Incorrect passcode.');
        document.getElementById('empAdminPass').value = '';
    }
}

function unlockEmpDashboard() {
    document.getElementById('empLoginOverlay').style.display = 'none';
    const dash = document.getElementById('empDashboard');
    dash.style.display = 'flex';
    setTimeout(() => dash.style.opacity = '1', 50);

    loadSettings();
    loadDashboardStats();
    renderEmployeeTable();
}

function logoutEmpAdmin() {
    sessionStorage.removeItem('empAdminAuth');
    window.location.reload();
}

function resetEmpPasscode() {
    if (!confirm('This will erase the saved admin passcode and log you out. Continue?')) return;
    localStorage.removeItem('emp_v1_admin_pass');
    sessionStorage.removeItem('empAdminAuth');
    window.location.reload();
}

/* ── Tab Switching ─────────────────────────────────────── */
function switchEmpTab(id, btn) {
    document.querySelectorAll('.emp-tab').forEach(c => c.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    if (id === 'empTabDashboard')  { loadDashboardStats(); }
    if (id === 'empTabEmployees')  { renderEmployeeTable(); }
    if (id === 'empTabSettings')   { loadSettings(); }
}

/* ── Dashboard Stats ───────────────────────────────────── */
function loadDashboardStats() {
    const emps = getEmployees();
    document.getElementById('statTotal').textContent = emps.length;

    // "Recently Added" = added within last 7 days
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const recent = emps.filter(e => (e.addedAt || 0) > cutoff).length;
    document.getElementById('statRecent').textContent = recent;

    // Current ID format
    const fmt = getEmpIdFormat();
    document.getElementById('statFormat').textContent = fmt.example;
}

/* ── Employee CRUD ─────────────────────────────────────── */
let editingEmpId = null;

function saveEmployeeForm() {
    const idVal  = document.getElementById('empIdInput').value.trim().toUpperCase();
    const name   = document.getElementById('empNameInput').value.trim();
    const err    = document.getElementById('empFormErr');
    err.style.display = 'none';

    // Validate name
    if (!name) {
        showErr(err, 'Employee Name cannot be empty.'); return;
    }

    // Validate ID format
    const regex = buildEmpIdRegex();
    if (!regex.test(idVal)) {
        const fmt = getEmpIdFormat();
        showErr(err, `Employee ID must match format: ${fmt.prefix}${'0'.repeat(fmt.digits - 1)}1 (e.g. ${fmt.example})`);
        return;
    }

    let emps = getEmployees();

    if (editingEmpId) {
        // Edit mode — ID uniqueness check (exclude self)
        const duplicate = emps.find(e => e.id === idVal && e.id !== editingEmpId);
        if (duplicate) { showErr(err, 'Employee ID already exists.'); return; }

        const idx = emps.findIndex(e => e.id === editingEmpId);
        if (idx !== -1) {
            emps[idx].id   = idVal;
            emps[idx].name = name;
        }
        toast('✅ Employee updated successfully!');
        cancelEmpEdit();
    } else {
        // Add mode — must be unique
        if (emps.find(e => e.id === idVal)) {
            showErr(err, 'Employee ID already exists. Each employee must have a unique ID.'); return;
        }
        emps.push({ id: idVal, name, addedAt: Date.now() });
        toast('✅ Employee added successfully!');

        // Reset form
        document.getElementById('empIdInput').value   = '';
        document.getElementById('empNameInput').value = '';
    }

    saveEmployees(emps);
    renderEmployeeTable();
    loadDashboardStats();
}

function editEmployee(id) {
    const emps = getEmployees();
    const emp  = emps.find(e => e.id === id);
    if (!emp) return;

    editingEmpId = id;
    document.getElementById('empIdInput').value   = emp.id;
    document.getElementById('empNameInput').value = emp.name;

    document.getElementById('empFormTitle').textContent       = '✏️ Edit Employee';
    document.getElementById('empSaveBtn').textContent         = 'Update Employee';
    document.getElementById('empCancelEditBtn').style.display = 'inline-flex';
    document.getElementById('empIdInput').focus();
}

function cancelEmpEdit() {
    editingEmpId = null;
    document.getElementById('empIdInput').value   = '';
    document.getElementById('empNameInput').value = '';
    document.getElementById('empFormTitle').textContent       = '➕ Add New Employee';
    document.getElementById('empSaveBtn').textContent         = 'Add Employee';
    document.getElementById('empCancelEditBtn').style.display = 'none';
    document.getElementById('empFormErr').style.display       = 'none';
}

function deleteEmployee(id) {
    if (!confirm(`Delete employee "${id}"? This action cannot be undone.`)) return;
    let emps = getEmployees().filter(e => e.id !== id);
    saveEmployees(emps);
    renderEmployeeTable();
    loadDashboardStats();
    toast('🗑️ Employee deleted.');
}

/* ── Search / Filter ───────────────────────────────────── */
function filterEmployees() {
    const q = document.getElementById('empSearch').value.trim().toLowerCase();
    renderEmployeeTable(q);
}

function clearSearch() {
    document.getElementById('empSearch').value = '';
    renderEmployeeTable();
}

/* ── Render Table ──────────────────────────────────────── */
function renderEmployeeTable(query = '') {
    let emps = getEmployees();

    if (query) {
        emps = emps.filter(e =>
            e.id.toLowerCase().includes(query) ||
            e.name.toLowerCase().includes(query)
        );
    }

    const tbody  = document.getElementById('empTbody');
    const notice = document.getElementById('empEmptyNotice');

    if (emps.length === 0) {
        tbody.innerHTML = '';
        notice.style.display = 'block';
        notice.textContent   = query
            ? `No employees match "${query}".`
            : 'No employees yet. Add one using the form above.';
        return;
    }

    notice.style.display = 'none';
    tbody.innerHTML = emps.map((e, i) => `
        <tr>
            <td style="color:var(--text-dim); font-size:13px;">${i + 1}</td>
            <td>
                <span class="emp-id-badge">${e.id}</span>
            </td>
            <td style="font-weight:600;">${e.name}</td>
            <td style="color:var(--text-dim); font-size:13px;">
                ${e.addedAt ? new Date(e.addedAt).toLocaleDateString('en-IN', {day:'2-digit', month:'short', year:'numeric'}) : '—'}
            </td>
            <td style="text-align:right;">
                <button onclick="editEmployee('${e.id}')" class="tbl-btn edit-btn">✏️ Edit</button>
                <button onclick="deleteEmployee('${e.id}')" class="tbl-btn del-btn">🗑️ Delete</button>
            </td>
        </tr>
    `).join('');
}

/* ── Settings ──────────────────────────────────────────── */
function loadSettings() {
    const fmt = getEmpIdFormat();
    document.getElementById('settingsPrefix').value = fmt.prefix;
    document.getElementById('settingsDigits').value = fmt.digits;
    updateFormatPreview();

    document.getElementById('newEmpPasscode').value    = '';
    document.getElementById('confirmEmpPasscode').value = '';
}

function updateFormatPreview() {
    const prefix = (document.getElementById('settingsPrefix').value || 'EMP').toUpperCase();
    const digits = parseInt(document.getElementById('settingsDigits').value) || 3;
    const sample = prefix + '1'.padStart(digits, '0');
    document.getElementById('formatPreview').textContent = sample;
    document.getElementById('empIdInput') &&
        (document.getElementById('empIdInput').placeholder = `e.g. ${sample}`);
}

function saveIdFormatSettings() {
    const prefix = document.getElementById('settingsPrefix').value.trim().toUpperCase();
    const digits  = parseInt(document.getElementById('settingsDigits').value);
    const msg     = document.getElementById('settingsMsg');

    if (!prefix || !/^[A-Z]+$/.test(prefix)) {
        alert('Prefix must contain only letters (A–Z).'); return;
    }
    if (isNaN(digits) || digits < 1 || digits > 6) {
        alert('Number of digits must be between 1 and 6.'); return;
    }

    saveEmpIdFormat({ prefix, digits });
    updateFormatPreview();
    showMsg(msg, '✅ ID Format saved! New employees must use the updated format.', 'success');
    loadDashboardStats();
}

function changeEmpPasscode() {
    const newP    = document.getElementById('newEmpPasscode').value;
    const confirm = document.getElementById('confirmEmpPasscode').value;
    if (newP.length < 4) { alert('Passcode must be at least 4 characters.'); return; }
    if (newP !== confirm) { alert('Passcodes do not match.'); return; }
    saveEmpAdminPasscode(newP);
    alert('Passcode updated! Please log in again.');
    logoutEmpAdmin();
}

function resetAllEmployees() {
    if (!confirm('⚠️ This will permanently delete ALL employee records. Are you absolutely sure?')) return;
    saveEmployees([]);
    renderEmployeeTable();
    loadDashboardStats();
    toast('🗑️ All employee records cleared.');
}

/* ── Export CSV ────────────────────────────────────────── */
function exportEmpCSV() {
    const emps = getEmployees();
    if (emps.length === 0) { toast('⚠️ No employee data to export.'); return; }

    let csv = 'Employee ID,Employee Name,Date Added\n';
    emps.forEach(e => {
        const date = e.addedAt ? new Date(e.addedAt).toLocaleDateString() : '';
        csv += `"${e.id}","${e.name}","${date}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `employees_export_${Date.now()}.csv`; a.click();
    toast('📥 CSV exported!');
}

/* ── Helpers ───────────────────────────────────────────── */
function showErr(el, msg) {
    el.textContent     = msg;
    el.style.display   = 'block';
}

function showMsg(el, msg, type = 'success') {
    el.textContent   = msg;
    el.className     = `msg ${type}`;
    el.style.display = 'block';
    setTimeout(() => el.style.display = 'none', 4000);
}

function toast(msg) {
    let t = document.getElementById('empToast');
    if (!t) {
        t = document.createElement('div');
        t.id = 'empToast';
        t.className = 'toast';
        document.body.appendChild(t);
    }
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3000);
}
