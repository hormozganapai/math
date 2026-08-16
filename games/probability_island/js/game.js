// game.js
import { loadData, saveData, defaultData } from './storage.js';
import { soundManager } from './sound.js';
import { UI } from './ui.js';
import { Simulation } from './simulation.js';
import { QuestionGenerator } from './questions.js';
import { ScoreManager } from './score.js';
import { levelData } from './levels.js';

class Game {
    constructor() {
        this.data = loadData();
        this.ui = new UI();
        this.sim = new Simulation('simulation-area');
        this.qGen = new QuestionGenerator();
        this.score = new ScoreManager(this.data, this.ui, saveData);

        this.currentLevelIndex = null;
        this.currentQuestion = null;
        this.bossQuestions = [];
        this.bossCurrentIndex = 0;
        this.bossHealth = 10;

        this.hintUsed = false;

        this.init();
    }

    init() {
        this.ui.setTheme(this.data.darkMode);
        soundManager.setEnabled(this.data.soundEnabled);
        this.updateStartScreenStats();
        this.setupEventListeners();
        this.ui.showScreen('start');
    }

    updateStartScreenStats() {
        document.getElementById('best-score-display').textContent = this.data.bestScore;
        document.getElementById('total-stars-display').textContent = this.score.getTotalStars();
    }

    setupEventListeners() {
        document.getElementById('btn-start').addEventListener('click', () => this.showMap());
        document.getElementById('btn-sound').addEventListener('click', (e) => this.toggleSound(e.target));
        document.getElementById('btn-theme').addEventListener('click', () => this.toggleTheme());
        document.getElementById('btn-back-to-map').addEventListener('click', () => this.showMap());
        document.getElementById('btn-play-again').addEventListener('click', () => this.resetGame());
        document.getElementById('btn-map-from-gameover').addEventListener('click', () => this.showMap());
        document.getElementById('btn-retry-level').addEventListener('click', () => this.startLevel(this.currentLevelIndex));

        // Map nodes
        for (let i = 1; i <= 6; i++) {
            const node = document.getElementById(`node-${i}`);
            if (node) {
                node.addEventListener('click', () => {
                    if (!node.hasAttribute('disabled')) {
                        this.startLevel(i);
                    }
                });
            }
        }

        // Tutorial
        document.getElementById('btn-tutorial-next').addEventListener('click', () => this.startPlayPhase());

        // Play phase
        document.getElementById('btn-hint').addEventListener('click', () => this.showHint());
        document.getElementById('btn-run-experiment').addEventListener('click', () => this.runExperiment());
        document.getElementById('btn-next-question').addEventListener('click', () => this.nextStep());
    }

    toggleSound(btn) {
        const newState = !this.data.soundEnabled;
        this.data.soundEnabled = newState;
        soundManager.setEnabled(newState);
        saveData(this.data);
        btn.textContent = newState ? '🔊' : '🔇';
    }

    toggleTheme() {
        this.data.darkMode = !this.data.darkMode;
        this.ui.setTheme(this.data.darkMode);
        saveData(this.data);
    }

    showMap() {
        this.ui.updateMap(this.data.unlockedLevels, this.data.stars);
        this.ui.updateHUD(this.data.bestScore, this.score.getTotalStars(), 3);
        this.ui.showScreen('map');
        soundManager.play('click');
    }

    startLevel(levelIndex) {
        soundManager.play('click');
        this.currentLevelIndex = levelIndex;
        this.score.resetLives();

        const levelInfo = levelData[levelIndex];
        document.getElementById('level-title').textContent = `${levelInfo.icon} ${levelInfo.title}`;

        if (levelInfo.tutorial) {
            document.getElementById('tutorial-title').textContent = levelInfo.tutorial.title;
            document.getElementById('tutorial-text').textContent = levelInfo.tutorial.text;
            this.ui.showScreen('tutorial');
        } else {
            this.startPlayPhase();
        }
    }

