/**
 * UI.js
 * ---------------------------------------------------------
 * تمام رندر DOM بازی در این کلاس متمرکز شده تا game.js فقط
 * منطق جریان بازی را مدیریت کند، نه ساخت DOM.
 * ---------------------------------------------------------
 */
class UIManager {
  constructor(animManager, soundManager) {
    this.anim = animManager;
    this.sound = soundManager;
  }

  /* ============== نقشه سرزمین جبر ============== */
  renderMap(containerEl, stages, storage, onSelectStage) {
    containerEl.innerHTML = '';
    stages.forEach((stage) => {
      const unlocked = storage.isStageUnlocked(stage.id);
      const done = storage.load().stageProgress[stage.id];

      const node = document.createElement('button');
      node.className = 'map-node' + (unlocked ? '' : ' locked') + (done ? ' done' : '');
      node.type = 'button';
      node.innerHTML = `
        <span class="map-node-icon">${unlocked ? stage.icon : '🔒'}</span>
        <span class="map-node-label">${stage.title}</span>
        ${done ? '<span class="map-node-check">✔️</span>' : ''}
      `;
      if (unlocked) {
        node.addEventListener('click', () => {
          this.sound.playClick();
          onSelectStage(stage);
        });
      }
      containerEl.appendChild(node);
    });
  }

