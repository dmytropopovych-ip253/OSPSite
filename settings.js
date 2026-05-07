/* ============================================================
     1. State
     2. Toast Notification
     3. Password Visibility Toggle
     4. Password Strength Meter
     5. Avatar Helpers
     6. Avatar File Upload Handler
     7. Save Account Info
     8. Change Password
     9. Delete Account
    10. Navbar & Dropdown
    11. Contacts Modal
    12. Init (DOMContentLoaded)
   ============================================================ */


/* ── 1. State ── */

let currentUser  = null;
let originalLogin = '';
let avatarDataURL = null;


/* ── 2. Toast Notification ── */

function showToast(msg, type = 'success') {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.className   = `toast ${type} show`;
    clearTimeout(t._tid);
    t._tid = setTimeout(() => t.classList.remove('show'), 3500);
}


/* ── 3. Password Visibility Toggle ── */

function togglePw(inputId, btn) {
    const inp    = document.getElementById(inputId);
    const hidden = inp.type === 'password';
    inp.type     = hidden ? 'text' : 'password';
    btn.textContent = hidden ? '🙈' : '👁';
}


/* ── 4. Password Strength Meter ── */

function checkStrength(val) {
    const fill  = document.getElementById('strengthFill');
    const label = document.getElementById('strengthLabel');
    if (!val) { fill.style.width = '0'; label.textContent = ''; return; }

    let score = 0;
    if (val.length >= 8)            score++;
    if (/[A-Z]/.test(val))          score++;
    if (/[0-9]/.test(val))          score++;
    if (/[^A-Za-z0-9]/.test(val))   score++;

    const levels = [
        { w: '20%',  bg: '#e53935', text: '😟 Дуже слабкий'  },
        { w: '40%',  bg: '#ff9800', text: '🤔 Слабкий'        },
        { w: '65%',  bg: '#fdd835', text: '😐 Середній'       },
        { w: '85%',  bg: '#4caf50', text: '😊 Надійний'       },
        { w: '100%', bg: '#1b5e20', text: '💪 Дуже надійний'  },
    ];
    const lv = levels[Math.min(score, 4)];
    fill.style.width      = lv.w;
    fill.style.background = lv.bg;
    label.textContent     = lv.text;
    label.style.color     = lv.bg;
}


/* ── 5. Avatar Helpers ── */

function triggerAvatarUpload() {
    document.getElementById('avatarFileInput').click();
}

function applyAvatar(src) {
    const img = document.getElementById('avatarImg');
    const ini = document.getElementById('avatarInitial');
    img.src              = src;
    img.style.display    = 'block';
    ini.style.display    = 'none';
    document.getElementById('removeAvatarBtn').style.display = 'inline-flex';
    avatarDataURL = src;
}

async function removeAvatar() {
    const img = document.getElementById('avatarImg');
    const ini = document.getElementById('avatarInitial');
    img.src = ''; img.style.display = 'none';
    ini.style.display = '';
    document.getElementById('removeAvatarBtn').style.display = 'none';
    avatarDataURL = null;

    const { error } = await supabaseClient
        .from('accounts')
        .update({ avatar_url: null })
        .eq('login', currentUser.login);

    currentUser.avatar_url = null;
    sessionStorage.setItem('currentUser', JSON.stringify(currentUser));

    if (error) { showToast('❌ Помилка видалення: ' + error.message, 'error'); return; }
    showToast('🗑 Фото видалено');
}


/* ── 6. Avatar File Upload Handler ── */

document.getElementById('avatarFileInput').onchange = async function () {
    const file = this.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { showToast('⚠️ Файл завеликий (макс. 5 МБ)', 'error'); return; }

    showToast('⏳ Завантаження фото...');

    const ext      = file.name.split('.').pop();
    const fileName = `avatar_${currentUser.login}_${Date.now()}.${ext}`;

    // Upload file to storage bucket
    const { error: uploadError } = await supabaseClient
        .storage.from('avatars')
        .upload(fileName, file, { upsert: true, contentType: file.type });

    if (uploadError) { showToast('❌ Помилка завантаження: ' + uploadError.message, 'error'); return; }

    // Get public URL and save to database
    const { data: urlData } = supabaseClient.storage.from('avatars').getPublicUrl(fileName);
    const publicUrl = urlData.publicUrl;

    const { error: dbError } = await supabaseClient
        .from('accounts')
        .update({ avatar_url: publicUrl })
        .eq('login', currentUser.login);

    if (dbError) { showToast('❌ Помилка збереження: ' + dbError.message, 'error'); return; }

    currentUser.avatar_url = publicUrl;
    sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
    avatarDataURL = publicUrl;
    applyAvatar(publicUrl);
    showToast('✅ Фото оновлено!');
};


/* ── 12. Init (DOMContentLoaded) ── */

