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
  const backstage = session.backstage || [];
  const allMedia = [...photos, ...backstage]; // для лайтбоксу — єдиний наскрізний список

  function renderGallery(items, galleryEl, indexOffset) {
    items.forEach((src, localIndex) => {
      const globalIndex = indexOffset + localIndex;
      const item = document.createElement('div');
      item.className = 'gallery-item';
      item.style.opacity = '0';
      item.style.transition = 'opacity 0.4s ease';
      item.onclick = () => openLightbox(globalIndex);
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
        item.innerHTML = `<img src="${cldOptimize(src, 900)}" alt="${session.title}" loading="lazy">`;
        item.onclick = () => openLightbox(globalIndex);
        item.style.opacity = '1';
      };

      img.onerror = () => {
        item.style.display = 'none';
      };
    });
  }

  renderGallery(photos, document.getElementById('session-gallery'), 0);

  if (backstage.length > 0) {
    document.getElementById('backstage-section').style.display = 'block';
    renderGallery(backstage, document.getElementById('backstage-gallery'), photos.length);
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
      imgEl.src = cldOptimize(src, 1800);
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
