/* ============================================================
   js/contacts.js — Контактна форма (модальне вікно)
   ============================================================
   Відповідає за:
     - відправку контактного повідомлення через Supabase
     - підключення обробників для contactOverlay
   Залежності:
     - api.js   → apiInsertContactMessage
     - utils.js → isValidEmail
   ============================================================ */

import { apiInsertContactMessage } from '../services/api.js';
import { isValidEmail }            from '../utils.js';

/* ── Обробник відправки ── */

export async function handleSendContact() {
    const name    = document.getElementById('contactName')?.value.trim();
    const email   = document.getElementById('contactEmail')?.value.trim();
    const message = document.getElementById('contactMessage')?.value.trim();

    if (!name || !email || !message) return alert('Заповніть всі поля.');
    if (!isValidEmail(email))        return alert('Введіть коректну пошту!');

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

/**
 * Підключає обробники до contactsBtn / contactOverlay / closeContact.
 * Викликати з DOMContentLoaded кожної сторінки де є ця модалка.
 */
export function initContactsModal() {
    const contactsBtn    = document.getElementById('contactsBtn');
    const contactOverlay = document.getElementById('contactOverlay');
    const closeContact   = document.getElementById('closeContact');
    const sendContactBtn = document.getElementById('sendContactBtn');

    if (contactsBtn && contactOverlay) {
        contactsBtn.onclick = e => { e.preventDefault(); contactOverlay.classList.add('active'); };
    }
    if (closeContact && contactOverlay) {
        closeContact.onclick = () => contactOverlay.classList.remove('active');
    }
    if (sendContactBtn) {
        sendContactBtn.onclick = handleSendContact;
    }

    // Закриття кліком на оверлей
    document.addEventListener('click', e => {
        if (contactOverlay && e.target === contactOverlay) {
            contactOverlay.classList.remove('active');
        }
    });
}
