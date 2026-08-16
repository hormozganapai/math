// js/storage.js

const Storage = {
    getKey(key) {
        return `mathplay_stats_city_${key}`;
    },

    save(key, value) {
        localStorage.setItem(this.getKey(key), JSON.stringify(value));
    },

    load(key, defaultValue = null) {
        const item = localStorage.getItem(this.getKey(key));
        if (item !== null) {
            try {
                return JSON.parse(item);
            } catch (e) {
                return defaultValue;
            }
        }
        return defaultValue;
    },

    getGameState() {
        return {
            bestScore: this.load('bestScore', 0),
            unlockedLevels: this.load('unlockedLevels', 1),
            stars: this.load('stars', {}),
            soundEnabled: this.load('soundEnabled', true),
            darkMode: this.load('darkMode', false)
        };
    },

    saveGameState(state) {
        if (state.bestScore !== undefined) this.save('bestScore', state.bestScore);
        if (state.unlockedLevels !== undefined) this.save('unlockedLevels', state.unlockedLevels);
        if (state.stars !== undefined) this.save('stars', state.stars);
        if (state.soundEnabled !== undefined) this.save('soundEnabled', state.soundEnabled);
        if (state.darkMode !== undefined) this.save('darkMode', state.darkMode);
    },

    resetProgress() {
        localStorage.removeItem(this.getKey('bestScore'));
        localStorage.removeItem(this.getKey('unlockedLevels'));
        localStorage.removeItem(this.getKey('stars'));
    }
};