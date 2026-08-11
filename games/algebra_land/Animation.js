/**
 * Animation.js
 * ---------------------------------------------------------
 * افکت‌های بصری بازی: ذرات نور، کانفتی موفقیت، انتقال نرم بین
 * صفحه‌ها، و حرکت مداوم ابرها در پس‌زمینه.
 * ---------------------------------------------------------
 */
class AnimationManager {
  constructor(rootEl) {
    this.root = rootEl || document.body;
  }

  switchScreen(hideEl, showEl) {
    if (hideEl) {
      hideEl.classList.add('screen-leaving');
      setTimeout(() => {
        hideEl.classList.add('hidden');
        hideEl.classList.remove('screen-leaving');
      }, 220);
    }
    if (showEl) {
      showEl.classList.remove('hidden');
      showEl.classList.add('screen-entering');
      setTimeout(() => showEl.classList.remove('screen-entering'), 320);
    }
  }

  burstParticles(x, y, count = 14, colors = ['#FFC845', '#7C4DFF', '#00BFA6', '#FF6B35']) {
    for (let i = 0; i < count; i++) {
      const p = document.createElement('span');
      p.className = 'particle';
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
      const dist = 40 + Math.random() * 60;
      p.style.setProperty('--dx', `${Math.cos(angle) * dist}px`);
      p.style.setProperty('--dy', `${Math.sin(angle) * dist}px`);
      p.style.left = `${x}px`;
      p.style.top = `${y}px`;
      p.style.background = colors[i % colors.length];
      this.root.appendChild(p);
      setTimeout(() => p.remove(), 900);
    }
  }

  confettiBurst(count = 40) {
    const colors = ['#FFC845', '#7C4DFF', '#00BFA6', '#FF6B35', '#FF4785', '#2E9BFF'];
    for (let i = 0; i < count; i++) {
      const c = document.createElement('span');
      c.className = 'confetti-piece';
      c.style.left = `${Math.random() * 100}vw`;
      c.style.background = colors[Math.floor(Math.random() * colors.length)];
      c.style.animationDuration = `${2.2 + Math.random() * 1.8}s`;
      c.style.animationDelay = `${Math.random() * 0.6}s`;
      c.style.setProperty('--rot', `${360 + Math.random() * 360}deg`);
      document.body.appendChild(c);
      setTimeout(() => c.remove(), 4500);
    }
  }

  shake(el) {
    el.classList.remove('shake-anim');
    void el.offsetWidth;
    el.classList.add('shake-anim');
  }

  pop(el) {
    el.classList.remove('pop-anim');
    void el.offsetWidth;
    el.classList.add('pop-anim');
  }

  renderClouds(containerEl, count = 4) {
    containerEl.innerHTML = '';
    for (let i = 0; i < count; i++) {
      const cloud = document.createElement('span');
      cloud.className = 'bg-cloud';
      cloud.textContent = '☁️';
      cloud.style.top = `${5 + Math.random() * 30}%`;
      cloud.style.fontSize = `${28 + Math.random() * 26}px`;
      cloud.style.animationDuration = `${30 + Math.random() * 25}s`;
      cloud.style.animationDelay = `-${Math.random() * 20}s`;
      containerEl.appendChild(cloud);
    }
  }

  wave(el) {
    el.classList.add('flag-wave');
  }

  updateHealthBar(fillEl, percent) {
    fillEl.style.width = `${Math.max(0, Math.min(100, percent))}%`;
    fillEl.classList.toggle('low', percent <= 30);
  }
}
