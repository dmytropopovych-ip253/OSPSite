/* ============================================================
   js/app.js — Точка входу (entry point)
   ============================================================
   Єдина відповідальність: визначити поточну сторінку по URL
   та передати керування відповідному модулю.

   Логіка сторінок більше тут не живе — вона у:
     search    → filters/search-page.js (фільтри, сортування, модал квартири)
     apartment → apartment-page.js
     admin     → admin-page.js
     settings  → settings-page.js
     profile   → profile-page.js
   Auth і contacts — спільні для всіх сторінок:
     auth.js, contacts.js
   ============================================================ */

import {
    apiFetchApartments, apiDeleteApartment,
    apiInsertApartment, apiUpdateApartment, apiUploadApartmentImage,
} from '../services/api.js';

import {
    allData, setAllData,
    currentFilteredData, setCurrentFilteredData,
    currentPage, setCurrentPage,
    currentSort, setCurrentSort,
} from '../state.js';

import {
    renderCurrentPage, updateAuthUI, setAuthMode, showPageLoading,
} from '../ui/ui.js';

import { initAuth }            from './auth.js';
import { initContactsModal }   from './contacts.js';
import { initApartmentPage }   from './apartment-page.js';
import { initAdminPage }       from './admin-page.js';
import { initSettingsPage }    from './settings-page.js';
import { initProfilePage }     from './profile-page.js';

/* ════════════════════════════════════════════════════════════
   SEARCH PAGE — фільтри, сортування, модал додавання квартири
   ════════════════════════════════════════════════════════════ */

function applyFiltersAndSort() {
    let result = [...allData];

    const activeRooms = Array.from(document.querySelectorAll('.room-btn.active')).map(b => b.innerText.trim());
    if (activeRooms.length) {
        result = result.filter(item => {
            const roomStr = String(item.rooms).trim();
            return activeRooms.includes(roomStr.charAt(0)) || activeRooms.includes(roomStr);
        });
    }

    const priceFrom = document.getElementById('priceFrom');
    const priceTo   = document.getElementById('priceTo');
    if (priceFrom && priceTo && (priceFrom.value || priceTo.value)) {
        const min = parseFloat(priceFrom.value) || 0;
        const max = parseFloat(priceTo.value)   || Infinity;
        result = result.filter(item => {
            const p = parseFloat(item.price);
            return p >= min && p <= max;
        });
    }

    const availFrom = document.getElementById('availDateFrom');
    const availTo   = document.getElementById('availDateTo');
    if (availFrom?.value || availTo?.value) {
        const filterFrom = availFrom?.value || null;
        const filterTo   = availTo?.value   || null;
        result = result.filter(item => {
            if (item.always_available) return true;
            const aptFrom = item.available_from ? item.available_from.slice(0, 10) : null;
            const aptTo   = item.available_to   ? item.available_to.slice(0, 10)   : null;
            if (!aptFrom && !aptTo) return false;
            if (filterFrom && aptFrom && aptFrom > filterFrom) return false;
            if (filterTo   && aptTo   && aptTo   < filterTo)   return false;
            return true;
        });
    }

    if (currentSort === 'cheap')     result.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
    if (currentSort === 'expensive') result.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));

    setCurrentFilteredData(result);
    setCurrentPage(1);
    renderCurrentPage();
}

async function loadApartments() {
    setAllData(await apiFetchApartments());
    applyFiltersAndSort();
}

async function handleSaveApartmentModal() {
    const saveBtn   = document.getElementById('saveApartmentBtn');
    const id        = document.getElementById('aptId').value;
    const fileInput = document.getElementById('aptImage');
    const file      = fileInput?.files?.[0];

    if (saveBtn) { saveBtn.disabled = true; saveBtn.innerText = 'Збереження...'; }

    let imageUrl = '';
    if (id && !file) {
        const existing = allData.find(a => String(a.id) === String(id));
        imageUrl = existing ? existing.image : '';
    }
    if (file) {
        const { url, error: uploadError } = await apiUploadApartmentImage(file);
        if (uploadError) {
            alert('Помилка завантаження фото: ' + uploadError.message);
            if (saveBtn) { saveBtn.disabled = false; saveBtn.innerText = 'Зберегти квартиру'; }
            return;
        }
        imageUrl = url;
    }

    const alwaysChk = document.getElementById('aptAlwaysAvail');
    const always    = alwaysChk ? alwaysChk.checked : false;
    const newApt = {
        title:            document.getElementById('aptTitle').value,
        rooms:            document.getElementById('aptRooms').value,
        address:          document.getElementById('aptAddress').value,
        floor:            document.getElementById('aptFloor').value,
        price:            document.getElementById('aptPrice').value,
        image:            imageUrl,
        always_available: always,
        available_from:   always ? null : (document.getElementById('aptAvailFrom').value || null),
        available_to:     always ? null : (document.getElementById('aptAvailTo').value   || null),
    };

    const error = id
        ? await apiUpdateApartment(id, newApt)
        : await apiInsertApartment(newApt);

    if (saveBtn) { saveBtn.disabled = false; saveBtn.innerText = 'Зберегти квартиру'; }
    if (error)   { console.error(error); return; }

    document.getElementById('apartmentModalOverlay')?.classList.remove('active');
    loadApartments();
}

