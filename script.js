// localStorage helpers
function loadUsers() {
    const raw = localStorage.getItem('users');
    return raw ? JSON.parse(raw) : {};
}

function saveUsers(users) {
    localStorage.setItem('users', JSON.stringify(users));
}

function loadMessages() {
    const raw = localStorage.getItem('localMessages');
    return raw ? JSON.parse(raw) : {};
}

function saveMessages(msgs) {
    localStorage.setItem('localMessages', JSON.stringify(msgs));
}

function loadCurrent() {
    return JSON.parse(localStorage.getItem('currentUser') || 'null');
}

function saveCurrent(u) {
    if (u) localStorage.setItem('currentUser', JSON.stringify(u));
    else localStorage.removeItem('currentUser');
}

// utility
function generateReferralCode(userId) {
    return 'REF_' + userId.substring(0, 8).toUpperCase() + '_' + Math.random().toString(36).substr(2, 5).toUpperCase();
}

// auth logic
function toggleForm() {
    const login = document.getElementById('login-form-container');
    const signup = document.getElementById('signup-form-container');
    login.classList.toggle('active');
    signup.classList.toggle('active');
}

async function init() {
    const current = loadCurrent();
    if (current) {
        showDashboard();
        loadUserTheme();
        showPage('inbox');
    } else {
        document.getElementById('auth-wrapper').style.display = 'block';
    }
}

// signup
if (document.getElementById('signup-form')) {
    document.getElementById('signup-form').addEventListener('submit', e => {
        e.preventDefault();
        const username = document.getElementById('signup-username').value.trim();
        const email = document.getElementById('signup-email').value.trim();
        const password = document.getElementById('signup-password').value;
        const referral = document.getElementById('referral-code').value.trim();
        if (password.length < 6) { alert('Password must be >=6 chars'); return; }
        const users = loadUsers();
        if (users[email]) { alert('Email already registered'); return; }
        const id = 'u_' + Date.now();
        const user = {
            id,
            username,
            email,
            password,
            createdAt: new Date().toISOString(),
            referralCode: generateReferralCode(id),
            referralEarnings: 10,
            referralCount: 0,
            totalBonusRewards: 0,
            referralActive: true,
            themeColor: '#6366f1',
        };
        // handle incoming referral
        if (referral) {
            const found = Object.values(users).find(u => u.referralCode === referral || u.username === referral);
            if (found) {
                found.referralCount = (found.referralCount||0) + 1;
                found.referralEarnings = (found.referralEarnings||0) + 10;
                if (found.referralCount % 15 === 0) {
                    found.totalBonusRewards = (found.totalBonusRewards||0) + 50;
                }
                users[found.email] = found;
                alert('Referral applied!');
            }
        }
        users[email] = user;
        saveUsers(users);
        saveCurrent({ email, username });
        alert('Account created! You earned R10');
        showDashboard();
    });
}

// login
if (document.getElementById('login-form')) {
    document.getElementById('login-form').addEventListener('submit', e => {
        e.preventDefault();
        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;
        const users = loadUsers();
        const user = users[email];
        if (!user || user.password !== password) { alert('Invalid credentials'); return; }
        saveCurrent({ email: user.email, username: user.username });
        showDashboard();
    });
}

function logout() {
    saveCurrent(null);
    location.reload();
}

function showDashboard() {
    document.getElementById('auth-wrapper').style.display = 'none';
    document.getElementById('dashboard-wrapper').style.display = 'block';
}

// nav
function showPage(pageId) {
    const pages = document.querySelectorAll('.page');
    pages.forEach(p => p.classList.remove('active'));
    const sel = document.getElementById(pageId + '-page');
    if (sel) sel.classList.add('active');
    if (pageId === 'inbox') loadInbox();
    if (pageId === 'profile') loadProfile();
    if (pageId === 'referral') loadReferralData();
}

