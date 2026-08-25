// age-gate.js
// Показує заглушку "18+" при першому візиті. Після підтвердження
// запам'ятовує вибір у localStorage — повторно не питає.

(() => {
  if (localStorage.getItem('ageVerified') === 'yes') return;

  function init() {
  const overlay = document.createElement('div');
  overlay.id = 'age-gate-overlay';
  overlay.innerHTML = `
    <div class="age-gate-box">
      <div class="age-gate-logo">SHIBARI·NOIR</div>
      <p class="age-gate-text">
        Цей сайт містить художню оголену та еротичну фотографію (fine art nude, shibari).
        Контент призначений виключно для повнолітніх відвідувачів.
      </p>
      <p class="age-gate-question">Підтвердіть, що вам виповнилося 18 років</p>
      <div class="age-gate-actions">
        <button id="age-gate-yes" class="age-gate-btn age-gate-btn-yes">Мені є 18, увійти</button>
        <a href="https://www.google.com" id="age-gate-no" class="age-gate-btn age-gate-btn-no">Мені немає 18, вийти</a>
      </div>
    </div>
  `;

  const style = document.createElement('style');
  style.textContent = `
    #age-gate-overlay {
      position: fixed;
      inset: 0;
      z-index: 99999;
      background: #050505;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 6% 6%;
    }
    .age-gate-box {
      max-width: 520px;
      text-align: center;
    }
    .age-gate-logo {
      font-family: 'Cormorant Garamond', Georgia, serif;
      font-size: clamp(1.8rem, 6vw, 2.4rem);
      letter-spacing: 0.15em;
      color: #c9a96e;
      margin-bottom: 2rem;
    }
    .age-gate-text {
      font-family: 'Inter', Arial, sans-serif;
      font-size: 0.95rem;
      color: #999;
      line-height: 1.7;
      margin-bottom: 1.5rem;
    }
    .age-gate-question {
      font-family: 'Inter', Arial, sans-serif;
      font-size: 1.05rem;
      color: #d0d0d0;
      margin-bottom: 2rem;
    }
    .age-gate-actions {
      display: flex;
      flex-direction: column;
      gap: 0.9rem;
      align-items: center;
    }
    .age-gate-btn {
      display: inline-block;
      width: 100%;
      max-width: 320px;
      padding: 1rem 1.5rem;
      text-decoration: none;
      font-family: 'Inter', Arial, sans-serif;
      font-size: 0.95rem;
      letter-spacing: 0.08em;
      border-radius: 4px;
      cursor: pointer;
      box-sizing: border-box;
      text-align: center;
      transition: all 0.3s;
    }
    .age-gate-btn-yes {
      background: #8b0000;
      color: #e0d0b0;
      border: 1px solid #8b0000;
    }
    .age-gate-btn-yes:hover { background: #a00000; }
    .age-gate-btn-no {
      background: transparent;
      color: #666;
      border: 1px solid #333;
    }
    .age-gate-btn-no:hover { color: #999; border-color: #555; }
    body.age-gate-locked { overflow: hidden; }
  `;

  document.head.appendChild(style);
  document.body.classList.add('age-gate-locked');
  document.body.appendChild(overlay);

  document.getElementById('age-gate-yes').addEventListener('click', () => {
    localStorage.setItem('ageVerified', 'yes');
    document.body.classList.remove('age-gate-locked');
    overlay.remove();
  });
  }

  if (document.body) {
    init();
  } else {
    document.addEventListener('DOMContentLoaded', init);
  }
})();
