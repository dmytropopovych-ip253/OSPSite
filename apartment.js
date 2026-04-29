document.addEventListener('DOMContentLoaded', () => {
    renderApartmentDetails();
});

async function renderApartmentDetails() {
    const selectedApartmentId = sessionStorage.getItem('selectedApartmentId');

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

    container.innerHTML = `
        <div class="apt-flex">
            <div class="apt-left">
                <img src="${selectedApt.image}" class="main-img" alt="фото">
            </div>
            <div class="apt-right">
                <div class="details-card">
                    <h1>${selectedApt.title}</h1>
                    <div class="price-tag">${selectedApt.price}$ <span>/ міс.</span></div>
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

async function renderRecommendations(currentId) {
    const { data: allData } = await supabaseClient
        .from('apartments')
        .select('*');

    const recGrid = document.getElementById('recommendGrid');

    if (!recGrid) return;

    const recommendations = allData
        .filter(a => a.id != currentId)
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
    sessionStorage.setItem('selectedApartmentId', id);
    window.location.reload();
};

window.openLandlordModal = function() {
    document.getElementById('landlordModal').classList.add('active');
};

window.closeLandlordModal = function() {
    document.getElementById('landlordModal').classList.remove('active');
};

document.addEventListener('DOMContentLoaded', () => {
    const sendBtn = document.getElementById('sendLandlordMsg');

    if (sendBtn) {
        sendBtn.onclick = async () => {
            const name = document.getElementById('contactName').value.trim();
            const email = document.getElementById('contactEmail').value;
            const message = document.getElementById('contactMessage').value.trim();

            if (!name || !email || !message) {
                return alert('Будь ласка, заповніть всі поля.');
            }
        }
    }
});