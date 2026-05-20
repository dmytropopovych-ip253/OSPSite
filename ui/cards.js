/* ============================================================
   js/ui/cards.js — Картки квартир, пагінація, лоадер
   ============================================================
   Функції:
     renderCurrentPage, renderCards, renderPagination,
     showPageLoading, goToApartment
   Залежності:
     - ../state.js  → currentPage, setCurrentPage,
                      currentFilteredData, itemsPerPage
     - ../utils.js  → buildAvailabilityHTML
   ============================================================ */

import { currentPage, setCurrentPage, currentFilteredData, itemsPerPage } from '../state.js';
import { buildAvailabilityHTML } from '../utils.js';

export function renderCurrentPage() {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const pageData   = currentFilteredData.slice(startIndex, startIndex + itemsPerPage);
    renderCards(pageData);
    renderPagination(currentFilteredData.length);
}

export function renderCards(data) {
    const container = document.getElementById('apartments');
    if (!container) return;
    container.innerHTML = '';

    data.forEach((item, index) => {
        const card = document.createElement('div');
        card.className = 'card card-fadein';
        card.style.animationDelay = `${index * 40}ms`;
        card.style.cursor = 'pointer';

        card.addEventListener('click', e => {
            if (!e.target.closest('.admin-btn')) goToApartment(item.id);
        });

        const availabilityHTML = buildAvailabilityHTML(item);

        card.innerHTML = `
            <div class="card-img-container">
                <img src="${item.image}" alt="flat">
            </div>
            <div class="card-content">
                <h3 class="card-title">${item.title}</h3>
                <div class="info-block">
                    <div class="info-line"><span class="label">Кімнат:</span><span class="val">${item.rooms}</span></div>
                    <div class="info-line"><span class="label">Адреса:</span><span class="val">${item.address}</span></div>
                    <div class="info-line"><span class="label">Поверх:</span><span class="val">${item.floor}</span></div>
                </div>
                ${availabilityHTML}
                <div class="card-footer" style="flex-wrap:wrap;">
                    <div class="price">${item.price}$ / міс.</div>
                    <div class="admin-actions">
                        <button class="admin-btn edit-btn"   onclick="editApartment('${item.id}')">Редагувати</button>
                        <button class="admin-btn delete-btn" onclick="deleteApartment('${item.id}')">Видалити</button>
                    </div>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

export function renderPagination(totalItems) {
    const paginationContainer = document.getElementById('pagination');
    if (!paginationContainer) return;
    paginationContainer.innerHTML = '';

    const totalPages = Math.ceil(totalItems / itemsPerPage);
    if (totalPages <= 1) return;

    for (let i = 1; i <= totalPages; i++) {
        const btn = document.createElement('button');
        btn.className = `page-btn ${i === currentPage ? 'active' : ''}`;
        btn.innerText = i;
        btn.onclick = () => {
            setCurrentPage(i);
            const section = document.getElementById('apartments');
            if (section) window.scrollTo({ top: section.offsetTop - 100, behavior: 'smooth' });
            showPageLoading();
            setTimeout(() => renderCurrentPage(), 900);
        };
        paginationContainer.appendChild(btn);
    }
}

export function showPageLoading() {
    const container = document.getElementById('apartments');
    if (!container) return;
    container.innerHTML = `
        <div style="grid-column:1/-1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:80px 20px;gap:20px;">
            <div class="page-loader"></div>
            <p style="color:#888;font-size:15px;margin:0;">Завантаження квартир...</p>
        </div>`;
}

window.goToApartment = function (id) {
    window.location.href = `apartment.html?id=${id}`;
};
