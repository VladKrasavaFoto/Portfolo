// session.js
const urlParams = new URLSearchParams(window.location.search);
const id = urlParams.get('id');

(async () => {
  const manifest = await fetchManifest();
  const session = manifest.sessions[id];

  if (!session) {
    document.getElementById('session-title').textContent = 'Сесію не знайдено';
    document.getElementById('page-title').textContent = 'Не знайдено | Dark Shibari';
    return;
  }

  document.getElementById('session-title').textContent = session.title;
  document.getElementById('page-title').textContent = `${session.title} | Dark Shibari`;

  let currentIndex = 0;
  const photos = session.photos || [];
  const gallery = document.getElementById('session-gallery');

  photos.forEach((photoSrc, index) => {
    const item = document.createElement('div');
    item.className = 'gallery-item';
    item.style.opacity = '0';
    item.style.transition = 'opacity 0.4s ease';
    item.onclick = () => openLightbox(index);
    gallery.appendChild(item);

    const img = new Image();
    img.src = photoSrc;

    img.onload = () => {
      if (img.naturalWidth / img.naturalHeight > 1.35) item.classList.add('horizontal');
      item.innerHTML = `<img src="${photoSrc}" alt="${session.title}" loading="lazy">`;
      item.onclick = () => openLightbox(index);
      item.style.opacity = '1';
    };

    img.onerror = () => {
      item.style.display = 'none';
    };
  });

  function openLightbox(index) {
    currentIndex = index;
    updateLightbox();
    document.getElementById('lightbox').classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function updateLightbox() {
    document.getElementById('lightbox-img').src = photos[currentIndex];
    document.getElementById('counter').textContent = `${currentIndex + 1} / ${photos.length}`;
  }

  document.getElementById('prev').onclick = () => {
    currentIndex = (currentIndex - 1 + photos.length) % photos.length;
    updateLightbox();
  };

  document.getElementById('next').onclick = () => {
    currentIndex = (currentIndex + 1) % photos.length;
    updateLightbox();
  };

  document.getElementById('close-btn').onclick = () => {
    document.getElementById('lightbox').classList.remove('active');
    document.body.style.overflow = '';
  };

  document.getElementById('lightbox').addEventListener('click', e => {
    if (e.target === document.getElementById('lightbox')) {
      document.getElementById('lightbox').classList.remove('active');
    }
  });

  let touchStartX = 0;
  let touchStartY = 0;

  document.getElementById('lightbox').addEventListener('touchstart', e => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  }, { passive: true });

  document.getElementById('lightbox').addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = e.changedTouches[0].clientY - touchStartY;

    if (Math.abs(dx) < 40 || Math.abs(dy) > Math.abs(dx)) return;

    if (dx < 0) {
      currentIndex = (currentIndex + 1) % photos.length;
    } else {
      currentIndex = (currentIndex - 1 + photos.length) % photos.length;
    }
    updateLightbox();
  }, { passive: true });
})();
