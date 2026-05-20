/* ============================================================
   js/admin-page.js — Адмін-панель (admin.html)
   ============================================================
   Відповідає за:
     - завантаження та рендер всіх даних адмін-панелі
     - CRUD для користувачів і квартир
     - видалення контактних та орендних повідомлень
     - фільтрацію/пошук квартир у таблиці
   Залежності:
     - api.js → apiFetchAccounts, apiInsertAccount, apiUpdateAccount,
                apiDeleteAccount, apiFetchApartments, apiInsertApartment,
                apiUpdateApartment, apiDeleteApartment, apiUploadApartmentImage,
                apiFetchContactMessages, apiDeleteContactMessage,
                apiFetchRentalMessages, apiDeleteRentalMessage
     - ui.js  → renderUsersTable, renderAdminAptsTable,
                renderContactMessagesTable, renderRentalMessagesTable
   ============================================================ */

import {
    apiFetchAccounts, apiUpdateAccount, apiDeleteAccount,
    apiFetchApartments, apiInsertApartment, apiUpdateApartment,
    apiDeleteApartment, apiUploadApartmentImage,
    apiFetchContactMessages, apiDeleteContactMessage,
    apiFetchRentalMessages,  apiDeleteRentalMessage,
} from '../services/api.js';

import {
    renderUsersTable, renderAdminAptsTable,
    renderContactMessagesTable, renderRentalMessagesTable,
} from '../ui/ui.js';

import { supabaseClient, SUPABASE_URL } from '../supabase-client.js';

/* ── Стан ── */

let adminAccounts       = [];
let adminApartments     = [];
let adminMessages       = [];
let adminRentalMessages = [];

let aptFilterSearch    = '';
let aptFilterRooms     = [];
let aptFilterPriceFrom = '';
let aptFilterPriceTo   = '';
let aptShowAll         = false;
let aptSectionOpen     = false;
const APT_PREVIEW      = 10;

/* ── Фільтрація квартир у таблиці ── */

function getFilteredApts() {
    let result = [...adminApartments];
    if (aptFilterSearch.trim()) {
        const q = aptFilterSearch.trim().toLowerCase();
        result = result.filter(a =>
            (a.title || '').toLowerCase().includes(q) ||
            (a.address || '').toLowerCase().includes(q)
        );
    }
    if (aptFilterRooms.length) {
        result = result.filter(a => {
            const first = parseInt(String(a.rooms || '').charAt(0), 10);
            return aptFilterRooms.some(r =>
                r === '4' ? first >= 4 : String(first) === r || String(a.rooms) === r
            );
        });
    }
    const minP = parseFloat(aptFilterPriceFrom) || 0;
    const maxP = parseFloat(aptFilterPriceTo)   || Infinity;
    if (aptFilterPriceFrom || aptFilterPriceTo) {
        result = result.filter(a => {
            const p = parseFloat(a.price);
            return p >= minP && p <= maxP;
        });
    }
    return result;
}

function updateAptFilterUI() {
    const hasFilter = aptFilterSearch || aptFilterRooms.length > 0 || aptFilterPriceFrom || aptFilterPriceTo;
    const resetBtn  = document.getElementById('aptFilterReset');
    const countEl   = document.getElementById('aptFilterCount');
    if (resetBtn) resetBtn.classList.toggle('visible', !!hasFilter);
    const filtered = getFilteredApts();
    if (countEl) {
        if (hasFilter) {
            countEl.style.display = 'block';
            countEl.innerHTML = `Знайдено: <b>${filtered.length}</b> з ${adminApartments.length} квартир`;
        } else {
            countEl.style.display = 'none';
        }
    }
    return filtered;
}

