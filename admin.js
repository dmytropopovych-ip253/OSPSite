    let accounts = JSON.parse(localStorage.getItem('myAppAccounts')) || [];
    let apartments = JSON.parse(localStorage.getItem('apartmentsData')) || [];
    let messages = JSON.parse(localStorage.getItem('contactMessages')) || [];
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));

    if (!currentUser || !currentUser.isAdmin) {
        window.location.href = 'search.html';
    }

    function render() {
        const uBody = document.querySelector('#usersTable tbody');
        uBody.innerHTML = accounts.map(acc => `
            <tr>
                <td><b>${acc.login}</b></td>
                <td>${acc.email || '-'}</td>
                <td>${acc.isAdmin ? 'Адмін' : 'Юзер'}</td>
                <td>
                    <button class="action-btn edit-btn" onclick="editUser('${acc.login}')">⚙️</button>
                    <button class="action-btn delete-btn" onclick="deleteUser('${acc.login}')">🗑️</button>
                </td>
            </tr>`).join('') || '<tr><td colspan="4" class="empty-row">Немає користувачів</td></tr>';
        const aBody = document.querySelector('#aptsTable tbody');
        aBody.innerHTML = apartments.map(apt => `
            <tr>
                <td><img src="${apt.image}"></td>
                <td>${apt.title}</td>
                <td>$${apt.price}</td>
                <td>${apt.address}</td>
                <td>
                    <button class="action-btn edit-btn" onclick="editApt('${apt.id}')">⚙️</button>
                    <button class="action-btn delete-btn" onclick="deleteApt('${apt.id}')">🗑️</button>
                </td>
            </tr>`).join('') || '<tr><td colspan="5" class="empty-row">Список порожній</td></tr>';
        const mBody = document.querySelector('#messagesTable tbody');
        mBody.innerHTML = messages.map(m => `
            <tr>
                <td style="font-size:12px">${m.date}</td>
                <td><b>${m.name}</b></td>
                <td><a href="mailto:${m.email}">${m.email}</a></td>
                <td class="msg-text">${m.message}</td>
                <td><button class="action-btn delete-btn" onclick="deleteMsg('${m.id}')">Видалити</button></td>
            </tr>`).join('') || '<tr><td colspan="5" class="empty-row">Повідомлень немає</td></tr>';
    }
    function saveUser() {
        const login = document.getElementById('userLogin').value;
        const pass = document.getElementById('userPassword').value;
        const old = document.getElementById('oldUserLogin').value;
        
        if(!login || !pass) return alert("Заповніть логін/пароль");
        
        const newUser = { 
            login, 
            password: pass, 
            email: document.getElementById('userEmail').value,
            isAdmin: document.getElementById('userIsAdmin').checked
        };

        if(old) {
            const idx = accounts.findIndex(u => u.login === old);
            accounts[idx] = newUser;
        } else {
            accounts.push(newUser);
        }
        
        localStorage.setItem('myAppAccounts', JSON.stringify(accounts));
        location.reload();
    }

    function deleteUser(login) {
        if(login === currentUser.login) return alert("Не можна видалити себе!");
        if(confirm("Видалити?")) {
            accounts = accounts.filter(u => u.login !== login);
            localStorage.setItem('myAppAccounts', JSON.stringify(accounts));
            render();
        }
    }

    function deleteApt(id) {
        if(confirm("Видалити квартиру?")) {
            apartments = apartments.filter(a => a.id !== id);
            localStorage.setItem('apartmentsData', JSON.stringify(apartments));
            render();
        }
    }

    function deleteMsg(id) {
        if(confirm("Видалити повідомлення?")) {
            messages = messages.filter(m => m.id !== id);
            localStorage.setItem('contactMessages', JSON.stringify(messages));
            render();
        }
    }

    function openUserModal() { document.getElementById('oldUserLogin').value = ''; document.getElementById('userModal').classList.add('active'); }
    function openAptModal() { document.getElementById('aptId').value = ''; document.getElementById('aptModal').classList.add('active'); }
    function closeModal(id) { document.getElementById(id).classList.remove('active'); }
    
    render();