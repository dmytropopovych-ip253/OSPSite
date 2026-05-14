import {
  apiFetchApartments, apiFetchApartmentById,
  apiInsertApartment, apiUpdateApartment, apiDeleteApartment, apiUploadApartmentImage,
  apiFetchAccounts, apiInsertAccount, apiFetchAccountByLogin,
  apiInsertRentalMessage,
  apiFetchContactMessages, apiInsertContactMessage, apiDeleteContactMessage,
  apiFetchRentalMessages, apiDeleteRentalMessage,
  apiUpdateAccount, apiDeleteAccount, apiUploadAvatar,
} from './api.js';

import { isValidEmail, formatDate, buildAvailabilityHTML } from './utils.js';

import {
  allData, setAllData,
  currentFilteredData, setCurrentFilteredData,
  currentPage, setCurrentPage,
  currentSort, setCurrentSort,
  isRegisterMode, setIsRegisterMode,
  itemsPerPage,
} from './state.js';

import {
  renderCurrentPage, renderCards, renderPagination,
  updateAuthUI, setAuthMode, showToast,
  renderAptCard, renderRecommendationCards,
  renderUsersTable, renderContactMessagesTable,
  renderRentalMessagesTable, renderAdminAptsTable,
  renderProfileMessages, checkStrength, togglePw,
  applyAvatar, removeAvatarUI, triggerAvatarUpload,
} from './ui.js';
/* ════════════════════════════════════════════════════════════
   SEARCH PAGE  (search.html / index.html)
   ════════════════════════════════════════════════════════════ */

/* ── Filtering & Sorting ── */

function applyFiltersAndSort() {
    let result = [...allData];

    const activeRooms   = Array.from(document.querySelectorAll('.room-btn.active')).map(b => b.innerText.trim());
    if (activeRooms.length) {
        result = result.filter(item => {
            const roomStr = String(item.rooms).trim();
            return activeRooms.includes(roomStr.charAt(0)) || activeRooms.includes(roomStr);
        });
    }

    const priceFrom = document.getElementById('priceFrom');
    const priceTo   = document.getElementById('priceTo');
    if (priceFrom && priceTo && (priceFrom.value || priceTo.value)) {
        const min = parseFloat(priceFrom.value) || 0;
        const max = parseFloat(priceTo.value)   || Infinity;
        result = result.filter(item => {
            const p = parseFloat(item.price);
            return p >= min && p <= max;
        });
    }

    if (currentSort === 'cheap')     result.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
    if (currentSort === 'expensive') result.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));

    setCurrentFilteredData(result);
    setCurrentPage(1);
    renderCurrentPage();
}

async function loadApartments() {
    setAllData(await apiFetchApartments());
    applyFiltersAndSort();
}

/* ── Admin — Apartment Modal (search page) ── */

window.editApartment = function (id) {
    const item = allData.find(apt => apt.id == id);
    if (!item) return;

    document.getElementById('apartmentModalTitle').innerText = 'Редагувати квартиру';
    document.getElementById('aptId').value         = item.id;
    document.getElementById('aptTitle').value      = item.title;
    document.getElementById('aptRooms').value      = item.rooms;
    document.getElementById('aptAddress').value    = item.address;
    document.getElementById('aptFloor').value      = item.floor;
    document.getElementById('aptPrice').value      = item.price;
    document.getElementById('aptAvailFrom').value  = item.available_from ? item.available_from.slice(0, 10) : '';
    document.getElementById('aptAvailTo').value    = item.available_to   ? item.available_to.slice(0, 10)   : '';

    const alwaysChk = document.getElementById('aptAlwaysAvail');
    const dateRow   = document.getElementById('aptDateRow');
    if (alwaysChk) {
        alwaysChk.checked = !!item.always_available;
        if (dateRow) {
            dateRow.style.opacity       = item.always_available ? '0.4' : '1';
            dateRow.style.pointerEvents = item.always_available ? 'none' : 'auto';
        }
    }
    document.getElementById('aptImage').value = '';
    const preview = document.getElementById('aptImagePreview');
    if (preview && item.image) { preview.src = item.image; preview.style.display = 'block'; }
    document.getElementById('apartmentModalOverlay').classList.add('active');
};

window.deleteApartment = async function (id) {
    if (!confirm('Ви впевнені, що хочете видалити цю квартиру?')) return;
    const error = await apiDeleteApartment(id);
    if (error) { console.error(error); return; }
    loadApartments();
};

/* ── Auth ── */

async function handleSignIn() {
    const login    = document.getElementById('authLogin').value.trim();
    const password = document.getElementById('authPassword').value.trim();
    const accounts = await apiFetchAccounts();
    const user     = accounts.find(a => a.login === login && a.password === password);

    if (user) {
        sessionStorage.setItem('currentUser', JSON.stringify(user));
        document.getElementById('authOverlay').classList.remove('active');
        updateAuthUI();
    } else {
        alert('Невірний логін або пароль');
    }
}

