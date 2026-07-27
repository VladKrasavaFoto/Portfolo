// data.js
// Спільна логіка отримання маніфесту сесій із Cloudinary.
// Маніфест — це один JSON-файл на Cloudinary (resource_type=raw),
// який admin.html перезаписує щоразу після заливки нової сесії.

const CLOUD_NAME = 'dufkhpzeg';
const MANIFEST_PUBLIC_ID = 'site/manifest.json';

function manifestUrl() {
  // ?t=... у кінці — щоб обійти кешування CDN і завжди отримати свіжу версію
  return `https://res.cloudinary.com/${CLOUD_NAME}/raw/upload/${MANIFEST_PUBLIC_ID}?t=${Date.now()}`;
}

async function fetchManifest() {
  try {
    const res = await fetch(manifestUrl());
    if (!res.ok) return { sessions: {} }; // маніфесту ще нема — це нормально на старті
    const data = await res.json();
    return data && data.sessions ? data : { sessions: {} };
  } catch (e) {
    console.error('Не вдалося завантажити маніфест сесій:', e);
    return { sessions: {} };
  }
}
