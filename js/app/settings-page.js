/* ============================================================
   js/settings-page.js — Налаштування акаунту (Supabase Auth)
   ============================================================ */

import {
    apiFetchAccountByLogin, apiUpdateAccount,
    apiDeleteAccount, apiUploadAvatar, apiFetchAccounts,
} from '../services/api.js';
import { supabaseClient }                                     from '../supabase-client.js';
import { isValidEmail }                                       from '../utils.js';
import { applyAvatar, removeAvatarUI, checkStrength, togglePw, triggerAvatarUpload, showToast } from '../ui/index.js';
import { syncCurrentUser }                                    from './auth.js';

export async function initSettingsPage() {
    // Виставляємо на window, бо HTML викликає їх через inline onclick/oninput
    window.togglePw      = togglePw;
    window.checkStrength = checkStrength;
    window.triggerAvatarUpload = triggerAvatarUpload;
    let currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
    if (!currentUser) { window.location.href = 'index.html'; return; }

    // Завжди синхронізуємо з Supabase Auth при вході на сторінку
    currentUser = await syncCurrentUser();
    if (!currentUser) { window.location.href = 'index.html'; return; }

    let originalLogin = currentUser.login;

    document.getElementById('setLogin').value = currentUser.login || '';
    document.getElementById('setEmail').value = currentUser.email  || '';
    document.getElementById('avatarInitial').textContent = (currentUser.login || '?')[0].toUpperCase();

    if (currentUser.avatar_url) applyAvatar(currentUser.avatar_url);

    document.getElementById('setLogin').oninput = function () {
        document.getElementById('avatarInitial').textContent = (this.value[0] || '?').toUpperCase();
    };

    /* ── Аватар ── */

    document.getElementById('avatarFileInput').onchange = async function () {
        const file = this.files[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) { showToast('⚠️ Файл завеликий (макс. 5 МБ)', 'error'); return; }
        showToast('⏳ Завантаження фото...');
        const { url, error: uploadError } = await apiUploadAvatar(currentUser.login, file);
        if (uploadError) { showToast('❌ Помилка завантаження: ' + uploadError.message, 'error'); return; }
        const dbError = await apiUpdateAccount(currentUser.login, { avatar_url: url });
        if (dbError) { showToast('❌ Помилка збереження: ' + dbError.message, 'error'); return; }
        currentUser.avatar_url = url;
        sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
        applyAvatar(url);
        showToast('✅ Фото оновлено!');
    };

    window.removeAvatar = async function () {
        removeAvatarUI();
        const error = await apiUpdateAccount(currentUser.login, { avatar_url: null });
        currentUser.avatar_url = null;
        sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
        if (error) { showToast('❌ Помилка видалення: ' + error.message, 'error'); return; }
        showToast('🗑 Фото видалено');
    };

    /* ── Збереження даних акаунту (логін / email) ── */

    document.getElementById('saveAccountBtn').onclick = async () => {
        const btn   = document.getElementById('saveAccountBtn');
        const login = document.getElementById('setLogin').value.trim();
        const email = document.getElementById('setEmail').value.trim();

        if (!login)                        return showToast('⚠️ Логін не може бути порожнім', 'error');
        if (email && !isValidEmail(email)) return showToast('⚠️ Введіть коректний email', 'error');

        if (login !== originalLogin) {
            const all = await apiFetchAccounts();
            if (all.find(a => a.login === login)) return showToast('⚠️ Цей логін вже зайнятий', 'error');
        }

        btn.textContent = '⏳ Збереження...'; btn.disabled = true;

        // Оновлюємо профіль
        const profileError = await apiUpdateAccount(originalLogin, { login, email });

        // Якщо email змінився — оновлюємо і в Supabase Auth
        if (!profileError && email !== currentUser.email) {
            const { error: authError } = await supabaseClient.auth.updateUser({ email });
            if (authError) {
                btn.textContent = '💾 Зберегти зміни'; btn.disabled = false;
                return showToast('❌ Помилка зміни email: ' + authError.message, 'error');
            }
        }

        btn.textContent = '💾 Зберегти зміни'; btn.disabled = false;
        if (profileError) return showToast('❌ Помилка: ' + profileError.message, 'error');

        currentUser.login = login; currentUser.email = email;
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

    /* ── Зміна пароля ── */

    const savePasswordBtn  = document.getElementById('savePasswordBtn');
    const currentPassInput = document.getElementById('currentPassword');
    const newPasswordInput = document.getElementById('newPassword');
    const confirmPassInput = document.getElementById('confirmPassword');

    // Вмикає/вимикає кнопку залежно від стану полів
    function updateSavePasswordBtn() {
        const currentFilled  = currentPassInput && currentPassInput.value.length > 0;
        const newPass        = newPasswordInput ? newPasswordInput.value : '';
        const confirmPass    = confirmPassInput ? confirmPassInput.value : '';
        const passwordsMatch = newPass.length > 0 && newPass === confirmPass;
        savePasswordBtn.disabled = !(currentFilled && passwordsMatch);
    }

    if (newPasswordInput) {
        newPasswordInput.addEventListener('input', e => {
            checkStrength(e.target.value);
            updateSavePasswordBtn();
        });
    }
    if (currentPassInput) currentPassInput.addEventListener('input', updateSavePasswordBtn);
    if (confirmPassInput)  confirmPassInput.addEventListener('input', updateSavePasswordBtn);

    // Встановлюємо початковий стан — кнопка заблокована
    updateSavePasswordBtn();
    savePasswordBtn.disabled = true;
    savePasswordBtn.style.opacity = '0.5';
    savePasswordBtn.style.cursor = 'not-allowed';

    function validatePasswordBtn() {
        const ok = currentPassInput?.value.length > 0 &&
                   newPasswordInput?.value.length > 0 &&
                   newPasswordInput?.value === confirmPassInput?.value;
        savePasswordBtn.disabled = !ok;
        savePasswordBtn.style.opacity = ok ? '1' : '0.5';
        savePasswordBtn.style.cursor = ok ? 'pointer' : 'not-allowed';
    }

    currentPassInput?.addEventListener('input', validatePasswordBtn);
    newPasswordInput?.addEventListener('input', validatePasswordBtn);
    confirmPassInput?.addEventListener('input', validatePasswordBtn);
    savePasswordBtn.onclick = async () => {
        const btn     = savePasswordBtn;
        const newPass = document.getElementById('newPassword').value;
        const confirm = document.getElementById('confirmPassword').value;

        // Supabase Auth не дозволяє перевірити поточний пароль на клієнті
        // Поле currentPassword залишаємо для UX, але перевірку робить Supabase при signIn
        if (!newPass || !confirm)   return showToast('⚠️ Заповніть поля пароля', 'error');
        if (newPass.length < 6)     return showToast('⚠️ Мінімум 6 символів', 'error');
        if (newPass !== confirm)    return showToast('⚠️ Паролі не збігаються', 'error');

        btn.textContent = '⏳ Збереження...'; btn.disabled = true;
        const { error } = await supabaseClient.auth.updateUser({ password: newPass });
        btn.textContent = '🔒 Змінити пароль'; btn.disabled = false;

        if (error) return showToast('❌ Помилка: ' + error.message, 'error');

        showToast('✅ Пароль змінено! Виконується вихід...');
        setTimeout(async () => {
            await supabaseClient.auth.signOut({ scope: 'local' });
            sessionStorage.removeItem('currentUser');
            window.location.href = 'index.html';
        }, 1500);
    };

    /* ── Видалення акаунту ── */

    document.getElementById('deleteAccountBtn').onclick = async () => {
        if (!confirm(`❗ Видалити акаунт "${currentUser.login}"? Цю дію не можна скасувати.`)) return;
        // Видаляємо профіль (auth.users — каскадно або через Edge Function)
        const error = await apiDeleteAccount(currentUser.login);
        if (error) return showToast('❌ Помилка: ' + error.message, 'error');
        await supabaseClient.auth.signOut();
        sessionStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    };

    /* ── Navbar ── */

    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) loginBtn.textContent = currentUser.login;
    const adminPanelLink = document.getElementById('adminPanelLink');
    if (currentUser.is_admin && adminPanelLink) adminPanelLink.style.display = 'block';
    const userDropdown = document.getElementById('userDropdown');
    if (loginBtn && userDropdown) {
        loginBtn.onclick = e => { e.preventDefault(); userDropdown.classList.toggle('active'); };
    }
    document.getElementById('logoutBtn').onclick = async () => {
        await supabaseClient.auth.signOut();
        sessionStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    };
    document.onclick = e => {
        if (userDropdown && loginBtn &&
            !userDropdown.contains(e.target) && e.target !== loginBtn) {
            userDropdown.classList.remove('active');
        }
    };

    const preloader = document.getElementById('site-preloader');
    if (preloader) setTimeout(() => preloader.classList.add('hidden'), 900);
}