async function handleRegister() {
    const login    = document.getElementById('authLogin').value.trim();
    const password = document.getElementById('authPassword').value.trim();
    const emailEl  = document.getElementById('authEmail');
    const email    = emailEl ? emailEl.value.trim() : '';

    if (!email)                  return alert('Введіть пошту');
    if (!isValidEmail(email))    return alert('Введіть коректну пошту (напр. test@email.com)');
    if (!login || !password)     return alert('Заповніть логін та пароль');
    if (password.length < 6)     return alert('Пароль повинен містити мінімум 6 символів');

    const accounts = await apiFetchAccounts();
    if (accounts.find(a => a.login === login)) return alert('Логін вже зайнятий');

    const error = await apiInsertAccount({ login, password, email, is_admin: false });
    if (error) { console.error(error); return; }
    alert('Успішно зареєстровано! Тепер увійдіть.');
    setAuthMode(false);
}

async function handleSaveApartmentModal() {
    const saveBtn = document.getElementById('saveApartmentBtn');
    const id      = document.getElementById('aptId').value;
    const fileInput = document.getElementById('aptImage');
    const file    = fileInput && fileInput.files && fileInput.files[0];

    if (saveBtn) { saveBtn.disabled = true; saveBtn.innerText = 'Збереження...'; }

    let imageUrl = '';
    if (id && !file) {
        const existing = allData.find(a => String(a.id) === String(id));
        imageUrl = existing ? existing.image : '';
    }
    if (file) {
        const { url, error: uploadError } = await apiUploadApartmentImage(file);
        if (uploadError) {
            alert('Помилка завантаження фото: ' + uploadError.message);
            if (saveBtn) { saveBtn.disabled = false; saveBtn.innerText = 'Зберегти квартиру'; }
            return;
        }
        imageUrl = url;
    }

    const alwaysChk = document.getElementById('aptAlwaysAvail');
    const always    = alwaysChk ? alwaysChk.checked : false;
    const newApt = {
        title:            document.getElementById('aptTitle').value,
        rooms:            document.getElementById('aptRooms').value,
        address:          document.getElementById('aptAddress').value,
        floor:            document.getElementById('aptFloor').value,
        price:            document.getElementById('aptPrice').value,
        image:            imageUrl,
        always_available: always,
        available_from:   always ? null : (document.getElementById('aptAvailFrom').value || null),
        available_to:     always ? null : (document.getElementById('aptAvailTo').value   || null),
    };

    const error = id
        ? await apiUpdateApartment(id, newApt)
        : await apiInsertApartment(newApt);

    if (saveBtn) { saveBtn.disabled = false; saveBtn.innerText = 'Зберегти квартиру'; }
    if (error)   { console.error(error); return; }

    document.getElementById('apartmentModalOverlay').classList.remove('active');
    loadApartments();
}

/* ── Contacts Modal (search page) ── */

async function handleSendContact() {
    const name    = document.getElementById('contactName').value.trim();
    const email   = document.getElementById('contactEmail').value;
    const message = document.getElementById('contactMessage').value.trim();

    if (!name || !email || !message) return alert('Заповніть всі поля.');
    if (!isValidEmail(email))        return alert('Введіть коректну пошту!');

    const error = await apiInsertContactMessage({ name, email, message, date: new Date().toLocaleString('uk-UA') });
    if (error) { console.error(error); return; }

    alert(`Дякуємо, ${name}! Повідомлення надіслано.`);
    document.getElementById('contactName').value    = '';
    document.getElementById('contactEmail').value   = '';
    document.getElementById('contactMessage').value = '';
    document.getElementById('contactOverlay').classList.remove('active');
}


/* ════════════════════════════════════════════════════════════
   APARTMENT PAGE  (apartment.html)
   ════════════════════════════════════════════════════════════ */

let currentApt  = null;
let isEditMode  = false;

async function renderApartmentDetails() {
    const id = new URLSearchParams(window.location.search).get('id');
    const apt = await apiFetchApartmentById(id);
    const container = document.getElementById('mainAptContent');

    if (!apt || !container) { window.location.href = 'search.html'; return; }
    currentApt = apt;
    renderAptCard(currentApt, isEditMode);
    renderRecommendations(currentApt.id);
}

async function renderRecommendations(currentId) {
    const all = await apiFetchApartments();
    const recommendations = all
        .filter(a => a.id != currentId)
        .sort(() => 0.5 - Math.random())
        .slice(0, 4);
    renderRecommendationCards(recommendations);
}

window.viewNewApt = function (id) {
    window.location.href = 'apartment.html?id=' + id;
};

window.openLandlordModal  = function () { document.getElementById('landlordModal').classList.add('active');    };
window.closeLandlordModal = function () { document.getElementById('landlordModal').classList.remove('active'); };