// messaging
function loadInbox() {
    const current = loadCurrent();
    if (!current) return;
    const msgs = loadMessages()[current.username] || [];
    const container = document.getElementById('messages-list');
    container.innerHTML = '';
    if (msgs.length === 0) {
        container.innerHTML = '<p style="text-align:center;color:#999;">No messages yet.</p>';
        return;
    }
    msgs.forEach(m => {
        const card = document.createElement('div');
        card.className = 'message-card';
        const date = new Date(m.timestamp).toLocaleString();
        card.innerHTML = `<p><strong>From:</strong> ${m.from}</p><p><strong>Message:</strong> ${m.text}</p><p class="message-time">${date}</p>`;
        container.appendChild(card);
    });
}

if (document.getElementById('send-form')) {
    document.getElementById('send-form').addEventListener('submit', e => {
        e.preventDefault();
        const recipient = document.getElementById('recipient').value.trim();
        const text = document.getElementById('message').value.trim();
        const users = loadUsers();
        let toUser = Object.values(users).find(u => u.referralCode === recipient || u.username === recipient);
        if (!toUser) { alert('Recipient not found'); return; }
        const msgs = loadMessages();
        if (!msgs[toUser.username]) msgs[toUser.username] = [];
        msgs[toUser.username].push({ from: loadCurrent().username, text, timestamp: new Date().toISOString() });
        saveMessages(msgs);
        alert('Message sent.');
        e.target.reset();
    });
}

// profile & referral
function loadProfile() {
    const cur = loadCurrent();
    if (!cur) return;
    const users = loadUsers();
    const u = users[cur.email];
    if (!u) return;
    document.getElementById('profile-username').textContent = u.username;
    document.getElementById('profile-email').textContent = u.email;
    document.getElementById('profile-earnings').textContent = u.referralEarnings || 0;
    document.getElementById('profile-created').textContent = new Date(u.createdAt).toLocaleDateString();
    const themeInput = document.getElementById('theme-color');
    if (themeInput && u.themeColor) themeInput.value = u.themeColor;
}

function loadReferralData() {
    const cur = loadCurrent();
    if (!cur) return;
    const users = loadUsers();
    const u = users[cur.email];
    const link = window.location.href.split('#')[0];
    document.getElementById('referral-link').value = link + '?ref=' + u.referralCode;
    document.getElementById('recipient-code-display').value = u.referralCode;
}

function copyReferralLink(){
    const el=document.getElementById('referral-link');el.select();document.execCommand('copy');alert('Copied');
}
function copyRecipientCode(){
    const el=document.getElementById('recipient-code-display');el.select();document.execCommand('copy');alert('Copied');
}

// settings
if (document.getElementById('change-password-form')) {
    document.getElementById('change-password-form').addEventListener('submit', e => {
        e.preventDefault();
        const curpass=document.getElementById('current-password').value;
        const newp=document.getElementById('new-password').value;
        const conf=document.getElementById('confirm-password').value;
        if (newp!==conf){alert('Passwords differ');return;}
        const cur = loadCurrent();
        const users=loadUsers();
        const u = users[cur.email];
        if (u.password!==curpass){alert('Current password wrong');return;}
        u.password=newp;users[cur.email]=u;saveUsers(users);alert('Password changed');
        e.target.reset();
    });
}

async function applyTheme(){
    const cur=loadCurrent();if(!cur)return;
    const users=loadUsers();const u=users[cur.email];
    const color=document.getElementById('theme-color').value;
    u.themeColor=color;users[cur.email]=u;saveUsers(users);
    document.documentElement.style.setProperty('--primary-color',color);
    alert('Theme updated');
}

async function loadUserTheme(){
    const cur=loadCurrent();if(!cur)return;
    const users=loadUsers();const u=users[cur.email];
    if (u&&u.themeColor) document.documentElement.style.setProperty('--primary-color',u.themeColor);
}

async function deleteAccount(){
    if(!confirm('Deleting account cannot be undone.'))return;
    const cur=loadCurrent();
    const users=loadUsers();
    delete users[cur.email];
    saveUsers(users);
    saveCurrent(null);
    location.reload();
}

// initialise on load
window.addEventListener('load', init);