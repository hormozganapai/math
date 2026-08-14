/**
 * game.js — سرزمین جبر (Algebra Land)
 * ---------------------------------------------------------
 * کنترلر اصلی بازی. جریان صفحه‌ها را مدیریت می‌کند:
 * شروع → نقشه → آموزش کوتاه منطقه → بازی منطقه → نتیجه منطقه → نقشه
 * تا پایان قلعه جادوگر جبر و صفحه پیروزی نهایی.
 * ---------------------------------------------------------
 */
(function () {
  'use strict';

  const STAGES = [
    {
      id: 'scale', title: 'شهر ترازو', icon: '⚖️', type: 'scale', count: 3,
      lesson: 'یک معادله مثل یک ترازوی متعادل است. اگر از یک طرف چیزی کم کنیم، باید از طرف دیگر هم به همان اندازه کم کنیم تا تعادل حفظ شود.'
    },
    {
      id: 'factory', title: 'کارخانه عبارت‌های جبری', icon: '🏭', type: 'factory', count: 4,
      lesson: 'یک عبارت جبری مثل یک کارخانه است: عددی وارد می‌شود، چند عملیات روی آن انجام می‌شود و خروجی تحویل داده می‌شود.'
    },
    {
      id: 'train', title: 'ایستگاه معادله', icon: '🚂', type: 'train', count: 4,
      lesson: 'برای پیدا کردن عدد گم‌شده در یک معادله ساده، کافیست عملیات معکوس را روی طرف دیگر تساوی انجام دهیم.'
    },
    {
      id: 'island', title: 'جزیره مجهول', icon: '🏴', type: 'island', count: 4,
      lesson: 'در معادله‌هایی مثل ax + b = c، ابتدا b را از دو طرف کم می‌کنیم، سپس بر a تقسیم می‌کنیم تا x پیدا شود.'
    },
    {
      id: 'castle', title: 'قلعه جادوگر جبر', icon: '🏰', type: 'wizard', count: 8,
      lesson: 'جادوگر جبر معادله‌های مختلف و تصادفی می‌فرستد. هر چه سریع‌تر و دقیق‌تر پاسخ دهی، امتیاز بیشتری می‌گیری!'
    }
  ];

  class AlgebraLandGame {
    constructor() {
      this.storage = new AlgebraStorage();
      this.score = new ScoreManager(this.storage);
      this.sound = new SoundManager(true);
      this.anim = new AnimationManager(document.body);
      this.ui = new UIManager(this.anim, this.sound);

      this.currentStage = null;
      this.questions = [];
      this.qIndex = 0;
      this.qStartTime = 0;
      this.playStartTime = 0;

      this._cacheEls();
      this._applySavedSettings();
      this._bindGlobalControls();
      this._bindStartScreen();
      this._bindResultScreen();

      this.anim.renderClouds(this.els.cloudsLayer, 4);
    }

    _cacheEls() {
      this.els = {
        screens: {
          start: document.getElementById('startScreen'),
          map: document.getElementById('mapScreen'),
          intro: document.getElementById('introScreen'),
          play: document.getElementById('playScreen'),
          result: document.getElementById('resultScreen'),
          victory: document.getElementById('victoryScreen')
        },
        cloudsLayer: document.getElementById('cloudsLayer'),
        startBtn: document.getElementById('startAdventureBtn'),
        bestScoreVal: document.getElementById('bestScoreVal'),
        medalsRow: document.getElementById('medalsRow'),

        mapNodes: document.getElementById('mapNodes'),
        mapBackBtn: document.getElementById('mapBackBtn'),

        introIcon: document.getElementById('introIcon'),
        introTitle: document.getElementById('introTitle'),
        introLesson: document.getElementById('introLesson'),
        introStartBtn: document.getElementById('introStartBtn'),
        introBackBtn: document.getElementById('introBackBtn'),

        stageBadge: document.getElementById('stageBadge'),
        hudCorrect: document.getElementById('hudCorrect'),
        hudWrong: document.getElementById('hudWrong'),
        hudScore: document.getElementById('hudScore'),
        progressFill: document.getElementById('progressFill'),
        healthBarWrap: document.getElementById('healthBarWrap'),
        healthFill: document.getElementById('healthFill'),
        questionArea: document.getElementById('questionArea'),

        resultStars: document.getElementById('resultStars'),
        resultTitle: document.getElementById('resultTitle'),
        resultStats: document.getElementById('resultStats'),
        resultContinueBtn: document.getElementById('resultContinueBtn'),
        resultMapBtn: document.getElementById('resultMapBtn'),

        victoryStats: document.getElementById('victoryStats'),
        victoryMapBtn: document.getElementById('victoryMapBtn'),

        themeToggle: document.getElementById('themeToggle'),
        soundToggle: document.getElementById('soundToggle')
      };
    }

    _applySavedSettings() {
      const data = this.storage.load();
      const sharedTheme = this._getSharedTheme();
      document.documentElement.setAttribute('data-theme', sharedTheme);
      this.els.themeToggle.textContent = sharedTheme === 'dark' ? '☀️' : '🌙';
      this.sound.setEnabled(data.soundOn);
      this.els.soundToggle.textContent = data.soundOn ? '🔊' : '🔇';
      this.els.bestScoreVal.textContent = QuestionGenerator.toFa(data.bestScore);
      this._renderMedalCollection(data.medals);
    }

    /** خواندن/نوشتن تم از کلید مشترک کل سایت MathPlay (mathplay_theme) */
    _getSharedTheme() {
      try { return localStorage.getItem('mathplay_theme') || 'light'; }
      catch (e) { return 'light'; }
    }
    _setSharedTheme(theme) {
      try { localStorage.setItem('mathplay_theme', theme); } catch (e) { /* ignore */ }
    }

    _renderMedalCollection(medalIds) {
      const ALL = { apprentice: '🥉', master: '🥈', champion: '🥇', savior: '👑' };
      this.els.medalsRow.innerHTML = Object.keys(ALL)
        .map((id) => `<span class="medal-chip ${medalIds.includes(id) ? '' : 'locked'}">${ALL[id]}</span>`)
        .join('');
    }

    _bindGlobalControls() {
      this.els.themeToggle.addEventListener('click', () => {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const next = isDark ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        this.els.themeToggle.textContent = next === 'dark' ? '☀️' : '🌙';
        this._setSharedTheme(next);
        this.sound.playClick();
      });

      this.els.soundToggle.addEventListener('click', () => {
        const nowOn = !this.sound.enabled;
        this.sound.setEnabled(nowOn);
        this.els.soundToggle.textContent = nowOn ? '🔊' : '🔇';
        this.storage.setSoundOn(nowOn);
        if (nowOn) this.sound.playClick();
      });

      this.els.mapBackBtn.addEventListener('click', () => this._goTo('start'));
      this.els.introBackBtn.addEventListener('click', () => this._goTo('map'));
      this.els.resultMapBtn.addEventListener('click', () => this._goTo('map'));
      this.els.victoryMapBtn.addEventListener('click', () => this._goTo('map'));
    }

    _bindStartScreen() {
      this.els.startBtn.addEventListener('click', () => {
        this.sound.startBackground();
        this._renderMap();
        this._goTo('map');
      });
    }

    _bindResultScreen() {
      this.els.resultContinueBtn.addEventListener('click', () => this._goTo('map'));
    }

    /* ============== انتقال بین صفحه‌ها ============== */
    _goTo(screenKey) {
      const target = this.els.screens[screenKey];
      Object.values(this.els.screens).forEach((s) => {
        if (s !== target) s.classList.add('hidden');
      });
      target.classList.remove('hidden');
      if (screenKey === 'map') this._renderMap();
    }

    _renderMap() {
      this.ui.renderMap(this.els.mapNodes, STAGES, this.storage, (stage) => this._openIntro(stage));
      this._renderMedalCollection(this.storage.load().medals);
      this.els.bestScoreVal.textContent = QuestionGenerator.toFa(this.storage.load().bestScore);
    }

    _openIntro(stage) {
      this.currentStage = stage;
      this.els.introIcon.textContent = stage.icon;
      this.els.introTitle.textContent = stage.title;
      this.els.introLesson.textContent = stage.lesson;
      this.els.introStartBtn.onclick = () => this._beginStage(stage);
      this._goTo('intro');
    }

    /* ============== اجرای یک منطقه ============== */
    _beginStage(stage) {
      this.score.startStage();
      this.questions = [];
      for (let i = 0; i < stage.count; i++) {
        this.questions.push(this._generateFor(stage));
      }
      this.qIndex = 0;
      this.playStartTime = Date.now();

      this.els.healthBarWrap.classList.toggle('hidden', stage.type !== 'wizard');
      if (stage.type === 'wizard') this.anim.updateHealthBar(this.els.healthFill, 100);

      this._updateHud();
      this._goTo('play');
      this._showQuestion();
    }

    _generateFor(stage) {
      switch (stage.type) {
        case 'scale': return QuestionGenerator.scaleQuestion();
        case 'factory': return QuestionGenerator.factoryQuestion();
        case 'train': return QuestionGenerator.trainQuestion();
        case 'island': return QuestionGenerator.islandQuestion();
        case 'wizard': return QuestionGenerator.wizardQuestion();
        default: throw new Error('نوع منطقه ناشناخته: ' + stage.type);
      }
    }

    _updateHud() {
      this.els.stageBadge.textContent = `${this.currentStage.icon} ${this.currentStage.title} — سؤال ${QuestionGenerator.toFa(this.qIndex + 1)} از ${QuestionGenerator.toFa(this.questions.length)}`;
      this.els.hudCorrect.textContent = QuestionGenerator.toFa(this.score.stageCorrect);
      this.els.hudWrong.textContent = QuestionGenerator.toFa(this.score.stageWrong);
      this.els.hudScore.textContent = QuestionGenerator.toFa(this.score.sessionScore);
      this.els.progressFill.style.width = `${(this.qIndex / this.questions.length) * 100}%`;
    }

    _showQuestion() {
      const q = this.questions[this.qIndex];
      this.qStartTime = Date.now();
      const stageType = this.currentStage.type;

      if (stageType === 'scale') {
        this.ui.renderScale(this.els.questionArea, q, () => this._onAnswered(true));
      } else if (stageType === 'factory') {
        this.ui.renderFactory(this.els.questionArea, q, (isCorrect) => this._onAnswered(isCorrect));
      } else if (stageType === 'train') {
        this.ui.renderEquationChallenge(this.els.questionArea, {
          promptLabel: 'واگن گم‌شده را پیدا کن:', icon: '🚂', text: q.text, answer: q.answer, themeClass: 'train-theme'
        }, (isCorrect) => this._onAnswered(isCorrect));
      } else if (stageType === 'island') {
        this.ui.renderEquationChallenge(this.els.questionArea, {
          promptLabel: 'برای باز کردن صندوق، معادله را حل کن:', icon: '🏴', text: q.text, answer: q.answer, themeClass: 'island-theme'
        }, (isCorrect) => this._onAnswered(isCorrect, true));
      } else if (stageType === 'wizard') {
        this.ui.renderEquationChallenge(this.els.questionArea, {
          promptLabel: 'جادوگر جبر یک معادله فرستاد:', icon: '🧙‍♂️', text: q.text, answer: q.answer, themeClass: 'castle-theme'
        }, (isCorrect) => this._onAnswered(isCorrect));
      }
    }

    _onAnswered(isCorrect, isChestOpen) {
      const timeTaken = (Date.now() - this.qStartTime) / 1000;

      if (isCorrect) {
        this.score.addCorrect(timeTaken);
        this.sound.playSuccess();
        if (isChestOpen) this.sound.playUnlock();
        const rect = this.els.questionArea.getBoundingClientRect();
        this.anim.burstParticles(rect.left + rect.width / 2, rect.top + 40);
      } else {
        this.score.addWrong();
        this.sound.playFail();
      }

      if (this.currentStage.type === 'wizard') {
        const remaining = this.questions.length - (this.qIndex + 1);
        const healthPct = (remaining / this.questions.length) * 100;
        if (isCorrect) this.anim.updateHealthBar(this.els.healthFill, healthPct);
      }

      this._updateHud();

      setTimeout(() => {
        this.qIndex++;
        if (this.qIndex >= this.questions.length) this._finishStage();
        else this._showQuestion();
      }, 1300);
    }

    /* ============== پایان منطقه ============== */
    _finishStage() {
      const stage = this.currentStage;
      const isLast = stage.id === STAGES[STAGES.length - 1].id;
      const stars = this.score.getStageStars();
      const playSeconds = Math.round((Date.now() - this.playStartTime) / 1000);

      this.storage.markStageComplete(stage.id);
      this.storage.submitScore(this.score.sessionScore);
      this.storage.addAnswerStats(this.score.stageCorrect, this.score.stageWrong);
      this.storage.addPlayTime(playSeconds);

      const newMedals = this.score.evaluateMedals(stage.id, isLast);
      newMedals.forEach((m, i) => setTimeout(() => this.ui.showMedalToast(m), i * 900));

      if (isLast) {
        this.sound.playVictory();
        this.anim.confettiBurst(60);
        this._renderVictory();
        this._goTo('victory');
      } else {
        this.sound.playUnlock();
        this.anim.confettiBurst(24);
        this._renderStageResult(stage, stars);
        this._goTo('result');
      }
    }

    _renderStageResult(stage, stars) {
      this.ui.renderStars(this.els.resultStars, stars);
      this.els.resultTitle.textContent = stars === 3
        ? `${stage.title} را عالی تمام کردی! 🎉`
        : stars === 2
        ? `${stage.title} را با موفقیت تمام کردی ⭐`
        : `${stage.title} تمام شد، بازم تمرین کن 💪`;
      this.els.resultStats.innerHTML = `
        <div class="stat-box"><span class="stat-label">پاسخ صحیح</span><span class="stat-value">${QuestionGenerator.toFa(this.score.stageCorrect)}</span></div>
        <div class="stat-box"><span class="stat-label">پاسخ غلط</span><span class="stat-value">${QuestionGenerator.toFa(this.score.stageWrong)}</span></div>
        <div class="stat-box"><span class="stat-label">امتیاز کل</span><span class="stat-value">${QuestionGenerator.toFa(this.score.sessionScore)}</span></div>
      `;
    }

    _renderVictory() {
      const data = this.storage.load();
      this.els.victoryStats.innerHTML = `
        <div class="stat-box"><span class="stat-label">امتیاز نهایی</span><span class="stat-value">${QuestionGenerator.toFa(this.score.sessionScore)}</span></div>
        <div class="stat-box"><span class="stat-label">بهترین امتیاز</span><span class="stat-value">${QuestionGenerator.toFa(data.bestScore)}</span></div>
        <div class="stat-box"><span class="stat-label">درصد موفقیت کل سفر</span><span class="stat-value">${QuestionGenerator.toFa(Math.round(this.score.getSessionPercent()))}٪</span></div>
      `;
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    window.algebraLandGame = new AlgebraLandGame();
  });
})();
