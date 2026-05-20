/* ============================================================
   js/auth.js — Логіка авторизації через Supabase Auth
   ============================================================
   Замінює пряму роботу з таблицею accounts на supabase.auth.*
   Залежності:
     - supabase-client.js → supabaseClient
     - utils.js           → isValidEmail
     - ui/index.js        → updateAuthUI, setAuthMode, showToast
   ============================================================ */

import { supabaseClient }                        from '../supabase-client.js';
import { isValidEmail }                          from '../utils.js';
import { updateAuthUI, setAuthMode, showToast }  from '../ui/ui.js';

/* ── Поточний користувач ── */

/**
 * Повертає об'єкт { login, email, is_admin, avatar_url, id } або null.
 * Читається із sessionStorage для синхронного доступу.
 */
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

/**
 * Завантажує профіль із таблиці profiles та зберігає у sessionStorage.
 * Викликати після будь-якого auth-події.
 */
export async function syncCurrentUser() {
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) { clearCurrentUser(); return null; }

    const { data: profile } = await supabaseClient
        .from('profiles')
        .select('login, is_admin, avatar_url')
        .eq('id', user.id)
        .single();

    const currentUser = {
        id:         user.id,
        email:      user.email,
        login:      profile?.login   ?? user.email,
        is_admin:   profile?.is_admin ?? false,
        avatar_url: profile?.avatar_url ?? null,
    };
    setCurrentUser(currentUser);
    return currentUser;
}

/* ── Обробники форм ── */

export async function handleSignIn() {
    const login    = document.getElementById('authLogin')?.value.trim();
    const password = document.getElementById('authPassword')?.value.trim();

    if (!login || !password) return alert('Введіть логін та пароль');

    // Знаходимо email за логіном через profiles
    const { data: profile, error: profileError } = await supabaseClient
        .from('profiles')
        .select('id')
        .eq('login', login)
        .single();

    if (profileError || !profile) return alert('Користувача з таким логіном не знайдено');

    // Отримуємо email через RPC або беремо з auth (потрібна service key — тому краще зберігати email у profiles)
    // Простіше рішення: зберігаємо email у profiles при реєстрації
    const { data: profileFull } = await supabaseClient
        .from('profiles')
        .select('email')
        .eq('login', login)
        .single();

    const email = profileFull?.email;
    if (!email) return alert('Не вдалося знайти email для цього логіну');

    const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) return alert('Невірний логін або пароль');

    await syncCurrentUser();
    document.getElementById('authOverlay')?.classList.remove('active');
    updateAuthUI();
    showToast('Вхід виконано!');
}

export async function handleRegister() {
    const login    = document.getElementById('authLogin')?.value.trim();
    const password = document.getElementById('authPassword')?.value.trim();
    const email    = document.getElementById('authEmail')?.value.trim() ?? '';

    if (!email)               return alert('Введіть пошту');
    if (!isValidEmail(email)) return alert('Введіть коректну пошту (напр. test@email.com)');
    if (!login || !password)  return alert('Заповніть логін та пароль');
    if (password.length < 6)  return alert('Пароль повинен містити мінімум 6 символів');

    // Перевірка унікальності логіну
    const { data: existing } = await supabaseClient
        .from('profiles')
        .select('id')
        .eq('login', login)
        .single();
    if (existing) return alert('Логін вже зайнятий');

    // Реєстрація через Supabase Auth
    const { data, error } = await supabaseClient.auth.signUp({
       email,
       password,
       options: { data: { login } },
    });
    if (error) { alert('Помилка реєстрації: ' + error.message); return; }

    // Зберігаємо login + email у profiles (upsert — на випадок якщо тригер ще не встиг створити рядок)
    if (data?.user) {
        await supabaseClient
            .from('profiles')
            .upsert({ id: data.user.id, login, email }, { onConflict: 'id' });
    }

    // ✅ Без підтвердження — одразу синхронізуємо і закриваємо
    await syncCurrentUser();
    document.getElementById('authOverlay')?.classList.remove('active');
    updateAuthUI();
    showToast('Успішно зареєстровано!');
    // Прибрати старий alert з "Перевірте пошту"

    alert('Успішно зареєстровано!');
    setAuthMode(false);
}

export async function handleLogout() {
    await supabaseClient.auth.signOut();
    clearCurrentUser();
    window.location.reload();
}

/* ── Ініціалізація auth-блоку (спільна для всіх сторінок) ── */

export async function initAuth({ onLogin } = {}) {
    // Відновлюємо сесію при завантаженні сторінки
    await syncCurrentUser();
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
