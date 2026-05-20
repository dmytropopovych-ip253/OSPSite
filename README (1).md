# 🏠 RentUA — Apartment Rental Platform

RentUA — це фронтенд-застосунок для пошуку та оренди квартир з повноцінним адмін-панеллю, авторизацією та системою повідомлень.

Проєкт побудований на сучасному стеку без важких фреймворків:

- **Vite** — збірник та dev-сервер
- **Supabase** — база даних і сховище файлів
- **Vanilla JavaScript (ES-модулі)**
- **HTML / CSS**

---

## 🌟 Функціонал

### 🔍 Пошук квартир

- Перегляд каталогу квартир із пагінацією (16 на сторінку)
- Фільтрація за кількістю кімнат, ціною, датами доступності
- Сортування: нові, дешеві, дорогі
- Статус доступності: завжди доступна / доступна / незабаром / зайнята

### 🏘 Деталі квартири

- Повна картка з описом, фото, адресою, поверхом, ціною
- Блок рекомендованих квартир (4 випадкові)
- Форма запиту оренди з вибором дат та підрахунком тривалості
- Режим редагування (edit mode) для адміністраторів

### 🔐 Авторизація

- Вхід / реєстрація / вихід
- Дані зберігаються у `sessionStorage`
- Рольова модель:
  - `user` — звичайний орендар
  - `admin` — адміністратор з розширеним доступом
- Валідація форм (email, мінімальна довжина пароля)

### 👤 Профіль користувача

- Відображення логіну, email, ролі та аватару
- Список власних запитів на оренду з прив'язкою до квартир
- Лічильник повідомлень

### ⚙️ Налаштування акаунту

- Зміна логіну та email
- Зміна пароля з індикатором надійності
- Завантаження / видалення аватара (Supabase Storage, до 5 МБ)
- Видалення акаунту

### 🛠 Адмін-панель

- Управління квартирами: додавання, редагування, видалення, завантаження фото
- Управління акаунтами користувачів
- Перегляд усіх запитів на оренду (`rental_messages`)
- Перегляд контактних повідомлень (`contact_messages`)

### 📩 Контактна форма

- Модальне вікно з валідацією
- Збереження до Supabase (`contact_messages`)

### 📅 Запит оренди

- Вибір дат заселення та виселення
- Автоматичний підрахунок тривалості (дні / місяці)
- Збереження до Supabase (`rental_messages`) з прив'язкою до користувача

---

## 🏗 Архітектура

Проєкт використовує просту багатосторінкову архітектуру без SPA-фреймворків.

- **Vite** збирає ES-модулі, обробляє `@supabase/supabase-js`, виводить білд у `dist/`
- **Supabase** виступає бекендом: зберігає дані та файли
- Спільний entry point — `js/app.js`, який визначає поточну сторінку та ініціалізує потрібний модуль

### Шар даних

- **Supabase** — основне сховище (таблиці: `apartments`, `accounts`, `rental_messages`, `contact_messages`)
- **Supabase Storage** — buckets `avatars` та `apartment-images`
- **sessionStorage** — поточний авторизований користувач
- **state.js** — реактивний стан сторінки (відфільтровані дані, пагінація, сортування)

### Структура проєкту

```
/css
  admin.css
  apartment.css
  base.css
  cards.css
  footer.css
  header.css
  main.css
  modals.css
  navbar.css
  profile.css
  responsive.css
  settings.css
  style.css

/js
  state.js                  # Глобальний стан (allData, currentPage тощо)
  supabase-client.js        # Ініціалізація Supabase (читає .env.local)
  utils.js                  # Допоміжні функції (formatDate, isValidEmail, buildAvailabilityHTML)

  /app
    app.js                  # Entry point — роутинг за URL
    admin-page.js           # Адмін-панель
    apartment-page.js       # Сторінка деталей квартири
    auth.js                 # Авторизація, реєстрація, logout
    contacts.js             # Контактна форма
    profile-page.js         # Профіль користувача
    settings-page.js        # Налаштування акаунту

  /services
    accounts.js             # CRUD акаунтів + upload аватара
    apartments.js           # CRUD квартир + upload фото
    api.js                  # Публічний реекспорт всіх сервісів
    contact-messages.js     # Контактні повідомлення
    rental-messages.js      # Запити на оренду

  /ui                       # UI-компоненти (рендер карток, модалок тощо)

# HTML сторінки
main.html
search.html
apartment.html
profile.html
settings.html
admin.html

# Конфігурація
package.json
vite.config.mjs
.env.local                  # VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
```

### Запуск локально (Vite)

Не відкривайте HTML через **`file://`** — ES-модулі та Supabase не працюватимуть без сервера.

```bash
npm install
npm run dev
```

Відкрийте <http://127.0.0.1:5173>. Продакшн: `npm run build` → білд у `dist/`, перегляд через `npm run preview`.

---

## 🗄 Supabase — таблиці

| Таблиця            | Опис                                              |
| ------------------ | ------------------------------------------------- |
| `apartments`       | Квартири: title, price, address, rooms, floor, image, available_from, available_to, always_available |
| `accounts`         | Користувачі: login, password, email, is_admin, avatar_url |
| `rental_messages`  | Запити на оренду: name, email, apartment_id, user_login, date_from, date_to, rental_period |
| `contact_messages` | Контактні повідомлення: name, email, message, date |

### Supabase Storage

| Bucket              | Призначення           |
| ------------------- | --------------------- |
| `avatars`           | Аватари користувачів  |
| `apartment-images`  | Фото квартир          |

---

## 🔑 Демо-акаунти

> Після розгортання створіть акаунти вручну або через адмін-панель.

Приклад адміна (встановити `is_admin = true` у таблиці `accounts`):

```
login: admin
password: admin123
```

---

## 🧰 Інструменти

Встановити залежності:

```bash
npm install
```

Dev-сервер із hot reload:

```bash
npm run dev
```

Продакшн-білд:

```bash
npm run build
```

Перегляд білду:

```bash
npm run preview
```

> Конфігурація Vite знаходиться у `vite.config.mjs`.

---

## ⚙️ Змінні середовища

Створіть файл `.env.local` у корені проєкту:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Без цих змінних застосунок не запуститься (буде помилка при ініціалізації `supabase-client.js`).

---

## ⚠️ Обмеження

- Немає серверного рендерингу — тільки клієнтський JS
- Паролі зберігаються у відкритому вигляді у Supabase (навчальний проєкт — не для продакшну)
- Авторизація через `sessionStorage` — без JWT / Supabase Auth
- Без тестів та CI/CD

---

## 🎓 Навчальні цілі

Проєкт демонструє:

- Роботу з ES-модулями та Vite
- Інтеграцію із Supabase (CRUD, Storage, реалтайм-незалежна архітектура)
- Багатосторінкову архітектуру без фреймворків
- Управління станом без Redux / Vuex
- Рольовий доступ на рівні UI
- Валідацію форм та UX-паттерни (модалки, фільтри, пагінація)
