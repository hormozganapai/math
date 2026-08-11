/**
 * SoundManager.js
 * ---------------------------------------------------------
 * تمام صداهای بازی با Web Audio API به‌صورت برنامه‌ریزی‌شده
 * تولید می‌شوند (کلیک، موفقیت، شکست، موسیقی پس‌زمینه ملایم)
 * تا هیچ فایل صوتی خارجی لازم نباشد. پوشه assets/sounds/ برای
 * جایگزینی احتمالی با فایل‌های واقعی در آینده رزرو شده است.
 * ---------------------------------------------------------
 */
class SoundManager {
  constructor(enabled = true) {
    this.enabled = enabled;
    this.ctx = null;
    this.bgInterval = null;
    this.bgPlaying = false;
  }

  _ensureContext() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      this.ctx = new AC();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  }

  setEnabled(enabled) {
    this.enabled = enabled;
    if (!enabled) this.stopBackground();
  }

  _tone(freq, duration, type = 'sine', volume = 0.18, delay = 0) {
    if (!this.enabled) return;
    const ctx = this._ensureContext();
    if (!ctx) return;
    const t0 = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    gain.gain.setValueAtTime(volume, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + duration + 0.05);
  }

  playClick() {
    this._tone(520, 0.08, 'square', 0.1);
  }

  playSuccess() {
    this._tone(523.25, 0.15, 'triangle', 0.16, 0);
    this._tone(659.25, 0.15, 'triangle', 0.16, 0.1);
    this._tone(783.99, 0.25, 'triangle', 0.18, 0.2);
  }

  playFail() {
    this._tone(300, 0.18, 'sawtooth', 0.14, 0);
    this._tone(220, 0.25, 'sawtooth', 0.14, 0.12);
  }

  playUnlock() {
    this._tone(440, 0.1, 'square', 0.14, 0);
    this._tone(660, 0.1, 'square', 0.14, 0.08);
    this._tone(880, 0.2, 'square', 0.16, 0.16);
  }

  playVictory() {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
      this._tone(f, 0.3, 'triangle', 0.2, i * 0.15);
    });
  }

  startBackground() {
    if (this.bgPlaying || !this.enabled) return;
    this.bgPlaying = true;
    const notes = [392, 440, 493.88, 440];
    let i = 0;
    this._tone(notes[0], 1.2, 'sine', 0.05);
    this.bgInterval = setInterval(() => {
      if (!this.enabled) return;
      i = (i + 1) % notes.length;
      this._tone(notes[i], 1.2, 'sine', 0.05);
    }, 1600);
  }

  stopBackground() {
    clearInterval(this.bgInterval);
    this.bgInterval = null;
    this.bgPlaying = false;
  }
}
