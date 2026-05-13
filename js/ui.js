/* ============================================================
   UI.JS — Функції для побудови HTML і рендеру у DOM
   ============================================================ */

/* ── Apartment Cards (Search Page) ── */

function renderCurrentPage() {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const pageData   = currentFilteredData.slice(startIndex, startIndex + itemsPerPage);
    renderCards(pageData);
    renderPagination(currentFilteredData.length);
}

function renderCards(data) {
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

function renderPagination(totalItems) {
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
            currentPage = i;
            const section = document.getElementById('apartments');
            if (section) window.scrollTo({ top: section.offsetTop - 100, behavior: 'smooth' });
            showPageLoading();
            setTimeout(() => renderCurrentPage(), 900);
        };
        paginationContainer.appendChild(btn);
    }
}

function showPageLoading() {
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


/* ── Auth UI ── */

function updateAuthUI() {
    const currentUser    = JSON.parse(sessionStorage.getItem('currentUser'));
    const loginBtn       = document.getElementById('loginBtn');
    const adminControls  = document.getElementById('adminControls');
    const adminPanelLink = document.getElementById('adminPanelLink');

    if (currentUser) {
        if (loginBtn) { loginBtn.innerText = currentUser.login; loginBtn.href = '#'; }
        const isAdmin = currentUser.is_admin;
        if (adminControls)  adminControls.style.display  = isAdmin ? 'flex'  : 'none';
        if (adminPanelLink) adminPanelLink.style.display = isAdmin ? 'block' : 'none';
    } else {
        if (loginBtn)       loginBtn.innerText           = 'Увійти';
        if (adminControls)  adminControls.style.display  = 'none';
        if (adminPanelLink) adminPanelLink.style.display = 'none';
    }
}

function setAuthMode(register) {
    isRegisterMode = register;
    const modal     = document.getElementById('authModal');
    const signInBtn = document.getElementById('signInBtn');
    const registerBtn = document.getElementById('registerBtn');
    if (!modal) return;

    if (register) {
        modal.classList.add('register-mode');
        modal.querySelector('h2').innerText = 'Реєстрація';
        const sub = modal.querySelector('.modal-subtitle');
        if (sub) sub.innerText = 'Створіть акаунт безкоштовно';
        if (signInBtn)   signInBtn.style.display   = 'none';
        if (registerBtn) { registerBtn.style.display = 'block'; registerBtn.innerText = 'Зареєструватися'; }
        const toggleEl = modal.querySelector('.auth-toggle-link');
        if (toggleEl) {
            toggleEl.innerHTML = 'Вже є акаунт? <a id="switchToLogin">Увійти</a>';
            const sw = document.getElementById('switchToLogin');
            if (sw) sw.onclick = e => { e.preventDefault(); setAuthMode(false); };
        }
    } else {
        modal.classList.remove('register-mode');
        modal.querySelector('h2').innerText = 'Авторизація';
        const sub = modal.querySelector('.modal-subtitle');
        if (sub) sub.innerText = 'Раді бачити вас знову!';
        if (signInBtn)   { signInBtn.style.display = 'block'; signInBtn.innerText = 'Увійти'; }
        if (registerBtn) registerBtn.style.display = 'none';
        const toggleEl = modal.querySelector('.auth-toggle-link');
        if (toggleEl) {
            toggleEl.innerHTML = 'Немає акаунта? <a id="switchToRegister">Зареєструйтеся</a>';
            const sw = document.getElementById('switchToRegister');
            if (sw) sw.onclick = e => { e.preventDefault(); setAuthMode(true); };
        }
        ['authEmail', 'authLogin', 'authPassword'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = '';
        });
    }
}

function showToast(msg, type = 'success') {
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    t.className   = `toast ${type} show`;
    clearTimeout(t._tid);
    t._tid = setTimeout(() => t.classList.remove('show'), 3500);
}


/* ── Apartment Detail Card (apartment.js) ── */

