document.addEventListener('DOMContentLoaded', () => {
    renderApartmentDetails();
});

function renderApartmentDetails() {
    const selectedApt = JSON.parse(localStorage.getItem('selectedApartment'));
    const container = document.getElementById('mainAptContent');

    if (!selectedApt || !container) {
        window.location.href = 'search.html';
        return;
    }

    container.innerHTML = `
        <div class="apt-flex">
            <div class="apt-left">
                <img src="${selectedApt.image}" class="main-img" alt="фото">
            </div>
            <div class="apt-right">
                <div class="details-card">
                    <h1>${selectedApt.title}</h1>
                    <div class="price-tag">$${selectedApt.price} <span>/ міс.</span></div>
                    <div class="apt-specs">
                        <div class="spec-item"><b>Адреса:</b> ${selectedApt.address}</div>
                        <div class="spec-item"><b>Кімнат:</b> ${selectedApt.rooms}</div>
                        <div class="spec-item"><b>Поверх:</b> ${selectedApt.floor}</div>
                    </div>
                    <button class="action-btn-main" onclick="openLandlordModal()">Зв'язатися з орендодавцем</button>
                </div>
            </div>
        </div>
    `;
    renderRecommendations(selectedApt.id);
}

function renderRecommendations(currentId) {
    const allData = JSON.parse(localStorage.getItem('apartmentsData')) || [];
    const recGrid = document.getElementById('recommendGrid');
    if (!recGrid) return;

    const recommendations = allData
        .filter(a => a.id !== currentId)
        .sort(() => 0.5 - Math.random())
        .slice(0, 4);

    recGrid.innerHTML = recommendations.map(item => `
        <div class="card" onclick="viewNewApt('${item.id}')" style="cursor:pointer">
            <img src="${item.image}" style="width:100%; height:150px; object-fit:cover; border-radius:8px;">
            <h4>${item.title}</h4>
            <p>$${item.price}</p>
        </div>
    `).join('');
}

window.viewNewApt = function(id) {
    const allData = JSON.parse(localStorage.getItem('apartmentsData'));
    const apt = allData.find(a => a.id === id);
    localStorage.setItem('selectedApartment', JSON.stringify(apt));
    window.location.reload();
};