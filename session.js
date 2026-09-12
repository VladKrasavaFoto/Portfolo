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
  hitSessionCounter(id); // рахуємо перегляд (не блокує рендер, помилки ігноруються)

  // Structured data для Google (виконує JS при індексації, на відміну від Telegram/Facebook)
  const ldScript = document.createElement('script');
  ldScript.type = 'application/ld+json';
  ldScript.textContent = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'ImageGallery',
    'name': session.title,
    'url': window.location.href,
    'author': { '@type': 'Person', 'name': 'SHIBARI·NOIR' },
    'image': [...(session.photos || []), ...(session.groups || []).flatMap(g => g.photos || [])].slice(0, 10)
  });
  document.head.appendChild(ldScript);

  let currentIndex = 0;
  const photos = session.photos || [];
  const groups = session.groups || [];
  const backstage = session.backstage || [];

  // Наскрізний список для лайтбоксу: основні фото → фото по групах (по порядку) → бекстейдж
  const allMedia = [
    ...photos,
    ...groups.flatMap(g => g.photos || []),
    ...backstage
  ];

  function renderGallery(items, galleryEl, indexOffset) {
    items.forEach((src, localIndex) => {
      const globalIndex = indexOffset + localIndex;
      const item = document.createElement('div');
      item.className = 'gallery-item';
      item.style.opacity = '0';
      item.style.transition = 'opacity 0.4s ease';
      item.tabIndex = 0;
      item.setAttribute('role', 'button');
      item.setAttribute('aria-label', `Відкрити фото ${globalIndex + 1}`);
      item.onclick = () => openLightbox(globalIndex);
      item.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openLightbox(globalIndex);
        }
      });
      galleryEl.appendChild(item);

      if (isVideoUrl(src)) {
        const posterSrc = cldOptimize(videoPosterUrl(src), 900);
        const probe = document.createElement('video');
        probe.preload = 'metadata';
        probe.src = src;

        probe.onloadedmetadata = () => {
          if (probe.videoWidth / probe.videoHeight > 1.35) item.classList.add('horizontal');
          item.innerHTML = `
            <div class="video-thumb">
              <img src="${posterSrc}" alt="${session.title}" loading="lazy">
              <div class="play-icon">▶</div>
            </div>
          `;
          item.onclick = () => openLightbox(globalIndex);
          item.classList.add('loaded');
          item.style.opacity = '1';
        };

        probe.onerror = () => {
          item.style.display = 'none';
        };
        return;
      }

      const img = new Image();
      img.src = src;

      img.onload = () => {
        if (img.naturalWidth / img.naturalHeight > 1.35) item.classList.add('horizontal');
        item.innerHTML = `<img src="${cldOptimize(src, 900, true)}" alt="${session.title}" loading="lazy">`;
        item.onclick = () => openLightbox(globalIndex);
        item.classList.add('loaded');
        item.style.opacity = '1';
      };

      img.onerror = () => {
        item.style.display = 'none';
      };
    });
  }

  // Основна (суцільна) галерея — показуємо тільки якщо в сесії дійсно є "неpозгруповані" фото
  renderGallery(photos, document.getElementById('session-gallery'), 0);

  // Групи (образи/локації) — кожна своя підпис-секція, з наскрізною нумерацією для лайтбоксу
  let groupOffset = photos.length;
  const groupsSectionsEl = document.getElementById('groups-sections');
  groups.forEach(group => {
    const groupPhotos = group.photos || [];
    if (groupPhotos.length === 0) return;

    const section = document.createElement('div');
    section.className = 'group-section';

    const title = document.createElement('h2');
    title.className = 'section-title';
    title.textContent = group.title || '';
    section.appendChild(title);

    const grid = document.createElement('div');
    grid.className = 'gallery';
    section.appendChild(grid);

    groupsSectionsEl.appendChild(section);
    renderGallery(groupPhotos, grid, groupOffset);
    groupOffset += groupPhotos.length;
  });

  if (backstage.length > 0) {
    document.getElementById('backstage-section').style.display = 'block';
    renderGallery(backstage, document.getElementById('backstage-gallery'), groupOffset);
  }

  function openLightbox(index) {
    currentIndex = index;
    updateLightbox();
    document.getElementById('lightbox').classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function updateLightbox() {
    const src = allMedia[currentIndex];
    const imgEl = document.getElementById('lightbox-img');
    const videoEl = document.getElementById('lightbox-video');

    videoEl.pause();
    videoEl.removeAttribute('src');
    videoEl.load();

    if (isVideoUrl(src)) {
      videoEl.src = src;
      videoEl.style.display = 'block';
      imgEl.style.display = 'none';
    } else {
      imgEl.src = cldOptimize(src, 1800, true);
      imgEl.style.display = 'block';
      videoEl.style.display = 'none';
    }

    document.getElementById('counter').textContent = `${currentIndex + 1} / ${allMedia.length}`;
  }

  document.getElementById('prev').onclick = () => {
    currentIndex = (currentIndex - 1 + allMedia.length) % allMedia.length;
    updateLightbox();
  };

  document.getElementById('next').onclick = () => {
    currentIndex = (currentIndex + 1) % allMedia.length;
    updateLightbox();
  };

  document.getElementById('close-btn').onclick = () => {
    document.getElementById('lightbox').classList.remove('active');
    document.getElementById('lightbox-video').pause();
    document.body.style.overflow = '';
  };

  document.getElementById('lightbox').addEventListener('click', e => {
    if (e.target === document.getElementById('lightbox')) {
      document.getElementById('lightbox').classList.remove('active');
      document.getElementById('lightbox-video').pause();
    }
  });

  document.addEventListener('keydown', e => {
    if (!document.getElementById('lightbox').classList.contains('active')) return;

    if (e.key === 'Escape') {
      document.getElementById('lightbox').classList.remove('active');
      document.getElementById('lightbox-video').pause();
      document.body.style.overflow = '';
    } else if (e.key === 'ArrowLeft') {
      currentIndex = (currentIndex - 1 + allMedia.length) % allMedia.length;
      updateLightbox();
    } else if (e.key === 'ArrowRight') {
      currentIndex = (currentIndex + 1) % allMedia.length;
      updateLightbox();
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
      currentIndex = (currentIndex + 1) % allMedia.length;
    } else {
      currentIndex = (currentIndex - 1 + allMedia.length) % allMedia.length;
    }
    updateLightbox();
  }, { passive: true });
})();
