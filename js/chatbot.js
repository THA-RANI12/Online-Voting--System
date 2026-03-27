// js/chatbot.js - Floating Support Chatbot

document.addEventListener('DOMContentLoaded', () => {
    injectChatbot();
});

function injectChatbot() {
    const isAdmin = window.location.pathname.includes('admin.html');
    
    // Define Questions
    const voterQuestions = [
        "How to vote?",
        "Can I vote again?",
        "When will results come?",
        "Is my vote safe?"
    ];
    
    const adminQuestions = [
        "How to set candidates?",
        "How many candidates can be set?",
        "What admin should do in admin page?",
        "Purpose of this website?"
    ];

    const questions = isAdmin ? adminQuestions : voterQuestions;

    // Inject HTML
    const botHTML = `
        <div class="chatbot-fab" id="chatbotFab" onclick="toggleChat()">💬</div>
        <div class="chatbot-window" id="chatbotWindow">
            <div class="chat-header">
                <h3>🤖 ${isAdmin ? 'Admin' : 'VoteBot'} Support</h3>
                <button class="chat-close" onclick="toggleChat()">×</button>
            </div>
            <div class="chat-body" id="chatBody">
                <div class="chat-bubble chat-bot fade-in">
                    Hi! I'm your ${isAdmin ? 'Admin' : 'Election'} Assistant. How can I help you today?
                </div>
                <!-- Smart Replies UI -->
                <div class="chat-options" id="chatOptions">
                    ${questions.map(q => `<button class="chat-option-btn" onclick="sendQuery('${q}')">${q}</button>`).join('')}
                </div>
            </div>
        </div>
    `;
    
    const div = document.createElement('div');
    div.innerHTML = botHTML;
    document.body.appendChild(div);
}

let chatOpen = false;

window.toggleChat = function() {
    chatOpen = !chatOpen;
    const win = document.getElementById('chatbotWindow');
    if (chatOpen) {
        win.classList.add('open');
    } else {
        win.classList.remove('open');
    }
}

window.sendQuery = function(query) {
    const body = document.getElementById('chatBody');
    const options = document.getElementById('chatOptions');
    
    if(options) options.style.display = 'none';

    const userMsg = document.createElement('div');
    userMsg.className = 'chat-bubble chat-user delay-1';
    userMsg.textContent = query;
    body.appendChild(userMsg);

    const typingMsg = document.createElement('div');
    typingMsg.className = 'chat-bubble chat-bot delay-1';
    typingMsg.id = 'typingBubble';
    typingMsg.textContent = 'Typing...';
    body.appendChild(typingMsg);

    body.scrollTop = body.scrollHeight;

    setTimeout(() => {
        typingMsg.remove();
        
        const botMsg = document.createElement('div');
        botMsg.className = 'chat-bubble chat-bot delay-1';
        botMsg.innerHTML = getBotReply(query);
        body.appendChild(botMsg);
        
        if(options) {
            options.style.display = 'flex';
            body.appendChild(options);
        }
        body.scrollTop = body.scrollHeight;

    }, 800);
}

function getBotReply(q) {
    // Voter Replies
    if (q === 'How to vote?') {
        return "1. Enter your Name and 10-digit Phone on the main page.<br>2. On the ballot, tap your preferred candidate.<br>3. Click 'Submit Vote'. That's it!";
    }
    if (q === 'Can I vote again?') {
        return "No. To ensure fair elections, our system strictly enforces one vote per phone number.";
    }
    if (q === 'When will results come?') {
        return "The results are live! Once you submit your vote, you will be redirected to the public results dashboard.";
    }
    if (q === 'Is my vote safe?') {
        return "Yes 🔒. Your vote is anonymous and stored securely. We only store your phone number to prevent double-voting.";
    }

    // Admin Replies
    if (q === 'How to set candidates?') {
        return "Go to the <b>Candidates</b> tab in the sidebar. Enter the name and an emoji avatar, then click '+ Add Candidate'.";
    }
    if (q === 'How many candidates can be set?') {
        return "You can set up to <b>8 candidates</b> for each election. This keeps the ballot clean and easy for voters.";
    }
    if (q === 'What admin should do in admin page?') {
        return "As an admin, you should:<br>1. Set up your candidates.<br>2. Monitor real-time vote counts.<br>3. Set a voter capacity in <b>Settings</b>.<br>4. Export results to CSV for record keeping.";
    }
    if (q === 'Purpose of this website?') {
        return "This platform is designed to provide a <b>secure, transparent, and user-friendly</b> way to conduct digital elections with real-time result tracking.";
    }

    return "I'm sorry, I didn't quite catch that. Please contact support for more assistance.";
}
