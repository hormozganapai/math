/**
 * app.js
 * ---------------------------------------------------------
 * کنترلر اصلی صفحه خانه MathPlay.
 * وظایف:
 *  - رندر پس‌زمینه اعداد شناور
 *  - نمایش آمار کلی در هدر (از localStorage)
 *  - بارگذاری بازی‌ها با GameLoader
 *  - ساخت کارت‌های بازی
 *  - اتصال جستجو و فیلتر دسته‌بندی
 * ---------------------------------------------------------
 */
(function () {
  const CATEGORIES = [
    { id: 'all', label: 'همه بازی‌ها' },
    { id: 'ریاضی هفتم', label: 'ریاضی هفتم' },
    { id: 'ریاضی هشتم', label: 'ریاضی هشتم' },
    { id: 'ریاضی نهم', label: 'ریاضی نهم' },
    { id: 'احتمال', label: 'احتمال' },
    { id: 'اعداد صحیح', label: 'اعداد صحیح' },
    { id: 'جبر', label: 'جبر' },
    { id: 'هندسه', label: 'هندسه' },
    { id: 'آمار', label: 'آمار' }
  ];

  const state = {
    allGames: [],
    query: '',
    category: 'all'
  };

  const els = {
    grid: document.getElementById('gamesGrid'),
    categoryList: document.getElementById('categoryList'),
    searchInput: document.getElementById('searchInput'),
    resultCount: document.getElementById('resultCount'),
    numberField: document.getElementById('numberField'),
    statPlayed: document.getElementById('statPlayed'),
    statBest: document.getElementById('statBest'),
    exploreBtn: document.getElementById('exploreBtn')
  };

  /* ---------------------------------------------------------
     پس‌زمینه اعداد و نمادهای ریاضی شناور
  --------------------------------------------------------- */
  function renderNumberField() {
    if (!els.numberField) return;
    const symbols = ['1', '2', '3', '5', '7', '8', '9', '+', '−', '×', '÷', '=', '%', 'π', '√'];
    const total = window.innerWidth < 640 ? 14 : 26;
    const frag = document.createDocumentFragment();

    for (let i = 0; i < total; i++) {
      const span = document.createElement('span');
      span.textContent = symbols[Math.floor(Math.random() * symbols.length)];
      const size = 18 + Math.random() * 34;
      span.style.left = `${Math.random() * 100}%`;
      span.style.fontSize = `${size}px`;
      span.style.animationDuration = `${14 + Math.random() * 12}s`;
      span.style.animationDelay = `-${Math.random() * 20}s`;
      frag.appendChild(span);
    }
    els.numberField.appendChild(frag);
  }

  /* ---------------------------------------------------------
     آمار هدر
  --------------------------------------------------------- */
  function renderHeaderStats() {
    const stats = MathPlayScore.getGlobalStats();
    if (els.statPlayed) els.statPlayed.textContent = stats.totalGamesPlayed;
    if (els.statBest) els.statBest.textContent = stats.bestScore;
  }

  /* ---------------------------------------------------------
     دسته‌بندی‌ها
  --------------------------------------------------------- */
  function renderCategories() {
    if (!els.categoryList) return;
    els.categoryList.innerHTML = '';
    CATEGORIES.forEach((cat) => {
      const btn = document.createElement('button');
      btn.className = 'category-chip' + (cat.id === state.category ? ' active' : '');
      btn.type = 'button';
      btn.textContent = cat.label;
      btn.setAttribute('data-category', cat.id);
      btn.addEventListener('click', () => {
        state.category = cat.id;
        renderCategories();
        renderGames();
      });
      els.categoryList.appendChild(btn);
    });
  }

  /* ---------------------------------------------------------
     کارت بازی
  --------------------------------------------------------- */
  const ACCENTS = {
    'احتمال': { grad: 'linear-gradient(135deg,#7C4DFF,#2E9BFF)', soft: '#EFEAFF' },
    'جبر': { grad: 'linear-gradient(135deg,#FF6B35,#FFC845)', soft: '#FFF1E5' },
    'هندسه': { grad: 'linear-gradient(135deg,#00BFA6,#2E9BFF)', soft: '#E3FBF6' },
    'آمار': { grad: 'linear-gradient(135deg,#FF4785,#7C4DFF)', soft: '#FFE7F1' },
    'اعداد صحیح': { grad: 'linear-gradient(135deg,#2E9BFF,#00BFA6)', soft: '#E3F3FF' }
  };

  function buildCard(game) {
    const accent = ACCENTS[game.category] || { grad: 'linear-gradient(135deg,#7C4DFF,#2E9BFF)', soft: '#EFEAFF' };
    const stats = MathPlayScore.getGameStats(game.id);

    const card = document.createElement('article');
    card.className = 'game-card';
    card.style.setProperty('--card-accent', accent.grad);
    card.style.setProperty('--card-accent-soft', accent.soft);

    card.innerHTML = `
      <div class="icon-badge" aria-hidden="true">${game.icon || '🧮'}</div>
      <h3>${game.title}</h3>
      <p class="desc">${game.description || ''}</p>
      <div class="tags">
        <span class="tag">${game.grade || ''}</span>
        <span class="tag">${game.category || ''}</span>
        ${stats.highScore ? `<span class="tag">🏆 رکورد: ${stats.highScore}</span>` : ''}
      </div>
      <a class="play-btn" href="${game.url}">
        شروع بازی <span aria-hidden="true">←</span>
      </a>
    `;
    return card;
  }

  function renderGames() {
    const filtered = MathPlaySearch.filterGames(state.allGames, state.query, state.category);

    if (els.resultCount) {
      els.resultCount.textContent = `${filtered.length} بازی`;
    }

    els.grid.innerHTML = '';

    if (filtered.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'empty-state';
      empty.innerHTML = `
        <div class="emoji">🔍</div>
        <p>بازی‌ای با این مشخصات پیدا نشد. عبارت جستجو یا دسته‌بندی را تغییر بده.</p>
      `;
      els.grid.appendChild(empty);
      return;
    }

    const frag = document.createDocumentFragment();
    filtered.forEach((game) => frag.appendChild(buildCard(game)));
    els.grid.appendChild(frag);
  }

  function renderSkeletons(count = 6) {
    els.grid.innerHTML = '';
    for (let i = 0; i < count; i++) {
      const sk = document.createElement('div');
      sk.className = 'skeleton-card';
      els.grid.appendChild(sk);
    }
  }

  /* ---------------------------------------------------------
     رویدادها
  --------------------------------------------------------- */
  function bindEvents() {
    if (els.searchInput) {
      els.searchInput.addEventListener('input', (e) => {
        state.query = e.target.value;
        renderGames();
      });
    }
    if (els.exploreBtn) {
      els.exploreBtn.addEventListener('click', () => {
        document.getElementById('games').scrollIntoView({ behavior: 'smooth' });
      });
    }
  }

  /* ---------------------------------------------------------
     راه‌اندازی
  --------------------------------------------------------- */
  async function init() {
    renderNumberField();
    renderHeaderStats();
    renderCategories();
    bindEvents();
    renderSkeletons();

    try {
      state.allGames = await GameLoader.loadAllGames();
    } catch (err) {
      console.error('خطا در بارگذاری بازی‌ها:', err);
      state.allGames = [];
    }

    renderGames();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
