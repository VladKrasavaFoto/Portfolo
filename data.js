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
  // raw.githubusercontent.com — публічний доступ, без токена.
  // ?t=... обходить CDN-кеш, щоб сайт завжди бачив свіжі дані.
  return `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/${GITHUB_BRANCH}/${MANIFEST_PATH}?t=${Date.now()}`;
}

async function fetchManifest() {
  try {
    const res = await fetch(manifestRawUrl());
    if (!res.ok) return { sessions: {} }; // манiфесту ще нема — це нормально на старті
    const data = await res.json();
    return data && data.sessions ? data : { sessions: {} };
  } catch (e) {
    console.error('Не вдалося завантажити маніфест сесій:', e);
    return { sessions: {} };
  }
}
