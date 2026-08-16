// js/game.js

class Game {
    constructor() {
        this.state = Storage.getGameState();
        this.score = 0;
        this.lives = 3;
        this.currentLevel = 1;
        this.combo = 0;
        this.hintsUsed = 0;

        // Stats for end screen
        this.totalCorrect = 0;
        this.totalWrong = 0;

        // Data Lab State
        this.labData = [];

        this.initEventListeners();
        this.applySettings();
        this.updateStartScreen();
    }

    initEventListeners() {
        document.getElementById('btn-start-game').addEventListener('click', () => {
            this.showMap();
        });

        document.getElementById('btn-data-lab').addEventListener('click', () => {
            UI.showScreen('screen-data-lab');
            this.updateLabView();
        });

        document.getElementById('btn-home').addEventListener('click', () => {
            UI.showScreen('screen-start');
            this.updateStartScreen();
        });

        const backBtns = document.querySelectorAll('.btn-back-map');
        backBtns.forEach(btn => {
            btn.addEventListener('click', () => this.showMap());
        });

        document.getElementById('btn-theme').addEventListener('click', () => {
            this.state.darkMode = !this.state.darkMode;
            Storage.saveGameState({ darkMode: this.state.darkMode });
            this.applySettings();
        });

        document.getElementById('btn-sound').addEventListener('click', () => {
            this.state.soundEnabled = !this.state.soundEnabled;
            Storage.saveGameState({ soundEnabled: this.state.soundEnabled });
            this.applySettings();
        });

        document.getElementById('btn-play-again').addEventListener('click', () => {
            this.score = 0;
            this.lives = 3;
            this.showMap();
        });

        // Map Node Clicks
        document.querySelectorAll('.map-node').forEach(node => {
            node.addEventListener('click', (e) => {
                const level = parseInt(e.target.dataset.level);
                if (level <= this.state.unlockedLevels) {
                    if (level === 10) {
                        this.startBossBattle();
                    } else {
                        this.startLevel(level);
                    }
                }
            });
        });

        // Data Lab events
        document.getElementById('btn-lab-add').addEventListener('click', () => this.addLabData());
        document.getElementById('btn-lab-clear').addEventListener('click', () => {
            this.labData = [];
            this.updateLabView();
        });
        document.getElementById('lab-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addLabData();
        });
    }

    applySettings() {
        UI.applyTheme(this.state.darkMode);
        document.getElementById('btn-sound').textContent = this.state.soundEnabled ? '🔊' : '🔇';
    }

    playSound(type) {
        if (!this.state.soundEnabled) return;
        // Mock sound logic, in a real game we would use Audio API
        // console.log(`Playing sound: ${type}`);
    }

    updateStartScreen() {
        document.getElementById('best-score').textContent = this.state.bestScore;
        const progress = Math.min(100, Math.floor(((this.state.unlockedLevels - 1) / 10) * 100));
        document.getElementById('progress-percent').textContent = progress;
    }

    showMap() {
        UI.showScreen('screen-map');
        UI.updateStats(this.score, this.lives, this.state.stars);
        UI.updateMapNodes(this.state.unlockedLevels);
    }

    startLevel(levelId) {
        this.currentLevel = levelId;
        this.hintsUsed = 0;
        const levelData = GameData.levels.find(l => l.id === levelId);

        if (!levelData) {
            UI.showToast('اطلاعات مرحله یافت نشد!', 'error');
            return;
        }

        UI.showScreen('screen-level');
        document.getElementById('level-title').textContent = levelData.title;

        // Show Tutorial
        const tutBox = document.getElementById('tutorial-box');
        tutBox.classList.remove('hidden');
        document.getElementById('tutorial-text').textContent = levelData.tutorial;

        document.getElementById('level-content').classList.add('hidden');
        document.getElementById('level-actions').classList.add('hidden');

        document.getElementById('btn-close-tutorial').onclick = () => {
            tutBox.classList.add('hidden');
            document.getElementById('level-content').classList.remove('hidden');
            document.getElementById('level-actions').classList.remove('hidden');

            // Delegate rendering logic to LevelManager
            if (typeof LevelManager !== 'undefined') {
                LevelManager.renderLevel(levelData, this);
            }
        };
    }

    startBossBattle() {
        UI.showScreen('screen-boss');
        if (typeof LevelManager !== 'undefined') {
            LevelManager.startBossBattle(this);
        }
    }

    handleCorrectAnswer(points = 10, noStars = false) {
        this.playSound('success');
        this.combo++;

        let earnedPoints = points;
        if (this.combo >= 3) {
            earnedPoints += 5; // Combo bonus
            UI.showToast('🔥 Combo! +5', 'success');
        }
        if (this.hintsUsed === 0) {
            earnedPoints += 5; // No hint bonus
        }

        this.score += earnedPoints;
        this.totalCorrect++;

        UI.updateStats(this.score, this.lives, this.state.stars);
        UI.showToast('پاسخ صحیح! آفرین!', 'success');

        if (!noStars) {
            this.completeLevel();
        }
    }

    handleWrongAnswer(explanation) {
        this.playSound('error');
        this.combo = 0;
        this.lives--;
        this.totalWrong++;

        UI.updateStats(this.score, this.lives, this.state.stars);
        UI.showModal('اشتباه بود!', explanation || 'دوباره تلاش کن.');

        if (this.lives <= 0) {
            UI.showModal('جان شما تمام شد!', 'باید دوباره تلاش کنی.');
            setTimeout(() => {
                UI.hideModal();
                this.score = 0;
                this.lives = 3;
                this.showMap();
            }, 2000);
        }
    }

    completeLevel() {
        // Calculate stars
        let stars = 3;
        if (this.hintsUsed > 0) stars--;
        if (this.combo === 0) stars--; // Assuming missed something previously
        stars = Math.max(1, stars);

        this.state.stars[this.currentLevel] = Math.max(this.state.stars[this.currentLevel] || 0, stars);

        if (this.state.unlockedLevels === this.currentLevel && this.currentLevel < 10) {
            this.state.unlockedLevels++;
        }

        if (this.score > this.state.bestScore) {
            this.state.bestScore = this.score;
        }

        Storage.saveGameState(this.state);

        setTimeout(() => {
            UI.showModal('مرحله کامل شد!', `شما ${stars} ستاره گرفتید!`);
            document.querySelector('.close-modal').onclick = () => {
                UI.hideModal();
                this.showMap();
                document.querySelector('.close-modal').onclick = UI.hideModal; // Reset
            };
        }, 1500);
    }

    showVictory() {
        UI.showScreen('screen-end');
        document.getElementById('final-score').textContent = this.score;
        document.getElementById('final-correct').textContent = this.totalCorrect;
        document.getElementById('final-wrong').textContent = this.totalWrong;

        let totalStars = 0;
        for (const level in this.state.stars) totalStars += this.state.stars[level];
        document.getElementById('final-stars').textContent = totalStars;

        if (this.score > this.state.bestScore) {
            this.state.bestScore = this.score;
            Storage.saveGameState(this.state);
        }
    }

    // --- Data Lab Logic ---
    addLabData() {
        const input = document.getElementById('lab-input');
        const val = parseFloat(input.value);
        if (!isNaN(val)) {
            this.labData.push(val);
            input.value = '';
            input.focus();
            this.updateLabView();
        } else {
            UI.showToast('لطفاً یک عدد معتبر وارد کنید', 'error');
        }
    }

    updateLabView() {
        const container = document.getElementById('lab-data-list');
        container.innerHTML = '';

        this.labData.forEach((val, index) => {
            const card = document.createElement('div');
            card.className = 'lab-data';
            card.textContent = val;

            // Allow delete on click
            card.title = 'برای حذف کلیک کنید';
            card.style.cursor = 'pointer';
            card.onclick = () => {
                this.labData.splice(index, 1);
                this.updateLabView();
            };

            container.appendChild(card);
        });

        const analysisBox = document.getElementById('lab-analysis');
        if (this.labData.length > 0) {
            analysisBox.classList.remove('hidden');

            const sorted = Utils.sortAscending(this.labData);
            document.getElementById('lab-sorted').textContent = sorted.join(', ');
            document.getElementById('lab-count').textContent = this.labData.length;
            document.getElementById('lab-sum').textContent = Utils.getSum(this.labData);
            document.getElementById('lab-mean').textContent = Utils.getMean(this.labData).toFixed(2);
            document.getElementById('lab-median').textContent = Utils.getMedian(this.labData);
            document.getElementById('lab-mode').textContent = Utils.getMode(this.labData).join(', ') || 'ندارد';

            // Draw Chart
            const freq = Utils.getFrequencies(this.labData);
            const labels = Object.keys(freq);
            const data = Object.values(freq);
            Utils.drawBarChart('lab-chart', labels, data);
        } else {
            analysisBox.classList.add('hidden');
        }
    }
}

// Initialize game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.gameInstance = new Game();
});