window.resetAptFilters = function () {
    aptFilterSearch = ''; aptFilterRooms = []; aptFilterPriceFrom = ''; aptFilterPriceTo = '';
    ['aptSearchInput', 'aptPriceFrom', 'aptPriceTo'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    document.querySelectorAll('.apt-room-btn').forEach(b => b.classList.remove('active'));
    refreshAptsTable();
};

function refreshAptsTable() {
    const filtered = updateAptFilterUI();
    renderAdminAptsTable(adminApartments, filtered);
    aptShowAll = false;
    applyAptRowVisibility();
}

function applyAptRowVisibility() {
    const rows  = document.querySelectorAll('#aptsTable tbody tr:not(.empty-row)');
    rows.forEach((row, i) => { row.style.display = (aptShowAll || i < APT_PREVIEW) ? '' : 'none'; });
    const wrap  = document.getElementById('aptShowMoreWrap');
    const label = document.getElementById('aptShowMoreLabel');
    const arrow = document.getElementById('aptShowMoreArrow');
    if (rows.length > APT_PREVIEW) {
        if (wrap)  wrap.style.display = 'flex';
        if (label) label.textContent  = aptShowAll ? 'Згорнути' : `Показати всі (ще ${rows.length - APT_PREVIEW})`;
        if (arrow) arrow.style.transform = aptShowAll ? 'rotate(180deg)' : '';
    } else if (wrap) {
        wrap.style.display = 'none';
    }
}

window.toggleAptSection = function () {
    aptSectionOpen = !aptSectionOpen;
    const body = document.getElementById('aptSectionBody');
    const icon = document.getElementById('aptCollapseIcon');
    if (body) body.classList.toggle('open', aptSectionOpen);
    if (icon) icon.style.transform = aptSectionOpen ? 'rotate(180deg)' : '';
};

window.toggleAptRows = function () {
    aptShowAll = !aptShowAll;
    applyAptRowVisibility();
};

/* ── Рендер всіх таблиць ── */

function renderAdminAll() {
    renderUsersTable(adminAccounts);
    refreshAptsTable();
    renderContactMessagesTable(adminMessages);
    const aptsMap = {};
    adminApartments.forEach(a => aptsMap[a.id] = a.title);
    renderRentalMessagesTable(adminRentalMessages, aptsMap);
}

async function loadAdminData() {
    [adminAccounts, adminApartments, adminMessages, adminRentalMessages] = await Promise.all([
        apiFetchAccounts(),
        apiFetchApartments(),
        apiFetchContactMessages(),
        apiFetchRentalMessages(),
    ]);
    renderAdminAll();
}

/* ── Допоміжні функції модалок ── */

window.closeModal = function (id) { document.getElementById(id)?.classList.remove('active'); };
function openModal(id)            { document.getElementById(id)?.classList.add('active'); }

/* ── CRUD Користувачі ── */

window.openUserModal = function () {
    alert('Додавання користувачів можливе лише через реєстрацію на сайті.');
};

window.editUser = function (login) {
    const acc = adminAccounts.find(a => a.login === login);
    if (!acc) return;
    document.getElementById('userModalTitle').innerText = 'Редагувати користувача';
    document.getElementById('oldUserLogin').value  = acc.login;
    document.getElementById('userLogin').value     = acc.login;
    document.getElementById('userEmail').value     = acc.email || '';
    document.getElementById('userIsAdmin').checked = !!acc.is_admin;
    openModal('userModal');
};

window.saveUser = async function () {
    const login     = document.getElementById('userLogin')?.value.trim();
    const email     = document.getElementById('userEmail')?.value.trim();
    const is_admin  = document.getElementById('userIsAdmin')?.checked;
    const oldLogin  = document.getElementById('oldUserLogin')?.value.trim();
    const newPass   = document.getElementById('userNewPassword')?.value.trim();

    if (!login) return alert('Введіть логін');

    // Оновлюємо профіль
    const error = await apiUpdateAccount(oldLogin, { login, email, is_admin });
    if (error) return alert('Помилка: ' + error.message);

    // Якщо введено пароль — міняємо через Edge Function
    if (newPass) {
        if (newPass.length < 6) return alert('Мінімум 6 символів');

        // Знаходимо userId по логіну
        const acc = adminAccounts.find(a => a.login === oldLogin);
        if (!acc?.id) return alert('ID користувача не знайдено');

        const { data: { session } } = await supabaseClient.auth.getSession();
        const res = await fetch(`${SUPABASE_URL}/functions/v1/smooth-task`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({ userId: acc.id, newPassword: newPass }),
        });
        if (!res.ok) return alert('Помилка зміни пароля');
    }

    window.closeModal('userModal');
    loadAdminData();
};