window.saveApartment = async function () {
    const title       = document.getElementById('edit-title').value.trim();
    const price       = document.getElementById('edit-price').value.trim();
    const address     = document.getElementById('edit-address').value.trim();
    const rooms       = document.getElementById('edit-rooms').value.trim();
    const floor       = document.getElementById('edit-floor').value.trim();
    const description = document.getElementById('edit-description').value.trim();
    const fileInput   = document.getElementById('edit-image');
    const file        = fileInput && fileInput.files && fileInput.files[0];

    if (!title || !price || !address) return alert('Заповніть хоча б заголовок, ціну та адресу');

    let imageUrl = currentApt.image;
    if (file) {
        const { url, error: uploadError } = await apiUploadApartmentImage(file);
        if (uploadError) return alert('Помилка завантаження фото: ' + uploadError.message);
        imageUrl = url;
    }

    const error = await apiUpdateApartment(currentApt.id, { title, price, address, rooms, floor, image: imageUrl, description });
    if (error) { console.error(error); return alert('Помилка збереження: ' + error.message); }

    currentApt = { ...currentApt, title, price, address, rooms, floor, image: imageUrl, description };
    alert('Збережено!');
    window.location.reload();
};

window.deleteApartment = async function () {
    if (!confirm(`Видалити квартиру "${currentApt.title}"? Цю дію не можна скасувати.`)) return;
    const error = await apiDeleteApartment(currentApt.id);
    if (error) { console.error(error); return alert('Помилка видалення: ' + error.message); }
    window.location.href = 'search.html';
};

