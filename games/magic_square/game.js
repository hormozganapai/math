/**
 * game.js — مربع جادویی (Magic Square)
 * ---------------------------------------------------------
 * پازل: اعداد ۱ تا n² از قبل به‌صورت تصادفی (و اشتباه) داخل
 * مربع n×n چیده شده‌اند. بازیکن باید با جابه‌جا کردن دو عدد در
 * هر بار، آن‌ها را طوری بچیند که مجموع هر سطر، هر ستون و هر دو
 * قطر اصلی با هم برابر شوند (عدد جادویی).
 *
 * تعامل: هم Drag & Drop واقعی (HTML5) و هم کلیک/لمس (انتخاب یک
 * خانه، سپس کلیک روی خانه دوم برای جابه‌جایی) پشتیبانی می‌شود.
 *
 * سطوح متوالی: 3×3 → 4×4 → 5×5 (هر سطح با حل سطح قبلی باز می‌شود)
 * ---------------------------------------------------------
 */
(function () {
  'use strict';

  const SIZES = [3, 4, 5];
  const STORAGE_KEY = 'magic_square_stats';

  const DIGITS_FA = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  function toFa(val) { return String(val).replace(/[0-9]/g, (d) => DIGITS_FA[d]); }
  function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  function magicConstant(n) { return (n * (n * n + 1)) / 2; }

  /* =========================================================
     ذخیره‌سازی
  ========================================================= */
  function loadStats() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const base = { unlocked: { 3: true, 4: false, 5: false }, bestMoves: {}, bestTime: {}, stars: {} };
      if (!raw) return base;
      const parsed = JSON.parse(raw);
      return { ...base, ...parsed, unlocked: { ...base.unlocked, ...(parsed.unlocked || {}) } };
    } catch (e) {
      return { unlocked: { 3: true, 4: false, 5: false }, bestMoves: {}, bestTime: {}, stars: {} };
    }
  }
  function saveStats(stats) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(stats)); } catch (e) { /* ignore */ }
  }
  function submitResult(size, moves, seconds, stars) {
    const s = loadStats();
    if (!s.bestMoves[size] || moves < s.bestMoves[size]) s.bestMoves[size] = moves;
    if (!s.bestTime[size] || seconds < s.bestTime[size]) s.bestTime[size] = seconds;
    if (!s.stars[size] || stars > s.stars[size]) s.stars[size] = stars;
    const idx = SIZES.indexOf(size);
    if (idx >= 0 && idx + 1 < SIZES.length) s.unlocked[SIZES[idx + 1]] = true;
    saveStats(s);
    return s;
  }

  /* =========================================================
     عناصر DOM
  ========================================================= */
  const els = {
    bgField: document.getElementById('bgField'),
    startScreen: document.getElementById('startScreen'),
    levelCards: document.getElementById('levelCards'),
    startBtn: document.getElementById('startBtn'),
    bestScoreLine: document.getElementById('bestScoreLine'),

    playScreen: document.getElementById('playScreen'),
    backBtn: document.getElementById('backBtn'),
    timerVal: document.getElementById('timerVal'),
    movesVal: document.getElementById('movesVal'),
    magicConstVal: document.getElementById('magicConstVal'),
    hintBox: document.getElementById('hintBox'),
    squareGrid: document.getElementById('squareGrid'),
    diagonalInfo: document.getElementById('diagonalInfo'),
    hintBtn: document.getElementById('hintBtn'),
    resetBtn: document.getElementById('resetBtn'),

    resultScreen: document.getElementById('resultScreen'),
    starsRow: document.getElementById('starsRow'),
    resultTitle: document.getElementById('resultTitle'),
    resultSub: document.getElementById('resultSub'),
    finalMoves: document.getElementById('finalMoves'),
    finalTime: document.getElementById('finalTime'),
    finalBestMoves: document.getElementById('finalBestMoves'),
    nextSizeBtn: document.getElementById('nextSizeBtn'),
    retryBtn: document.getElementById('retryBtn')
  };

  /* =========================================================
     وضعیت بازی
  ========================================================= */
  const state = {
    chosenSize: 3,
    size: 3,
    grid: [],
    selectedCell: null, // {r, c} خانه‌ای که برای جابه‌جایی انتخاب شده
    moves: 0,
    seconds: 0,
    timerHandle: null
  };

  /* =========================================================
     پس‌زمینه اعداد شناور
  ========================================================= */
  function renderBgField() {
    const symbols = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '+', '='];
    const total = window.innerWidth < 640 ? 10 : 18;
    const frag = document.createDocumentFragment();
    for (let i = 0; i < total; i++) {
      const span = document.createElement('span');
      span.textContent = symbols[randInt(0, symbols.length - 1)];
      span.style.left = `${Math.random() * 100}%`;
      span.style.fontSize = `${16 + Math.random() * 26}px`;
      span.style.animationDuration = `${14 + Math.random() * 12}s`;
      span.style.animationDelay = `-${Math.random() * 20}s`;
      frag.appendChild(span);
    }
    els.bgField.appendChild(frag);
  }

  /* =========================================================
     صفحه شروع
  ========================================================= */
  function renderLevelCards() {
    const stats = loadStats();
    [...els.levelCards.children].forEach((card) => {
      const size = Number(card.dataset.size);
      const unlocked = !!stats.unlocked[size];
      card.classList.toggle('locked', !unlocked);
      card.querySelector('.level-star')?.remove();
      if (stats.stars[size]) {
        card.insertAdjacentHTML('beforeend', `<span class="level-star">${'⭐'.repeat(stats.stars[size])}</span>`);
      }
    });

    const lines = SIZES.filter((s) => stats.bestMoves[s]).map(
      (s) => `مربع ${toFa(s)}×${toFa(s)}: بهترین حرکت ${toFa(stats.bestMoves[s])} — ${stats.stars[s] ? '⭐'.repeat(stats.stars[s]) : ''}`
    );
    els.bestScoreLine.innerHTML = lines.join('<br>');
  }

  function bindStartScreen() {
    els.levelCards.addEventListener('click', (e) => {
      const card = e.target.closest('.level-card');
      if (!card) return;
      const size = Number(card.dataset.size);
      const stats = loadStats();
      if (!stats.unlocked[size]) {
        card.classList.add('shake');
        setTimeout(() => card.classList.remove('shake'), 400);
        return;
      }
      [...els.levelCards.children].forEach((c) => c.classList.remove('active'));
      card.classList.add('active');
      state.chosenSize = size;
    });

    els.startBtn.addEventListener('click', () => beginPuzzle(state.chosenSize));
    els.backBtn.addEventListener('click', () => {
      stopTimer();
      showScreen('start');
      renderLevelCards();
    });
  }

  function showScreen(name) {
    els.startScreen.classList.toggle('hidden', name !== 'start');
    els.playScreen.classList.toggle('hidden', name !== 'play');
    els.resultScreen.classList.toggle('hidden', name !== 'result');
  }

  /* =========================================================
     شروع یک پازل — همه خانه‌ها از ابتدا با اعداد به‌هم‌ریخته پر می‌شوند
  ========================================================= */
  function beginPuzzle(size) {
    state.size = size;
    state.selectedCell = null;
    state.moves = 0;
    state.seconds = 0;

    const M = magicConstant(size);
    let flat;
    // اطمینان از این‌که چیدمان اولیه از قبل حل‌شده نباشد
    do {
      flat = shuffle(Array.from({ length: size * size }, (_, i) => i + 1));
    } while (isMagic(flat, size, M));

    state.grid = [];
    for (let r = 0; r < size; r++) {
      state.grid.push(flat.slice(r * size, r * size + size));
    }

    els.magicConstVal.textContent = toFa(M);
    els.hintBox.textContent = '';
    updateHud();
    startTimer();
    renderGrid();
    showScreen('play');
  }

  /** بررسی سریع این‌که یک چیدمان صاف (flat) از قبل جادویی است یا نه */
  function isMagic(flat, n, M) {
    const g = [];
    for (let r = 0; r < n; r++) g.push(flat.slice(r * n, r * n + n));
    for (let i = 0; i < n; i++) {
      let rSum = 0, cSum = 0;
      for (let j = 0; j < n; j++) { rSum += g[i][j]; cSum += g[j][i]; }
      if (rSum !== M || cSum !== M) return false;
    }
    let mainSum = 0, antiSum = 0;
    for (let i = 0; i < n; i++) { mainSum += g[i][i]; antiSum += g[i][n - 1 - i]; }
    return mainSum === M && antiSum === M;
  }

  function startTimer() {
    clearInterval(state.timerHandle);
    els.timerVal.textContent = formatTime(0);
    state.timerHandle = setInterval(() => {
      state.seconds++;
      els.timerVal.textContent = formatTime(state.seconds);
    }, 1000);
  }
  function stopTimer() { clearInterval(state.timerHandle); }
  function formatTime(total) {
    const m = Math.floor(total / 60), s = total % 60;
    return toFa(`${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
  }
  function updateHud() {
    els.movesVal.textContent = toFa(state.moves);
  }

  /* =========================================================
     محاسبه مجموع‌ها (همه خانه‌ها همیشه پر هستند)
  ========================================================= */
  function computeSums() {
    const n = state.size, g = state.grid;
    const rows = [], cols = [];
    for (let i = 0; i < n; i++) {
      let rSum = 0, cSum = 0;
      for (let j = 0; j < n; j++) { rSum += g[i][j]; cSum += g[j][i]; }
      rows.push(rSum);
      cols.push(cSum);
    }
    let mainSum = 0, antiSum = 0;
    for (let i = 0; i < n; i++) { mainSum += g[i][i]; antiSum += g[i][n - 1 - i]; }
    return { rows, cols, mainSum, antiSum };
  }

  /* =========================================================
     رندر جدول
  ========================================================= */
  function renderGrid() {
    const n = state.size;
    const cellPx = n <= 3 ? 68 : n <= 4 ? 58 : 48;
    const labelPx = Math.round(cellPx * 0.7);
    const M = magicConstant(n);
    const sums = computeSums();

    els.squareGrid.innerHTML = '';
    els.squareGrid.style.gridTemplateColumns = `repeat(${n}, ${cellPx}px) ${labelPx}px`;
    els.squareGrid.style.gridTemplateRows = `repeat(${n}, ${cellPx}px) ${labelPx}px`;

    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        const val = state.grid[r][c];
        const isSelected = !!state.selectedCell && state.selectedCell.r === r && state.selectedCell.c === c;
        const cell = document.createElement('div');
        cell.className = 'cell filled' + (isSelected ? ' selected' : '');
        cell.textContent = toFa(val);
        cell.dataset.r = r; cell.dataset.c = c;
        cell.draggable = true;

        cell.addEventListener('click', () => onCellClick(r, c));
        cell.addEventListener('dragstart', (e) => {
          e.dataTransfer.setData('text/plain', `cell:${r}:${c}`);
        });
        cell.addEventListener('dragover', (e) => { e.preventDefault(); cell.classList.add('dragover'); });
        cell.addEventListener('dragleave', () => cell.classList.remove('dragover'));
        cell.addEventListener('drop', (e) => {
          e.preventDefault();
          cell.classList.remove('dragover');
          handleDrop(e.dataTransfer.getData('text/plain'), r, c);
        });

        els.squareGrid.appendChild(cell);
      }
      const rowLabel = document.createElement('div');
      const isOk = sums.rows[r] === M;
      rowLabel.className = 'sum-label ' + (isOk ? 'ok' : 'bad');
      rowLabel.textContent = toFa(sums.rows[r]);
      els.squareGrid.appendChild(rowLabel);
    }

    for (let c = 0; c < n; c++) {
      const colLabel = document.createElement('div');
      const isOk = sums.cols[c] === M;
      colLabel.className = 'sum-label ' + (isOk ? 'ok' : 'bad');
      colLabel.textContent = toFa(sums.cols[c]);
      els.squareGrid.appendChild(colLabel);
    }
    const corner = document.createElement('div');
    corner.className = 'sum-label corner';
    corner.textContent = '✨';
    els.squareGrid.appendChild(corner);

    const mainOk = sums.mainSum === M;
    const antiOk = sums.antiSum === M;
    els.diagonalInfo.innerHTML = `
      <span class="${mainOk ? 'diag-ok' : 'diag-bad'}">قطر ↘: ${toFa(sums.mainSum)}</span>
      <span class="${antiOk ? 'diag-ok' : 'diag-bad'}">قطر ↙: ${toFa(sums.antiSum)}</span>
    `;

    checkWin(sums, M);
  }

  /* =========================================================
     تعامل: کلیک برای انتخاب و جابه‌جایی
  ========================================================= */
  function onCellClick(r, c) {
    if (state.selectedCell === null) {
      state.selectedCell = { r, c };
      renderGrid();
      return;
    }
    if (state.selectedCell.r === r && state.selectedCell.c === c) {
      state.selectedCell = null; // لغو انتخاب
      renderGrid();
      return;
    }
    swapCells(state.selectedCell.r, state.selectedCell.c, r, c);
    state.selectedCell = null;
    registerMove();
  }

  /* =========================================================
     تعامل: Drag & Drop
  ========================================================= */
  function handleDrop(payload, tr, tc) {
    if (!payload || !payload.startsWith('cell:')) return;
    const [, a, b] = payload.split(':');
    const sr = Number(a), sc = Number(b);
    if (sr === tr && sc === tc) return;
    swapCells(sr, sc, tr, tc);
    state.selectedCell = null;
    registerMove();
  }

  function swapCells(r1, c1, r2, c2) {
    const tmp = state.grid[r1][c1];
    state.grid[r1][c1] = state.grid[r2][c2];
    state.grid[r2][c2] = tmp;
  }

  function registerMove() {
    state.moves++;
    updateHud();
    renderGrid();
  }

  /* =========================================================
     بررسی برد
  ========================================================= */
  function checkWin(sums, M) {
    const n = state.size;
    const rowsOk = sums.rows.every((s) => s === M);
    const colsOk = sums.cols.every((s) => s === M);
    const diagOk = sums.mainSum === M && sums.antiSum === M;

    if (rowsOk && colsOk && diagOk) {
      stopTimer();
      const target = n * n * 0.6;
      let stars;
      if (state.moves <= target) stars = 3;
      else if (state.moves <= n * n * 1.2) stars = 2;
      else stars = 1;

      const statsAfter = submitResult(n, state.moves, state.seconds, stars);
      showResult(stars, statsAfter);
    }
  }

  /* =========================================================
     صفحه نتیجه
  ========================================================= */
  function showResult(stars, statsAfter) {
    renderStars(stars);
    els.resultTitle.textContent = stars === 3
      ? 'محشر بود! مربع را کامل و بهینه ساختی 🏆'
      : stars === 2
      ? 'آفرین! مربع جادویی درست شد ⭐'
      : 'درست شد! با جابه‌جایی کمتر می‌تونی ستاره بیشتری بگیری 💪';
    els.resultSub.textContent = `مربع ${toFa(state.size)}×${toFa(state.size)} با عدد جادویی ${toFa(magicConstant(state.size))}`;

    els.finalMoves.textContent = toFa(state.moves);
    els.finalTime.textContent = formatTime(state.seconds);
    els.finalBestMoves.textContent = toFa(statsAfter.bestMoves[state.size]);

    const idx = SIZES.indexOf(state.size);
    const hasNext = idx >= 0 && idx + 1 < SIZES.length;
    els.nextSizeBtn.classList.toggle('hidden', !hasNext);
    if (hasNext) {
      els.nextSizeBtn.onclick = () => beginPuzzle(SIZES[idx + 1]);
    }
    els.retryBtn.onclick = () => beginPuzzle(state.size);

    showScreen('result');
  }

  function renderStars(count) {
    els.starsRow.querySelectorAll('.star').forEach((s, i) => {
      s.classList.toggle('filled', i < count);
      s.style.animationDelay = `${i * 0.12}s`;
    });
  }

  /* =========================================================
     راهنمایی
  ========================================================= */
  function bindHint() {
    els.hintBtn.addEventListener('click', () => {
      const n = state.size, M = magicConstant(n);
      const sums = computeSums();
      const problems = [];
      sums.rows.forEach((s, i) => { if (s !== M) problems.push(`سطر ${toFa(i + 1)} مجموعش ${toFa(s)} است، باید ${toFa(M)} شود`); });
      sums.cols.forEach((s, i) => { if (s !== M) problems.push(`ستون ${toFa(i + 1)} مجموعش ${toFa(s)} است، باید ${toFa(M)} شود`); });
      if (sums.mainSum !== M) problems.push(`قطر اصلی مجموعش ${toFa(sums.mainSum)} است، باید ${toFa(M)} شود`);
      if (sums.antiSum !== M) problems.push(`قطر فرعی مجموعش ${toFa(sums.antiSum)} است، باید ${toFa(M)} شود`);

      els.hintBox.textContent = problems.length > 0
        ? '💡 ' + problems[0]
        : '💡 همه چیز درست به‌نظر می‌رسه!';
      setTimeout(() => { els.hintBox.textContent = ''; }, 5000);
    });

    els.resetBtn.addEventListener('click', () => beginPuzzle(state.size));
  }

  /* =========================================================
     تم روشن/تاریک (کلید مشترک با کل سایت MathPlay)
  ========================================================= */
  function bindThemeToggle() {
    const btn = document.getElementById('themeToggle');
    if (!btn) return;
    const THEME_KEY = 'mathplay_theme';

    const refreshIcon = () => {
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      btn.textContent = isDark ? '☀️' : '🌙';
    };
    refreshIcon();

    btn.addEventListener('click', () => {
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      const next = isDark ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      try { localStorage.setItem(THEME_KEY, next); } catch (e) { /* ignore */ }
      refreshIcon();
    });
  }

  /* =========================================================
     init
  ========================================================= */
  function init() {
    renderBgField();
    bindThemeToggle();
    renderLevelCards();
    bindStartScreen();
    bindHint();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
