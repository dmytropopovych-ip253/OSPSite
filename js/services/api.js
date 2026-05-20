/* ============================================================
   js/services/api.js — Публічний API: реекспорт всіх підмодулів
   ============================================================
   Решта коду імпортує звідси:
     import { apiFetchApartments, apiUpdateAccount, ... } from '../services/api.js'
   Або скорочено (якщо Vite налаштований):
     import { ... } from '../api'
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
  apiInsertAccount,
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
