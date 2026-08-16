// storage.js
const STORAGE_KEY = 'mathplay_probability_island_data';

export const defaultData = {
    bestScore: 0,
    currentLevel: 1,
    unlockedLevels: [1],
    stars: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 },
    totalCorrect: 0,
    totalWrong: 0,
    totalExperiments: 0,
    soundEnabled: true,
    darkMode: false
};

export function loadData() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        if (data) {
            return { ...defaultData, ...JSON.parse(data) };
        }
    } catch (e) {
        console.error("Error loading data from localStorage", e);
    }
    return { ...defaultData };
}

export function saveData(data) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
        console.error("Error saving data to localStorage", e);
    }
}