async function handleSendLandlordMsg() {
    const name      = document.getElementById('landlordName').value.trim();
    const email     = document.getElementById('landlordEmail').value.trim();
    const message   = document.getElementById('landlordMessage').value.trim();
    const dateFromV = document.getElementById('landlordDateFrom')?.value || '';
    const dateToV   = document.getElementById('landlordDateTo')?.value   || '';

    if (!name || !email)                              return alert('Будь ласка, заповніть ім\'я та email.');
    if (!isValidEmail(email))                         return alert('Введіть коректний email');
    if (!dateFromV || !dateToV)                       return alert('Будь ласка, оберіть дати оренди.');
    if (new Date(dateToV) <= new Date(dateFromV))     return alert('Дата виселення має бути пізніше дати заселення.');

    const days      = Math.round((new Date(dateToV) - new Date(dateFromV)) / (1000 * 60 * 60 * 24));
    const dateLabel = `${formatDate(dateFromV)} — ${formatDate(dateToV)} (${days} дн.)`;
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
    const aptId       = new URLSearchParams(window.location.search).get('id');

    const error = await apiInsertRentalMessage({
        message_id:    crypto.randomUUID(),
        name, email,
        message:       message || '—',
        apartment_id:  aptId,
        user_login:    currentUser ? currentUser.login : null,
        date_from:     dateFromV,
        date_to:       dateToV,
        rental_period: dateLabel,
        date:          new Date().toLocaleString('uk-UA'),
    });

    if (error) { console.error(error); return alert('Помилка відправки: ' + error.message); }

    alert(`Дякуємо, ${name}! Ваш запит на оренду ${dateLabel} надіслано.`);
    ['landlordName', 'landlordEmail', 'landlordMessage'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    const dateFrom = document.getElementById('landlordDateFrom');
    const dateTo   = document.getElementById('landlordDateTo');
    if (dateFrom) dateFrom.value = '';
    if (dateTo)   dateTo.value   = '';
    const durationEl = document.getElementById('rentalDurationLabel');
    if (durationEl) durationEl.style.display = 'none';
    document.getElementById('landlordModal').classList.remove('active');
}


/* ════════════════════════════════════════════════════════════
   ADMIN PAGE  (admin.html)
   ════════════════════════════════════════════════════════════ */

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
            return aptFilterRooms.some(r => r === '4' ? first >= 4 : String(first) === r || String(a.rooms) === r);
        });
    }
    const minP = parseFloat(aptFilterPriceFrom) || 0;
    const maxP = parseFloat(aptFilterPriceTo)   || Infinity;
    if (aptFilterPriceFrom || aptFilterPriceTo) {
        result = result.filter(a => { const p = parseFloat(a.price); return p >= minP && p <= maxP; });
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
        const el = document.getElementById(id); if (el) el.value = '';
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
        wrap.style.display = 'flex';
        label.textContent  = aptShowAll ? 'Згорнути' : `Показати всі (ще ${rows.length - APT_PREVIEW})`;
        arrow.style.transform = aptShowAll ? 'rotate(180deg)' : '';
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

window.closeModal  = function (id) { document.getElementById(id).classList.remove('active'); };
function openModal(id)              { document.getElementById(id).classList.add('active');    }

window.openUserModal = function () {
    document.getElementById('userModalTitle').innerText = 'Додати користувача';
    ['oldUserLogin', 'userLogin', 'userEmail', 'userPassword'].forEach(id => { document.getElementById(id).value = ''; });
    document.getElementById('userIsAdmin').checked = false;
    openModal('userModal');
};

window.editUser = function (login) {
    const acc = adminAccounts.find(a => a.login === login);
    if (!acc) return;
    document.getElementById('userModalTitle').innerText = 'Редагувати користувача';
    document.getElementById('oldUserLogin').value  = acc.login;
    document.getElementById('userLogin').value     = acc.login;
    document.getElementById('userEmail').value     = acc.email    || '';
    document.getElementById('userPassword').value  = acc.password || '';
    document.getElementById('userIsAdmin').checked = !!acc.is_admin;
    openModal('userModal');
};

window.saveUser = async function () {
    const login    = document.getElementById('userLogin').value.trim();
    const email    = document.getElementById('userEmail').value.trim();
    const password = document.getElementById('userPassword').value.trim();
    const is_admin = document.getElementById('userIsAdmin').checked;
    const oldLogin = document.getElementById('oldUserLogin').value.trim();

    if (!login || !password) return alert('Заповніть логін та пароль');

    let error;
    if (oldLogin) {
        error = await apiUpdateAccount(oldLogin, { login, email, password, is_admin });
    } else {
        const existing = await apiFetchAccounts();
        if (existing.find(a => a.login === login)) return alert('Логін вже зайнятий');
        error = await apiInsertAccount({ login, email, password, is_admin });
    }

    if (error) { console.error(error); return alert('Помилка: ' + error.message); }
    closeModal('userModal');
    loadAdminData();
};

window.deleteUser = async function (login) {
    if (!confirm(`Видалити користувача "${login}"?`)) return;
    const error = await apiDeleteAccount(login);
    if (error) { console.error(error); return alert('Помилка: ' + error.message); }
    loadAdminData();
};

window.openAptModal = function () {
    document.getElementById('aptModalTitle').innerText = 'Додати квартиру';
    ['aptId', 'aptTitle', 'aptAddress', 'aptPrice', 'aptRoomsAdmin', 'aptFloorAdmin', 'aptDescAdmin', 'aptAvailFromAdmin', 'aptAvailToAdmin'].forEach(id => {
        const el = document.getElementById(id); if (el) el.value = '';
    });
    const alwaysChk = document.getElementById('aptAlwaysAvailAdmin');
    const dateRow   = document.getElementById('aptDateRowAdmin');
    if (alwaysChk) alwaysChk.checked = false;
    if (dateRow)   { dateRow.style.opacity = '1'; dateRow.style.pointerEvents = 'auto'; }
    const fileInput = document.getElementById('aptImage');
    if (fileInput) fileInput.value = '';
    const preview = document.getElementById('adminAptImagePreview');
    if (preview) { preview.src = ''; preview.style.display = 'none'; }
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
    document.getElementById('aptAvailFromAdmin').value = apt.available_from ? apt.available_from.slice(0,10) : '';
    document.getElementById('aptAvailToAdmin').value   = apt.available_to   ? apt.available_to.slice(0,10)   : '';
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
    else if (preview) { preview.style.display = 'none'; }
    openModal('aptModal');
};

window.saveApt = async function () {
    const id          = document.getElementById('aptId').value;
    const title       = document.getElementById('aptTitle').value.trim();
    const address     = document.getElementById('aptAddress').value.trim();
    const price       = document.getElementById('aptPrice').value;
    const rooms       = document.getElementById('aptRoomsAdmin').value.trim();
    const floor       = document.getElementById('aptFloorAdmin').value.trim();
    const description = document.getElementById('aptDescAdmin').value.trim();
    const alwaysChk   = document.getElementById('aptAlwaysAvailAdmin');
    const always      = alwaysChk ? alwaysChk.checked : false;
    const availFrom   = document.getElementById('aptAvailFromAdmin').value || null;
    const availTo     = document.getElementById('aptAvailToAdmin').value   || null;
    const fileInput   = document.getElementById('aptImage');
    const file        = fileInput && fileInput.files && fileInput.files[0];

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
        title, address, price, image: imageUrl,
        rooms, floor, description,
        always_available: always,
        available_from:   always ? null : availFrom,
        available_to:     always ? null : availTo,
    };
    const error = id ? await apiUpdateApartment(id, aptData) : await apiInsertApartment(aptData);

    if (saveBtn) { saveBtn.disabled = false; saveBtn.innerText = 'Зберегти'; }
    if (error)   { console.error(error); return alert('Помилка: ' + error.message); }
    closeModal('aptModal');
    loadAdminData();
};

window.deleteApt = async function (id) {
    if (!confirm('Видалити цю квартиру?')) return;
    const error = await apiDeleteApartment(id);
    if (error) { console.error(error); return alert('Помилка: ' + error.message); }
    loadAdminData();
};

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


/* ════════════════════════════════════════════════════════════
   SETTINGS PAGE  (settings.html)
   ════════════════════════════════════════════════════════════ */