    startPlayPhase() {
        this.ui.showScreen('play');
        this.hintUsed = false;

        document.getElementById('prediction-phase').classList.add('hidden');
        document.getElementById('experiment-phase').classList.add('hidden');
        document.getElementById('experiment-controls').classList.remove('hidden');
        document.getElementById('feedback-phase').classList.add('hidden');
        document.getElementById('boss-phase').classList.add('hidden');
        document.getElementById('simulation-area').classList.remove('hidden');
        document.getElementById('question-text').classList.remove('hidden');

        const levelInfo = levelData[this.currentLevelIndex];

        if (levelInfo.isBoss) {
            this.startBossBattle();
        } else if (levelInfo.isPureExperiment) {
            this.startPureExperiment();
        } else {
            this.loadQuestion(levelInfo.generatorMethod);
        }
    }

    loadQuestion(generatorMethod) {
        this.currentQuestion = this.qGen[generatorMethod]();

        document.getElementById('question-text').textContent = this.currentQuestion.text;

        // Render options for prediction
        const optionsGrid = document.getElementById('prediction-options');
        optionsGrid.innerHTML = '';
        this.currentQuestion.options.forEach((opt, index) => {
            const btn = document.createElement('button');
            btn.className = 'option-btn';
            btn.textContent = opt.text;
            btn.addEventListener('click', () => this.handlePrediction(opt, btn));
            optionsGrid.appendChild(btn);
        });

        // Setup hint
        document.getElementById('hint-text').classList.add('hidden');
        document.getElementById('hint-text').textContent = this.currentQuestion.hint;
        document.getElementById('btn-hint').classList.remove('hidden');

        // Setup sim
        this.setupSimulation();

        document.getElementById('prediction-phase').classList.remove('hidden');
    }

    setupSimulation() {
        if (!this.currentQuestion) return;
        const type = this.currentQuestion.simType;
        if (type === 'coin') this.sim.renderCoin();
        else if (type === 'dice') this.sim.renderDice();
        else if (type === 'wheel') this.sim.renderWheel(this.currentQuestion.segments);
        else if (type === 'bag') this.sim.renderBag(this.currentQuestion.marbles);
    }

    showHint() {
        this.hintUsed = true;
        soundManager.play('click');
        document.getElementById('hint-text').classList.remove('hidden');
        document.getElementById('btn-hint').classList.add('hidden');
    }

    handlePrediction(selectedOption, btnElement) {
        soundManager.play('click');

        const opts = document.querySelectorAll('.option-btn');
        opts.forEach(b => b.disabled = true);

        const isCorrect = selectedOption.isCorrect;

        if (isCorrect) {
            btnElement.classList.add('correct');
            soundManager.play('success');
            // Give prediction points
            this.score.addPoints(5);
        } else {
            btnElement.classList.add('wrong');
            soundManager.play('error');
            // Highlight correct one
            opts.forEach((b, i) => {
                if (this.currentQuestion.options[i].isCorrect) b.classList.add('correct');
            });
        }

        // Show experiment phase
        document.getElementById('prediction-phase').classList.add('hidden');
        document.getElementById('experiment-phase').classList.remove('hidden');
        document.getElementById('experiment-controls').classList.remove('hidden');
        document.getElementById('results-area').classList.add('hidden');
    }

