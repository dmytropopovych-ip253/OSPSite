/* ============================================================
   js/settings-page.js — Сторінка налаштувань акаунту
   ============================================================
   Відповідає за:
     - завантаження та збереження даних профілю (логін, email)
     - зміну пароля
     - завантаження/видалення аватара
     - видалення акаунту
   Залежності:
     - api.js → apiFetchAccountByLogin, apiUpdateAccount,
                apiDeleteAccount, apiUploadAvatar, apiFetchAccounts
     - utils.js → isValidEmail
     - ui.js    → applyAvatar, removeAvatarUI, checkStrength, showToast
   ============================================================ */

import {
    apiFetchAccountByLogin, apiUpdateAccount,
    apiDeleteAccount, apiUploadAvatar, apiFetchAccounts,
} from '../services/api.js';
import { isValidEmail }                               from '../utils.js';
import { applyAvatar, removeAvatarUI, checkStrength, showToast } from '../ui/index.js';

export async function initSettingsPage() {
    let currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
    if (!currentUser) { window.location.href = 'main.html'; return; }

    let originalLogin = currentUser.login;

    document.getElementById('setLogin').value = currentUser.login || '';
    document.getElementById('setEmail').value = currentUser.email  || '';
    document.getElementById('avatarInitial').textContent = (currentUser.login || '?')[0].toUpperCase();

    // Завантажити актуальний аватар з БД
    const accData = await apiFetchAccountByLogin(currentUser.login);
    if (accData?.avatar_url) {
        currentUser.avatar_url = accData.avatar_url;
        sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
        applyAvatar(accData.avatar_url);
    }

    // Оновлення ініціалу при зміні логіну
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

    /* ── Збереження даних акаунту ── */

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
        const error = await apiUpdateAccount(originalLogin, { login, email });
        btn.textContent = '💾 Зберегти зміни'; btn.disabled = false;

        if (error) return showToast('❌ Помилка: ' + error.message, 'error');
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

    const newPasswordInput = document.getElementById('newPassword');
    if (newPasswordInput) {
        newPasswordInput.addEventListener('input', e => checkStrength(e.target.value));
    }

    document.getElementById('savePasswordBtn').onclick = async () => {
        const btn     = document.getElementById('savePasswordBtn');
        const current = document.getElementById('currentPassword').value;
        const newPass = document.getElementById('newPassword').value;
        const confirm = document.getElementById('confirmPassword').value;

        if (!current || !newPass || !confirm) return showToast('⚠️ Заповніть всі поля', 'error');
        if (current !== currentUser.password)  return showToast('⚠️ Поточний пароль невірний', 'error');
        if (newPass.length < 6)               return showToast('⚠️ Новий пароль — мінімум 6 символів', 'error');
        if (newPass !== confirm)              return showToast('⚠️ Паролі не збігаються', 'error');

        btn.textContent = '⏳ Збереження...'; btn.disabled = true;
        const error = await apiUpdateAccount(currentUser.login, { password: newPass });
        btn.textContent = '🔒 Змінити пароль'; btn.disabled = false;

        if (error) return showToast('❌ Помилка: ' + error.message, 'error');
        currentUser.password = newPass;
        sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
        ['currentPassword', 'newPassword', 'confirmPassword'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = '';
        });
        checkStrength('');
        showToast('✅ Пароль успішно змінено!');
    };

    /* ── Видалення акаунту ── */

    document.getElementById('deleteAccountBtn').onclick = async () => {
        if (!confirm(`❗ Ви впевнені, що хочете видалити акаунт "${currentUser.login}"?\nЦю дію не можна скасувати.`)) return;
        const error = await apiDeleteAccount(currentUser.login);
        if (error) return showToast('❌ Помилка: ' + error.message, 'error');
        sessionStorage.removeItem('currentUser');
        window.location.href = 'main.html';
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
    document.getElementById('logoutBtn').onclick = () => {
        sessionStorage.removeItem('currentUser');
        window.location.href = 'main.html';
    };
    document.onclick = e => {
        if (userDropdown && loginBtn &&
            !userDropdown.contains(e.target) && e.target !== loginBtn) {
            userDropdown.classList.remove('active');
        }
    };

    /* ── Preloader ── */

    const preloader = document.getElementById('site-preloader');
    if (preloader) setTimeout(() => preloader.classList.add('hidden'), 900);
}
