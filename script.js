let allData = [];
let currentFilteredData = [];
let currentPage = 1;
const itemsPerPage = 16;
let currentSort = 'new';

const container = document.getElementById('apartments');
const filterPanel = document.getElementById('filterPanel');
const sortPanel = document.getElementById('sortPanel');
const filterBtn = document.getElementById('openFilters');
const sortSelectInput = document.getElementById('openSort');
const sortWrapper = document.querySelector('.sort-wrapper');
const roomButtons = document.querySelectorAll('.room-btn');
const applyFiltersBtn = document.getElementById('applyFilters');

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

const editModeToggle = document.getElementById('editModeToggle');
const addApartmentBtn = document.getElementById('addApartmentBtn');
const aptModalOverlay = document.getElementById('apartmentModalOverlay');
const closeApartmentModal = document.getElementById('closeApartmentModal');
const saveApartmentBtn = document.getElementById('saveApartmentBtn');

async function loadApartments() {
    const { data, error } = await supabaseClient
        .from('apartments')
        .select('*');

    if (error) {
        console.error(error);
        return;
    }

    allData = data || [];
    applyFiltersAndSort();
}

loadApartments();

function applyFiltersAndSort() {
    let result = [...allData];

    const activeRoomButtons = document.querySelectorAll('.room-btn.active');
    const selectedRooms = Array.from(activeRoomButtons).map(btn =>
        btn.innerText.trim()
    );

    if (selectedRooms.length > 0) {
        result = result.filter(item => {
            const roomCount = item.rooms.charAt(0);
            return selectedRooms.includes(roomCount);
        });
    }

    const priceFrom = document.getElementById('priceFrom');
    const priceTo = document.getElementById('priceTo');

    if (priceFrom && priceTo && (priceFrom.value || priceTo.value)) {
        const minPrice = parseFloat(priceFrom.value) || 0;
        const maxPrice = parseFloat(priceTo.value) || Infinity;

        result = result.filter(item => {
            const itemPrice = parseFloat(item.price);
            return itemPrice >= minPrice && itemPrice <= maxPrice;
        });
    }

    if (currentSort === 'cheap') {
        result.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
    }

    if (currentSort === 'expensive') {
        result.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
    }

    currentFilteredData = result;
    currentPage = 1;

    renderCurrentPage();
}

function renderCurrentPage() {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;

    const pageData = currentFilteredData.slice(startIndex, endIndex);

    render(pageData);
    renderPagination(currentFilteredData.length);
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
        showPageLoading();

        const apartmentsSection = document.getElementById('apartments');
        if (apartmentsSection) {
            window.scrollTo({ top: apartmentsSection.offsetTop - 100, behavior: 'smooth' });
        }

        setTimeout(() => {
            renderCurrentPage();
        }, 500);
        };

        paginationContainer.appendChild(btn);
    }
}

function render(data) {
    if (!container) return;

    container.innerHTML = '';

    data.forEach(item => {
        const card = document.createElement('div');

        card.className = 'card';

        card.innerHTML = `
            <div class="card-img-container">
                <img src="${item.image}" alt="flat">
            </div>

            <div class="card-content">
                <h3 class="card-title">${item.title}</h3>

                <div class="info-block">
                    <div class="info-line">
                        <span class="label">Кімнат:</span>
                        <span class="val">${item.rooms}</span>
                    </div>

                    <div class="info-line">
                        <span class="label">Адреса:</span>
                        <span class="val">${item.address}</span>
                    </div>

                    <div class="info-line">
                        <span class="label">Поверх:</span>
                        <span class="val">${item.floor}</span>
                    </div>
                </div>

                <div class="card-footer" style="flex-wrap: wrap;">
                    <div class="price">${item.price}$ / міс.</div>

                    <button class="buy-btn" onclick="goToApartment(${item.id})">
                        Орендувати
                    </button>

                    <div class="admin-actions">
                        <button class="admin-btn edit-btn" onclick="editApartment('${item.id}')">
                            Редагувати
                        </button>

                        <button class="admin-btn delete-btn" onclick="deleteApartment('${item.id}')">
                            Видалити
                        </button>
                    </div>
                </div>
            </div>
        `;

        container.appendChild(card);
    });
}

if (filterBtn) {
    filterBtn.onclick = e => {
        e.stopPropagation();
        filterPanel.classList.toggle('active');
    };
}

if (sortSelectInput) {
    sortSelectInput.onclick = e => {
        e.stopPropagation();

        sortPanel.classList.toggle('active');
        sortWrapper.classList.toggle('active');
    };
}

roomButtons.forEach(btn => {
    btn.onclick = e => {
        e.stopPropagation();

        btn.classList.toggle('active');

        applyFiltersAndSort();
    };
});

