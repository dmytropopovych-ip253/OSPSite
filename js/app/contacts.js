/* ============================================================
   js/contacts.js — Контактна форма (модальне вікно)
   ============================================================ */

import { apiInsertContactMessage } from '../services/api.js';

/* ── Підставити дані з поточного акаунту у форму ── */

function prefillContactForm() {
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
    const emailInput  = document.getElementById('contactEmail');
    const nameInput   = document.getElementById('contactName');

    if (currentUser) {
        // Залогінений — ховаємо email, підставляємо логін
        if (emailInput) {
            const wrap = emailInput.closest('.form-group, label, .input-wrap, .field');
            if (wrap) wrap.style.display = 'none';
            else      emailInput.style.display = 'none';
        }
        if (nameInput && !nameInput.value) nameInput.value = currentUser.login || '';
    } else {
        // Не залогінений — показуємо поле email
        if (emailInput) {
            const wrap = emailInput.closest('.form-group, label, .input-wrap, .field');
            if (wrap) wrap.style.display = '';
            else      emailInput.style.display = '';
        }
    }
}

/* ── Обробник відправки ── */

export async function handleSendContact() {
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
    const name    = document.getElementById('contactName')?.value.trim();
    const message = document.getElementById('contactMessage')?.value.trim();
    const email   = currentUser?.email
        || document.getElementById('contactEmail')?.value.trim()
        || '';

    if (!name || !message) return alert('Заповніть всі поля.');
    if (!email)            return alert('Будь ласка, введіть вашу пошту.');

    const error = await apiInsertContactMessage({
        name, email, message,
        date: new Date().toLocaleString('uk-UA'),
    });
    if (error) { console.error(error); return; }

    alert(`Дякуємо, ${name}! Повідомлення надіслано.`);
    ['contactName', 'contactEmail', 'contactMessage'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    document.getElementById('contactOverlay')?.classList.remove('active');
}

/* ── Ініціалізація модального вікна контактів ── */

export function initContactsModal() {
    const contactsBtn    = document.getElementById('contactsBtn');
    const contactOverlay = document.getElementById('contactOverlay');
    const closeContact   = document.getElementById('closeContact');
    const sendContactBtn = document.getElementById('sendContactBtn');

    if (contactsBtn && contactOverlay) {
        contactsBtn.onclick = e => {
            e.preventDefault();
            prefillContactForm();
            contactOverlay.classList.add('active');
        };
    }
    if (closeContact && contactOverlay) {
        closeContact.onclick = () => contactOverlay.classList.remove('active');
    }
    if (sendContactBtn) {
        sendContactBtn.onclick = handleSendContact;
    }

    document.addEventListener('click', e => {
        if (contactOverlay && e.target === contactOverlay) {
            contactOverlay.classList.remove('active');
        }
    });
}