async function initSettingsPage() {
    let currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
    if (!currentUser) { window.location.href = 'main.html'; return; }

    let originalLogin = currentUser.login;

    document.getElementById('setLogin').value = currentUser.login || '';
    document.getElementById('setEmail').value = currentUser.email  || '';
    document.getElementById('avatarInitial').textContent = (currentUser.login || '?')[0].toUpperCase();

    const accData = await apiFetchAccountByLogin(currentUser.login);
    if (accData && accData.avatar_url) {
        currentUser.avatar_url = accData.avatar_url;
        sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
        applyAvatar(accData.avatar_url);
    }

    document.getElementById('setLogin').oninput = function () {
        document.getElementById('avatarInitial').textContent = (this.value[0] || '?').toUpperCase();
    };

    // Avatar file upload
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

    // Remove avatar
    window.removeAvatar = async function () {
        removeAvatarUI();
        const error = await apiUpdateAccount(currentUser.login, { avatar_url: null });
        currentUser.avatar_url = null;
        sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
        if (error) { showToast('❌ Помилка видалення: ' + error.message, 'error'); return; }
        showToast('🗑 Фото видалено');
    };

    // Save account info
    document.getElementById('saveAccountBtn').onclick = async () => {
        const btn   = document.getElementById('saveAccountBtn');
        const login = document.getElementById('setLogin').value.trim();
        const email = document.getElementById('setEmail').value.trim();

        if (!login)                       return showToast('⚠️ Логін не може бути порожнім', 'error');
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

    // Change password
    document.getElementById('savePasswordBtn').onclick = async () => {
        const btn     = document.getElementById('savePasswordBtn');
        const current = document.getElementById('currentPassword').value;
        const newPass  = document.getElementById('newPassword').value;
        const confirm  = document.getElementById('confirmPassword').value;

        if (!current || !newPass || !confirm) return showToast('⚠️ Заповніть всі поля', 'error');
        if (current !== currentUser.password) return showToast('⚠️ Поточний пароль невірний', 'error');
        if (newPass.length < 6)               return showToast('⚠️ Новий пароль — мінімум 6 символів', 'error');
        if (newPass !== confirm)              return showToast('⚠️ Паролі не збігаються', 'error');

        btn.textContent = '⏳ Збереження...'; btn.disabled = true;
        const error = await apiUpdateAccount(currentUser.login, { password: newPass });
        btn.textContent = '🔒 Змінити пароль'; btn.disabled = false;

        if (error) return showToast('❌ Помилка: ' + error.message, 'error');
        currentUser.password = newPass;
        sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
        ['currentPassword', 'newPassword', 'confirmPassword'].forEach(id => { document.getElementById(id).value = ''; });
        checkStrength('');
        showToast('✅ Пароль успішно змінено!');
    };

    // Delete account
    document.getElementById('deleteAccountBtn').onclick = async () => {
        if (!confirm(`❗ Ви впевнені, що хочете видалити акаунт "${currentUser.login}"?\nЦю дію не можна скасувати.`)) return;
        const error = await apiDeleteAccount(currentUser.login);
        if (error) return showToast('❌ Помилка: ' + error.message, 'error');
        sessionStorage.removeItem('currentUser');
        window.location.href = 'main.html';
    };

    // Navbar
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

    // Contacts modal
    const contactsBtn    = document.getElementById('contactsBtn');
    const contactOverlay = document.getElementById('contactOverlay');
    if (contactsBtn) contactsBtn.onclick = e => { e.preventDefault(); contactOverlay.classList.add('active'); };
    document.getElementById('closeContact').onclick = () => contactOverlay.classList.remove('active');

    document.onclick = e => {
        if (e.target === contactOverlay) contactOverlay.classList.remove('active');
        if (userDropdown && loginBtn && !userDropdown.contains(e.target) && e.target !== loginBtn)
            userDropdown.classList.remove('active');
    };

    const preloader = document.getElementById('site-preloader');
    if (preloader) setTimeout(() => preloader.classList.add('hidden'), 900);
}


/* ════════════════════════════════════════════════════════════
   PROFILE PAGE  (profile.html)
   ════════════════════════════════════════════════════════════ */

async function initProfilePage() {
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
    if (!currentUser) { window.location.href = 'main.html'; return; }

    document.getElementById('profileUsername').textContent = currentUser.login;
    document.getElementById('profileEmail').textContent    = currentUser.email || 'Email не вказано';
    document.getElementById('profileAvatarInitial').textContent = (currentUser.login || '?')[0].toUpperCase();

    // Avatar
    const accData = await apiFetchAccountByLogin(currentUser.login);
    if (accData && accData.avatar_url) {
        const img = document.getElementById('profileAvatarImg');
        img.src = accData.avatar_url; img.style.display = 'block';
        document.getElementById('profileAvatarInitial').style.display = 'none';
    }

    // Role badge
    const badgeWrap = document.getElementById('profileBadgeWrap');
    if (currentUser.is_admin) {
        badgeWrap.innerHTML = '<span class="profile-badge admin">👑 Адміністратор</span>';
        document.getElementById('statRole').textContent = 'Адмін';
    } else {
        badgeWrap.innerHTML = '<span class="profile-badge">👤 Орендар</span>';
        document.getElementById('statRole').textContent = 'Юзер';
    }

    // Rental messages
    const list = await apiFetchRentalMessages(currentUser.login);
    document.getElementById('statMsgCount').textContent = list.length;
    document.getElementById('msgBadge').textContent     = list.length;

    let aptsMap = {};
    const aptIds = [...new Set(list.map(m => m.apartment_id).filter(Boolean))];
    if (aptIds.length) {
        const apts = await apiFetchApartments();
        apts.forEach(a => aptsMap[a.id] = a.title);
    }
    renderProfileMessages(list, aptsMap);

    document.getElementById('profileLogoutBtn').onclick = () => {
        sessionStorage.removeItem('currentUser');
        window.location.href = 'main.html';
    };

    // Navbar
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
        sessionStorage.removeItem('currentUser'); window.location.href = 'main.html';
    };

    // Contacts modal
    const contactsBtn    = document.getElementById('contactsBtn');
    const contactOverlay = document.getElementById('contactOverlay');
    if (contactsBtn) contactsBtn.onclick = e => { e.preventDefault(); contactOverlay.classList.add('active'); };
    document.getElementById('closeContact').onclick = () => contactOverlay.classList.remove('active');
    document.onclick = e => { if (e.target === contactOverlay) contactOverlay.classList.remove('active'); };

    const preloader = document.getElementById('site-preloader');
    if (preloader) setTimeout(() => preloader.classList.add('hidden'), 900);
}


