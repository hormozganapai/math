/**
 * game.js — شهر اعداد صحیح (Integer City)
 * ---------------------------------------------------------
 * بازی مستقل (بدون هیچ وابستگی خارجی جز فونت) برای آموزش
 * اعداد صحیح: شناخت، مقایسه، حرکت روی خط اعداد، جمع و تفریق.
 *
 * ساختار:
 *  - LEVELS: تنظیمات سطح (بازه اعداد، مراحل فعال، تعداد سؤال هر مرحله)
 *  - STAGE_META: عنوان و توضیح هر نوع مرحله
 *  - generateQuestion(): تولید تصادفی سؤال بر اساس نوع مرحله
 *  - رندر ساختمان/آسانسور به‌صورت پویا با موقعیت نسبی
 *  - state machine ساده برای پیشروی بین سؤال‌ها
 *  - ذخیره بهترین امتیاز در localStorage (کلید: integer_city_stats)
 * ---------------------------------------------------------
 */
(function () {
  'use strict';

  /* =========================================================
     تنظیمات سطوح
  ========================================================= */
  const LEVELS = {
    easy: {
      label: 'آسان',
      range: [-5, 5],
      stages: ['recognize'],
      perStage: 6,
      scoreMultiplier: 1
    },
    medium: {
      label: 'متوسط',
      range: [-10, 10],
      stages: ['recognize', 'compare', 'move', 'add'],
      perStage: 3,
      scoreMultiplier: 1.5
    },
    hard: {
      label: 'سخت',
      range: [-50, 50],
      stages: ['add', 'subtract'],
      perStage: 4,
      scoreMultiplier: 2
    }
  };

  const STAGE_META = {
    recognize: { index: 1, title: 'شناخت اعداد صحیح' },
    compare:   { index: 2, title: 'مقایسه اعداد' },
    move:      { index: 3, title: 'حرکت آسانسور' },
    add:       { index: 4, title: 'جمع اعداد صحیح' },
    subtract:  { index: 5, title: 'تفریق اعداد صحیح' }
  };

  const ENCOURAGE_CORRECT = [
    'آفرین! آسانسور درست حرکت کرد 🎉',
    'عالی بود! دقیقاً درست گفتی ⭐',
    'محشر! ادامه بده 🚀',
    'دمت گرم! کاملاً درسته ✅'
  ];
  const ENCOURAGE_WRONG = [
    'اشکالی نداره، دوباره تلاش کن 💪',
    'نزدیک بود! به خط اعداد نگاه کن 🔍',
    'یک بار دیگه با دقت به آسانسور نگاه کن 🧐'
  ];

  const STORAGE_KEY = 'integer_city_stats';

  /* =========================================================
     ابزارهای کمکی
  ========================================================= */
  const DIGITS_FA = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  function toFa(val) {
    return String(val).replace(/[0-9]/g, (d) => DIGITS_FA[d]);
  }
  function fmtSigned(n) {
    if (n > 0) return `+${toFa(n)}`;
    if (n < 0) return `−${toFa(Math.abs(n))}`;
    return toFa(0);
  }
  function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }
  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
  }

  /* =========================================================
     ذخیره‌سازی محلی
  ========================================================= */
  function loadStats() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { bestScore: 0, gamesPlayed: 0, bestStars: 0 };
      return JSON.parse(raw);
    } catch (e) {
      return { bestScore: 0, gamesPlayed: 0, bestStars: 0 };
    }
  }
  function saveStats(stats) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
    } catch (e) { /* localStorage در دسترس نیست، بی‌خیال ذخیره می‌شویم */ }
  }
  function recordGamePlayed() {
    const s = loadStats();
    s.gamesPlayed = (s.gamesPlayed || 0) + 1;
    saveStats(s);
  }
  function submitResult(score, stars) {
    const s = loadStats();
    if (score > (s.bestScore || 0)) s.bestScore = score;
    if (stars > (s.bestStars || 0)) s.bestStars = stars;
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
    bestScoreVal: document.getElementById('bestScoreVal'),

    playScreen: document.getElementById('playScreen'),
    timerVal: document.getElementById('timerVal'),
    correctVal: document.getElementById('correctVal'),
    wrongVal: document.getElementById('wrongVal'),
    scoreVal: document.getElementById('scoreVal'),
    progressFill: document.getElementById('progressFill'),
    stageBadge: document.getElementById('stageBadge'),
    shaft: document.getElementById('shaft'),
    questionPrompt: document.getElementById('questionPrompt'),
    questionSub: document.getElementById('questionSub'),
    optionsRow: document.getElementById('optionsRow'),
    feedbackMsg: document.getElementById('feedbackMsg'),

    resultScreen: document.getElementById('resultScreen'),
    starsRow: document.getElementById('starsRow'),
    resultTitle: document.getElementById('resultTitle'),
    resultSub: document.getElementById('resultSub'),
    finalCorrect: document.getElementById('finalCorrect'),
    finalWrong: document.getElementById('finalWrong'),
    finalPercent: document.getElementById('finalPercent'),
    finalTime: document.getElementById('finalTime'),
    finalScore: document.getElementById('finalScore'),
    finalBest: document.getElementById('finalBest'),
    playAgainBtn: document.getElementById('playAgainBtn'),
    changeLevelBtn: document.getElementById('changeLevelBtn')
  };

  /* =========================================================
     وضعیت بازی
  ========================================================= */
  const state = {
    levelId: 'easy',
    questions: [],
    qIndex: 0,
    correct: 0,
    wrong: 0,
    score: 0,
    seconds: 0,
    timerHandle: null,
    locked: false
  };

  /* =========================================================
     پس‌زمینه اعداد شناور
  ========================================================= */
  function renderBgField() {
    const symbols = ['+1', '-2', '+3', '-4', '0', '+5', '-1', '+2', '-3'];
    const total = window.innerWidth < 640 ? 10 : 18;
    const frag = document.createDocumentFragment();
    for (let i = 0; i < total; i++) {
      const span = document.createElement('span');
      span.textContent = pick(symbols);
      span.style.left = `${Math.random() * 100}%`;
      span.style.fontSize = `${16 + Math.random() * 26}px`;
      span.style.animationDuration = `${14 + Math.random() * 12}s`;
      span.style.animationDelay = `-${Math.random() * 20}s`;
      frag.appendChild(span);
    }
    els.bgField.appendChild(frag);
  }

  /* =========================================================
     تولید سؤال بر اساس نوع مرحله
  ========================================================= */
  function generateQuestion(stageType, range) {
    const [min, max] = range;

    if (stageType === 'recognize') {
      const n = randInt(min, max);
      const sign = n > 0 ? 'مثبت' : n < 0 ? 'منفی' : 'صفر';
      return {
        stageType,
        prompt: 'آسانسور روی این طبقه ایستاده. این عدد چیست؟',
        sub: `آسانسور روی طبقه ${fmtSigned(n)} قرار دارد.`,
        options: shuffle(['عدد مثبت', 'عدد منفی', 'صفر']),
        correctOption: sign === 'مثبت' ? 'عدد مثبت' : sign === 'منفی' ? 'عدد منفی' : 'صفر',
        visual: { car: n }
      };
    }

    if (stageType === 'compare') {
      let a = randInt(min, max);
      let b = randInt(min, max);
      while (b === a) b = randInt(min, max);
      const correct = a > b ? a : b;
      return {
        stageType,
        prompt: 'کدام طبقه بالاتر است؟',
        sub: 'روی طبقه‌ای که فکر می‌کنی بالاتر است کلیک کن.',
        options: shuffle([fmtSigned(a), fmtSigned(b)]),
        correctOption: fmtSigned(correct),
        visual: { car: a, target: b }
      };
    }

    if (stageType === 'move') {
      const start = randInt(min, max);
      const steps = randInt(1, Math.max(2, Math.floor((max - min) / 2)));
      const goUp = Math.random() < 0.5;
      const dest = goUp ? start + steps : start - steps;
      const distractors = shuffle([dest + 1, dest - 1, -dest].filter((d) => d !== dest));
      const optionSet = new Set([dest, distractors[0]]);
      let extra = distractors[1];
      let guard = 0;
      while (optionSet.size < 3 && guard < 10) {
        if (!optionSet.has(extra)) optionSet.add(extra);
        else extra += 1;
        guard++;
      }
      const finalOptions = shuffle([...optionSet]).slice(0, 3);
      if (!finalOptions.includes(dest)) finalOptions[0] = dest;

      return {
        stageType,
        prompt: `دستور: از طبقه ${fmtSigned(start)} به‌اندازه ${toFa(steps)} طبقه ${goUp ? 'بالا' : 'پایین'} برو.`,
        sub: 'آسانسور به کدام طبقه می‌رسد؟',
        options: shuffle(finalOptions.map(fmtSigned)),
        correctOption: fmtSigned(dest),
        visual: { car: start, target: dest }
      };
    }

    if (stageType === 'add' || stageType === 'subtract') {
      const a = randInt(min, max);
      const b = randInt(1, Math.max(2, Math.floor((max - min) / 2)));
      const bSigned = Math.random() < 0.5 ? b : -b;
      const isAdd = stageType === 'add';
      const result = isAdd ? a + bSigned : a - bSigned;
      const opSymbol = isAdd ? '+' : '−';
      const moveText = isAdd
        ? (bSigned >= 0 ? `${toFa(bSigned)} طبقه بالا` : `${toFa(Math.abs(bSigned))} طبقه پایین`)
        : (bSigned >= 0 ? `${toFa(bSigned)} طبقه پایین` : `${toFa(Math.abs(bSigned))} طبقه بالا`);

      const distractors = new Set([result + 1, result - 1, a]);
      distractors.delete(result);
      const optionValues = shuffle([result, ...[...distractors].slice(0, 2)]);

      // عملوند دوم را همیشه با علامت واقعی‌اش داخل پرانتز نشان می‌دهیم تا
      // عبارت نمایشی دقیقاً با همان محاسبه‌ای که پاسخ درست از آن به دست
      // می‌آید یکی باشد (مثلاً اگر واقعاً «۱ طبقه پایین» یعنی جمع با ۱−،
      // عبارت باید «... + (۱−)» نشان داده شود، نه «... + ۱»).
      return {
        stageType,
        prompt: `${fmtSigned(a)} ${opSymbol} (${fmtSigned(bSigned)}) = ?`,
        promptIsEquation: true,
        sub: `آسانسور از طبقه ${fmtSigned(a)} به‌اندازه ${moveText} حرکت می‌کند.`,
        options: shuffle(optionValues.map(fmtSigned)),
        correctOption: fmtSigned(result),
        visual: { car: a, target: result }
      };
    }

    throw new Error('نوع مرحله نامعتبر: ' + stageType);
  }

  function buildQuestionQueue(levelId) {
    const cfg = LEVELS[levelId];
    const queue = [];
    cfg.stages.forEach((stageType) => {
      for (let i = 0; i < cfg.perStage; i++) {
        queue.push(generateQuestion(stageType, cfg.range));
      }
    });
    return queue;
  }

  /* =========================================================
     رندر ساختمان / آسانسور
  ========================================================= */
  function renderBuilding(q, levelRange) {
    const [min, max] = levelRange;
    const span = max - min;
    const step = span <= 12 ? 1 : span <= 30 ? 5 : 10;

    els.shaft.innerHTML = '';

    for (let v = min; v <= max; v += step) {
      const pct = 100 - ((v - min) / span) * 100;
      const mark = document.createElement('div');
      mark.className = 'floor-mark' + (v === 0 ? ' zero-mark' : '');
      mark.style.top = `${pct}%`;
      const label = document.createElement('span');
      label.textContent = v === 0 ? '۰ 🚪' : fmtSigned(v);
      mark.appendChild(label);
      els.shaft.appendChild(mark);
    }
    if ((max - min) % step !== 0) {
      const mark = document.createElement('div');
      mark.className = 'floor-mark';
      mark.style.top = '0%';
      const label = document.createElement('span');
      label.textContent = fmtSigned(max);
      mark.appendChild(label);
      els.shaft.appendChild(mark);
    }

    function posPct(v) {
      const clamped = clamp(v, min, max);
      return 100 - ((clamped - min) / span) * 100;
    }

    const car = document.createElement('div');
    car.className = 'elevator-car';
    car.id = 'elevatorCar';
    car.textContent = '🛗';
    car.style.top = `${posPct(q.visual.car)}%`;
    els.shaft.appendChild(car);

    if (typeof q.visual.target === 'number' && q.visual.target !== q.visual.car) {
      const targetCar = document.createElement('div');
      targetCar.className = 'elevator-car target-car';
      targetCar.textContent = '🎯';
      targetCar.style.top = `${posPct(q.visual.target)}%`;
      els.shaft.appendChild(targetCar);
    }

    return { posPct, carEl: car };
  }

  /* =========================================================
     نمایش یک سؤال
  ========================================================= */
  let currentBuildingCtl = null;

  function showQuestion() {
    const cfg = LEVELS[state.levelId];
    const q = state.questions[state.qIndex];
    state.locked = false;

    const meta = STAGE_META[q.stageType];
    els.stageBadge.textContent = `مرحله ${toFa(meta.index)} — ${meta.title}`;
    els.questionPrompt.textContent = q.prompt;
    els.questionPrompt.classList.toggle('is-equation', !!q.promptIsEquation);
    els.questionSub.textContent = q.sub;
    els.feedbackMsg.textContent = '';
    els.feedbackMsg.className = 'feedback-msg';

    currentBuildingCtl = renderBuilding(q, cfg.range);

    els.optionsRow.innerHTML = '';
    q.options.forEach((optLabel) => {
      const btn = document.createElement('button');
      btn.className = 'option-btn';
      btn.type = 'button';
      btn.textContent = optLabel;
      btn.addEventListener('click', () => handleAnswer(btn, optLabel, q));
      els.optionsRow.appendChild(btn);
    });

    els.progressFill.style.width = `${(state.qIndex / state.questions.length) * 100}%`;
  }

  function handleAnswer(btnEl, chosenLabel, q) {
    if (state.locked) return;
    state.locked = true;

    const isCorrect = chosenLabel === q.correctOption;
    const allBtns = [...els.optionsRow.children];
    allBtns.forEach((b) => (b.disabled = true));

    if (isCorrect) {
      btnEl.classList.add('correct');
      state.correct++;
      const base = 10;
      state.score += Math.round(base * LEVELS[state.levelId].scoreMultiplier);
      els.feedbackMsg.textContent = pick(ENCOURAGE_CORRECT);
      els.feedbackMsg.classList.add('correct');
    } else {
      btnEl.classList.add('wrong');
      state.wrong++;
      const correctBtn = allBtns.find((b) => b.textContent === q.correctOption);
      if (correctBtn) correctBtn.classList.add('correct');
      els.feedbackMsg.textContent = pick(ENCOURAGE_WRONG);
      els.feedbackMsg.classList.add('wrong');
      btnEl.classList.add('shake');
    }

    els.correctVal.textContent = toFa(state.correct);
    els.wrongVal.textContent = toFa(state.wrong);
    els.scoreVal.textContent = toFa(state.score);

    if (currentBuildingCtl && typeof q.visual.target === 'number') {
      const car = document.getElementById('elevatorCar');
      if (car) {
        car.classList.add('moving');
        car.style.top = `${currentBuildingCtl.posPct(q.visual.target)}%`;
      }
    }

    setTimeout(() => {
      state.qIndex++;
      if (state.qIndex >= state.questions.length) {
        finishGame();
      } else {
        showQuestion();
      }
    }, 1300);
  }

  /* =========================================================
     تایمر
  ========================================================= */
  function startTimer() {
    clearInterval(state.timerHandle);
    state.seconds = 0;
    els.timerVal.textContent = formatTime(0);
    state.timerHandle = setInterval(() => {
      state.seconds++;
      els.timerVal.textContent = formatTime(state.seconds);
    }, 1000);
  }
  function stopTimer() {
    clearInterval(state.timerHandle);
  }
  function formatTime(totalSeconds) {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return toFa(`${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
  }

  /* =========================================================
     پایان بازی و ستاره‌دهی
  ========================================================= */
  function finishGame() {
    stopTimer();
    const total = state.correct + state.wrong;
    const percent = total > 0 ? (state.correct / total) * 100 : 0;

    let stars;
    if (percent > 90) stars = 3;
    else if (percent >= 70) stars = 2;
    else stars = 1;

    if (percent > 90 && state.seconds < 60) {
      state.score += 20;
    }

    const savedStats = submitResult(state.score, stars);

    els.starsRow.querySelectorAll('.star').forEach((starEl, i) => {
      starEl.classList.toggle('filled', i < stars);
      starEl.style.animationDelay = `${i * 0.12}s`;
    });

    els.resultTitle.textContent = stars === 3
      ? 'محشر بودی، قهرمان شهر اعداد صحیح شدی! 🏆'
      : stars === 2
      ? 'عالی بود! یک مرحله دیگر باز شد ⭐'
      : 'آفرین که تلاش کردی، بازم امتحان کن 💪';
    els.resultSub.textContent = `در سطح ${LEVELS[state.levelId].label} با ${toFa(total)} سؤال بازی کردی.`;

    els.finalCorrect.textContent = toFa(state.correct);
    els.finalWrong.textContent = toFa(state.wrong);
    els.finalPercent.textContent = `${toFa(Math.round(percent))}٪`;
    els.finalTime.textContent = formatTime(state.seconds);
    els.finalScore.textContent = toFa(state.score);
    els.finalBest.textContent = toFa(savedStats.bestScore);

    els.playScreen.classList.add('hidden');
    els.resultScreen.classList.remove('hidden');
  }

  /* =========================================================
     شروع/راه‌اندازی بازی
  ========================================================= */
  function startGame() {
    state.questions = buildQuestionQueue(state.levelId);
    state.qIndex = 0;
    state.correct = 0;
    state.wrong = 0;
    state.score = 0;

    els.correctVal.textContent = toFa(0);
    els.wrongVal.textContent = toFa(0);
    els.scoreVal.textContent = toFa(0);
    els.progressFill.style.width = '0%';

    recordGamePlayed();

    els.startScreen.classList.add('hidden');
    els.resultScreen.classList.add('hidden');
    els.playScreen.classList.remove('hidden');

    startTimer();
    showQuestion();
  }

  /* =========================================================
     اتصال رویدادها
  ========================================================= */
  function bindStartScreen() {
    els.levelCards.addEventListener('click', (e) => {
      const card = e.target.closest('.level-card');
      if (!card) return;
      [...els.levelCards.children].forEach((c) => c.classList.remove('active'));
      card.classList.add('active');
      state.levelId = card.dataset.level;
    });
    els.startBtn.addEventListener('click', startGame);

    const stats = loadStats();
    els.bestScoreVal.textContent = toFa(stats.bestScore || 0);
  }

  function bindResultScreen() {
    els.playAgainBtn.addEventListener('click', startGame);
    els.changeLevelBtn.addEventListener('click', () => {
      els.resultScreen.classList.add('hidden');
      els.startScreen.classList.remove('hidden');
      const stats = loadStats();
      els.bestScoreVal.textContent = toFa(stats.bestScore || 0);
    });
  }

  /* =========================================================
     init
  ========================================================= */
  function init() {
    renderBgField();
    bindStartScreen();
    bindResultScreen();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
