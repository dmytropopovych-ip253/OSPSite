/* ============================================================
   APARTMENT.JS  —  Single Apartment Detail Page
   ============================================================
   Sections:
     1. State
     2. Data Loading & Routing
     3. Card Rendering (view / edit modes)
     4. Save & Delete Apartment
     5. Recommendations
     6. Landlord Contact Modal
     7. Init (DOMContentLoaded)
   ============================================================ */


/* ── 1. State ── */

let currentApt = null;
let isEditMode = false;


/* ── 2. Data Loading & Routing ── */

async function renderApartmentDetails() {
    const urlParams          = new URLSearchParams(window.location.search);
    const selectedApartmentId = urlParams.get('id');

    const { data: selectedApt } = await supabaseClient
        .from('apartments')
        .select('*')
        .eq('id', selectedApartmentId)
        .single();

    const container = document.getElementById('mainAptContent');
    if (!selectedApt || !container) {
        window.location.href = 'search.html';
        return;
    }

    currentApt = selectedApt;
    renderCard(currentApt);
    renderRecommendations(currentApt.id);
}


/* ── 3. Card Rendering ── */

function renderCard(apt) {
    const container = document.getElementById('mainAptContent');
    if (!container) return;

    if (isEditMode) {
        // Edit mode — show form fields
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
        // View mode — read-only details
        const descriptionBlock = apt.description
            ? `<div class="apt-description"><h3>Опис</h3><p>${apt.description}</p></div>`
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
                        ${descriptionBlock}
                        <button class="action-btn-main" onclick="openLandlordModal()">Орендувати</button>
                    </div>
                </div>
            </div>
        `;
    }
}


/* ── 4. Save & Delete Apartment ── */

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

    // Upload new image if a file was selected
    if (file) {
        const ext      = file.name.split('.').pop();
        const fileName = `apt_${Date.now()}.${ext}`;
        const { error: uploadError } = await supabaseClient
            .storage.from('apartment-images')
            .upload(fileName, file, { upsert: true, contentType: file.type });

        if (uploadError) return alert('Помилка завантаження фото: ' + uploadError.message);

        const { data: urlData } = supabaseClient.storage.from('apartment-images').getPublicUrl(fileName);
        imageUrl = urlData.publicUrl;
    }

    const { error } = await supabaseClient
        .from('apartments')
        .update({ title, price, address, rooms, floor, image: imageUrl, description })
        .eq('id', currentApt.id);

    if (error) { console.error(error); return alert('Помилка збереження: ' + error.message); }

    currentApt = { ...currentApt, title, price, address, rooms, floor, image: imageUrl, description };
    alert('Збережено!');
    window.location.reload();
};

window.deleteApartment = async function () {
    if (!confirm(`Видалити квартиру "${currentApt.title}"? Цю дію не можна скасувати.`)) return;

    const { error } = await supabaseClient.from('apartments').delete().eq('id', currentApt.id);
    if (error) { console.error(error); return alert('Помилка видалення: ' + error.message); }

    window.location.href = 'search.html';
};


/* ── 5. Recommendations ── */

async function renderRecommendations(currentId) {
    const { data: allData } = await supabaseClient.from('apartments').select('*');
    const recGrid = document.getElementById('recommendGrid');
    if (!recGrid) return;

    // Pick 4 random apartments excluding the current one
    const recommendations = allData
        .filter(a => a.id != currentId)
        .sort(() => 0.5 - Math.random())
        .slice(0, 4);

    recGrid.innerHTML = recommendations.map(item => `
        <div class="card" onclick="viewNewApt('${item.id}')" style="cursor:pointer">
            <img src="${item.image}" style="width:100%;height:150px;object-fit:cover;border-radius:8px;">
            <h4>${item.title}</h4>
            <p>$${item.price}</p>
        </div>
    `).join('');
}

window.viewNewApt = function (id) {
    window.location.href = 'apartment.html?id=' + id;
};


/* ── 6. Landlord Contact Modal ── */

window.openLandlordModal  = function () { document.getElementById('landlordModal').classList.add('active');    };
window.closeLandlordModal = function () { document.getElementById('landlordModal').classList.remove('active'); };


/* ── 7. Init (DOMContentLoaded) ── */

document.addEventListener('DOMContentLoaded', () => {
    renderApartmentDetails();

    // Edit mode toggle
    const toggle = document.getElementById('editModeToggle');
    if (toggle) {
        toggle.addEventListener('change', e => {
            isEditMode = e.target.checked;
            if (currentApt) renderCard(currentApt);
        });
    }

    // Landlord message form submit
    const sendBtn = document.getElementById('sendLandlordMsg');
    if (sendBtn) {
        sendBtn.onclick = async () => {
            const name    = document.getElementById('landlordName').value.trim();
            const email   = document.getElementById('landlordEmail').value.trim();
            const message = document.getElementById('landlordMessage').value.trim();
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            if (!name || !email || !message) return alert('Будь ласка, заповніть всі поля.');
            if (!emailRegex.test(email))     return alert('Введіть коректний email');

            const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
            const aptId       = new URLSearchParams(window.location.search).get('id');

            const { error } = await supabaseClient
                .from('rental_messages')
                .insert([{
                    message_id:   crypto.randomUUID(),
                    name,
                    email,
                    message,
                    apartment_id: aptId,
                    user_login:   currentUser ? currentUser.login : null,
                    date:         new Date().toLocaleString('uk-UA')
                }]);

            if (error) { console.error(error); return alert('Помилка відправки: ' + error.message); }

            alert(`Дякуємо, ${name}! Ваше повідомлення надіслано орендодавцю.`);
            document.getElementById('landlordName').value    = '';
            document.getElementById('landlordEmail').value   = '';
            document.getElementById('landlordMessage').value = '';
            document.getElementById('landlordModal').classList.remove('active');
        };
    }
});
