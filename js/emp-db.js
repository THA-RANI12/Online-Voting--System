// js/emp-db.js — Employee Management Data Layer
// All keys prefixed emp_v1_ to avoid collision with voting system

const EMP_KEY       = 'emp_v1_employees';
const EMP_FMT_KEY   = 'emp_v1_id_format';
const EMP_PASS_KEY  = 'emp_v1_admin_pass';

/* ── Employees ─────────────────────────────────────────── */
function getEmployees() {
    return JSON.parse(localStorage.getItem(EMP_KEY) || '[]');
}

function saveEmployees(arr) {
    localStorage.setItem(EMP_KEY, JSON.stringify(arr));
}

/* ── ID Format Config ──────────────────────────────────── */
/**
 * Returns an object: { prefix, digits, example }
 *   prefix  – letters before the number, e.g. "EMP"
 *   digits  – how many numeric digits to pad, e.g. 3 → 001
 *   example – auto-generated demo string, e.g. "EMP001"
 */
function getEmpIdFormat() {
    const raw = localStorage.getItem(EMP_FMT_KEY);
    if (raw) return JSON.parse(raw);
    // Default format
    return { prefix: 'EMP', digits: 3, example: 'EMP001' };
}

function saveEmpIdFormat(fmt) {
    // Regenerate example string
    const num = '1'.padStart(fmt.digits, '0');
    fmt.example = fmt.prefix + num;
    localStorage.setItem(EMP_FMT_KEY, JSON.stringify(fmt));
}

/**
 * Build a human-readable regex description and a RegExp for validation.
 * Rule: must start with the configured prefix (case-insensitive) 
 *       followed by exactly `digits` numeric characters.
 */
function buildEmpIdRegex() {
    const fmt = getEmpIdFormat();
    const escaped = fmt.prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`^${escaped}\\d{${fmt.digits}}$`, 'i');
}

/* ── Admin Passcode ────────────────────────────────────── */
function getEmpAdminPasscode() {
    return localStorage.getItem(EMP_PASS_KEY);
}

function saveEmpAdminPasscode(p) {
    localStorage.setItem(EMP_PASS_KEY, p);
}
