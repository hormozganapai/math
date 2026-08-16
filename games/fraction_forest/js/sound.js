/**
 * Sound Module
 * Manages audio playback and mute state.
 * Uses Web Audio API synthed sounds to avoid needing external files,
 * making it completely standalone.
 */

const Sound = {
    audioCtx: null,
    enabled: true,

    init() {
        this.enabled = Storage.get('soundEnabled');

        // Initialize AudioContext on first user interaction to comply with browser policies
        const initAudio = () => {
            if (!this.audioCtx) {
                this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            }
            document.removeEventListener('click', initAudio);
        };
        document.addEventListener('click', initAudio);
    },

    toggle() {
        this.enabled = !this.enabled;
        Storage.set('soundEnabled', this.enabled);
        return this.enabled;
    },

    playTone(frequency, type, duration, vol = 0.1) {
        if (!this.enabled || !this.audioCtx) return;

        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }

        const oscillator = this.audioCtx.createOscillator();
        const gainNode = this.audioCtx.createGain();

        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, this.audioCtx.currentTime);

        gainNode.gain.setValueAtTime(vol, this.audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + duration);

        oscillator.connect(gainNode);
        gainNode.connect(this.audioCtx.destination);

        oscillator.start();
        oscillator.stop(this.audioCtx.currentTime + duration);
    },

    playClick() {
        this.playTone(400, 'sine', 0.1, 0.05);
    },

    playSuccess() {
        if (!this.enabled || !this.audioCtx) return;
        this.playTone(523.25, 'sine', 0.1, 0.1); // C5
        setTimeout(() => this.playTone(659.25, 'sine', 0.2, 0.1), 100); // E5
        setTimeout(() => this.playTone(783.99, 'sine', 0.3, 0.1), 200); // G5
    },

    playError() {
        if (!this.enabled || !this.audioCtx) return;
        this.playTone(300, 'sawtooth', 0.2, 0.1);
        setTimeout(() => this.playTone(250, 'sawtooth', 0.3, 0.1), 150);
    },

    playUnlock() {
        if (!this.enabled || !this.audioCtx) return;
        this.playTone(440, 'square', 0.1, 0.05);
        setTimeout(() => this.playTone(554.37, 'square', 0.1, 0.05), 100);
        setTimeout(() => this.playTone(659.25, 'square', 0.4, 0.05), 200);
    },

    playHit() {
        this.playTone(150, 'square', 0.2, 0.1);
    }
};

// Expose to window for UI toggles if needed early
window.Sound = Sound;
