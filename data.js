// data.js
// Спільна логіка отримання маніфесту сесій.
// Маніфест (manifest.json) лежить у тому ж GitHub-репозиторії, що й сайт.
// admin.html (локально) оновлює цей файл через GitHub API.
// Публічний сайт просто читає його як звичайний JSON-файл.

const CLOUD_NAME = 'dufkhpzeg'; // Cloudinary — тільки для фото

const GITHUB_OWNER = 'VladKrasavaFoto';
const GITHUB_REPO = 'Portfolo';
const GITHUB_BRANCH = 'main';
const MANIFEST_PATH = 'manifest.json';

function manifestRawUrl() {
  // Читаємо з власного домену сайту (Vercel), а не з GitHub raw CDN —
  // так швидше й без зайвого кешування на боці GitHub.
  // ?t=... обходить кеш браузера, щоб сайт завжди бачив свіжі дані.
  return `manifest.json?t=${Date.now()}`;
}

async function fetchManifest() {
  try {
    const res = await fetch(manifestRawUrl());
    if (!res.ok) return { sessions: {}, testimonials: [] }; // манiфесту ще нема — це нормально на старті
    const data = await res.json();
    if (!data || !data.sessions) return { sessions: {}, testimonials: [] };
    if (!data.testimonials) data.testimonials = [];
    return data;
  } catch (e) {
    console.error('Не вдалося завантажити маніфест сесій:', e);
    return { sessions: {}, testimonials: [] };
  }
}

// --- Визначення типу медіа (фото/відео) прямо з Cloudinary-посилання ---
// Маніфест не потребує окремого поля "type" — Cloudinary сам кладе
// /video/upload/ або /image/upload/ у шлях залежно від типу файлу.

function isVideoUrl(url) {
  return typeof url === 'string' && url.includes('/video/upload/');
}

// Cloudinary вміє віддати кадр-прев'ю відео, якщо просто замінити розширення на .jpg
function videoPosterUrl(url) {
  return url.replace(/\.[a-zA-Z0-9]+(?=$|\?)/, '.jpg');
}

// --- Оптимізація доставки: віддаємо фото/кадри потрібного розміру й формату ---
// f_auto — сучасний формат (webp/avif) якщо браузер підтримує; q_auto — авто-якість;
// w_XXXX — ширина, більше за яку немає сенсу вантажити (Cloudinary сам зменшить).
// watermark=true додає непомітний напівпрозорий підпис у кутку (захист від крадіжки фото).
function cldOptimize(url, width, watermark) {
  if (typeof url !== 'string' || !url.includes('/upload/')) return url;
  let transform = `f_auto,q_auto,w_${width}`;
  if (watermark) {
    transform += `/l_text:Arial_16_bold:SHIBARI%C2%B7NOIR,co_rgb:C9A96E,o_45/fl_layer_apply,g_south_east,x_12,y_12`;
  }
  return url.replace('/upload/', `/upload/${transform}/`);
}

// --- Лічильник переглядів сесій (countapi.xyz — безкоштовний, без реєстрації) ---
// Значення публічні (будь-хто, хто знає ключ, може побачити число), але це просто
// лічильник переглядів, нічого чутливого. Якщо сервіс колись стане недоступним —
// лічильник просто перестане оновлюватись, решта сайту на це не впливає.

const COUNTER_NAMESPACE = 'lucida-pp-ua';

// Збільшує лічильник на 1 (викликається на сторінці сесії при перегляді)
async function hitSessionCounter(sessionId) {
  try {
    await fetch(`https://api.countapi.xyz/hit/${COUNTER_NAMESPACE}/session-${sessionId}`);
  } catch (e) {
    // тихо ігноруємо — лічильник не критичний для роботи сайту
  }
}

// Читає поточне значення без збільшення (використовується в admin.html)
async function getSessionCounter(sessionId) {
  try {
    const res = await fetch(`https://api.countapi.xyz/get/${COUNTER_NAMESPACE}/session-${sessionId}`);
    if (!res.ok) return null;
    const data = await res.json();
    return typeof data.value === 'number' ? data.value : null;
  } catch (e) {
    return null;
  }
}

// --- Базовий захист фото/відео від випадкового копіювання ---
// Не 100% захист (скріншот завжди можливий), але відсіює просте
// "зберегти зображення" правою кнопкою чи перетягування в інше вікно.
document.addEventListener('contextmenu', e => {
  if (e.target.tagName === 'IMG' || e.target.tagName === 'VIDEO') e.preventDefault();
});
document.addEventListener('dragstart', e => {
  if (e.target.tagName === 'IMG' || e.target.tagName === 'VIDEO') e.preventDefault();
});