    runExperiment() {
        soundManager.play('click');
        const count = parseInt(document.getElementById('experiment-count').value);
        this.score.recordExperiment(count);

        const type = this.currentQuestion ? this.currentQuestion.simType : 'coin'; // default for pure experiment
        let results = [];

        document.getElementById('btn-run-experiment').disabled = true;

        if (type === 'coin') {
            soundManager.play('coin');
            let heads = 0, tails = 0;
            for(let i=0; i<count; i++) { if(Math.random() < 0.5) heads++; else tails++; }
            results = [
                {label: 'رو', value: heads, total: count, color: '#f1c40f'},
                {label: 'پشت', value: tails, total: count, color: '#e67e22'}
            ];
            this.sim.animateCoin(heads > tails ? 'رو' : 'پشت', () => this.showResults(results, count));

        } else if (type === 'dice') {
            soundManager.play('dice');
            let counts = [0,0,0,0,0,0];
            for(let i=0; i<count; i++) { counts[Math.floor(Math.random() * 6)]++; }
            results = counts.map((c, i) => ({label: `عدد ${i+1}`, value: c, total: count, color: '#3498db'}));
            this.sim.animateDice(Math.floor(Math.random() * 6) + 1, () => this.showResults(results, count));

        } else if (type === 'wheel') {
            soundManager.play('coin'); // temp sound
            const segments = this.currentQuestion.segments;
            const totalWeight = segments.reduce((s, seg) => s + seg.weight, 0);
            let counts = segments.map(() => 0);

            for(let i=0; i<count; i++) {
                let r = Math.random() * totalWeight;
                let acc = 0;
                for(let j=0; j<segments.length; j++) {
                    acc += segments[j].weight;
                    if (r <= acc) { counts[j]++; break; }
                }
            }
            results = segments.map((seg, i) => ({label: seg.name, value: counts[i], total: count, color: seg.color}));
            // Just picking a random angle for animation
            this.sim.animateWheel(Math.random() * 360, () => this.showResults(results, count));
        } else if (type === 'bag') {
            soundManager.play('coin');
            const marbles = this.currentQuestion.marbles;
            let red = 0, blue = 0;
            for(let i=0; i<count; i++) {
                const draw = marbles[Math.floor(Math.random() * marbles.length)];
                if(draw === 'red') red++; else blue++;
            }
            results = [
                {label: 'قرمز', value: red, total: count, color: 'red'},
                {label: 'آبی', value: blue, total: count, color: 'blue'}
            ];
            setTimeout(() => this.showResults(results, count), 1000);
        }
    }

    showResults(results, count) {
        document.getElementById('btn-run-experiment').disabled = false;

        const resArea = document.getElementById('results-area');
        resArea.classList.remove('hidden');
        this.sim.renderBarChart(resArea, results);

        // Show feedback phase
        const fbPhase = document.getElementById('feedback-phase');
        fbPhase.classList.remove('hidden');
        fbPhase.className = 'phase-box success'; // default styling

        if (this.currentLevelIndex !== 5) {
            document.getElementById('experiment-controls').classList.add('hidden');

            document.getElementById('feedback-title').textContent = 'نتیجه آزمایش';
            document.getElementById('feedback-text').textContent = 'دیدی؟ وقتی آزمایش را انجام می‌دهیم، نتیجه واقعی مشخص می‌شود. هرچه تعداد آزمایش بیشتر شود، نتیجه به احتمال ریاضی نزدیک‌تر می‌شود.';

            // Score the main answer based on prediction if needed, but we already scored prediction.
            // Just let them move on.
            if (this.score.currentLives <= 0) {
                 this.gameOver();
            }
        } else {
            document.getElementById('feedback-title').textContent = 'بررسی نتایج';
            document.getElementById('feedback-text').textContent = 'به درصدها نگاه کن. آیا با افزایش تعداد، درصدها به مقدار نظری (۵۰٪) نزدیک‌تر می‌شوند؟';
        }
    }

    startPureExperiment() {
        this.currentQuestion = null;
        document.getElementById('question-text').textContent = 'خودت آزمایش کن! تعداد پرتاب سکه را انتخاب کن و ببین نتایج چطور تغییر می‌کنند.';
        this.sim.renderCoin();
        document.getElementById('experiment-phase').classList.remove('hidden');
        document.getElementById('experiment-controls').classList.remove('hidden');
    }

    startBossBattle() {
        document.getElementById('simulation-area').classList.add('hidden');
        document.getElementById('question-text').classList.add('hidden');
        document.getElementById('boss-phase').classList.remove('hidden');

        this.bossQuestions = this.qGen.generateBossQuestions(10);
        this.bossCurrentIndex = 0;
        this.bossHealth = 10;
        this.updateBossHealth();
        this.loadBossQuestion();
    }