/* ════════════════════════════════════════════════════════════
   DOMContentLoaded — розпізнає сторінку автоматично по URL
   ════════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {

    // Автоматично визначаємо сторінку по імені файлу в URL
    const path = window.location.pathname.toLowerCase();
    let page = 'search'; // дефолт для index.html / main.html / search.html
    if      (path.includes('apartment')) page = 'apartment';
    else if (path.includes('admin'))     page = 'admin';
    else if (path.includes('settings'))  page = 'settings';
    else if (path.includes('profile'))   page = 'profile';

    /* ── Search Page ── */
    if (page === 'search') {
        updateAuthUI();
        setAuthMode(false);
        loadApartments();

        // Filter & sort wire-up
        const priceFromInput = document.getElementById('priceFrom');
        const priceToInput   = document.getElementById('priceTo');
        if (priceFromInput) priceFromInput.addEventListener('input', applyFiltersAndSort);
        if (priceToInput)   priceToInput.addEventListener('input',   applyFiltersAndSort);

        const applyFiltersBtn = document.getElementById('applyFilters');
        if (applyFiltersBtn) applyFiltersBtn.style.display = 'none';

        document.querySelectorAll('.room-btn').forEach(btn => {
            btn.onclick = e => { e.stopPropagation(); btn.classList.toggle('active'); applyFiltersAndSort(); };
        });

        document.querySelectorAll('.sort-dropdown .sort-option').forEach(option => {
            option.onclick = () => {
                setCurrentSort(option.dataset.sort);
                const el = document.getElementById('currentSort');
                if (el) el.innerText = option.innerText;
                applyFiltersAndSort();
                document.getElementById('sortPanel')?.classList.remove('active');
                document.querySelector('.sort-wrapper')?.classList.remove('active');
            };
        });

        // Admin modal — always available checkbox
        const alwaysChk = document.getElementById('aptAlwaysAvail');
        if (alwaysChk) {
            alwaysChk.addEventListener('change', () => {
                const dateRow = document.getElementById('aptDateRow');
                if (dateRow) {
                    dateRow.style.opacity       = alwaysChk.checked ? '0.4' : '1';
                    dateRow.style.pointerEvents = alwaysChk.checked ? 'none' : 'auto';
                }
            });
        }

        const editModeToggle  = document.getElementById('editModeToggle');
        const addApartmentBtn = document.getElementById('addApartmentBtn');
        if (editModeToggle) {
            editModeToggle.addEventListener('change', e => {
                document.body.classList.toggle('admin-mode', e.target.checked);
                if (addApartmentBtn) addApartmentBtn.style.display = e.target.checked ? 'block' : 'none';
            });
        }
        if (addApartmentBtn) {
            addApartmentBtn.onclick = () => {
                document.getElementById('apartmentModalTitle').innerText = 'Додати квартиру';
                ['aptId','aptTitle','aptRooms','aptAddress','aptFloor','aptPrice','aptAvailFrom','aptAvailTo','aptImage']
                    .forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
                const alwaysChk = document.getElementById('aptAlwaysAvail');
                const dateRow   = document.getElementById('aptDateRow');
                if (alwaysChk) alwaysChk.checked = false;
                if (dateRow)   { dateRow.style.opacity = '1'; dateRow.style.pointerEvents = 'auto'; }
                const preview = document.getElementById('aptImagePreview');
                if (preview) { preview.src = ''; preview.style.display = 'none'; }
                document.getElementById('apartmentModalOverlay').classList.add('active');
            };
        }

        const saveApartmentBtn = document.getElementById('saveApartmentBtn');
        if (saveApartmentBtn) saveApartmentBtn.onclick = handleSaveApartmentModal;

        const closeApartmentModal = document.getElementById('closeApartmentModal');
        if (closeApartmentModal) closeApartmentModal.onclick = () =>
            document.getElementById('apartmentModalOverlay').classList.remove('active');

        // Auth buttons
        const loginBtn    = document.getElementById('loginBtn');
        const authOverlay = document.getElementById('authOverlay');
        const userDropdown = document.getElementById('userDropdown');
        if (loginBtn) {
            loginBtn.onclick = e => {
                e.preventDefault(); e.stopPropagation();
                if (sessionStorage.getItem('currentUser')) userDropdown.classList.toggle('active');
                else { setAuthMode(false); authOverlay.classList.add('active'); }
            };
        }
        const signInBtn  = document.getElementById('signInBtn');
        const registerBtn = document.getElementById('registerBtn');
        const closeAuth  = document.getElementById('closeAuth');
        const logoutBtn  = document.getElementById('logoutBtn');
        if (signInBtn)   signInBtn.onclick   = handleSignIn;
        if (registerBtn) registerBtn.onclick = handleRegister;
        if (closeAuth)   closeAuth.onclick   = () => authOverlay.classList.remove('active');
        if (logoutBtn)   logoutBtn.onclick   = e => {
            e.preventDefault(); sessionStorage.removeItem('currentUser'); window.location.href = 'search.html';
        };

        const switchReg = document.getElementById('switchToRegister');
        if (switchReg) switchReg.onclick = e => { e.preventDefault(); setAuthMode(true); };

        // Contacts
        const contactsBtn    = document.getElementById('contactsBtn');
        const contactOverlay = document.getElementById('contactOverlay');
        const closeContact   = document.getElementById('closeContact');
        const sendContactBtn = document.getElementById('sendContactBtn');
        if (contactsBtn)    contactsBtn.onclick    = e => { e.preventDefault(); contactOverlay.classList.add('active'); };
        if (closeContact)   closeContact.onclick   = () => contactOverlay.classList.remove('active');
        if (sendContactBtn) sendContactBtn.onclick = handleSendContact;

        // Filter & sort panel toggles
        const filterBtn      = document.getElementById('openFilters');
        const filterPanel    = document.getElementById('filterPanel');
        const sortSelectInput = document.getElementById('openSort');
        const sortPanel      = document.getElementById('sortPanel');
        const sortWrapper    = document.querySelector('.sort-wrapper');
        if (filterBtn) {
            filterBtn.onclick = e => {
                e.stopPropagation();
                const opening = !filterPanel.classList.contains('active');
                filterPanel.classList.toggle('active');
                if (opening) { sortPanel?.classList.remove('active'); sortWrapper?.classList.remove('active'); }
            };
        }
        if (sortSelectInput) {
            sortSelectInput.onclick = e => {
                e.stopPropagation();
                const opening = !sortPanel.classList.contains('active');
                sortPanel.classList.toggle('active');
                sortWrapper.classList.toggle('active');
                if (opening) filterPanel?.classList.remove('active');
            };
        }

        const aptModalOverlay = document.getElementById('apartmentModalOverlay');
        document.onclick = e => {
            if (filterPanel && filterBtn && !filterPanel.contains(e.target) && e.target !== filterBtn)
                filterPanel.classList.remove('active');
            if (sortPanel && sortSelectInput && !sortPanel.contains(e.target) && e.target !== sortSelectInput) {
                sortPanel.classList.remove('active'); sortWrapper?.classList.remove('active');
            }
            if (userDropdown && loginBtn && !userDropdown.contains(e.target) && e.target !== loginBtn)
                userDropdown.classList.remove('active');
            if (authOverlay    && e.target === authOverlay)     authOverlay.classList.remove('active');
            if (aptModalOverlay && e.target === aptModalOverlay) aptModalOverlay.classList.remove('active');
            if (contactOverlay && e.target === contactOverlay)  contactOverlay.classList.remove('active');
        };

        // Preloader
        const preloader = document.getElementById('site-preloader');
        if (preloader) {
            window.addEventListener('load', () => setTimeout(() => preloader.classList.add('hidden'), 900));
            setTimeout(() => preloader.classList.add('hidden'), 1000);
        }
    }

    /* ── Apartment Page ── */
    if (page === 'apartment') {
        renderApartmentDetails();

        const toggle = document.getElementById('editModeToggle');
        if (toggle) {
            toggle.addEventListener('change', e => {
                isEditMode = e.target.checked;
                if (currentApt) renderAptCard(currentApt, isEditMode);
            });
        }
        // ── Auth wire-up (apartment page) ──
        updateAuthUI();
        setAuthMode(false);

        const loginBtn     = document.getElementById('loginBtn');
        const authOverlay  = document.getElementById('authOverlay');
        const userDropdown = document.getElementById('userDropdown');

        if (loginBtn) {
            loginBtn.onclick = e => {
                e.preventDefault(); e.stopPropagation();
                if (sessionStorage.getItem('currentUser')) userDropdown.classList.toggle('active');
                else { setAuthMode(false); authOverlay.classList.add('active'); }
            };
        }

        const signInBtn   = document.getElementById('signInBtn');
        const registerBtn = document.getElementById('registerBtn');
        const closeAuth   = document.getElementById('closeAuth');
        const switchReg   = document.getElementById('switchToRegister');
        const logoutBtn   = document.getElementById('logoutBtn');

        if (signInBtn)   signInBtn.onclick   = handleSignIn;
        if (registerBtn) registerBtn.onclick = handleRegister;
        if (closeAuth)   closeAuth.onclick   = () => authOverlay.classList.remove('active');
        if (switchReg)   switchReg.onclick   = e => { e.preventDefault(); setAuthMode(true); };
        if (logoutBtn)   logoutBtn.onclick   = e => {
            e.preventDefault(); sessionStorage.removeItem('currentUser'); window.location.reload();
        };

        // Contacts
        const contactsBtn    = document.getElementById('contactsBtn');
        const contactOverlay = document.getElementById('contactOverlay');
        const closeContact   = document.getElementById('closeContact');
        const sendContactBtn = document.getElementById('sendContactBtn');
        if (contactsBtn)    contactsBtn.onclick    = e => { e.preventDefault(); contactOverlay.classList.add('active'); };
        if (closeContact)   closeContact.onclick   = () => contactOverlay.classList.remove('active');
        if (sendContactBtn) sendContactBtn.onclick = handleSendContact;

        document.onclick = e => {
            if (userDropdown && loginBtn && !userDropdown.contains(e.target) && e.target !== loginBtn)
        userDropdown.classList.remove('active');
            if (authOverlay    && e.target === authOverlay)    authOverlay.classList.remove('active');
            if (contactOverlay && e.target === contactOverlay) contactOverlay.classList.remove('active');
        };
        const sendBtn  = document.getElementById('sendLandlordMsg');
        if (sendBtn) {
            const today    = new Date().toISOString().split('T')[0];
            const dateFrom = document.getElementById('landlordDateFrom');
            const dateTo   = document.getElementById('landlordDateTo');
            if (dateFrom) dateFrom.min = today;
            if (dateTo)   dateTo.min   = today;

            function updateDurationLabel() {
                const durationEl = document.getElementById('rentalDurationLabel');
                if (!dateFrom || !dateTo || !durationEl) return;
                const from = new Date(dateFrom.value);
                const to   = new Date(dateTo.value);
                if (dateFrom.value && dateTo.value && to > from) {
                    const days    = Math.round((to - from) / (1000 * 60 * 60 * 24));
                    const months  = Math.floor(days / 30);
                    const remDays = days % 30;
                    const label   = months > 0 ? `${months} міс. ${remDays > 0 ? remDays + ' дн.' : ''}` : `${days} дн.`;
                    durationEl.style.display = 'block';
                    durationEl.innerHTML = `<span class="duration-icon">📅</span> Тривалість: <b>${label}</b>`;
                } else {
                    durationEl.style.display = 'none';
                }
                if (dateFrom.value && dateTo) dateTo.min = dateFrom.value;
            }

            if (dateFrom) dateFrom.addEventListener('change', updateDurationLabel);
            if (dateTo)   dateTo.addEventListener('change',   updateDurationLabel);
            sendBtn.onclick = handleSendLandlordMsg;
        }
    }

    /* ── Admin Page ── */
    if (page === 'admin') {
        const cu = JSON.parse(sessionStorage.getItem('currentUser'));
        if (!cu || !cu.is_admin) { window.location.href = 'search.html'; return; }

        ['userModal', 'aptModal'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.addEventListener('click', e => { if (e.target === el) closeModal(id); });
        });
        initAptFilters();
        loadAdminData();
    }

    /* ── Settings Page ── */
    if (page === 'settings') {
        initSettingsPage();
    }

    /* ── Profile Page ── */
    if (page === 'profile') {
        initProfilePage();
    }

    // Гарантовано ховаємо preloader для всіх сторінок — на випадок якщо
    // конкретний init не спрацював або сторінка не розпізнана
    const preloaderGlobal = document.getElementById('site-preloader');
    if (preloaderGlobal) {
        setTimeout(() => preloaderGlobal.classList.add('hidden'), 1200);
    }
});