  /* ============== منطقه ۲: ترازوی Drag & Drop ============== */
  renderScale(container, q, onSolved) {
    const localState = { left: q.a, right: q.b };

    container.innerHTML = `
      <p class="q-prompt">با کشیدن بلوک‌ها به «منطقه حذف»، هر دو طرف ترازو را هم‌زمان کم کن تا فقط x بماند.</p>
      <div class="scale-widget">
        <div class="scale-beam"><span class="scale-icon">⚖️</span></div>
        <div class="scale-pans">
          <div class="pan pan-left">
            <span class="pan-label">x + ${QuestionGenerator.toFa(q.a)}</span>
            <div class="pan-blocks" id="panLeft"></div>
          </div>
          <div class="pan pan-right">
            <span class="pan-label">${QuestionGenerator.toFa(q.b)}</span>
            <div class="pan-blocks" id="panRight"></div>
          </div>
        </div>
        <div class="drop-zone" id="dropZone">🗑️ منطقه حذف یک واحد از هر دو طرف</div>
      </div>
      <p class="q-feedback"></p>
    `;

    const panLeft = container.querySelector('#panLeft');
    const panRight = container.querySelector('#panRight');
    const dropZone = container.querySelector('#dropZone');
    const feedback = container.querySelector('.q-feedback');

    const removeOneFromBoth = () => {
      if (localState.left <= 0) return;
      localState.left--;
      localState.right--;
      this.sound.playClick();
      renderPans();
      if (localState.left === 0) {
        feedback.textContent = `عالی! ترازو برابر ماند و فهمیدیم x = ${QuestionGenerator.toFa(localState.right)} ✅`;
        feedback.className = 'q-feedback correct';
        dropZone.classList.add('disabled');
        setTimeout(() => onSolved(localState.right), 900);
      }
    };

    const wireBlocks = (pan) => {
      [...pan.querySelectorAll('.unit-block')].forEach((block) => {
        block.addEventListener('click', removeOneFromBoth);
        block.addEventListener('dragstart', (e) => e.dataTransfer.setData('text/plain', 'unit'));
      });
    };

    const renderPans = () => {
      panLeft.innerHTML = '<span class="block x-block">x</span>' +
        '<span class="block unit-block" draggable="true">۱</span>'.repeat(localState.left);
      panRight.innerHTML = '<span class="block unit-block" draggable="true">۱</span>'.repeat(localState.right);
      wireBlocks(panLeft);
      wireBlocks(panRight);
    };

    dropZone.addEventListener('dragover', (e) => e.preventDefault());
    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      removeOneFromBoth();
    });

    renderPans();
  }

  /* ============== منطقه ۳: کارخانه عبارت‌های جبری ============== */
  renderFactory(container, q, onAnswer) {
    const isForward = q.mode === 'forward';
    const stepsHtml = q.steps
      .map((s) => `<div class="factory-box">${s.op}${QuestionGenerator.toFa(s.val)}</div>`)
      .join('<div class="factory-arrow">↓</div>');

    container.innerHTML = `
      <p class="q-prompt">${isForward ? 'خروجی این ماشین چیست؟' : 'ورودی این ماشین چه عددی بوده؟'}</p>
      <div class="factory-pipeline">
        <div class="factory-box factory-io">${isForward ? QuestionGenerator.toFa(q.input) : '?'}</div>
        <div class="factory-arrow">↓</div>
        ${stepsHtml}
        <div class="factory-arrow">↓</div>
        <div class="factory-box factory-io">${isForward ? '?' : QuestionGenerator.toFa(q.output)}</div>
      </div>
      <div class="answer-row">
        <input type="number" class="answer-input" id="factoryAnswer" placeholder="پاسخ">
        <button class="btn btn-primary" id="factorySubmit">بررسی</button>
      </div>
      <p class="q-feedback"></p>
    `;
    this._wireNumericAnswer(container, q.answer, onAnswer, '#factoryAnswer', '#factorySubmit');
  }

  /* ============== چالش معادله عمومی (قطار / جزیره / قلعه) ============== */
  renderEquationChallenge(container, opts, onAnswer) {
    container.innerHTML = `
      <p class="q-prompt">${opts.promptLabel || 'معادله را حل کن:'}</p>
      <div class="equation-display ${opts.themeClass || ''}">${opts.icon || ''} ${opts.text}</div>
      <div class="answer-row">
        <label>x = </label>
        <input type="number" class="answer-input" id="eqAnswer" placeholder="پاسخ">
        <button class="btn btn-primary" id="eqSubmit">تأیید</button>
      </div>
      <p class="q-feedback"></p>
    `;
    this._wireNumericAnswer(container, opts.answer, onAnswer, '#eqAnswer', '#eqSubmit');
  }

  /** منطق مشترک بررسی پاسخ عددی (برای کارخانه، قطار، جزیره، قلعه) */
  _wireNumericAnswer(container, correctAnswer, onAnswer, inputSel, btnSel) {
    const input = container.querySelector(inputSel);
    const btn = container.querySelector(btnSel);
    const feedback = container.querySelector('.q-feedback');
    let locked = false;

    const submit = () => {
      if (locked || input.value.trim() === '') {
        this.anim.shake(input);
        return;
      }
      locked = true;
      const val = Number(input.value);
      const isCorrect = val === correctAnswer;
      input.disabled = true;
      btn.disabled = true;
      feedback.textContent = isCorrect
        ? 'آفرین! پاسخ درست بود 🎉'
        : `اشکالی نداره، پاسخ درست ${QuestionGenerator.toFa(correctAnswer)} بود.`;
      feedback.className = 'q-feedback ' + (isCorrect ? 'correct' : 'wrong');
      if (isCorrect) this.anim.pop(btn); else this.anim.shake(input);
      onAnswer(isCorrect);
    };

    btn.addEventListener('click', submit);
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') submit(); });
    input.focus();
  }

  /* ============== ستاره‌ها و مدال ============== */
  renderStars(container, count) {
    container.innerHTML = '';
    for (let i = 1; i <= 3; i++) {
      const s = document.createElement('span');
      s.className = 'star' + (i <= count ? ' filled' : '');
      s.textContent = '⭐';
      s.style.animationDelay = `${i * 0.12}s`;
      container.appendChild(s);
    }
  }

  showMedalToast(medal) {
    const toast = document.createElement('div');
    toast.className = 'medal-toast';
    toast.innerHTML = `<span class="medal-icon">${medal.icon}</span><span>مدال جدید: ${medal.label}</span>`;
    document.body.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 400);
    }, 3000);
  }
}
