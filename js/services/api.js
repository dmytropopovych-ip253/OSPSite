/* ============================================================
   js/services/api.js — Публічний API: реекспорт всіх підмодулів
   ============================================================ */

export {
    apiFetchApartments,
    apiFetchApartmentById,
    apiInsertApartment,
    apiUpdateApartment,
    apiDeleteApartment,
    apiUploadApartmentImage,
} from './apartments.js';

export {
    apiFetchAccounts,
    apiFetchAccountByLogin,
    apiUpdateAccount,
    apiDeleteAccount,
    apiUploadAvatar,
} from './accounts.js';

export {
    apiFetchRentalMessages,
    apiInsertRentalMessage,
    apiDeleteRentalMessage,
} from './rental-messages.js';

export {
    apiFetchContactMessages,
    apiInsertContactMessage,
    apiDeleteContactMessage,
} from './contact-messages.js';
