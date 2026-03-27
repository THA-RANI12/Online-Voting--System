// js/auth.js - General Registration/Login Logic

function handleRegistration(event) {
    event.preventDefault();

    const nameInput = document.getElementById('voterName').value.trim();
    const phoneInput = document.getElementById('voterPhone').value.trim();
    const btn = document.getElementById('regBtn');
    const err = document.getElementById('authErrMsg');

    err.style.display = 'none';

    // Validation
    if (nameInput.length < 3) {
        return showError("Name must be at least 3 characters long.");
    }
    if (!/^\d{10}$/.test(phoneInput)) {
        return showError("Please enter exactly 10 digits for your phone number.");
    }

    const usedPhones = getUsedPhones();
    const voterLimit = getVoterLimit();
    
    // Check if limit reached
    if (usedPhones.length >= voterLimit) {
        return showError(`Registration closed. Maximum capacity of ${voterLimit} voters has been reached.`);
    }

    // Check if phone has already been used to VOTE
    if (usedPhones.includes(phoneInput)) {
        return showError("This phone number has already cast a vote. Multiple votes are not permitted.");
    }

    // Save voter to database if not already there (for tracking registered vs voted)
    let voters = getVoters();
    const existingVoter = voters.find(v => v.phone === phoneInput);
    if (!existingVoter) {
        voters.push({ name: nameInput, phone: phoneInput, timestamp: new Date().toISOString() });
        saveVoters(voters);
    } else if (existingVoter.name.toLowerCase() !== nameInput.toLowerCase()) {
        // Warn if they use the same phone with a different name
        // (Just a UX choice, we still allow them in but keep original registered name or update it)
        existingVoter.name = nameInput; // update to latest name
        saveVoters(voters);
    }

    // Set session
    sessionStorage.setItem('activeVoter', JSON.stringify({ name: nameInput, phone: phoneInput }));

    // UI Feedback
    btn.textContent = "Verifying...";
    btn.disabled = true;

    // Simulate network delay for SaaS feel
    setTimeout(() => {
        window.location.href = 'voting.html';
    }, 800);
}

function showError(msg) {
    const err = document.getElementById('authErrMsg');
    err.textContent = msg;
    err.style.display = 'block';
    
    // Shake effect
    const form = document.getElementById('loginForm');
    form.style.transform = 'translateX(5px)';
    setTimeout(() => form.style.transform = 'translateX(-5px)', 100);
    setTimeout(() => form.style.transform = 'translateX(5px)', 200);
    setTimeout(() => form.style.transform = 'translateX(0)', 300);
}