document.addEventListener('DOMContentLoaded', async () => {
    currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
    if (!currentUser) { window.location.href = 'main.html'; return; }

    originalLogin = currentUser.login;

    // Populate fields
    document.getElementById('setLogin').value = currentUser.login || '';
    document.getElementById('setEmail').value = currentUser.email  || '';
    document.getElementById('avatarInitial').textContent = (currentUser.login || '?')[0].toUpperCase();

    // Load saved avatar from DB
    const { data: accData } = await supabaseClient
        .from('accounts')
        .select('avatar_url')
        .eq('login', currentUser.login)
        .single();

    if (accData && accData.avatar_url) {
        currentUser.avatar_url = accData.avatar_url;
        sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
        applyAvatar(accData.avatar_url);
    }

    // Live avatar initial preview on login input change
    document.getElementById('setLogin').oninput = function () {
        document.getElementById('avatarInitial').textContent = (this.value[0] || '?').toUpperCase();
    };


    /* ── 7. Save Account Info ── */

    document.getElementById('saveAccountBtn').onclick = async () => {
        const btn   = document.getElementById('saveAccountBtn');
        const login = document.getElementById('setLogin').value.trim();
        const email = document.getElementById('setEmail').value.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!login)                          return showToast('⚠️ Логін не може бути порожнім', 'error');
        if (email && !emailRegex.test(email)) return showToast('⚠️ Введіть коректний email', 'error');

        // Check login availability if it changed
        if (login !== originalLogin) {
            const { data: existing } = await supabaseClient.from('accounts').select('login').eq('login', login);
            if (existing && existing.length > 0) return showToast('⚠️ Цей логін вже зайнятий', 'error');
        }

        btn.textContent = '⏳ Збереження...'; btn.disabled = true;
        const { error } = await supabaseClient.from('accounts').update({ login, email }).eq('login', originalLogin);
        btn.textContent = '💾 Зберегти зміни'; btn.disabled = false;

        if (error) return showToast('❌ Помилка: ' + error.message, 'error');

        currentUser.login = login;
        currentUser.email = email;
        sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
        originalLogin = login;
        const lb = document.getElementById('loginBtn');
        if (lb) lb.textContent = login;
        showToast('✅ Зміни збережено!');
    };

    document.getElementById('cancelAccountBtn').onclick = () => {
        document.getElementById('setLogin').value = currentUser.login;
        document.getElementById('setEmail').value = currentUser.email || '';
        showToast('ℹ️ Зміни скасовано');
    };


    /* ── 8. Change Password ── */

    document.getElementById('savePasswordBtn').onclick = async () => {
        const btn     = document.getElementById('savePasswordBtn');
        const current = document.getElementById('currentPassword').value;
        const newPass  = document.getElementById('newPassword').value;
        const confirm  = document.getElementById('confirmPassword').value;

        if (!current || !newPass || !confirm)   return showToast('⚠️ Заповніть всі поля', 'error');
        if (current !== currentUser.password)   return showToast('⚠️ Поточний пароль невірний', 'error');
        if (newPass.length < 6)                 return showToast('⚠️ Новий пароль — мінімум 6 символів', 'error');
        if (newPass !== confirm)                return showToast('⚠️ Паролі не збігаються', 'error');

        btn.textContent = '⏳ Збереження...'; btn.disabled = true;
        const { error } = await supabaseClient.from('accounts').update({ password: newPass }).eq('login', currentUser.login);
        btn.textContent = '🔒 Змінити пароль'; btn.disabled = false;

        if (error) return showToast('❌ Помилка: ' + error.message, 'error');

        currentUser.password = newPass;
        sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
        ['currentPassword', 'newPassword', 'confirmPassword'].forEach(id => { document.getElementById(id).value = ''; });
        checkStrength('');
        showToast('✅ Пароль успішно змінено!');
    };


    /* ── 9. Delete Account ── */

    document.getElementById('deleteAccountBtn').onclick = async () => {
        if (!confirm(`❗ Ви впевнені, що хочете видалити акаунт "${currentUser.login}"?\nЦю дію не можна скасувати.`)) return;

        const { error } = await supabaseClient.from('accounts').delete().eq('login', currentUser.login);
        if (error) return showToast('❌ Помилка: ' + error.message, 'error');

        sessionStorage.removeItem('currentUser');
        window.location.href = 'main.html';
    };


    /* ── 10. Navbar & Dropdown ── */

    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) loginBtn.textContent = currentUser.login;

    const adminPanelLink = document.getElementById('adminPanelLink');
    if (currentUser.is_admin && adminPanelLink) adminPanelLink.style.display = 'block';

    const userDropdown = document.getElementById('userDropdown');
    if (loginBtn && userDropdown) {
        loginBtn.onclick = e => { e.preventDefault(); userDropdown.classList.toggle('active'); };
    }

    document.getElementById('logoutBtn').onclick = () => {
        sessionStorage.removeItem('currentUser');
        window.location.href = 'main.html';
    };


    /* ── 11. Contacts Modal ── */

    const contactsBtn    = document.getElementById('contactsBtn');
    const contactOverlay = document.getElementById('contactOverlay');
    if (contactsBtn) contactsBtn.onclick = e => { e.preventDefault(); contactOverlay.classList.add('active'); };
    document.getElementById('closeContact').onclick = () => contactOverlay.classList.remove('active');

    // Close on backdrop click or outside dropdown
    document.onclick = e => {
        if (e.target === contactOverlay) contactOverlay.classList.remove('active');
        if (userDropdown && loginBtn && !userDropdown.contains(e.target) && e.target !== loginBtn)
            userDropdown.classList.remove('active');
    };


    /* ── Preloader ── */

    const preloader = document.getElementById('site-preloader');
    if (preloader) setTimeout(() => preloader.classList.add('hidden'), 900);

});
