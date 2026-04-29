let accounts = [];
let apartments = [];
let messages = [];

const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));

if (!currentUser || !currentUser.is_admin) {
    window.location.href = 'search.html';
}

async function loadData() {
    const { data: accountsData } = await supabaseClient.from('accounts').select('*');
    const { data: apartmentsData } = await supabaseClient.from('apartments').select('*');
    const { data: messagesData } = await supabaseClient.from('contact_messages').select('*');

    accounts = accountsData || [];
    apartments = apartmentsData || [];
    messages = messagesData || [];

    render();
}

function render() {
    const uBody = document.querySelector('#usersTable tbody');
    uBody.innerHTML = accounts.map(acc => `
        <tr>
            <td><b>${acc.login}</b></td>
            <td>${acc.email || '-'}</td>
            <td>${acc.is_admin ? 'Адмін' : 'Юзер'}</td>
            <td>
                <button class="action-btn edit-btn" onclick="editUser('${acc.login}')">⚙️ Ред.</button>
                <button class="action-btn delete-btn" onclick="deleteUser('${acc.login}')">🗑️ Вид.</button>
            </td>
        </tr>
    `).join('') || '<tr><td colspan="4" class="empty-row">Немає користувачів</td></tr>';

    const aBody = document.querySelector('#aptsTable tbody');
    aBody.innerHTML = apartments.map(apt => `
        <tr>
            <td><img src="${apt.image}" onerror="this.src='https://placehold.co/60x40'"></td>
            <td>${apt.title}</td>
            <td>$${apt.price}</td>
            <td>${apt.address}</td>
            <td>
                <button class="action-btn edit-btn" onclick="editApt('${apt.id}')">⚙️ Ред.</button>
                <button class="action-btn delete-btn" onclick="deleteApt('${apt.id}')">🗑️ Вид.</button>
            </td>
        </tr>
    `).join('') || '<tr><td colspan="5" class="empty-row">Список порожній</td></tr>';

    const mBody = document.querySelector('#messagesTable tbody');
    mBody.innerHTML = messages.map(m => `
        <tr>
            <td style="font-size:12px">${m.date || '-'}</td>
            <td><b>${m.name}</b></td>
            <td><a href="mailto:${m.email}">${m.email}</a></td>
            <td class="msg-text">${m.message}</td>
            <td><button class="action-btn delete-btn" onclick="deleteMsg('${m.id}')">🗑️ Вид.</button></td>
        </tr>
    `).join('') || '<tr><td colspan="5" class="empty-row">Повідомлень немає</td></tr>';
}

window.closeModal = function(id) {
    document.getElementById(id).classList.remove('active');
};
function openModal(id) {
    document.getElementById(id).classList.add('active');
}

window.openUserModal = function() {
    document.getElementById('userModalTitle').innerText = 'Додати користувача';
    document.getElementById('oldUserLogin').value = '';
    document.getElementById('userLogin').value = '';
    document.getElementById('userEmail').value = '';
    document.getElementById('userPassword').value = '';
    document.getElementById('userIsAdmin').checked = false;
    openModal('userModal');
};

window.editUser = function(login) {
    const acc = accounts.find(a => a.login === login);
    if (!acc) return;
    document.getElementById('userModalTitle').innerText = 'Редагувати користувача';
    document.getElementById('oldUserLogin').value = acc.login;
    document.getElementById('userLogin').value = acc.login;
    document.getElementById('userEmail').value = acc.email || '';
    document.getElementById('userPassword').value = acc.password || '';
    document.getElementById('userIsAdmin').checked = !!acc.is_admin;
    openModal('userModal');
};

window.saveUser = async function() {
    const login    = document.getElementById('userLogin').value.trim();
    const email    = document.getElementById('userEmail').value.trim();
    const password = document.getElementById('userPassword').value.trim();
    const is_admin = document.getElementById('userIsAdmin').checked;
    const oldLogin = document.getElementById('oldUserLogin').value.trim();

    if (!login || !password) return alert('Заповніть логін та пароль');

    let error;
    if (oldLogin) {
        ({ error } = await supabaseClient.from('accounts').update({ login, email, password, is_admin }).eq('login', oldLogin));
    } else {
        const { data: existing } = await supabaseClient.from('accounts').select('login').eq('login', login);
        if (existing && existing.length > 0) return alert('Логін вже зайнятий');
        ({ error } = await supabaseClient.from('accounts').insert([{ login, email, password, is_admin }]));
    }

    if (error) { console.error(error); return alert('Помилка: ' + error.message); }
    closeModal('userModal');
    loadData();
};

window.deleteUser = async function(login) {
    if (!confirm(`Видалити користувача "${login}"?`)) return;
    const { error } = await supabaseClient.from('accounts').delete().eq('login', login);
    if (error) { console.error(error); return alert('Помилка: ' + error.message); }
    loadData();
};

window.openAptModal = function() {
    document.getElementById('aptModalTitle').innerText = 'Додати квартиру';
    ['aptId','aptTitle','aptAddress','aptPrice','aptImage'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    openModal('aptModal');
};

window.editApt = function(id) {
    const apt = apartments.find(a => String(a.id) === String(id));
    if (!apt) return;
    document.getElementById('aptModalTitle').innerText = 'Редагувати квартиру';
    document.getElementById('aptId').value = apt.id;
    document.getElementById('aptTitle').value = apt.title || '';
    document.getElementById('aptAddress').value = apt.address || '';
    document.getElementById('aptPrice').value = apt.price || '';
    document.getElementById('aptImage').value = apt.image || '';
    openModal('aptModal');
};

window.saveApt = async function() {
    const id      = document.getElementById('aptId').value;
    const title   = document.getElementById('aptTitle').value.trim();
    const address = document.getElementById('aptAddress').value.trim();
    const price   = document.getElementById('aptPrice').value;
    const image   = document.getElementById('aptImage').value.trim();

    if (!title || !address || !price) return alert('Заповніть назву, адресу та ціну');

    const aptData = { title, address, price, image };

    let error;
    if (id) {
        ({ error } = await supabaseClient.from('apartments').update(aptData).eq('id', id));
    } else {
        ({ error } = await supabaseClient.from('apartments').insert([aptData]));
    }

    if (error) { console.error(error); return alert('Помилка: ' + error.message); }
    closeModal('aptModal');
    loadData();
};

window.deleteApt = async function(id) {
    if (!confirm('Видалити цю квартиру?')) return;
    const { error } = await supabaseClient.from('apartments').delete().eq('id', id);
    if (error) { console.error(error); return alert('Помилка: ' + error.message); }
    loadData();
};

window.deleteMsg = async function(id) {
    if (!confirm('Видалити це повідомлення?')) return;
    const { error } = await supabaseClient.from('contact_messages').delete().eq('id', id);
    if (error) { console.error(error); return alert('Помилка: ' + error.message); }
    loadData();
};

document.addEventListener('DOMContentLoaded', () => {
    ['userModal', 'aptModal'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('click', e => { if (e.target === el) closeModal(id); });
    });
});

loadData();