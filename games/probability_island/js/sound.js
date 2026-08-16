// sound.js
export class SoundManager {
    constructor() {
        this.enabled = true;
        this.sounds = {
            click: this.createAudioTone(400, 'sine', 0.1),
            success: this.createAudioTone(800, 'sine', 0.2),
            error: this.createAudioTone(200, 'sawtooth', 0.2),
            coin: this.createAudioTone(1000, 'square', 0.1),
            dice: this.createAudioTone(600, 'triangle', 0.1),
            victory: this.createAudioTone(1200, 'sine', 0.5)
        };
    }

    createAudioTone(frequency, type, duration) {
        // Fallback simple tone generator since we don't have actual sound files yet
        return () => {
            if (!this.enabled) return;
            try {
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                if (!AudioContext) return;
                const ctx = new AudioContext();
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();

                osc.type = type;
                osc.frequency.setValueAtTime(frequency, ctx.currentTime);

                gain.gain.setValueAtTime(0.1, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

                osc.connect(gain);
                gain.connect(ctx.destination);

                osc.start();
                osc.stop(ctx.currentTime + duration);
            } catch(e) {
                // Ignore audio errors
            }
        };
    }

    play(name) {
        if (this.enabled && this.sounds[name]) {
            this.sounds[name]();
        }
    }

    setEnabled(enabled) {
        this.enabled = enabled;
    }
}

export const soundManager = new SoundManager();
