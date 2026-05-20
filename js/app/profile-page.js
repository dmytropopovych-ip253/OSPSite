/* ============================================================
   js/profile-page.js — Сторінка профілю (Supabase Auth)
   ============================================================ */

import { apiFetchRentalMessages, apiFetchApartments } from '../services/api.js';
import { renderProfileMessages }                      from '../ui/ui.js';
import { supabaseClient }                             from '../supabase-client.js';
import { syncCurrentUser }                            from './auth.js';

export async function initProfilePage() {
    // Синхронізуємо сесію Supabase Auth → sessionStorage
    const currentUser = await syncCurrentUser();
    if (!currentUser) { window.location.href = 'main.html'; return; }

    document.getElementById('profileUsername').textContent = currentUser.login;
    document.getElementById('profileEmail').textContent    = currentUser.email || 'Email не вказано';
    document.getElementById('profileAvatarInitial').textContent = (currentUser.login || '?')[0].toUpperCase();

    /* ── Аватар ── */
    if (currentUser.avatar_url) {
        const img = document.getElementById('profileAvatarImg');
        if (img) { img.src = currentUser.avatar_url; img.style.display = 'block'; }
        const ini = document.getElementById('profileAvatarInitial');
        if (ini) ini.style.display = 'none';
    }

    /* ── Бейдж ролі ── */
    const badgeWrap = document.getElementById('profileBadgeWrap');
    const statRole  = document.getElementById('statRole');
    if (currentUser.is_admin) {
        if (badgeWrap) badgeWrap.innerHTML = '<span class="profile-badge admin">👑 Адміністратор</span>';
        if (statRole)  statRole.textContent = 'Адмін';
    } else {
        if (badgeWrap) badgeWrap.innerHTML = '<span class="profile-badge">👤 Орендар</span>';
        if (statRole)  statRole.textContent = 'Юзер';
    }

    /* ── Орендні повідомлення ── */
    const list = await apiFetchRentalMessages(currentUser.login);
    const statMsgCount = document.getElementById('statMsgCount');
    const msgBadge     = document.getElementById('msgBadge');
    if (statMsgCount) statMsgCount.textContent = list.length;
    if (msgBadge)     msgBadge.textContent     = list.length;

    let aptsMap = {};
    const aptIds = [...new Set(list.map(m => m.apartment_id).filter(Boolean))];
    if (aptIds.length) {
        const apts = await apiFetchApartments();
        apts.forEach(a => aptsMap[a.id] = a.title);
    }
    renderProfileMessages(list, aptsMap);

    /* ── Логаут ── */
    document.getElementById('profileLogoutBtn').onclick = async () => {
        await supabaseClient.auth.signOut();
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
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.onclick = async () => {
            await supabaseClient.auth.signOut();
            sessionStorage.removeItem('currentUser');
            window.location.href = 'main.html';
        };
    }

    const preloader = document.getElementById('site-preloader');
    if (preloader) setTimeout(() => preloader.classList.add('hidden'), 900);
}