if (applyFiltersBtn) {
    applyFiltersBtn.onclick = () => {
        applyFiltersAndSort();
        filterPanel.classList.remove('active');
    };
}

document.querySelectorAll('.sort-dropdown .sort-option').forEach(option => {
    option.onclick = () => {
        currentSort = option.dataset.sort;

        const currentSortEl = document.getElementById('currentSort');

        if (currentSortEl) {
            currentSortEl.innerText = option.innerText;
        }

        applyFiltersAndSort();

        sortPanel.classList.remove('active');
        sortWrapper.classList.remove('active');
    };
});

if (editModeToggle) {
    editModeToggle.addEventListener('change', e => {
        if (e.target.checked) {
            document.body.classList.add('admin-mode');

            if (addApartmentBtn) {
                addApartmentBtn.style.display = 'block';
            }
        } else {
            document.body.classList.remove('admin-mode');

            if (addApartmentBtn) {
                addApartmentBtn.style.display = 'none';
            }
        }
    });
}

if (addApartmentBtn) {
    addApartmentBtn.onclick = () => {
        document.getElementById('apartmentModalTitle').innerText =
            'Додати квартиру';

        document.getElementById('aptId').value = '';
        document.getElementById('aptTitle').value = '';
        document.getElementById('aptRooms').value = '';
        document.getElementById('aptAddress').value = '';
        document.getElementById('aptFloor').value = '';
        document.getElementById('aptPrice').value = '';
        document.getElementById('aptImage').value = '';

        aptModalOverlay.classList.add('active');
    };
}

if (closeApartmentModal) {
    closeApartmentModal.onclick = () => {
        aptModalOverlay.classList.remove('active');
    };
}

window.deleteApartment = async function(id) {
    if (!confirm('Ви впевнені, що хочете видалити цю квартиру?')) {
        return;
    }

    const { error } = await supabaseClient
        .from('apartments')
        .delete()
        .eq('id', id);

    if (error) {
        console.error(error);
        return;
    }

    loadApartments();
};

window.editApartment = function(id) {
    const item = allData.find(apt => apt.id == id);

    if (!item) return;

    document.getElementById('apartmentModalTitle').innerText =
        'Редагувати квартиру';

    document.getElementById('aptId').value = item.id;
    document.getElementById('aptTitle').value = item.title;
    document.getElementById('aptRooms').value = item.rooms;
    document.getElementById('aptAddress').value = item.address;
    document.getElementById('aptFloor').value = item.floor;
    document.getElementById('aptPrice').value = item.price;
    document.getElementById('aptImage').value = item.image;

    aptModalOverlay.classList.add('active');
};

if (saveApartmentBtn) {
    saveApartmentBtn.onclick = async () => {
        const id = document.getElementById('aptId').value;

        const newApt = {
            title: document.getElementById('aptTitle').value,
            rooms: document.getElementById('aptRooms').value,
            address: document.getElementById('aptAddress').value,
            floor: document.getElementById('aptFloor').value,
            price: document.getElementById('aptPrice').value,
            image: document.getElementById('aptImage').value
        };

        let error;

        if (id) {
            ({ error } = await supabaseClient
                .from('apartments')
                .update(newApt)
                .eq('id', id));
        } else {
            ({ error } = await supabaseClient
                .from('apartments')
                .insert([newApt]));
        }

        if (error) {
            console.error(error);
            return;
        }

        aptModalOverlay.classList.remove('active');

        loadApartments();
    };
}

if (loginBtn) {
    loginBtn.onclick = e => {
        e.preventDefault();
        e.stopPropagation();

        if (sessionStorage.getItem('currentUser')) {
            userDropdown.classList.toggle('active');
        } else {
            authOverlay.classList.add('active');
        }
    };
}

if (signInBtn) {
    signInBtn.onclick = async () => {
        const { data: accounts, error } = await supabaseClient
            .from('accounts')
            .select('*');

        if (error) {
            console.error(error);
            return;
        }

        const user = accounts.find(
            acc =>
                acc.login === loginInput.value.trim() &&
                acc.password === passwordInput.value.trim()
        );

        if (user) {
            sessionStorage.setItem(
                'currentUser',
                JSON.stringify(user)
            );

            authOverlay.classList.remove('active');

            updateAuthUI();
        } else {
            alert('Невірний логін або пароль');
        }
    };
}

if (registerBtn) {
    registerBtn.onclick = async () => {
        const login = loginInput.value.trim();
        const password = passwordInput.value.trim();
        const email = emailInput.value.trim();

        if (!login || !password) {
            return alert('Заповніть поля');
        }

        const { data: existingUsers } = await supabaseClient
            .from('accounts')
            .select('*')
            .eq('login', login);

        if (existingUsers.length > 0) {
            return alert('Логін зайнятий');
        }

        const { error } = await supabaseClient
            .from('accounts')
            .insert([
                {
                    login,
                    password,
                    email,
                    is_admin: false
                }
            ]);

        if (error) {
            console.error(error);
            return;
        }

        alert('Успішно зареєстровано. Тепер увійдіть');
    };
}

