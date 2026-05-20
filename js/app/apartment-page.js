/* ============================================================
   js/apartment-page.js — Сторінка деталей квартири
   ============================================================
   Відповідає за:
     - завантаження та відображення деталей квартири
     - режим редагування (edit mode toggle)
     - форму запиту оренди (landlord modal)
     - блок рекомендацій
   Залежності:
     - api.js   → apiFetchApartmentById, apiFetchApartments,
                  apiUpdateApartment, apiDeleteApartment,
                  apiUploadApartmentImage, apiInsertRentalMessage
     - utils.js → isValidEmail, formatDate
     - ui.js    → renderAptCard, renderRecommendationCards
     - auth.js  → getCurrentUser
   ============================================================ */

import {
    apiFetchApartmentById, apiFetchApartments,
    apiUpdateApartment, apiDeleteApartment,
    apiUploadApartmentImage, apiInsertRentalMessage,
} from '../services/api.js';
import { isValidEmail, formatDate }              from '../utils.js';
import { renderAptCard, renderRecommendationCards } from '../ui/index.js';
import { getCurrentUser }                        from './auth.js';

let currentApt = null;
let isEditMode = false;

/* ── Завантаження деталей ── */

export async function renderApartmentDetails() {
    const id        = new URLSearchParams(window.location.search).get('id');
    const apt       = await apiFetchApartmentById(id);
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

/* ── Збереження / видалення (edit mode) ── */

window.saveApartment = async function () {
    const title       = document.getElementById('edit-title')?.value.trim();
    const price       = document.getElementById('edit-price')?.value.trim();
    const address     = document.getElementById('edit-address')?.value.trim();
    const rooms       = document.getElementById('edit-rooms')?.value.trim();
    const floor       = document.getElementById('edit-floor')?.value.trim();
    const description = document.getElementById('edit-description')?.value.trim();
    const fileInput   = document.getElementById('edit-image');
    const file        = fileInput?.files?.[0];

    if (!title || !price || !address) return alert('Заповніть хоча б заголовок, ціну та адресу');

    let imageUrl = currentApt.image;
    if (file) {
        const { url, error: uploadError } = await apiUploadApartmentImage(file);
        if (uploadError) return alert('Помилка завантаження фото: ' + uploadError.message);
        imageUrl = url;
    }

    const error = await apiUpdateApartment(currentApt.id, {
        title, price, address, rooms, floor, image: imageUrl, description,
    });
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

/* ── Landlord modal (запит оренди) ── */

window.openLandlordModal  = function () { document.getElementById('landlordModal')?.classList.add('active');    };
window.closeLandlordModal = function () { document.getElementById('landlordModal')?.classList.remove('active'); };
window.viewNewApt         = function (id) { window.location.href = 'apartment.html?id=' + id; };

async function handleSendLandlordMsg() {
    const name      = document.getElementById('landlordName')?.value.trim();
    const email     = document.getElementById('landlordEmail')?.value.trim();
    const message   = document.getElementById('landlordMessage')?.value.trim();
    const dateFromV = document.getElementById('landlordDateFrom')?.value || '';
    const dateToV   = document.getElementById('landlordDateTo')?.value   || '';

    if (!name || !email)                          return alert("Будь ласка, заповніть ім'я та email.");
    if (!isValidEmail(email))                     return alert('Введіть коректний email');
    if (!dateFromV || !dateToV)                   return alert('Будь ласка, оберіть дати оренди.');
    if (new Date(dateToV) <= new Date(dateFromV)) return alert('Дата виселення має бути пізніше дати заселення.');

    const days      = Math.round((new Date(dateToV) - new Date(dateFromV)) / (1000 * 60 * 60 * 24));
    const dateLabel = `${formatDate(dateFromV)} — ${formatDate(dateToV)} (${days} дн.)`;
    const user      = getCurrentUser();
    const aptId     = new URLSearchParams(window.location.search).get('id');

    const error = await apiInsertRentalMessage({
        message_id:    crypto.randomUUID(),
        name, email,
        message:       message || '—',
        apartment_id:  aptId,
        user_login:    user ? user.login : null,
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
    document.getElementById('landlordModal')?.classList.remove('active');
}

/* ── Ініціалізація сторінки ── */

export function initApartmentPage() {
    renderApartmentDetails();

    // Edit mode toggle
    const toggle = document.getElementById('editModeToggle');
    if (toggle) {
        toggle.addEventListener('change', e => {
            isEditMode = e.target.checked;
            if (currentApt) renderAptCard(currentApt, isEditMode);
        });
    }

    // Landlord form — дати
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
                const label   = months > 0
                    ? `${months} міс. ${remDays > 0 ? remDays + ' дн.' : ''}`
                    : `${days} дн.`;
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
