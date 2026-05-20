/* ============================================================
   js/auth.js — Логіка авторизації та реєстрації
   ============================================================
   Відповідає за:
     - вхід / реєстрацію / вихід користувача
     - підключення обробників подій для auth-модального вікна
   Залежності:
     - api.js       → apiFetchAccounts, apiInsertAccount
     - utils.js     → isValidEmail
     - ui.js        → updateAuthUI, setAuthMode, showToast
   ============================================================ */

import { apiFetchAccounts, apiInsertAccount } from '../services/api.js';
import { isValidEmail }                        from '../utils.js';
import { updateAuthUI, setAuthMode, showToast } from '../ui/index.js';

/* ── Поточний користувач ── */

export function getCurrentUser() {
    const raw = sessionStorage.getItem('currentUser');
    return raw ? JSON.parse(raw) : null;
}

export function setCurrentUser(user) {
    sessionStorage.setItem('currentUser', JSON.stringify(user));
}

export function clearCurrentUser() {
    sessionStorage.removeItem('currentUser');
}

/* ── Обробники форм ── */

export async function handleSignIn() {
    const login    = document.getElementById('authLogin')?.value.trim();
    const password = document.getElementById('authPassword')?.value.trim();

    if (!login || !password) return alert('Введіть логін та пароль');

    const accounts = await apiFetchAccounts();
    const user     = accounts.find(a => a.login === login && a.password === password);

    if (user) {
        setCurrentUser(user);
        document.getElementById('authOverlay')?.classList.remove('active');
        updateAuthUI();
        showToast('Вхід виконано!');
    } else {
        alert('Невірний логін або пароль');
    }
}

export async function handleRegister() {
    const login    = document.getElementById('authLogin')?.value.trim();
    const password = document.getElementById('authPassword')?.value.trim();
    const email    = document.getElementById('authEmail')?.value.trim() ?? '';

    if (!email)               return alert('Введіть пошту');
    if (!isValidEmail(email)) return alert('Введіть коректну пошту (напр. test@email.com)');
    if (!login || !password)  return alert('Заповніть логін та пароль');
    if (password.length < 6)  return alert('Пароль повинен містити мінімум 6 символів');

    const accounts = await apiFetchAccounts();
    if (accounts.find(a => a.login === login)) return alert('Логін вже зайнятий');

    const error = await apiInsertAccount({ login, password, email, is_admin: false });
    if (error) { console.error(error); return; }

    alert('Успішно зареєстровано! Тепер увійдіть.');
    setAuthMode(false);
}

export function handleLogout() {
    clearCurrentUser();
    window.location.reload();
}

/* ── Ініціалізація auth-блоку (спільна для всіх сторінок) ── */

/**
 * Підключає обробники до елементів авторизації.
 * Викликати з DOMContentLoaded кожної сторінки, де є auth-модалка.
 *
 * @param {object} options
 * @param {Function} [options.onLogin]  — додатковий колбек після успішного входу
 */
export function initAuth({ onLogin } = {}) {
    updateAuthUI();
    setAuthMode(false);

    const loginBtn     = document.getElementById('loginBtn');
    const authOverlay  = document.getElementById('authOverlay');
    const userDropdown = document.getElementById('userDropdown');
    const signInBtn    = document.getElementById('signInBtn');
    const registerBtn  = document.getElementById('registerBtn');
    const closeAuth    = document.getElementById('closeAuth');
    const switchReg    = document.getElementById('switchToRegister');
    const logoutBtn    = document.getElementById('logoutBtn');

    if (loginBtn) {
        loginBtn.onclick = e => {
            e.preventDefault();
            e.stopPropagation();
            if (getCurrentUser()) {
                userDropdown?.classList.toggle('active');
            } else {
                setAuthMode(false);
                authOverlay?.classList.add('active');
            }
        };
    }

    if (signInBtn) {
        signInBtn.onclick = async () => {
            await handleSignIn();
            if (getCurrentUser()) onLogin?.();
        };
    }
    if (registerBtn) registerBtn.onclick = handleRegister;
    if (closeAuth)   closeAuth.onclick   = () => authOverlay?.classList.remove('active');
    if (switchReg)   switchReg.onclick   = e => { e.preventDefault(); setAuthMode(true); };
    if (logoutBtn)   logoutBtn.onclick   = e => { e.preventDefault(); handleLogout(); };

    /* Закриття dropdown і модалки кліком поза ними */
    document.addEventListener('click', e => {
        if (userDropdown && loginBtn &&
            !userDropdown.contains(e.target) && e.target !== loginBtn) {
            userDropdown.classList.remove('active');
        }
        if (authOverlay && e.target === authOverlay) {
            authOverlay.classList.remove('active');
        }
    });
}
