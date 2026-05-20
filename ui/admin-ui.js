/* ============================================================
   js/ui/admin-ui.js — Рендер таблиць адмін-панелі
   ============================================================
   Функції:
     renderUsersTable, renderContactMessagesTable,
     renderRentalMessagesTable, renderAdminAptsTable
   Залежності:
     - ../utils.js → formatDate
   ============================================================ */

import { formatDate } from '../utils.js';

export function renderUsersTable(accounts) {
    const uBody = document.querySelector('#usersTable tbody');
    if (!uBody) return;
    uBody.innerHTML = accounts.map(acc => `
        <tr>
            <td><b>${acc.login}</b></td>
            <td>${acc.email || '-'}</td>
            <td>${acc.is_admin ? 'Адмін' : 'Юзер'}</td>
            <td>
                <button class="action-btn edit-btn"   onclick="editUser('${acc.login}')">Ред.</button>
                <button class="action-btn delete-btn" onclick="deleteUser('${acc.login}')">Вид.</button>
            </td>
        </tr>
    `).join('') || '<tr><td colspan="4" class="empty-row">Немає користувачів</td></tr>';
}

export function renderContactMessagesTable(messages) {
    const mBody = document.querySelector('#messagesTable tbody');
    if (!mBody) return;
    mBody.innerHTML = messages.map(m => `
        <tr>
            <td style="font-size:12px">${m.date || '-'}</td>
            <td><b>${m.name}</b></td>
            <td><a href="mailto:${m.email}">${m.email}</a></td>
            <td class="msg-text">${m.message}</td>
            <td><button class="action-btn delete-btn" onclick="deleteMsg('${m.id}')">Вид.</button></td>
        </tr>
    `).join('') || '<tr><td colspan="5" class="empty-row">Повідомлень немає</td></tr>';
}

export function renderRentalMessagesTable(rentalMessages, aptsMap) {
    const rmBody = document.querySelector('#rentalMessagesTable tbody');
    if (!rmBody) return;
    rmBody.innerHTML = rentalMessages.map(m => {
        const periodHtml = m.rental_period
            ? `<span class="rental-period-badge">${m.rental_period}</span>`
            : (m.date_from && m.date_to
                ? `<span class="rental-period-badge">${formatDate(m.date_from)} — ${formatDate(m.date_to)}</span>`
                : '<span style="color:var(--text-light);font-style:italic;font-size:12px;">—</span>');
        return `
            <tr>
                <td style="font-size:12px;white-space:nowrap">${m.date || '-'}</td>
                <td><b>${m.user_login || m.name || '-'}</b></td>
                <td><a href="mailto:${m.email}">${m.email}</a></td>
                <td>${m.apartment_id
                    ? `<a href="apartment.html?id=${m.apartment_id}" style="color:var(--brand);text-decoration:none;font-weight:600;">${aptsMap[m.apartment_id] || 'Квартира #' + m.apartment_id}</a>`
                    : '-'}</td>
                <td>${periodHtml}</td>
                <td class="msg-text">${m.message && m.message !== '—' ? m.message : '<span style="color:var(--text-light);font-style:italic;font-size:12px;">—</span>'}</td>
                <td><button class="action-btn delete-btn" onclick="deleteRentalMsg('${m.id}')">Вид.</button></td>
            </tr>
        `;
    }).join('') || '<tr><td colspan="7" class="empty-row">Повідомлень немає</td></tr>';
}

export function renderAdminAptsTable(apartments, aptsFiltered) {
    const badge = document.getElementById('aptTotalBadge');
    if (badge) badge.textContent = apartments.length > 0 ? apartments.length : '';

    const aBody = document.querySelector('#aptsTable tbody');
    if (!aBody) return;
    aBody.innerHTML = aptsFiltered.map(apt => `
        <tr>
            <td><img src="${apt.image}" onerror="this.src='https://placehold.co/60x40'"></td>
            <td>${apt.title}</td>
            <td>$${apt.price}</td>
            <td>${apt.address}</td>
            <td>
                <button class="action-btn edit-btn"   onclick="editApt('${apt.id}')">Ред.</button>
                <button class="action-btn delete-btn" onclick="deleteApt('${apt.id}')">Вид.</button>
            </td>
        </tr>
    `).join('') || '<tr><td colspan="5" class="empty-row">Список порожній</td></tr>';
}
