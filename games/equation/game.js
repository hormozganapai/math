/**
 * game.js — قهرمان معادله
 * ---------------------------------------------------------
 * بازی حل معادله یک مجهولی با تولید خودکار سؤال و سه سطح سختی:
 *   آسان:   x + a = b
 *   متوسط:  ax + b = c
 *   سخت:    ax + b = cx + d
 * برای عبور از هر سطح باید ۵ پاسخ صحیح ثبت شود.
 * ---------------------------------------------------------
 */
(function () {
  const GAME_ID = 'equation';
  const TARGET_CORRECT = 5;
  const LEVEL_ORDER = ['easy', 'medium', 'hard'];
  const LEVEL_POINTS = { easy: 10, medium: 15, hard: 20 };

  const state = {
    level: 'easy',
    correct: 0,
    wrong: 0,
    current: null, // {a,b,c,d,answer,text}
    timerSeconds: 0,
    timerHandle: null,
    totalScore: 0,
    roundScore: 0
  };

  const els = {
    setupPanel: document.getElementById('setupPanel'),
    playPanel: document.getElementById('playPanel'),
    resultPanel: document.getElementById('resultPanel'),
    levelCards: document.getElementById('levelCards'),

    timerVal: document.getElementById('timerVal'),
    correctCount: document.getElementById('correctCount'),
    wrongCount: document.getElementById('wrongCount'),
    progressFill: document.getElementById('progressFill'),

    equationDisplay: document.getElementById('equationDisplay'),
    answerInput: document.getElementById('answerInput'),
    submitAnswerBtn: document.getElementById('submitAnswerBtn'),
    hintBtn: document.getElementById('hintBtn'),
    hintText: document.getElementById('hintText'),
    feedbackInline: document.getElementById('feedbackInline'),

    resultEmoji: document.getElementById('resultEmoji'),
    resultTitle: document.getElementById('resultTitle'),
    finalCorrect: document.getElementById('finalCorrect'),
    finalTime: document.getElementById('finalTime'),
    finalRoundScore: document.getElementById('finalRoundScore'),
    nextLevelBtn: document.getElementById('nextLevelBtn'),
    retryLevelBtn: document.getElementById('retryLevelBtn'),

    scoreVal: document.getElementById('scoreVal')
  };

  const DIGITS_FA = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  function toFa(num) {
    return String(num).replace(/[0-9]/g, (d) => DIGITS_FA[d]);
  }

  function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function fmtNum(n) {
    return n < 0 ? `(${n})` : `${n}`;
  }

  /* ---------------------------------------------------------
     تولید معادله بر اساس سطح
  --------------------------------------------------------- */
  function generateEquation(level) {
    if (level === 'easy') {
      // x + a = b  → x = b - a
      const a = randInt(-12, 12);
      const x = randInt(-15, 15);
      const b = x + a;
      return {
        text: `x + ${fmtNum(a)} = ${fmtNum(b)}`,
        answer: x,
        hint: `برای پیدا کردن x، عدد ${fmtNum(a)} را از طرف مقابل تساوی کم کن: x = ${fmtNum(b)} − ${fmtNum(a)}`
      };
    }

    if (level === 'medium') {
      // ax + b = c → x = (c-b)/a
      let a = randInt(2, 9);
      if (Math.random() < 0.5) a = -a;
      const x = randInt(-10, 10);
      const b = randInt(-15, 15);
      const c = a * x + b;
      return {
        text: `${fmtNum(a)}x + ${fmtNum(b)} = ${fmtNum(c)}`,
        answer: x,
        hint: `اول ${fmtNum(b)} را از دو طرف کم کن، بعد دو طرف را بر ${fmtNum(a)} تقسیم کن.`
      };
    }

    // hard: ax + b = cx + d → x = (d-b)/(a-c)
    let a, c;
    do {
      a = randInt(-8, 8);
      c = randInt(-8, 8);
    } while (a === c || a === 0 || c === 0);
    const x = randInt(-10, 10);
    const b = randInt(-12, 12);
    const d = (a - c) * x + b;
    return {
      text: `${fmtNum(a)}x + ${fmtNum(b)} = ${fmtNum(c)}x + ${fmtNum(d)}`,
      answer: x,
      hint: `جمله‌های x‌دار را یک طرف و اعداد را طرف دیگر بیاور: (${fmtNum(a)} − ${fmtNum(c)})x = ${fmtNum(d)} − ${fmtNum(b)}`
    };
  }

  /* ---------------------------------------------------------
     انتخاب سطح
  --------------------------------------------------------- */
  function bindSetup() {
    els.levelCards.addEventListener('click', (e) => {
      const card = e.target.closest('.level-card');
      if (!card) return;
      startLevel(card.dataset.level);
    });
  }

  function startLevel(level) {
    state.level = level;
    state.correct = 0;
    state.wrong = 0;
    state.timerSeconds = 0;
    state.roundScore = 0;

    els.correctCount.textContent = toFa(0);
    els.wrongCount.textContent = toFa(0);
    els.progressFill.style.width = '0%';
    els.feedbackInline.textContent = '';
    els.feedbackInline.className = 'feedback-inline';
    els.hintText.classList.add('hidden');

    els.setupPanel.classList.add('hidden');
    els.resultPanel.classList.add('hidden');
    els.playPanel.classList.remove('hidden');

    startTimer();
    nextQuestion();
    els.answerInput.focus();
  }

  function startTimer() {
    clearInterval(state.timerHandle);
    state.timerHandle = setInterval(() => {
      state.timerSeconds++;
      els.timerVal.textContent = formatTime(state.timerSeconds);
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

  /* ---------------------------------------------------------
     سؤال جدید
  --------------------------------------------------------- */
  function nextQuestion() {
    state.current = generateEquation(state.level);
    els.equationDisplay.textContent = state.current.text;
    els.answerInput.value = '';
    els.hintText.classList.add('hidden');
    els.hintText.textContent = state.current.hint;
    els.feedbackInline.textContent = '';
    els.feedbackInline.className = 'feedback-inline';
    els.answerInput.focus();
  }

  function bindPlay() {
    els.submitAnswerBtn.addEventListener('click', submitAnswer);
    els.answerInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') submitAnswer();
    });
    els.hintBtn.addEventListener('click', () => {
      els.hintText.classList.toggle('hidden');
    });
  }

  function submitAnswer() {
    if (els.answerInput.value.trim() === '') {
      els.answerInput.classList.add('shake');
      setTimeout(() => els.answerInput.classList.remove('shake'), 500);
      return;
    }
    const userAnswer = Number(els.answerInput.value);
    const isCorrect = userAnswer === state.current.answer;

    if (isCorrect) {
      state.correct++;
      state.roundScore += LEVEL_POINTS[state.level];
      els.feedbackInline.textContent = '✅ آفرین! درست بود.';
      els.feedbackInline.className = 'feedback-inline correct bounce-in';
    } else {
      state.wrong++;
      els.feedbackInline.textContent = `❌ اشتباه بود. جواب درست: x = ${toFa(state.current.answer)}`;
      els.feedbackInline.className = 'feedback-inline wrong shake';
    }

    els.correctCount.textContent = toFa(state.correct);
    els.wrongCount.textContent = toFa(state.wrong);
    els.progressFill.style.width = `${(state.correct / TARGET_CORRECT) * 100}%`;

    if (state.correct >= TARGET_CORRECT) {
      setTimeout(finishLevel, 900);
    } else {
      setTimeout(nextQuestion, isCorrect ? 700 : 1400);
    }
  }

  /* ---------------------------------------------------------
     پایان سطح
  --------------------------------------------------------- */
  function finishLevel() {
    stopTimer();
    state.totalScore += state.roundScore;
    els.scoreVal.textContent = toFa(state.totalScore);
    MathPlayScore.submitScore(GAME_ID, state.totalScore);
    MathPlayScore.setLastLevel(GAME_ID, levelLabel(state.level));

    els.resultEmoji.textContent = state.level === 'hard' ? '👑' : '🏆';
    els.resultTitle.textContent =
      state.wrong === 0 ? 'بی‌نقص! قهرمان واقعی معادله شدی!' : 'تبریک، این سطح را تمام کردی!';
    els.finalCorrect.textContent = `${toFa(state.correct)} / ${toFa(TARGET_CORRECT)}`;
    els.finalTime.textContent = formatTime(state.timerSeconds);
    els.finalRoundScore.textContent = toFa(state.roundScore);

    const isLastLevel = LEVEL_ORDER.indexOf(state.level) === LEVEL_ORDER.length - 1;
    els.nextLevelBtn.classList.toggle('hidden', isLastLevel);

    els.playPanel.classList.add('hidden');
    els.resultPanel.classList.remove('hidden');
  }

  function levelLabel(level) {
    return { easy: 'آسان', medium: 'متوسط', hard: 'سخت' }[level] || level;
  }

  function bindResult() {
    els.nextLevelBtn.addEventListener('click', () => {
      const idx = LEVEL_ORDER.indexOf(state.level);
      const next = LEVEL_ORDER[Math.min(idx + 1, LEVEL_ORDER.length - 1)];
      startLevel(next);
    });
    els.retryLevelBtn.addEventListener('click', () => startLevel(state.level));
  }

  /* ---------------------------------------------------------
     راه‌اندازی
  --------------------------------------------------------- */
  function init() {
    MathPlayScore.recordPlay(GAME_ID);
    bindSetup();
    bindPlay();
    bindResult();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
