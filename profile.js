/* ============================================================
     1. Auth Guard & User Data
     2. Avatar
     3. Role Badge & Stats
     4. Rental Messages
     5. Navbar & Dropdown
     6. Contacts Modal
     7. Init
   ============================================================ */

document.addEventListener('DOMContentLoaded', async () => {

/* ── 1. Auth Guard & User Data ── */

const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
if (!currentUser) { window.location.href = 'main.html'; return; }

document.getElementById('profileUsername').textContent = currentUser.login;
document.getElementById('profileEmail').textContent    = currentUser.email || 'Email не вказано';

const initial = currentUser.login ? currentUser.login[0].toUpperCase() : '?';
document.getElementById('profileAvatarInitial').textContent = initial;


/* ── 2. Avatar ── */

const { data: accData } = await supabaseClient
    .from('accounts')
    .select('avatar_url')
    .eq('login', currentUser.login)
    .single();

if (accData && accData.avatar_url) {
    const img = document.getElementById('profileAvatarImg');
    img.src = accData.avatar_url;
    img.style.display = 'block';
    document.getElementById('profileAvatarInitial').style.display = 'none';
}


/* ── 3. Role Badge & Stats ── */

const badgeWrap = document.getElementById('profileBadgeWrap');
if (currentUser.is_admin) {
    badgeWrap.innerHTML = '<span class="profile-badge admin">👑 Адміністратор</span>';
    document.getElementById('statRole').textContent = 'Адмін';
} else {
    badgeWrap.innerHTML = '<span class="profile-badge">👤 Орендар</span>';
    document.getElementById('statRole').textContent = 'Юзер';
}


/* ── 4. Rental Messages ── */

const { data: msgs } = await supabaseClient
    .from('rental_messages')
    .select('*')
    .eq('user_login', currentUser.login)
    .order('date', { ascending: false });

const list = msgs || [];
document.getElementById('statMsgCount').textContent = list.length;
document.getElementById('msgBadge').textContent     = list.length;

const msgContainer = document.getElementById('messagesList');

if (list.length === 0) {
    msgContainer.innerHTML = `
        <div class="empty-profile">
            <div class="empty-icon">📭</div>
            <p>Ви ще не надсилали повідомлень по оренді.<br>
               <a href="search.html" style="color:var(--brand);font-weight:600;">Переглянути квартири →</a>
            </p>
        </div>`;
} else {
    // Fetch apartment titles for all referenced apartments
    const aptIds = [...new Set(list.map(m => m.apartment_id).filter(Boolean))];
    let aptsMap  = {};
    if (aptIds.length) {
        const { data: apts } = await supabaseClient.from('apartments').select('id, title').in('id', aptIds);
        (apts || []).forEach(a => aptsMap[a.id] = a.title);
    }

    msgContainer.innerHTML = list.map(m => `
        <div class="rental-msg-item">
            <div class="msg-item-top">
                <div class="msg-apt-title">
                    🏠 ${aptsMap[m.apartment_id] || 'Квартира'}
                    <span class="msg-type-tag">Оренда</span>
                    ${m.apartment_id ? `<a href="apartment.html?id=${m.apartment_id}">Переглянути →</a>` : ''}
                </div>
                <span class="msg-date">${m.date || ''}</span>
            </div>
            <div class="msg-body">${m.message}</div>
        </div>
    `).join('');
}

// Logout button inside profile card
document.getElementById('profileLogoutBtn').onclick = () => {
    sessionStorage.removeItem('currentUser');
    window.location.href = 'main.html';
};


/* ── 5. Navbar & Dropdown ── */

const loginBtn = document.getElementById('loginBtn');
if (loginBtn) loginBtn.textContent = currentUser.login;

const adminPanelLink = document.getElementById('adminPanelLink');
if (currentUser.is_admin && adminPanelLink) adminPanelLink.style.display = 'block';

const userDropdown = document.getElementById('userDropdown');
if (loginBtn && userDropdown) {
    loginBtn.onclick = e => { e.preventDefault(); userDropdown.classList.toggle('active'); };
}

const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) logoutBtn.onclick = () => {
    sessionStorage.removeItem('currentUser');
    window.location.href = 'main.html';
};


/* ── 6. Contacts Modal ── */

const contactsBtn    = document.getElementById('contactsBtn');
const contactOverlay = document.getElementById('contactOverlay');
if (contactsBtn) contactsBtn.onclick = e => { e.preventDefault(); contactOverlay.classList.add('active'); };
document.getElementById('closeContact').onclick = () => contactOverlay.classList.remove('active');

// Close modal on backdrop click
document.onclick = e => {
    if (e.target === contactOverlay) contactOverlay.classList.remove('active');
};


/* ── 7. Init ── */

// Preloader
const preloader = document.getElementById('site-preloader');
if (preloader) setTimeout(() => preloader.classList.add('hidden'), 900);
});