window.editApartment = function (id) {
    const item = allData.find(apt => apt.id == id);
    if (!item) return;
    document.getElementById('apartmentModalTitle').innerText = 'Редагувати квартиру';
    document.getElementById('aptId').value        = item.id;
    document.getElementById('aptTitle').value     = item.title;
    document.getElementById('aptRooms').value     = item.rooms;
    document.getElementById('aptAddress').value   = item.address;
    document.getElementById('aptFloor').value     = item.floor;
    document.getElementById('aptPrice').value     = item.price;
    document.getElementById('aptAvailFrom').value = item.available_from ? item.available_from.slice(0, 10) : '';
    document.getElementById('aptAvailTo').value   = item.available_to   ? item.available_to.slice(0, 10)   : '';
    const alwaysChk = document.getElementById('aptAlwaysAvail');
    const dateRow   = document.getElementById('aptDateRow');
    if (alwaysChk) {
        alwaysChk.checked = !!item.always_available;
        if (dateRow) {
            dateRow.style.opacity       = item.always_available ? '0.4' : '1';
            dateRow.style.pointerEvents = item.always_available ? 'none' : 'auto';
        }
    }
    document.getElementById('aptImage').value = '';
    const preview = document.getElementById('aptImagePreview');
    if (preview && item.image) { preview.src = item.image; preview.style.display = 'block'; }
    document.getElementById('apartmentModalOverlay')?.classList.add('active');
};

window.deleteApartment = async function (id) {
    if (!confirm('Ви впевнені, що хочете видалити цю квартиру?')) return;
    const error = await apiDeleteApartment(id);
    if (error) { console.error(error); return; }
    loadApartments();
};

window.goToApartment = function (id) {
    window.location.href = `apartment.html?id=${id}`;
};

