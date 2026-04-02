let allData = [];
const container = document.getElementById('apartments');
const filterPanel = document.getElementById('filterPanel');
const sortPanel = document.getElementById('sortPanel');
const filterBtn = document.getElementById('openFilters');
const sortSelectInput = document.getElementById('openSort');
const sortWrapper = document.querySelector('.sort-wrapper');
const roomButtons = document.querySelectorAll('.room-btn');
const loginBtn = document.getElementById('loginBtn');
const authOverlay = document.getElementById('authOverlay');
const closeAuth = document.getElementById('closeAuth');
const signInBtn = document.getElementById('signInBtn');
const registerBtn = document.getElementById('registerBtn');
const loginInput = document.getElementById('authLogin');
const passwordInput = document.getElementById('authPassword');
const emailInput = document.getElementById('authEmail');
const userDropdown = document.getElementById('userDropdown');
const adminControls = document.getElementById('adminControls');
const logoutBtn = document.getElementById('logoutBtn');
fetch('data.json')
    .then(res => res.json())
    .then(data => {
        allData = data;
        render(data);
    }).catch(err => console.error("Помилка завантаження даних", err));
function render(data) {
    container.innerHTML = '';
    data.forEach(item => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <div class="card-img-container"><img src="${item.image}" alt="flat"></div>
            <div class="card-content">
                <h3 class="card-title">${item.title}</h3>
                <div class="info-block">
                    <div class="info-line"><span class="label">Кімнат:</span> <span class="val">${item.rooms}</span></div>
                    <div class="info-line"><span class="label">Адреса:</span> <span class="val">${item.address}</span></div>
                    <div class="info-line"><span class="label">Поверх:</span> <span class="val">${item.floor}</span></div>
                </div>
                <div class="card-footer">
                    <div class="price">${item.price}</div>
                    <button class="buy-btn">Орендувати</button>
                </div>
            </div>`;
        
        card.querySelector('.buy-btn').onclick = function() {
            this.classList.add('active-btn');
            setTimeout(() => this.classList.remove('active-btn'), 100);
        };
        container.appendChild(card);
    });
}
filterBtn.onclick = (e) => {
    e.stopPropagation();
    [sortPanel, sortWrapper, userDropdown].forEach(el => el?.classList.remove('active'));
    filterPanel.classList.toggle('active');
};
sortSelectInput.onclick = (e) => {
    e.stopPropagation();
    [filterPanel, userDropdown].forEach(el => el?.classList.remove('active'));
    sortPanel.classList.toggle('active');
    sortWrapper.classList.toggle('active');
};
roomButtons.forEach(btn => {
    btn.onclick = (e) => {
        e.stopPropagation();
        btn.classList.toggle('active');
    };
});
document.querySelectorAll('.sort-dropdown .sort-option').forEach(option => {
    option.onclick = () => {
        const sortType = option.dataset.sort;
        document.getElementById('currentSort').innerText = option.innerText;
        let sorted = [...allData];
        if (sortType === 'cheap') sorted.sort((a, b) => parseInt(a.price.replace(/\D/g, '')) - parseInt(b.price.replace(/\D/g, '')));
        if (sortType === 'expensive') sorted.sort((a, b) => parseInt(b.price.replace(/\D/g, '')) - parseInt(a.price.replace(/\D/g, '')));
        render(sorted);
        [sortPanel, sortWrapper].forEach(el => el.classList.remove('active'));
    };
});
function updateAuthUI() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (currentUser) {
        loginBtn.innerText = `Вітаю, ${currentUser.login}!`;
        loginBtn.onclick = (e) => {
            e.preventDefault(); e.stopPropagation();
            [filterPanel, sortPanel, sortWrapper].forEach(el => el.classList.remove('active'));
            userDropdown.classList.toggle('active');
        };
        if (currentUser.isAdmin) adminControls.style.display = 'flex';
    } else {
        loginBtn.innerText = 'Увійти';
        adminControls.style.display = 'none';
        loginBtn.onclick = (e) => {
            e.preventDefault();
            authOverlay.classList.add('active');
        };
    }
}
signInBtn.onclick = () => {
    const accounts = JSON.parse(localStorage.getItem('myAppAccounts')) || [];
    const user = accounts.find(acc => acc.login === loginInput.value.trim() && acc.password === passwordInput.value.trim());
    if (user) {
        localStorage.setItem('currentUser', JSON.stringify(user));
        authOverlay.classList.remove('active');
        updateAuthUI();
    } else {
        alert('Невірний логін або пароль');
    }
};
registerBtn.onclick = () => {
    const login = loginInput.value.trim();
    const accounts = JSON.parse(localStorage.getItem('myAppAccounts')) || [];
    if (!login || !passwordInput.value) return alert('Заповніть поля');
    if (accounts.some(acc => acc.login === login)) return alert('Логін зайнятий');
    accounts.push({ email: emailInput.value, login, password: passwordInput.value, isAdmin: false });
    localStorage.setItem('myAppAccounts', JSON.stringify(accounts));
    alert('Успішно зареєстровано');
};
logoutBtn.onclick = () => {
    localStorage.removeItem('currentUser');
    location.reload();
};
closeAuth.onclick = () => authOverlay.classList.remove('active');
document.onclick = (e) => {
    if (!filterPanel.contains(e.target) && e.target !== filterBtn) filterPanel.classList.remove('active');
    if (!sortPanel.contains(e.target) && e.target !== sortSelectInput) {
        sortPanel.classList.remove('active');
        sortWrapper.classList.remove('active');
    }
    if (!userDropdown.contains(e.target) && e.target !== loginBtn) userDropdown.classList.remove('active');
    if (e.target === authOverlay) authOverlay.classList.remove('active');
};
updateAuthUI();