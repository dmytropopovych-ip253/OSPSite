/* ============================================================
   js/ui/apartment-ui.js — Рендер деталей квартири і рекомендацій
   ============================================================
   Функції:
     renderAptCard, renderRecommendationCards
   Залежності:
     - ../utils.js → buildAvailabilityHTML
   ============================================================ */

import { buildAvailabilityHTML } from '../utils.js';

export function renderAptCard(apt, isEditMode) {
    const container = document.getElementById('mainAptContent');
    if (!container) return;

    if (isEditMode) {
        container.innerHTML = `
            <div class="apt-flex">
                <div class="apt-left"></div>
                <div class="apt-right">
                    <div class="details-card edit-mode-card">
                        <div class="edit-badge">Режим редагування</div>
                        <div class="edit-field">
                            <label>Заголовок</label>
                            <input class="edit-input" id="edit-title" value="${apt.title || ''}">
                        </div>
                        <div class="edit-field">
                            <label>Ціна ($/міс.)</label>
                            <input class="edit-input" id="edit-price" type="number" value="${apt.price || ''}">
                        </div>
                        <div class="edit-field">
                            <label>Адреса</label>
                            <input class="edit-input" id="edit-address" value="${apt.address || ''}">
                        </div>
                        <div class="edit-field">
                            <label>Кімнат</label>
                            <input class="edit-input" id="edit-rooms" value="${apt.rooms || ''}">
                        </div>
                        <div class="edit-field">
                            <label>Поверх</label>
                            <input class="edit-input" id="edit-floor" value="${apt.floor || ''}">
                        </div>
                        <div class="edit-field">
                            <label>Фото квартири</label>
                            <img id="previewImg" src="${apt.image}" class="main-img" alt="фото" style="margin-bottom:10px;">
                            <input type="file" id="edit-image" accept="image/*"
                                style="width:100%;padding:8px;border:1px solid #ddd;border-radius:8px;box-sizing:border-box;cursor:pointer;"
                                onchange="const f=this.files[0];if(f)document.getElementById('previewImg').src=URL.createObjectURL(f);">
                        </div>
                        <div class="edit-field">
                            <label>Опис</label>
                            <textarea class="edit-input edit-textarea" id="edit-description">${apt.description || ''}</textarea>
                        </div>
                        <div class="edit-actions">
                            <button class="action-btn-main save-btn"            onclick="saveApartment()">Зберегти зміни</button>
                            <button class="action-btn-secondary delete-apt-btn" onclick="deleteApartment()">Видалити квартиру</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    } else {
        const descriptionBlock = apt.description
            ? `<div class="apt-description"><h3>Опис</h3><p>${apt.description}</p></div>`
            : '';
        const availabilityHTML  = buildAvailabilityHTML(apt);
        const availabilityBlock = availabilityHTML
            ? `<div class="apt-description" style="border-top:none;padding-top:0;margin-top:0;margin-bottom:4px;">${availabilityHTML}</div>`
            : '';
        container.innerHTML = `
            <div class="apt-flex">
                <div class="apt-left">
                    <img src="${apt.image}" class="main-img" alt="фото">
                </div>
                <div class="apt-right">
                    <div class="details-card">
                        <h1>${apt.title}</h1>
                        <div class="price-tag">${apt.price}$ <span>/ міс.</span></div>
                        <div class="apt-specs">
                            <div class="spec-item"><b>Адреса:</b> ${apt.address}</div>
                            <div class="spec-item"><b>Кімнат:</b> ${apt.rooms}</div>
                            <div class="spec-item"><b>Поверх:</b> ${apt.floor}</div>
                        </div>
                        ${availabilityBlock}
                        ${descriptionBlock}
                        <button class="action-btn-main" onclick="openLandlordModal()">Орендувати</button>
                    </div>
                </div>
            </div>
        `;
    }
}

export function renderRecommendationCards(recommendations) {
    const recGrid = document.getElementById('recommendGrid');
    if (!recGrid) return;
    recGrid.innerHTML = recommendations.map(item => {
        const availabilityHTML = buildAvailabilityHTML(item);
        return `
        <div class="card" onclick="viewNewApt('${item.id}')" style="cursor:pointer">
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
                <div class="card-footer">
                    <div class="price">${item.price}$ / міс.</div>
                </div>
            </div>
        </div>`;
    }).join('');
}
