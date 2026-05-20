/* ============================================================
   js/ui/index.js — Точка входу для всього UI
   ============================================================
   Реекспортує всі публічні функції з підмодулів.
   Файли в js/app/ імпортують звідси: from '../ui/index.js'
   (або скорочено from '../ui/index.js')
   ============================================================ */

export { renderCurrentPage, renderCards, renderPagination, showPageLoading } from './cards.js';
export { updateAuthUI, setAuthMode, showToast }                               from './auth-ui.js';
export { renderAptCard, renderRecommendationCards }                           from './apartment-ui.js';
export { renderUsersTable, renderContactMessagesTable,
         renderRentalMessagesTable, renderAdminAptsTable }                    from './admin-ui.js';
export { renderProfileMessages, applyAvatar, removeAvatarUI,
         triggerAvatarUpload, checkStrength, togglePw }                       from './profile-ui.js';