function renderAptCard(apt, isEditMode) {
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
        const availabilityHTML = buildAvailabilityHTML(apt);
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

function renderRecommendationCards(recommendations) {
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

/* ── Admin Tables (admin.js) ── */

function renderUsersTable(accounts) {
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

function renderContactMessagesTable(messages) {
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

function renderRentalMessagesTable(rentalMessages, aptsMap) {
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

function renderAdminAptsTable(apartments, aptsFiltered) {
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


/* ── Profile Messages (profile.js) ── */

function renderProfileMessages(list, aptsMap) {
    const msgContainer = document.getElementById('messagesList');
    if (!msgContainer) return;

    if (list.length === 0) {
        msgContainer.innerHTML = `
            <div class="empty-profile">
                <div class="empty-icon">📭</div>
                <p>Ви ще не надсилали повідомлень по оренді.<br>
                   <a href="search.html" style="color:var(--brand);font-weight:600;">Переглянути квартири →</a>
                </p>
            </div>`;
        return;
    }

    msgContainer.innerHTML = list.map(m => `
        <div class="rental-msg-item">
            <div class="msg-item-top">
                <div class="msg-apt-title">
                    🏠 ${aptsMap[m.apartment_id] || 'Квартира'}
                    <span class="msg-type-tag">Оренда</span>
                    ${m.apartment_id ? `<a href="apartment.html?id=${m.apartment_id}">Переглянути →</a>` : ''}
                </div>
                <span class="msg-date">${m.date || ''}</span>
            </div>
            <div class="msg-body">${m.message}</div>
        </div>
    `).join('');
}


/* ── Settings — Avatar ── */

let avatarDataURL = null;

function applyAvatar(src) {
    const img = document.getElementById('avatarImg');
    const ini = document.getElementById('avatarInitial');
    if (!img || !ini) return;
    img.src = src;
    img.style.display = 'block';
    ini.style.display = 'none';
    const removeBtn = document.getElementById('removeAvatarBtn');
    if (removeBtn) removeBtn.style.display = 'inline-flex';
    avatarDataURL = src;
}

function removeAvatarUI() {
    const img = document.getElementById('avatarImg');
    const ini = document.getElementById('avatarInitial');
    if (img) { img.src = ''; img.style.display = 'none'; }
    if (ini) ini.style.display = '';
    const removeBtn = document.getElementById('removeAvatarBtn');
    if (removeBtn) removeBtn.style.display = 'none';
    avatarDataURL = null;
}

function triggerAvatarUpload() {
    const input = document.getElementById('avatarFileInput');
    if (input) input.click();
}


/* ── Settings — Password Strength ── */

function checkStrength(val) {
    const fill  = document.getElementById('strengthFill');
    const label = document.getElementById('strengthLabel');
    if (!fill || !label) return;
    if (!val) { fill.style.width = '0'; label.textContent = ''; return; }

    let score = 0;
    if (val.length >= 8)          score++;
    if (/[A-Z]/.test(val))        score++;
    if (/[0-9]/.test(val))        score++;
    if (/[^A-Za-z0-9]/.test(val)) score++;

    const levels = [
        { w: '20%',  bg: '#e53935', text: '😟 Дуже слабкий' },
        { w: '40%',  bg: '#ff9800', text: '🤔 Слабкий'       },
        { w: '65%',  bg: '#fdd835', text: '😐 Середній'      },
        { w: '85%',  bg: '#4caf50', text: '😊 Надійний'      },
        { w: '100%', bg: '#1b5e20', text: '💪 Дуже надійний' },
    ];
    const lv = levels[Math.min(score, 4)];
    fill.style.width      = lv.w;
    fill.style.background = lv.bg;
    label.textContent     = lv.text;
    label.style.color     = lv.bg;
}

function togglePw(inputId, btn) {
    const inp    = document.getElementById(inputId);
    if (!inp) return;
    const hidden = inp.type === 'password';
    inp.type     = hidden ? 'text' : 'password';
    btn.textContent = hidden ? '🙈' : '👁';
}
