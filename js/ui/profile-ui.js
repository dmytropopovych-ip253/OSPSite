/* ============================================================
   js/ui/profile-ui.js — UI профілю: повідомлення, аватар, пароль
   ============================================================
   Функції:
     renderProfileMessages,
     applyAvatar, removeAvatarUI, triggerAvatarUpload,
     checkStrength, togglePw
   ============================================================ */

/* ── Повідомлення профілю ── */

export function renderProfileMessages(list, aptsMap) {
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

/* ── Аватар ── */

let avatarDataURL = null;

export function applyAvatar(url) {
    const img = document.getElementById('avatarImg');
    const ini = document.getElementById('avatarInitial');
    if (!img || !ini) return;
    img.src = url;
    img.style.display = 'block';
    ini.style.display = 'none';
    const removeBtn = document.getElementById('removeAvatarBtn');
    if (removeBtn) removeBtn.style.display = 'inline-flex';
    avatarDataURL = url;
}

export function removeAvatarUI() {
    const img = document.getElementById('avatarImg');
    const ini = document.getElementById('avatarInitial');
    if (img) { img.src = ''; img.style.display = 'none'; }
    if (ini) ini.style.display = '';
    const removeBtn = document.getElementById('removeAvatarBtn');
    if (removeBtn) removeBtn.style.display = 'none';
    avatarDataURL = null;
}

export function triggerAvatarUpload() {
    const input = document.getElementById('avatarFileInput');
    if (input) input.click();
}

/* ── Сила пароля ── */

export function checkStrength(val) {
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

export function togglePw(inputId, btn) {
    const inp = document.getElementById(inputId);
    if (!inp) return;
    const hidden = inp.type === 'password';
    inp.type        = hidden ? 'text' : 'password';
    btn.textContent = hidden ? '🙈' : '👁';
}
