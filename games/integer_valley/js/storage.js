/**
 * Storage Module
 * Handles loading and saving game data to LocalStorage.
 */

const STORAGE_KEY = 'integer_valley_data';

const defaultData = {
    bestScore: 0,
    currentLevel: 1,
    unlockedLevels: 1, // Max level reached
    totalScore: 0,
    stars: {}, // { level1: 3, level2: 2, ... }
    totalCorrect: 0,
    totalWrong: 0,
    soundEnabled: true,
    darkMode: false,
    lives: 3
};

class GameStorage {
    constructor() {
        this.data = this.loadData();
    }

    loadData() {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                return { ...defaultData, ...JSON.parse(saved) };
            } catch (e) {
                console.error("Error loading save data", e);
                return { ...defaultData };
            }
        }
        return { ...defaultData };
    }

    saveData() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    }

    get(key) {
        return this.data[key];
    }

    set(key, value) {
        this.data[key] = value;
        this.saveData();
    }

    updateScore(points) {
        this.data.totalScore += points;
        if (this.data.totalScore > this.data.bestScore) {
            this.data.bestScore = this.data.totalScore;
        }
        this.saveData();
    }

    unlockLevel(level) {
        if (level > this.data.unlockedLevels) {
            this.data.unlockedLevels = level;
            this.saveData();
        }
    }

    saveLevelStars(level, starsCount) {
        const currentStars = this.data.stars[`level${level}`] || 0;
        if (starsCount > currentStars) {
            this.data.stars[`level${level}`] = starsCount;
            this.saveData();
        }
    }

    addCorrect() {
        this.data.totalCorrect++;
        this.saveData();
    }

    addWrong() {
        this.data.totalWrong++;
        this.saveData();
    }

    resetProgress() {
        this.data.totalScore = 0;
        this.data.currentLevel = 1;
        this.data.totalCorrect = 0;
        this.data.totalWrong = 0;
        this.data.lives = 3;
        this.saveData();
    }
}

// Global instance
const storage = new GameStorage();
