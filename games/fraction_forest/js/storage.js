/**
 * Storage Module
 * Handles loading and saving game state to LocalStorage
 */

const STORAGE_KEY = 'fraction_forest_save';

const defaultState = {
    bestScore: 0,
    currentLevel: 1,
    unlockedLevels: 1, // Max unlocked level (1-8)
    stars: {}, // Format: { 1: 3, 2: 2, ... }
    totalCorrect: 0,
    totalWrong: 0,
    soundEnabled: true,
    darkMode: false
};

const Storage = {
    state: null,

    init() {
        this.load();
    },

    load() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                this.state = { ...defaultState, ...JSON.parse(saved) };
            } else {
                this.state = { ...defaultState };
                this.save();
            }
        } catch (e) {
            console.error("Error loading save data:", e);
            this.state = { ...defaultState };
        }
    },

    save() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
        } catch (e) {
            console.error("Error saving game data:", e);
        }
    },

    get(key) {
        if (!this.state) this.init();
        return this.state[key];
    },

    set(key, value) {
        if (!this.state) this.init();
        this.state[key] = value;
        this.save();
    },

    updateBestScore(score) {
        if (score > this.get('bestScore')) {
            this.set('bestScore', score);
        }
    },

    unlockLevel(level) {
        let currentUnlocked = this.get('unlockedLevels');
        if (level > currentUnlocked && level <= 8) {
            this.set('unlockedLevels', level);
        }
    },

    saveLevelStars(level, stars) {
        let currentStars = this.get('stars');
        if (!currentStars[level] || stars > currentStars[level]) {
            currentStars[level] = stars;
            this.set('stars', currentStars);
        }
    },

    addCorrect() {
        this.set('totalCorrect', this.get('totalCorrect') + 1);
    },

    addWrong() {
        this.set('totalWrong', this.get('totalWrong') + 1);
    },

    resetProgress() {
        this.state = { ...defaultState };
        this.save();
    }
};

// Initialize immediately so state is ready for other modules
Storage.init();
