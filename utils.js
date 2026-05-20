/* ============================================================
   js/utils.js — Допоміжні функції (ES-модуль для Vite)
   ============================================================
   ЗМІНИ від оригіналу:
     - Додано export до кожної функції
   ============================================================ */

/**
 * Форматує дату з ISO-рядка (YYYY-MM-DD) у DD.MM.YYYY
 */
export function formatDate(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  return `${d}.${m}.${y}`;
}

/**
 * Форматує ISO-дату для відображення у картці квартири (локаль uk-UA)
 */
export function fmtCardDate(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  return d.toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/**
 * Перевіряє коректність email
 */
export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Генерує HTML-блок доступності квартири
 */
export function buildAvailabilityHTML(item) {
  const dateFrom = fmtCardDate(item.available_from);
  const dateTo   = fmtCardDate(item.available_to);

  if (item.always_available) {
    return `
      <div class="availability-block">
        <span class="avail-status avail-available">Завжди доступна</span>
        <div class="avail-dates">
          <div class="avail-range">
            <span class="avail-icon">📅</span>
            <span class="avail-from" style="color:var(--text-muted);font-weight:500;">Без обмежень</span>
          </div>
        </div>
      </div>`;
  }

  if (dateFrom || dateTo) {
    const today    = new Date(); today.setHours(0, 0, 0, 0);
    const fromDate = item.available_from ? new Date(item.available_from) : null;
    const toDate   = item.available_to   ? new Date(item.available_to)   : null;

    let statusClass = 'avail-available';
    let statusLabel = 'Доступна';

    if (toDate && toDate < today) {
      statusClass = 'avail-taken';
      statusLabel = 'Зайнята';
    } else if (fromDate && fromDate > today) {
      statusClass = 'avail-soon';
      statusLabel = 'Незабаром';
    }

    return `
      <div class="availability-block">
        <span class="avail-status ${statusClass}">${statusLabel}</span>
        <div class="avail-dates">
          <div class="avail-range">
            <span class="avail-icon">📅</span>
            <span class="avail-from">${dateFrom || '—'}</span>
            <span class="avail-arrow">→</span>
            <span class="avail-to">${dateTo || '∞'}</span>
          </div>
        </div>
      </div>`;
  }

  return `
    <div class="availability-block">
      <span class="avail-status avail-taken">Зайнята</span>
    </div>`;
}