function initSearchPage() {
    initAuth();
    initContactsModal();
    loadApartments();

    const priceFromInput = document.getElementById('priceFrom');
    const priceToInput   = document.getElementById('priceTo');
    if (priceFromInput) priceFromInput.addEventListener('input', applyFiltersAndSort);
    if (priceToInput)   priceToInput.addEventListener('input',   applyFiltersAndSort);

    const availFromInput = document.getElementById('availDateFrom');
    const availToInput   = document.getElementById('availDateTo');
    if (availFromInput) availFromInput.addEventListener('change', applyFiltersAndSort);
    if (availToInput)   availToInput.addEventListener('change',   applyFiltersAndSort);

    const applyFiltersBtn = document.getElementById('applyFilters');
    if (applyFiltersBtn) applyFiltersBtn.style.display = 'none';

    document.querySelectorAll('.room-btn').forEach(btn => {
        btn.onclick = e => { e.stopPropagation(); btn.classList.toggle('active'); applyFiltersAndSort(); };
    });

    document.querySelectorAll('.sort-dropdown .sort-option').forEach(option => {
        option.onclick = () => {
            setCurrentSort(option.dataset.sort);
            const el = document.getElementById('currentSort');
            if (el) el.innerText = option.innerText;
            applyFiltersAndSort();
            document.getElementById('sortPanel')?.classList.remove('active');
            document.querySelector('.sort-wrapper')?.classList.remove('active');
        };
    });

    const alwaysChk = document.getElementById('aptAlwaysAvail');
    if (alwaysChk) {
        alwaysChk.addEventListener('change', () => {
            const dateRow = document.getElementById('aptDateRow');
            if (dateRow) {
                dateRow.style.opacity       = alwaysChk.checked ? '0.4' : '1';
                dateRow.style.pointerEvents = alwaysChk.checked ? 'none' : 'auto';
            }
        });
    }

    const editModeToggle  = document.getElementById('editModeToggle');
    const addApartmentBtn = document.getElementById('addApartmentBtn');
    if (editModeToggle) {
        editModeToggle.addEventListener('change', e => {
            document.body.classList.toggle('admin-mode', e.target.checked);
            if (addApartmentBtn) addApartmentBtn.style.display = e.target.checked ? 'block' : 'none';
        });
    }
    if (addApartmentBtn) {
        addApartmentBtn.onclick = () => {
            document.getElementById('apartmentModalTitle').innerText = 'Додати квартиру';
            ['aptId','aptTitle','aptRooms','aptAddress','aptFloor','aptPrice','aptAvailFrom','aptAvailTo','aptImage']
                .forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
            const chk = document.getElementById('aptAlwaysAvail');
            const row = document.getElementById('aptDateRow');
            if (chk) chk.checked = false;
            if (row) { row.style.opacity = '1'; row.style.pointerEvents = 'auto'; }
            const preview = document.getElementById('aptImagePreview');
            if (preview) { preview.src = ''; preview.style.display = 'none'; }
            document.getElementById('apartmentModalOverlay')?.classList.add('active');
        };
    }

    const saveApartmentBtn    = document.getElementById('saveApartmentBtn');
    const closeApartmentModal = document.getElementById('closeApartmentModal');
    if (saveApartmentBtn)    saveApartmentBtn.onclick    = handleSaveApartmentModal;
    if (closeApartmentModal) closeApartmentModal.onclick = () =>
        document.getElementById('apartmentModalOverlay')?.classList.remove('active');

    // Filter & sort panel toggles
    const filterBtn   = document.getElementById('openFilters');
    const filterPanel = document.getElementById('filterPanel');
    const sortInput   = document.getElementById('openSort');
    const sortPanel   = document.getElementById('sortPanel');
    const sortWrapper = document.querySelector('.sort-wrapper');
    if (filterBtn) {
        filterBtn.onclick = e => {
            e.stopPropagation();
            const opening = !filterPanel.classList.contains('active');
            filterPanel.classList.toggle('active');
            if (opening) { sortPanel?.classList.remove('active'); sortWrapper?.classList.remove('active'); }
        };
    }
    if (sortInput) {
        sortInput.onclick = e => {
            e.stopPropagation();
            const opening = !sortPanel.classList.contains('active');
            sortPanel.classList.toggle('active');
            sortWrapper?.classList.toggle('active');
            if (opening) filterPanel?.classList.remove('active');
        };
    }

    const aptModalOverlay = document.getElementById('apartmentModalOverlay');
    document.addEventListener('click', e => {
        if (filterPanel && filterBtn && !filterPanel.contains(e.target) && e.target !== filterBtn)
            filterPanel.classList.remove('active');
        if (sortPanel && sortInput && !sortPanel.contains(e.target) && e.target !== sortInput) {
            sortPanel.classList.remove('active'); sortWrapper?.classList.remove('active');
        }
        if (aptModalOverlay && e.target === aptModalOverlay) aptModalOverlay.classList.remove('active');
    });

    const preloader = document.getElementById('site-preloader');
    if (preloader) {
        window.addEventListener('load', () => setTimeout(() => preloader.classList.add('hidden'), 900));
        setTimeout(() => preloader.classList.add('hidden'), 1000);
    }
}

/* ════════════════════════════════════════════════════════════
   DOMContentLoaded — визначаємо сторінку і делегуємо
   ════════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname.toLowerCase();
    let page = 'search';
    if      (path.includes('apartment')) page = 'apartment';
    else if (path.includes('admin'))     page = 'admin';
    else if (path.includes('settings'))  page = 'settings';
    else if (path.includes('profile'))   page = 'profile';

    if (page === 'search')    initSearchPage();
    if (page === 'apartment') { initAuth(); initContactsModal(); initApartmentPage(); }
    if (page === 'admin')     initAdminPage();
    if (page === 'settings')  initSettingsPage();
    if (page === 'profile')   initProfilePage();

    // Гарантовано ховаємо preloader для всіх сторінок
    const preloaderGlobal = document.getElementById('site-preloader');
    if (preloaderGlobal) {
        setTimeout(() => preloaderGlobal.classList.add('hidden'), 1200);
    }
});
