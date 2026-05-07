/* ============================================================
     1. State & Auth Guard
     2. Data Loading
     3. Render Tables
     4. Modal Helpers
     5. User CRUD
     6. Apartment CRUD
     7. Contact Messages
     8. Rental Messages
     9. Init (DOMContentLoaded)
   ============================================================ */


/* ── 1. State & Auth Guard ── */

let accounts       = [];
let apartments     = [];
let messages       = [];
let rentalMessages = [];

const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));

// Redirect non-admins immediately
if (!currentUser || !currentUser.is_admin) {
    window.location.href = 'search.html';
}


/* ── 2. Data Loading ── */

async function loadData() {
    const { data: accountsData  } = await supabaseClient.from('accounts').select('*');
    const { data: apartmentsData} = await supabaseClient.from('apartments').select('*');
    const { data: messagesData  } = await supabaseClient.from('contact_messages').select('*');
    const { data: rentalData    } = await supabaseClient.from('rental_messages').select('*');

    accounts       = accountsData   || [];
    apartments     = apartmentsData || [];
    messages       = messagesData   || [];
    rentalMessages = rentalData     || [];

    render();
}


/* ── 3. Render Tables ── */

function render() {

    // Users table
    const uBody = document.querySelector('#usersTable tbody');
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

    // Apartments table
    const aBody = document.querySelector('#aptsTable tbody');
    aBody.innerHTML = apartments.map(apt => `
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

    // Contact messages table
    const mBody = document.querySelector('#messagesTable tbody');
    mBody.innerHTML = messages.map(m => `
        <tr>
            <td style="font-size:12px">${m.date || '-'}</td>
            <td><b>${m.name}</b></td>
            <td><a href="mailto:${m.email}">${m.email}</a></td>
            <td class="msg-text">${m.message}</td>
            <td><button class="action-btn delete-btn" onclick="deleteMsg('${m.id}')">Вид.</button></td>
        </tr>
    `).join('') || '<tr><td colspan="5" class="empty-row">Повідомлень немає</td></tr>';

    // Rental messages table
    const rmBody = document.querySelector('#rentalMessagesTable tbody');
    if (rmBody) {
        const aptsMap = {};
        apartments.forEach(a => aptsMap[a.id] = a.title);

        rmBody.innerHTML = rentalMessages.map(m => `
            <tr>
                <td style="font-size:12px">${m.date || '-'}</td>
                <td><b>${m.user_login || m.name || '-'}</b></td>
                <td><a href="mailto:${m.email}">${m.email}</a></td>
                <td>${m.apartment_id
                    ? `<a href="apartment.html?id=${m.apartment_id}" style="color:var(--brand);text-decoration:none;font-weight:600;">${aptsMap[m.apartment_id] || 'Квартира #' + m.apartment_id}</a>`
                    : '-'}</td>
                <td class="msg-text">${m.message}</td>
                <td><button class="action-btn delete-btn" onclick="deleteRentalMsg('${m.id}')">Вид.</button></td>
            </tr>
        `).join('') || '<tr><td colspan="6" class="empty-row">Повідомлень немає</td></tr>';
    }
}


/* ── 4. Modal Helpers ── */

window.closeModal = function (id) { document.getElementById(id).classList.remove('active'); };
function openModal(id)             { document.getElementById(id).classList.add('active');    }


/* ── 5. User CRUD ── */

window.openUserModal = function () {
    document.getElementById('userModalTitle').innerText = 'Додати користувача';
    document.getElementById('oldUserLogin').value   = '';
    document.getElementById('userLogin').value      = '';
    document.getElementById('userEmail').value      = '';
    document.getElementById('userPassword').value   = '';
    document.getElementById('userIsAdmin').checked  = false;
    openModal('userModal');
};

window.editUser = function (login) {
    const acc = accounts.find(a => a.login === login);
    if (!acc) return;
    document.getElementById('userModalTitle').innerText = 'Редагувати користувача';
    document.getElementById('oldUserLogin').value  = acc.login;
    document.getElementById('userLogin').value     = acc.login;
    document.getElementById('userEmail').value     = acc.email     || '';
    document.getElementById('userPassword').value  = acc.password  || '';
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
        // Update existing user
        ({ error } = await supabaseClient.from('accounts').update({ login, email, password, is_admin }).eq('login', oldLogin));
    } else {
        // Create new user — check for duplicate login first
        const { data: existing } = await supabaseClient.from('accounts').select('login').eq('login', login);
        if (existing && existing.length > 0) return alert('Логін вже зайнятий');
        ({ error } = await supabaseClient.from('accounts').insert([{ login, email, password, is_admin }]));
    }

    if (error) { console.error(error); return alert('Помилка: ' + error.message); }
    closeModal('userModal');
    loadData();
};

window.deleteUser = async function (login) {
    if (!confirm(`Видалити користувача "${login}"?`)) return;
    const { error } = await supabaseClient.from('accounts').delete().eq('login', login);
    if (error) { console.error(error); return alert('Помилка: ' + error.message); }
    loadData();
};


/* ── 6. Apartment CRUD ── */

window.openAptModal = function () {
    document.getElementById('aptModalTitle').innerText = 'Додати квартиру';
    ['aptId', 'aptTitle', 'aptAddress', 'aptPrice'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    const fileInput = document.getElementById('aptImage');
    if (fileInput) fileInput.value = '';
    const preview = document.getElementById('adminAptImagePreview');
    if (preview) { preview.src = ''; preview.style.display = 'none'; }
    openModal('aptModal');
};

window.editApt = function (id) {
    const apt = apartments.find(a => String(a.id) === String(id));
    if (!apt) return;
    document.getElementById('aptModalTitle').innerText = 'Редагувати квартиру';
    document.getElementById('aptId').value      = apt.id;
    document.getElementById('aptTitle').value   = apt.title   || '';
    document.getElementById('aptAddress').value = apt.address || '';
    document.getElementById('aptPrice').value   = apt.price   || '';
    const fileInput = document.getElementById('aptImage');
    if (fileInput) fileInput.value = '';
    const preview = document.getElementById('adminAptImagePreview');
    if (preview && apt.image) { preview.src = apt.image; preview.style.display = 'block'; }
    else if (preview)          { preview.style.display = 'none'; }
    openModal('aptModal');
};

window.saveApt = async function () {
    const id      = document.getElementById('aptId').value;
    const title   = document.getElementById('aptTitle').value.trim();
    const address = document.getElementById('aptAddress').value.trim();
    const price   = document.getElementById('aptPrice').value;
    const fileInput = document.getElementById('aptImage');
    const file    = fileInput && fileInput.files && fileInput.files[0];

    if (!title || !address || !price) return alert('Заповніть назву, адресу та ціну');

    const saveBtn = document.querySelector('#aptModal .auth-action-btn');
    if (saveBtn) { saveBtn.disabled = true; saveBtn.innerText = 'Збереження...'; }

    // Keep existing image if editing without a new file
    let imageUrl = '';
    if (id && !file) {
        const existing = apartments.find(a => String(a.id) === String(id));
        imageUrl = existing ? existing.image : '';
    }

    // Upload new image if provided
    if (file) {
        const ext      = file.name.split('.').pop();
        const fileName = `apt_${Date.now()}.${ext}`;
        const { error: uploadError } = await supabaseClient
            .storage.from('apartment-images')
            .upload(fileName, file, { upsert: true, contentType: file.type });

        if (uploadError) {
            alert('Помилка завантаження фото: ' + uploadError.message);
            if (saveBtn) { saveBtn.disabled = false; saveBtn.innerText = 'Зберегти'; }
            return;
        }
        const { data: urlData } = supabaseClient.storage.from('apartment-images').getPublicUrl(fileName);
        imageUrl = urlData.publicUrl;
    }

    const aptData = { title, address, price, image: imageUrl };
    let error;
    if (id) {
        ({ error } = await supabaseClient.from('apartments').update(aptData).eq('id', id));
    } else {
        ({ error } = await supabaseClient.from('apartments').insert([aptData]));
    }

    if (saveBtn) { saveBtn.disabled = false; saveBtn.innerText = 'Зберегти'; }
    if (error)   { console.error(error); return alert('Помилка: ' + error.message); }

    closeModal('aptModal');
    loadData();
};

window.deleteApt = async function (id) {
    if (!confirm('Видалити цю квартиру?')) return;
    const { error } = await supabaseClient.from('apartments').delete().eq('id', id);
    if (error) { console.error(error); return alert('Помилка: ' + error.message); }
    loadData();
};


/* ── 7. Contact Messages ── */

window.deleteMsg = async function (id) {
    if (!confirm('Видалити це повідомлення?')) return;
    const { error } = await supabaseClient.from('contact_messages').delete().eq('id', id);
    if (error) { console.error(error); return alert('Помилка: ' + error.message); }
    loadData();
};


/* ── 8. Rental Messages ── */

window.deleteRentalMsg = async function (id) {
    if (!confirm('Видалити це повідомлення по оренді?')) return;
    const { error } = await supabaseClient.from('rental_messages').delete().eq('id', id);
    if (error) { console.error(error); return alert('Помилка: ' + error.message); }
    loadData();
};


/* ── 9. Init (DOMContentLoaded) ── */

document.addEventListener('DOMContentLoaded', () => {
    // Close modals on backdrop click
    ['userModal', 'aptModal'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('click', e => { if (e.target === el) closeModal(id); });
    });
});

loadData();
