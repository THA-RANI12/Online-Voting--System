// js/vote.js - Voting Logic

let voterSession = null;
let selectedCandidateId = null;
let isLocked = false;

document.addEventListener('DOMContentLoaded', () => {
    // 1. Authenticate check
    const rawSession = sessionStorage.getItem('activeVoter');
    if (!rawSession) {
        window.location.href = 'index.html';
        return;
    }
    voterSession = JSON.parse(rawSession);
    document.getElementById('userInfo').textContent = `👤 ${voterSession.name} (Logout)`;

    // 2. Check if already voted
    const usedPhones = getUsedPhones();
    if (usedPhones.includes(voterSession.phone)) {
        showLockedState("You have already cast your vote securely.");
        return;
    }

    // 3. Render candidates
    renderBallot();
});

function renderBallot() {
    const grid = document.getElementById('candidatesGrid');
    const candidates = getCandidates();

    if (candidates.length === 0) {
        grid.innerHTML = '<p style="text-align:center; color:var(--text-dim); grid-column:1/-1;">No candidates available for this election.</p>';
        return;
    }

    grid.innerHTML = candidates.map(c => `
        <div class="candidate-card" id="card-${c.id}" onclick="selectCandidate('${c.id}')">
            <div class="cand-avatar">${c.avatar || '👤'}</div>
            <div class="cand-name">${c.name}</div>
        </div>
    `).join('');

    // Setup submit button
    const submitBtn = document.getElementById('submitBtn');
    submitBtn.addEventListener('click', castVote);
}

function selectCandidate(id) {
    if (isLocked) return; // Locked

    selectedCandidateId = id;
    
    // UI Update
    document.querySelectorAll('.candidate-card').forEach(c => c.classList.remove('selected'));
    document.getElementById(`card-${id}`).classList.add('selected');

    const submitBtn = document.getElementById('submitBtn');
    submitBtn.disabled = false;
}

function castVote() {
    if (!selectedCandidateId) return;

    if (!confirm("Are you sure? Your vote is final and cannot be changed.")) {
        return;
    }

    const btn = document.getElementById('submitBtn');
    const err = document.getElementById('errMsg');
    btn.disabled = true;
    btn.textContent = 'Processing Vote...';
    err.style.display = 'none';

    // Anti-race condition double check
    let usedPhones = getUsedPhones();
    if (usedPhones.includes(voterSession.phone)) {
        showError("Vote failed: You have already voted from another tab/device.");
        return;
    }

    // 1. Mark phone as used
    usedPhones.push(voterSession.phone);
    saveUsedPhones(usedPhones);

    // 2. Add to candidates tally
    let candidates = getCandidates();
    const candIndex = candidates.findIndex(c => c.id === selectedCandidateId);
    if (candIndex !== -1) {
        candidates[candIndex].votes += 1;
        saveCandidates(candidates);
    }

    // 3. Update voter status in history
    let voters = getVoters();
    const voterRecord = voters.find(v => v.phone === voterSession.phone);
    if (voterRecord) {
        voterRecord.hasVoted = true;
        voterRecord.votedAt = new Date().toISOString();
        saveVoters(voters);
    }

    // 4. Success feedback and redirect
    isLocked = true;
    const succ = document.getElementById('successMsg');
    succ.textContent = 'Vote successfully cast securely! Redirecting to live results...';
    succ.style.display = 'block';

    setTimeout(() => {
        window.location.href = 'results.html';
    }, 1500);
}

function showLockedState(msg) {
    isLocked = true;
    document.getElementById('candidatesGrid').innerHTML = `
        <div style="grid-column:1/-1; text-align:center; padding: 40px;">
            <div style="font-size: 48px; margin-bottom: 20px;">🔒</div>
            <h3 style="color:var(--primary); margin-bottom: 10px;">${msg}</h3>
            <p style="color:var(--text-dim); margin-bottom: 24px;">Thank you for participating in the digital election.</p>
            <button class="btn" style="width: auto;" onclick="window.location.href='results.html'">View Live Results →</button>
        </div>
    `;
    document.getElementById('submitBtn').style.display = 'none';
}

function showError(msg) {
    const err = document.getElementById('errMsg');
    err.textContent = msg;
    err.style.display = 'block';
    document.getElementById('submitBtn').disabled = false;
    document.getElementById('submitBtn').textContent = 'Cast Official Vote →';
}

function logout() {
    sessionStorage.removeItem('activeVoter');
    window.location.href = 'index.html';
}