    loadBossQuestion() {
        if (this.bossCurrentIndex >= this.bossQuestions.length || this.bossHealth <= 0) {
            this.levelComplete(true);
            return;
        }

        const q = this.bossQuestions[this.bossCurrentIndex];
        document.getElementById('boss-question-text').textContent = q.text;

        const optionsGrid = document.getElementById('boss-options');
        optionsGrid.innerHTML = '';

        // Shuffle options
        const shuffled = [...q.options].sort(() => 0.5 - Math.random());

        shuffled.forEach(opt => {
            const btn = document.createElement('button');
            btn.className = 'option-btn';
            btn.textContent = opt.t;
            btn.addEventListener('click', () => this.handleBossAnswer(opt.c, btn));
            optionsGrid.appendChild(btn);
        });
    }

    handleBossAnswer(isCorrect, btn) {
        const opts = document.getElementById('boss-options').querySelectorAll('.option-btn');
        opts.forEach(b => b.disabled = true);

        if (this.score.recordAnswer(isCorrect, false)) {
            btn.classList.add('correct');
            soundManager.play('success');
            this.bossHealth--;
            this.updateBossHealth();
            setTimeout(() => {
                this.bossCurrentIndex++;
                this.loadBossQuestion();
            }, 1000);
        } else {
            btn.classList.add('wrong');
            soundManager.play('error');
            opts.forEach(b => {
                // Find correct and highlight (need to know which one is correct)
                const origOpt = this.bossQuestions[this.bossCurrentIndex].options.find(o => o.t === b.textContent);
                if (origOpt && origOpt.c) b.classList.add('correct');
            });

            if (this.score.currentLives <= 0) {
                setTimeout(() => this.gameOver(), 1500);
            } else {
                 setTimeout(() => {
                    this.bossCurrentIndex++;
                    this.loadBossQuestion();
                }, 2000);
            }
        }
    }

    updateBossHealth() {
        const fill = document.getElementById('boss-health-fill');
        fill.style.width = `${(this.bossHealth / 10) * 100}%`;
    }

    nextStep() {
        // Complete the level (since each level is a single scenario except Boss)
        this.levelComplete(false);
    }

    levelComplete(isBossVictory) {
        soundManager.play('victory');

        let starsEarned = 1;
        if (this.score.currentLives === 3) starsEarned = 3;
        else if (this.score.currentLives === 2) starsEarned = 2;

        this.score.awardStars(this.currentLevelIndex, starsEarned);

        if (this.currentLevelIndex < 6) {
            this.score.unlockLevel(this.currentLevelIndex + 1);
        }

        if (isBossVictory) {
            this.showVictoryScreen();
        } else {
            document.getElementById('level-stars').textContent = '⭐'.repeat(starsEarned);
            let msg = 'عالی بود!';
            if (starsEarned === 3) msg = 'بی‌نقص! عملکردت فوق‌العاده بود.';
            else if (starsEarned === 2) msg = 'خوب بود! اما می‌توانی بهتر هم باشی.';
            document.getElementById('level-feedback-msg').textContent = msg;
            this.ui.showScreen('levelComplete');
        }
    }

    gameOver() {
        soundManager.play('error');
        this.ui.showScreen('gameOver');
    }

    showVictoryScreen() {
        document.getElementById('final-score').textContent = this.data.bestScore;
        document.getElementById('final-correct').textContent = this.data.totalCorrect;
        document.getElementById('final-wrong').textContent = this.data.totalWrong;
        document.getElementById('final-experiments').textContent = this.data.totalExperiments;
        this.ui.showScreen('victory');
    }

    resetGame() {
        // Reset progress but keep settings
        const currentDark = this.data.darkMode;
        const currentSound = this.data.soundEnabled;

        this.data = { ...defaultData, darkMode: currentDark, soundEnabled: currentSound };
        saveData(this.data);
        this.score.data = this.data;

        this.updateStartScreenStats();
        this.showMap();
    }
}

// Start game when DOM is loaded
window.addEventListener('DOMContentLoaded', () => {
    window.game = new Game();
});