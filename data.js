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
function cldOptimize(url, width) {
  if (typeof url !== 'string' || !url.includes('/upload/')) return url;
  const transform = `f_auto,q_auto,w_${width}`;
  return url.replace('/upload/', `/upload/${transform}/`);
}
