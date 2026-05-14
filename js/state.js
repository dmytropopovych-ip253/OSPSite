/* ============================================================
   js/state.js — Поточні дані сторінки (ES-модуль для Vite)
   ============================================================
   ЗМІНИ від оригіналу:
     - Усі змінні тепер export let / export const
     - Додані сеттери для змінних, які змінюються ззовні
   ============================================================ */

export let allData             = [];
export let currentFilteredData = [];
export let currentPage         = 1;
export let isRegisterMode      = false;
export let currentSort         = 'new';
export const itemsPerPage      = 16;

/* Сеттери — використовуйте замість прямого присвоювання */
export function setAllData(data)             { allData             = data; }
export function setCurrentFilteredData(data) { currentFilteredData = data; }
export function setCurrentPage(page)         { currentPage         = page; }
export function setIsRegisterMode(val)       { isRegisterMode      = val;  }
export function setCurrentSort(val)          { currentSort         = val;  }
