// js/admin.js - Admin Logic for SaaS Platform

document.addEventListener('DOMContentLoaded', () => {
    // Check if passcode is set
    if (!getAdminPasscode()) {
        showPasscodeSetup();
    } else if (sessionStorage.getItem('saasAdminAuth') === '1') {
        unlockDashboard();
    }
});

function showPasscodeSetup() {
    document.getElementById('loginTitle').textContent = "Set Admin Passcode";
    document.getElementById('loginSubtitle').textContent = "Since this is your first time, please set a secure passcode to protect the dashboard.";
    document.getElementById('confirmPassWrap').style.display = 'block';
    document.getElementById('loginBtn').textContent = "Set Passcode & Unlock";
}

function checkAdminPassword() {
    const p = document.getElementById('adminPass').value;
    const confirm = document.getElementById('adminPassConfirm').value;
    const err = document.getElementById('adminErr');
    err.style.display = 'none';

    // Setup mode logic
    if (!getAdminPasscode()) {
        if (p.length < 4) {
            err.textContent = "Passcode must be at least 4 characters.";
            err.style.display = 'block';
            return;
        }
        if (p !== confirm) {
            err.textContent = "Passcodes do not match.";
            err.style.display = 'block';
            return;
        }
        saveAdminPasscode(p);
        sessionStorage.setItem('saasAdminAuth', '1');
        unlockDashboard();
        return;
    }

    // Regular login logic
    if (p === getAdminPasscode()) {
        sessionStorage.setItem('saasAdminAuth', '1');
        unlockDashboard();
    } else {
        err.style.display = 'block';
        err.textContent = "Incorrect password.";
        document.getElementById('adminPass').value = '';
    }
}

function unlockDashboard() {
    document.getElementById('loginOverlay').style.display = 'none';
    const main = document.getElementById('adminDashboard');
    main.style.display = 'flex';
    setTimeout(() => main.style.opacity = '1', 50);
    
    // Set initial value for voter limit input
    document.getElementById('voterLimitInput').value = getVoterLimit();
    
    loadDashboardStats();
    renderCandidateList();
}

function updateVoterLimit() {
    const val = parseInt(document.getElementById('voterLimitInput').value);
    const msg = document.getElementById('settingsMsg');
    
    if (isNaN(val) || val < 200) {
        alert("Please enter a valid number (minimum 200).");
        return;
    }
    
    saveVoterLimit(val);
    msg.style.display = 'block';
    setTimeout(() => msg.style.display = 'none', 3000);
    loadDashboardStats();
}

function changePasscode() {
    const newP = document.getElementById('newPasscode').value;
    const confirmP = document.getElementById('confirmNewPasscode').value;
    
    if (newP.length < 4) {
        alert("New passcode must be at least 4 characters.");
        return;
    }
    if (newP !== confirmP) {
        alert("Passcodes do not match.");
        return;
    }
    
    saveAdminPasscode(newP);
    alert("Passcode updated successfully! Please log in again with your new code.");
    logoutAdmin();
}

function logoutAdmin() {
    sessionStorage.removeItem('saasAdminAuth');
    window.location.reload();
}

function switchTab(id, btn) {
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    if (id === 'dashboard') loadDashboardStats();
    if (id === 'candidates') renderCandidateList();
}

// —— Overview ——
function loadDashboardStats() {
    const voters = getVoters();
    const cands = getCandidates();
    const used = getUsedPhones().length;

    document.getElementById('statVoters').textContent = voters.length;
    document.getElementById('statVoted').textContent = used;
    document.getElementById('statCands').textContent = cands.length;
}