function updateAuthUI() {
    const currentUser = JSON.parse(
        sessionStorage.getItem('currentUser')
    );

    const adminPanelLink =
        document.getElementById('adminPanelLink');

    if (currentUser) {
        if (loginBtn) {
            loginBtn.innerText = currentUser.login;
            loginBtn.href = '#';
        }

        if (currentUser.is_admin) {
            if (adminControls) {
                adminControls.style.display = 'flex';
            }

            if (adminPanelLink) {
                adminPanelLink.style.display = 'block';
            }
        } else {
            if (adminControls) {
                adminControls.style.display = 'none';
            }

            if (adminPanelLink) {
                adminPanelLink.style.display = 'none';
            }
        }
    } else {
        if (loginBtn) {
            loginBtn.innerText = 'Увійти';
        }

        if (adminControls) {
            adminControls.style.display = 'none';
        }

        if (adminPanelLink) {
            adminPanelLink.style.display = 'none';
        }
    }
}

if (logoutBtn) {
    logoutBtn.onclick = e => {
        e.preventDefault();

        sessionStorage.removeItem('currentUser');

        window.location.href = 'search.html';
    };
}

if (closeAuth) {
    closeAuth.onclick = () => {
        authOverlay.classList.remove('active');
    };
}

document.onclick = e => {
    if (
        filterPanel &&
        filterBtn &&
        !filterPanel.contains(e.target) &&
        e.target !== filterBtn
    ) {
        filterPanel.classList.remove('active');
    }

    if (
        sortPanel &&
        sortWrapper &&
        sortSelectInput &&
        !sortPanel.contains(e.target) &&
        e.target !== sortSelectInput
    ) {
        sortPanel.classList.remove('active');
        sortWrapper.classList.remove('active');
    }

    if (
        userDropdown &&
        loginBtn &&
        !userDropdown.contains(e.target) &&
        e.target !== loginBtn
    ) {
        userDropdown.classList.remove('active');
    }

    if (authOverlay && e.target === authOverlay) {
        authOverlay.classList.remove('active');
    }

    if (aptModalOverlay && e.target === aptModalOverlay) {
        aptModalOverlay.classList.remove('active');
    }

    if (contactOverlay && e.target === contactOverlay) {
        contactOverlay.classList.remove('active');
    }
};

const contactsBtn = document.getElementById('contactsBtn');
const contactOverlay = document.getElementById('contactOverlay');
const closeContact = document.getElementById('closeContact');
const sendContactBtn = document.getElementById('sendContactBtn');

if (contactsBtn) {
    contactsBtn.onclick = e => {
        e.preventDefault();

        if (contactOverlay) {
            contactOverlay.classList.add('active');
        }
    };
}

if (closeContact) {
    closeContact.onclick = () => {
        contactOverlay.classList.remove('active');
    };
}

if (sendContactBtn) {
    sendContactBtn.onclick = async () => {
        const name = document.getElementById('contactName').value.trim();

        const email =
            document.getElementById('contactEmail').value;

        const message =
            document.getElementById('contactMessage').value.trim();

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!name || !email || !message) {
            return alert('Заповніть всі поля.');
        }

        if (!emailRegex.test(email)) {
            return alert('Введіть коректну пошту!');
        }

        const { error } = await supabaseClient
            .from('contact_messages')
            .insert([
                {
                    name,
                    email,
                    message,
                    date: new Date().toLocaleString('uk-UA')
                }
            ]);

        if (error) {
            console.error(error);
            return;
        }

        alert(`Дякуємо, ${name}! Повідомлення надіслано.`);

        document.getElementById('contactName').value = '';
        document.getElementById('contactEmail').value = '';
        document.getElementById('contactMessage').value = '';

        contactOverlay.classList.remove('active');
    };
}

window.goToApartment = function(id) {
    sessionStorage.setItem('selectedApartmentId', id);

    window.location.href = 'apartment.html';
};

document.addEventListener('DOMContentLoaded', () => {
    updateAuthUI();
});
function showPageLoading() {
    if (!container) return;
    container.innerHTML = `
        <div style="grid-column: 1/-1; display:flex; flex-direction:column; align-items:center; justify-content:center; padding: 80px 20px; gap: 20px;">
            <div class="page-loader"></div>
            <p style="color:#888; font-size:15px; margin:0;">Завантаження квартир...</p>
        </div>
    `;
}