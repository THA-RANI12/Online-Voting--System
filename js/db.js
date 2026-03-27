// js/db.js — Database layer (localStorage) for SaaS Voting Platform

const DB_KEYS = {
    voters:     'saas_v1_voters',
    candidates: 'saas_v1_candidates',
    usedPhones: 'saas_v1_used_phones',
    adminPasscode: 'saas_v1_admin_pass',
    voterLimit: 'saas_v1_voter_limit'
};

function initDB() {
    if (!localStorage.getItem(DB_KEYS.candidates)) {
        localStorage.setItem(DB_KEYS.candidates, JSON.stringify([]));
    }
    if (!localStorage.getItem(DB_KEYS.voters)) {
        localStorage.setItem(DB_KEYS.voters, JSON.stringify([]));
    }
    if (!localStorage.getItem(DB_KEYS.usedPhones)) {
        localStorage.setItem(DB_KEYS.usedPhones, JSON.stringify([]));
    }
    if (!localStorage.getItem(DB_KEYS.voterLimit)) {
        localStorage.setItem(DB_KEYS.voterLimit, '200');
    }
}

// —— Admin Passcode ——
function getAdminPasscode() {
    return localStorage.getItem(DB_KEYS.adminPasscode);
}

function saveAdminPasscode(pass) {
    localStorage.setItem(DB_KEYS.adminPasscode, pass);
}

// —— Voter Limit ——
function getVoterLimit() {
    return parseInt(localStorage.getItem(DB_KEYS.voterLimit) || '200');
}

function saveVoterLimit(limit) {
    localStorage.setItem(DB_KEYS.voterLimit, limit.toString());
}

// —— Candidates ——
function getCandidates() {
    return JSON.parse(localStorage.getItem(DB_KEYS.candidates) || '[]');
}

function saveCandidates(candidates) {
    localStorage.setItem(DB_KEYS.candidates, JSON.stringify(candidates));
}

// —— Voters ——
function getVoters() {
    return JSON.parse(localStorage.getItem(DB_KEYS.voters) || '[]');
}

function saveVoters(voters) {
    localStorage.setItem(DB_KEYS.voters, JSON.stringify(voters));
}

// —— Used Phones ——
function getUsedPhones() {
    return JSON.parse(localStorage.getItem(DB_KEYS.usedPhones) || '[]');
}

function saveUsedPhones(phones) {
    localStorage.setItem(DB_KEYS.usedPhones, JSON.stringify(phones));
}

// Initialize on script load
initDB();
