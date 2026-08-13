/**
 * game.js — دنیای احتمال
 * ---------------------------------------------------------
 * بازی سه‌مرحله‌ای آموزش احتمال:
 *  ۱) حدس زدن احتمال یک رویداد
 *  ۲) اجرای آزمایش تصادفی (۱۰، ۵۰، ۱۰۰ بار)
 *  ۳) مقایسه احتمال نظری، تجربی و حدس دانش‌آموز
 * ---------------------------------------------------------
 */
(function () {
  const GAME_ID = 'probability';

  /* تعریف رویدادهای هدف بر اساس ابزار و سطح انتخابی */
  const EVENTS = {
    coin: {
      easy:   { label: 'آمدن «رو»',            theoretical: 0.5,  check: (r) => r === 'رو' },
      medium: { label: 'آمدن «پشت»',              theoretical: 0.5,  check: (r) => r === 'پشت' },
      hard:   { label: 'آمدن «رو» سه بار پشت‌هم به‌صورت میانگین هر بلوک', theoretical: 0.5, check: (r) => r === 'رو' }
    },
    die: {
      easy:   { label: 'آمدن عدد «۶»',           theoretical: 1 / 6, check: (r) => r === 6 },
      medium: { label: 'آمدن یک عدد زوج',        theoretical: 0.5,  check: (r) => r % 2 === 0 },
      hard:   { label: 'آمدن عددی بزرگ‌تر از ۴',  theoretical: 2 / 6, check: (r) => r > 4 }
    }
  };

  const state = {
    tool: 'coin',
    level: 'easy',
    guess: 0,
    totalTrials: 0,
    targetHits: 0,
    round: 1,
    totalScore: 0
  };

  const els = {
    stepItems: document.querySelectorAll('.step-tracker .step'),
    setupPanel: document.getElementById('setupPanel'),
    guessPanel: document.getElementById('guessPanel'),
    experimentPanel: document.getElementById('experimentPanel'),
    comparePanel: document.getElementById('comparePanel'),

    toolGroup: document.getElementById('toolGroup'),
    levelGroup: document.getElementById('levelGroup'),
    startRoundBtn: document.getElementById('startRoundBtn'),

    guessQuestion: document.getElementById('guessQuestion'),
    guessHint: document.getElementById('guessHint'),
    guessInput: document.getElementById('guessInput'),
    confirmGuessBtn: document.getElementById('confirmGuessBtn'),

    coinVisual: document.getElementById('coinVisual'),
    dieVisual: document.getElementById('dieVisual'),
    totalTrials: document.getElementById('totalTrials'),
    targetHits: document.getElementById('targetHits'),
    experimentalProb: document.getElementById('experimentalProb'),
    goToCompareBtn: document.getElementById('goToCompareBtn'),

    compareGuess: document.getElementById('compareGuess'),
    compareTheoretical: document.getElementById('compareTheoretical'),
    compareExperimental: document.getElementById('compareExperimental'),
    feedbackMsg: document.getElementById('feedbackMsg'),
    starsRow: document.getElementById('starsRow'),
    playAgainBtn: document.getElementById('playAgainBtn'),

    scoreVal: document.getElementById('scoreVal')
  };

  const DIGITS_FA = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  function toFa(num) {
    return String(num).replace(/[0-9]/g, (d) => DIGITS_FA[d]);
  }

  function currentEvent() {
    return EVENTS[state.tool][state.level];
  }

  function setStep(n) {
    els.stepItems.forEach((li) => {
      const step = Number(li.dataset.step);
      li.classList.remove('active', 'done');
      if (step < n) li.classList.add('done');
      if (step === n) li.classList.add('active');
    });
  }

  /* ---------------------------------------------------------
     مرحله صفر: انتخاب ابزار و سطح
  --------------------------------------------------------- */
  function bindSetup() {
    els.toolGroup.addEventListener('click', (e) => {
      const btn = e.target.closest('.pill-btn');
      if (!btn) return;
      [...els.toolGroup.children].forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      state.tool = btn.dataset.tool;
    });

    els.levelGroup.addEventListener('click', (e) => {
      const btn = e.target.closest('.pill-btn');
      if (!btn) return;
      [...els.levelGroup.children].forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      state.level = btn.dataset.level;
    });

    els.startRoundBtn.addEventListener('click', startGuessStep);
  }

  /* ---------------------------------------------------------
     مرحله ۱: حدس
  --------------------------------------------------------- */
  function startGuessStep() {
    const ev = currentEvent();
    const toolLabel = state.tool === 'coin' ? 'پرتاب سکه' : 'پرتاب تاس';
    els.guessQuestion.textContent = `احتمال «${ev.label}» در ${toolLabel} چند درصد است؟`;
    els.guessHint.textContent =
      state.tool === 'coin'
        ? 'راهنمایی: سکه دو رو دارد.'
        : 'راهنمایی: تاس شش رو دارد (۱ تا ۶).';
    els.guessInput.value = '';

    els.setupPanel.classList.add('hidden');
    els.guessPanel.classList.remove('hidden');
    setStep(1);
  }

  function bindGuess() {
    els.confirmGuessBtn.addEventListener('click', () => {
      const val = Number(els.guessInput.value);
      if (Number.isNaN(val) || val < 0 || val > 100 || els.guessInput.value.trim() === '') {
        els.guessInput.classList.add('shake');
        setTimeout(() => els.guessInput.classList.remove('shake'), 500);
        els.guessInput.focus();
        return;
      }
      state.guess = val;
      startExperimentStep();
    });
  }

  /* ---------------------------------------------------------
     مرحله ۲: آزمایش
  --------------------------------------------------------- */
  function startExperimentStep() {
    state.totalTrials = 0;
    state.targetHits = 0;
    updateResultsBox();

    els.coinVisual.classList.toggle('hidden', state.tool !== 'coin');
    els.dieVisual.classList.toggle('hidden', state.tool !== 'die');
    els.goToCompareBtn.disabled = true;

    els.guessPanel.classList.add('hidden');
    els.experimentPanel.classList.remove('hidden');
    setStep(2);
  }

  function runTrials(count) {
    const ev = currentEvent();
    for (let i = 0; i < count; i++) {
      const result = state.tool === 'coin'
        ? (Math.random() < 0.5 ? 'رو' : 'پشت')
        : (1 + Math.floor(Math.random() * 6));
      if (ev.check(result)) state.targetHits++;
      state.totalTrials++;
    }
    updateResultsBox();
    animateTool();
    els.goToCompareBtn.disabled = false;
  }

  function animateTool() {
    if (state.tool === 'coin') {
      els.coinVisual.classList.remove('flipping');
      void els.coinVisual.offsetWidth; // ری‌فلو برای اجرای مجدد انیمیشن
      els.coinVisual.classList.add('flipping');
      els.coinVisual.textContent = Math.random() < 0.5 ? '🪙' : '🪙';
    } else {
      els.dieVisual.classList.remove('rolling');
      void els.dieVisual.offsetWidth;
      els.dieVisual.classList.add('rolling');
      const faces = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
      els.dieVisual.textContent = faces[Math.floor(Math.random() * faces.length)];
    }
  }

  function updateResultsBox() {
    const prob = state.totalTrials > 0 ? (state.targetHits / state.totalTrials) * 100 : 0;
    els.totalTrials.textContent = toFa(state.totalTrials);
    els.targetHits.textContent = toFa(state.targetHits);
    els.experimentalProb.textContent = `${toFa(prob.toFixed(1))}٪`;
  }

  function bindExperiment() {
    document.querySelectorAll('.trial-btn').forEach((btn) => {
      btn.addEventListener('click', () => runTrials(Number(btn.dataset.count)));
    });
    els.goToCompareBtn.addEventListener('click', startCompareStep);
  }

  /* ---------------------------------------------------------
     مرحله ۳: مقایسه و امتیازدهی
  --------------------------------------------------------- */
  function startCompareStep() {
    const ev = currentEvent();
    const theoreticalPct = ev.theoretical * 100;
    const experimentalPct = state.totalTrials > 0 ? (state.targetHits / state.totalTrials) * 100 : 0;

    els.compareGuess.textContent = `${toFa(state.guess)}٪`;
    els.compareTheoretical.textContent = `${toFa(theoreticalPct.toFixed(1))}٪`;
    els.compareExperimental.textContent = `${toFa(experimentalPct.toFixed(1))}٪`;

    const guessDiff = Math.abs(state.guess - theoreticalPct);
    const expDiff = Math.abs(experimentalPct - theoreticalPct);

    let stars;
    let message;
    if (guessDiff <= 5) {
      stars = 3;
      message = 'عالی بود! حدس تو خیلی نزدیک به احتمال واقعی بود. 🎉';
    } else if (guessDiff <= 15) {
      stars = 2;
      message = 'خوب بود! با کمی تمرین بیشتر، حدس‌هایت دقیق‌تر می‌شود. 👍';
    } else {
      stars = 1;
      message = 'اشکالی ندارد! هرچه تعداد آزمایش بیشتر باشد، به احتمال نظری نزدیک‌تر می‌شویم. دوباره امتحان کن. 💪';
    }

    if (expDiff <= 3 && stars < 3) {
      message += ' نکته: آزمایش تجربی‌ات هم خیلی به احتمال نظری نزدیک شد.';
    }

    els.feedbackMsg.textContent = message;
    renderStars(stars);

    const roundScore = stars * 10 + Math.min(state.totalTrials, 100) / 10 | 0;
    state.totalScore += roundScore;
    els.scoreVal.textContent = toFa(state.totalScore);
    MathPlayScore.submitScore(GAME_ID, state.totalScore);
    MathPlayScore.setLastLevel(GAME_ID, `${state.tool === 'coin' ? 'سکه' : 'تاس'} / ${levelLabel(state.level)}`);

    els.experimentPanel.classList.add('hidden');
    els.comparePanel.classList.remove('hidden');
    setStep(3);
  }

  function levelLabel(level) {
    return { easy: 'آسان', medium: 'متوسط', hard: 'سخت' }[level] || level;
  }

  function renderStars(count) {
    els.starsRow.innerHTML = '';
    for (let i = 1; i <= 3; i++) {
      const span = document.createElement('span');
      span.className = 'star' + (i <= count ? ' filled' : '');
      span.textContent = '⭐';
      span.style.animationDelay = `${i * 0.1}s`;
      els.starsRow.appendChild(span);
    }
  }

  function bindCompare() {
    els.playAgainBtn.addEventListener('click', () => {
      state.round++;
      els.comparePanel.classList.add('hidden');
      els.setupPanel.classList.remove('hidden');
      setStep(1);
      els.stepItems.forEach((li) => li.classList.remove('done', 'active'));
      els.stepItems[0].classList.add('active');
    });
  }

  /* ---------------------------------------------------------
     راه‌اندازی
  --------------------------------------------------------- */
  function init() {
    MathPlayScore.recordPlay(GAME_ID);
    bindSetup();
    bindGuess();
    bindExperiment();
    bindCompare();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
