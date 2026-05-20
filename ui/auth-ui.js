/* ============================================================
   js/ui/auth-ui.js — UI-функції авторизації
   ============================================================
   Функції:
     updateAuthUI, setAuthMode, showToast
   Залежності:
     - ../state.js → isRegisterMode, setIsRegisterMode
   ============================================================ */

import { setIsRegisterMode } from '../state.js';

export function updateAuthUI() {
    const currentUser    = JSON.parse(sessionStorage.getItem('currentUser'));
    const loginBtn       = document.getElementById('loginBtn');
    const adminControls  = document.getElementById('adminControls');
    const adminPanelLink = document.getElementById('adminPanelLink');

    if (currentUser) {
        if (loginBtn) { loginBtn.innerText = currentUser.login; loginBtn.href = '#'; }
        const isAdmin = currentUser.is_admin;
        if (adminControls)  adminControls.style.display  = isAdmin ? 'flex'  : 'none';
        if (adminPanelLink) adminPanelLink.style.display = isAdmin ? 'block' : 'none';
    } else {
        if (loginBtn)       loginBtn.innerText           = 'Увійти';
        if (adminControls)  adminControls.style.display  = 'none';
        if (adminPanelLink) adminPanelLink.style.display = 'none';
    }
}

export function setAuthMode(register) {
    setIsRegisterMode(register);
    const modal       = document.getElementById('authModal');
    const signInBtn   = document.getElementById('signInBtn');
    const registerBtn = document.getElementById('registerBtn');
    if (!modal) return;

    if (register) {
        modal.classList.add('register-mode');
        modal.querySelector('h2').innerText = 'Реєстрація';
        const sub = modal.querySelector('.modal-subtitle');
        if (sub) sub.innerText = 'Створіть акаунт безкоштовно';
        if (signInBtn)   signInBtn.style.display   = 'none';
        if (registerBtn) { registerBtn.style.display = 'block'; registerBtn.innerText = 'Зареєструватися'; }
        const toggleEl = modal.querySelector('.auth-toggle-link');
        if (toggleEl) {
            toggleEl.innerHTML = 'Вже є акаунт? <a id="switchToLogin">Увійти</a>';
            const sw = document.getElementById('switchToLogin');
            if (sw) sw.onclick = e => { e.preventDefault(); setAuthMode(false); };
        }
    } else {
        modal.classList.remove('register-mode');
        modal.querySelector('h2').innerText = 'Авторизація';
        const sub = modal.querySelector('.modal-subtitle');
        if (sub) sub.innerText = 'Раді бачити вас знову!';
        if (signInBtn)   { signInBtn.style.display = 'block'; signInBtn.innerText = 'Увійти'; }
        if (registerBtn) registerBtn.style.display = 'none';
        const toggleEl = modal.querySelector('.auth-toggle-link');
        if (toggleEl) {
            toggleEl.innerHTML = 'Немає акаунта? <a id="switchToRegister">Зареєструйтеся</a>';
            const sw = document.getElementById('switchToRegister');
            if (sw) sw.onclick = e => { e.preventDefault(); setAuthMode(true); };
        }
        ['authEmail', 'authLogin', 'authPassword'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = '';
        });
    }
}

export function showToast(msg, type = 'success') {
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    t.className   = `toast ${type} show`;
    clearTimeout(t._tid);
    t._tid = setTimeout(() => t.classList.remove('show'), 3500);
}