// —— Candidates CRUD ——
function renderCandidateList() {
    const cands = getCandidates();
    const tbody = document.getElementById('candidatesTbody');
    
    if (cands.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:20px; color:var(--text-dim);">No candidates found.</td></tr>';
        return;
    }

    tbody.innerHTML = cands.map(c => `
        <tr>
            <td style="font-size:24px;">${c.avatar}</td>
            <td style="font-weight:600;">${c.name}</td>
            <td><strong style="color:var(--primary);">${c.votes}</strong></td>
            <td style="text-align:right;">
                <button onclick="editCandidate('${c.id}')" style="background:var(--secondary); color:white; border:none; padding:6px 12px; border-radius:6px; cursor:pointer; font-size:12px; margin-right:4px;">Edit</button>
                <button onclick="deleteCandidate('${c.id}')" style="background:var(--error); color:white; border:none; padding:6px 12px; border-radius:6px; cursor:pointer; font-size:12px;">Delete</button>
            </td>
        </tr>
    `).join('');
}

function saveCandidateForm() {
    const editId = document.getElementById('editCandId').value;
    const name = document.getElementById('candName').value.trim();
    const avatar = document.getElementById('candAvatar').value.trim();
    const err = document.getElementById('candErr');
    err.style.display = 'none';

    if (name.length < 2) { 
        err.textContent = "Name too short."; err.style.display = 'block'; return; 
    }

    let cands = getCandidates();
    
    if (editId) {
        // Edit mode
        const index = cands.findIndex(c => c.id === editId);
        if (index !== -1) {
            cands[index].name = name;
            cands[index].avatar = avatar || '👤';
            saveCandidates(cands);
            cancelEdit(); // Reset form
        }
    } else {
        // Add mode
        if (cands.length >= 8) {
            err.textContent = "Maximum limit of 8 candidates reached."; err.style.display = 'block'; return; 
        }

        const newId = "c" + Date.now();
        cands.push({ id: newId, name: name, avatar: avatar || '👤', votes: 0 });
        saveCandidates(cands);

        // Reset form manually
        document.getElementById('candName').value = '';
        document.getElementById('candAvatar').value = '👤';
    }
    
    renderCandidateList();
    loadDashboardStats();
}

function editCandidate(id) {
    const cands = getCandidates();
    const c = cands.find(c => c.id === id);
    if (!c) return;

    document.getElementById('editCandId').value = c.id;
    document.getElementById('candName').value = c.name;
    document.getElementById('candAvatar').value = c.avatar;
    
    document.getElementById('candFormTitle').textContent = "Edit Candidate";
    document.getElementById('saveCandBtn').textContent = "Update Candidate";
    document.getElementById('cancelEditBtn').style.display = 'inline-flex';
}

function cancelEdit() {
    document.getElementById('editCandId').value = '';
    document.getElementById('candName').value = '';
    document.getElementById('candAvatar').value = '👤';
    
    document.getElementById('candFormTitle').textContent = "Add New Candidate";
    document.getElementById('saveCandBtn').textContent = "+ Add Candidate";
    document.getElementById('cancelEditBtn').style.display = 'none';
}

function deleteCandidate(id) {
    if (!confirm("Delete this candidate? All their specific votes will be lost.")) return;
    
    let cands = getCandidates();
    cands = cands.filter(c => c.id !== id);
    saveCandidates(cands);
    renderCandidateList();
    loadDashboardStats();
}

// —— Controls ——
function resetElection() {
    if (!confirm("Are you absolutely sure you want to completely erase all data? This cannot be undone.")) return;
    
    saveVoters([]);
    saveUsedPhones([]);
    
    let cands = getCandidates();
    cands.forEach(c => c.votes = 0);
    saveCandidates(cands);
    
    alert("Election has been completely zeroed out.");
    loadDashboardStats();
    renderCandidateList();
}

function exportCSV() {
    const voters = getVoters();
    let csv = "Name,Phone,Registered At,Has Voted,Voted At\n";
    
    voters.forEach(v => {
        csv += `"${v.name}","${v.phone}","${v.timestamp || ''}","${v.hasVoted ? 'Yes' : 'No'}","${v.votedAt || ''}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `votepro_voters_export_${new Date().getTime()}.csv`;
    a.click();
}