window.deleteUser = async function (login) {
    if (!confirm(`Видалити користувача "${login}"?`)) return;
    const error = await apiDeleteAccount(login);
    if (error) { console.error(error); return alert('Помилка: ' + error.message); }
    loadAdminData();
};

/* ── CRUD Квартири ── */

window.openAptModal = function () {
    document.getElementById('aptModalTitle').innerText = 'Додати квартиру';
    ['aptId','aptTitle','aptAddress','aptPrice','aptRoomsAdmin','aptFloorAdmin',
     'aptDescAdmin','aptAvailFromAdmin','aptAvailToAdmin'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    const alwaysChk = document.getElementById('aptAlwaysAvailAdmin');
    const dateRow   = document.getElementById('aptDateRowAdmin');
    if (alwaysChk) alwaysChk.checked = false;
    if (dateRow)   { dateRow.style.opacity = '1'; dateRow.style.pointerEvents = 'auto'; }
    const fileInput = document.getElementById('aptImage');
    if (fileInput) fileInput.value = '';
    const preview = document.getElementById('adminAptImagePreview');
    if (preview)  { preview.src = ''; preview.style.display = 'none'; }
    openModal('aptModal');
};

window.editApt = function (id) {
    const apt = adminApartments.find(a => String(a.id) === String(id));
    if (!apt) return;
    document.getElementById('aptModalTitle').innerText = 'Редагувати квартиру';
    document.getElementById('aptId').value          = apt.id;
    document.getElementById('aptTitle').value       = apt.title       || '';
    document.getElementById('aptAddress').value     = apt.address     || '';
    document.getElementById('aptPrice').value       = apt.price       || '';
    document.getElementById('aptRoomsAdmin').value  = apt.rooms       || '';
    document.getElementById('aptFloorAdmin').value  = apt.floor       || '';
    document.getElementById('aptDescAdmin').value   = apt.description || '';
    document.getElementById('aptAvailFromAdmin').value = apt.available_from ? apt.available_from.slice(0, 10) : '';
    document.getElementById('aptAvailToAdmin').value   = apt.available_to   ? apt.available_to.slice(0, 10)   : '';
    const alwaysChk = document.getElementById('aptAlwaysAvailAdmin');
    const dateRow   = document.getElementById('aptDateRowAdmin');
    if (alwaysChk) {
        alwaysChk.checked = !!apt.always_available;
        if (dateRow) {
            dateRow.style.opacity       = apt.always_available ? '0.4' : '1';
            dateRow.style.pointerEvents = apt.always_available ? 'none' : 'auto';
        }
    }
    const fileInput = document.getElementById('aptImage');
    if (fileInput) fileInput.value = '';
    const preview = document.getElementById('adminAptImagePreview');
    if (preview && apt.image) { preview.src = apt.image; preview.style.display = 'block'; }
    else if (preview)         { preview.style.display = 'none'; }
    openModal('aptModal');
};

window.saveApt = async function () {
    const id          = document.getElementById('aptId')?.value;
    const title       = document.getElementById('aptTitle')?.value.trim();
    const address     = document.getElementById('aptAddress')?.value.trim();
    const price       = document.getElementById('aptPrice')?.value;
    const rooms       = document.getElementById('aptRoomsAdmin')?.value.trim();
    const floor       = document.getElementById('aptFloorAdmin')?.value.trim();
    const description = document.getElementById('aptDescAdmin')?.value.trim();
    const alwaysChk   = document.getElementById('aptAlwaysAvailAdmin');
    const always      = alwaysChk ? alwaysChk.checked : false;
    const availFrom   = document.getElementById('aptAvailFromAdmin')?.value || null;
    const availTo     = document.getElementById('aptAvailToAdmin')?.value   || null;
    const fileInput   = document.getElementById('aptImage');
    const file        = fileInput?.files?.[0];

    if (!title || !address || !price) return alert('Заповніть назву, адресу та ціну');

    const saveBtn = document.querySelector('#aptModal .auth-action-btn');
    if (saveBtn) { saveBtn.disabled = true; saveBtn.innerText = 'Збереження...'; }

    let imageUrl = '';
    if (id && !file) {
        const existing = adminApartments.find(a => String(a.id) === String(id));
        imageUrl = existing ? existing.image : '';
    }
    if (file) {
        const { url, error: uploadError } = await apiUploadApartmentImage(file);
        if (uploadError) {
            alert('Помилка завантаження фото: ' + uploadError.message);
            if (saveBtn) { saveBtn.disabled = false; saveBtn.innerText = 'Зберегти'; }
            return;
        }
        imageUrl = url;
    }

    const aptData = {
        title, address, price, image: imageUrl, rooms, floor, description,
        always_available: always,
        available_from:   always ? null : availFrom,
        available_to:     always ? null : availTo,
    };
    const error = id ? await apiUpdateApartment(id, aptData) : await apiInsertApartment(aptData);

    if (saveBtn) { saveBtn.disabled = false; saveBtn.innerText = 'Зберегти'; }
    if (error)   { console.error(error); return alert('Помилка: ' + error.message); }
    window.closeModal('aptModal');
    loadAdminData();
};

window.deleteApt = async function (id) {
    if (!confirm('Видалити цю квартиру?')) return;
    const error = await apiDeleteApartment(id);
    if (error) { console.error(error); return alert('Помилка: ' + error.message); }
    loadAdminData();
};

/* ── Видалення повідомлень ── */

window.deleteMsg = async function (id) {
    if (!confirm('Видалити це повідомлення?')) return;
    const error = await apiDeleteContactMessage(id);
    if (error) { console.error(error); return alert('Помилка: ' + error.message); }
    loadAdminData();
};

window.deleteRentalMsg = async function (id) {
    if (!confirm('Видалити це повідомлення по оренді?')) return;
    const error = await apiDeleteRentalMessage(id);
    if (error) { console.error(error); return alert('Помилка: ' + error.message); }
    loadAdminData();
};

/* ── Ініціалізація фільтрів таблиці квартир ── */

function initAptFilters() {
    const searchInput = document.getElementById('aptSearchInput');
    const priceFrom   = document.getElementById('aptPriceFrom');
    const priceTo     = document.getElementById('aptPriceTo');
    if (searchInput) searchInput.addEventListener('input', e => { aptFilterSearch    = e.target.value; refreshAptsTable(); });
    if (priceFrom)   priceFrom.addEventListener('input',   e => { aptFilterPriceFrom = e.target.value; refreshAptsTable(); });
    if (priceTo)     priceTo.addEventListener('input',     e => { aptFilterPriceTo   = e.target.value; refreshAptsTable(); });
    document.querySelectorAll('.apt-room-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const room = btn.dataset.room;
            if (btn.classList.contains('active')) {
                btn.classList.remove('active');
                aptFilterRooms = aptFilterRooms.filter(r => r !== room);
            } else {
                btn.classList.add('active');
                aptFilterRooms.push(room);
            }
            refreshAptsTable();
        });
    });
}

/* ── Ініціалізація сторінки ── */

export function initAdminPage() {
    const cu = JSON.parse(sessionStorage.getItem('currentUser'));
    if (!cu || !cu.is_admin) { window.location.href = 'search.html'; return; }

    ['userModal', 'aptModal'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('click', e => { if (e.target === el) window.closeModal(id); });
    });

    initAptFilters();
    loadAdminData();
}

