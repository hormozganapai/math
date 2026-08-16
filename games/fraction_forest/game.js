/**
 * Main Game Controller
 * Ties all modules together and manages game flow
 */

const Game = {
    state: {
        score: 0,
        lives: 3,
        currentLevelConfig: null,
        questionCount: 0,
        currentQuestion: null,
        combo: 0,
        bossHealth: 100
    },
    builder: null,

    init() {
        UI.init();
        Sound.init();
        this.bindEvents();

        // Setup start screen data
        document.getElementById('best-score-display').textContent = Storage.get('bestScore');
        document.getElementById('last-level-display').textContent = Storage.get('unlockedLevels');
    },

    bindEvents() {
        document.getElementById('btn-start').addEventListener('click', () => {
            Sound.playClick();
            this.state.score = 0;
            this.showMap();
        });

        document.getElementById('btn-home').addEventListener('click', () => {
            Sound.playClick();
            this.showMap();
        });

        document.getElementById('btn-close-tutorial').addEventListener('click', () => {
            Sound.playClick();
            document.getElementById('tutorial-area').classList.add('hidden');
            document.getElementById('game-area').classList.remove('hidden');
            this.nextQuestion();
        });

        document.getElementById('btn-submit').addEventListener('click', () => {
            this.checkAnswer();
        });

        document.getElementById('btn-next-question').addEventListener('click', () => {
            Sound.playClick();
            UI.hideFeedback();
            this.nextQuestion();
        });

        document.getElementById('btn-hint').addEventListener('click', () => {
            if (this.state.currentQuestion && this.state.currentQuestion.hint) {
                alert(`💡 راهنمایی: ${this.state.currentQuestion.hint}`);
                this.state.score = Math.max(0, this.state.score - 2); // Penalty for hint
                this.updateStatsUI();
            }
        });

        // Boss events
        document.getElementById('btn-boss-submit').addEventListener('click', () => {
            this.checkAnswer(true);
        });

        document.getElementById('btn-boss-next').addEventListener('click', () => {
            Sound.playClick();
            UI.hideFeedback(true);
            if (this.state.bossHealth <= 0) {
                this.endGame(true);
            } else if (this.state.lives <= 0) {
                this.endGame(false);
            } else {
                this.nextQuestion(true);
            }
        });

        document.getElementById('btn-restart').addEventListener('click', () => {
            Sound.playClick();
            this.state.score = 0;
            this.showMap();
        });

        document.getElementById('btn-back-to-map').addEventListener('click', () => {
            Sound.playClick();
            this.showMap();
        });
    },

    updateStatsUI() {
        let totalStars = Object.values(Storage.get('stars')).reduce((a, b) => a + b, 0);
        UI.updateStats(this.state.score, totalStars, this.state.lives);
    },

    showMap() {
        UI.showScreen('map');
        this.updateStatsUI();
        UI.renderMap(Storage.get('unlockedLevels'), (levelId) => {
            this.startLevel(levelId);
        });
    },

    startLevel(levelId) {
        const config = Levels.getLevel(levelId);
        if (!config) return;

        this.state.currentLevelConfig = config;
        this.state.questionCount = 0;
        this.state.lives = 3;
        this.state.combo = 0;

        Storage.set('currentLevel', levelId);

        if (config.type === 'boss') {
            this.state.bossHealth = 100;
            UI.updateBossHealth(100);
            UI.showScreen('boss');
            this.nextQuestion(true);
        } else {
            UI.showScreen('level');
            document.getElementById('level-title').textContent = config.name;
            this.showTutorial(config);
        }

        this.updateStatsUI();
    },

    showTutorial(config) {
        document.getElementById('game-area').classList.add('hidden');
        const tutArea = document.getElementById('tutorial-area');
        tutArea.classList.remove('hidden');
        document.getElementById('tutorial-text').textContent = config.tutorialText;

        const visualContainer = document.getElementById('tutorial-visual');
        visualContainer.innerHTML = '';

        // Add a visual example based on level type
        if (['build_fraction', 'identify_parts', 'split'].includes(config.type)) {
            visualContainer.appendChild(Fractions.createVisual(1, 4));
        } else if (config.type === 'compare') {
            const wrap = document.createElement('div');
            wrap.className = 'comparison-container';
            wrap.appendChild(Fractions.createVisual(1, 2));
            const span = document.createElement('span');
            span.textContent = ' > ';
            span.style.fontWeight = 'bold';
            span.style.fontSize = '2rem';
            wrap.appendChild(span);
            wrap.appendChild(Fractions.createVisual(1, 4));
            visualContainer.appendChild(wrap);
        }
    },

    nextQuestion(isBoss = false) {
        if (!isBoss && this.state.questionCount >= this.state.currentLevelConfig.questionsRequired) {
            this.completeLevel();
            return;
        }

        const config = this.state.currentLevelConfig;
        const q = Questions.generate(isBoss ? 'boss' : config.type, config.difficulty);
        this.state.currentQuestion = q;
        this.state.questionCount++;

        this.renderQuestion(q, isBoss);
    },

    renderQuestion(q, isBoss = false) {
        const prefix = isBoss ? 'boss-' : '';
        const qContainer = document.getElementById(`${prefix}question-container`);
        const intArea = document.getElementById(`${prefix}interactive-area`);

        // Reset areas
        qContainer.innerHTML = '';
        intArea.innerHTML = '';

        // Render Question Text
        const textP = document.createElement('p');
        textP.textContent = q.text;
        qContainer.appendChild(textP);

        // Options container (hide by default)
        const optContainer = document.getElementById('options-container');
        if(optContainer) optContainer.classList.add('hidden');

        // Setup Interactive Area based on question type
        if (q.type === 'compare') {
            intArea.className = 'interactive-area comparison-container';

            // Render fractions visually and textually
            const f1Div = document.createElement('div');
            f1Div.style.textAlign = 'center';
            f1Div.appendChild(Fractions.createVisual(q.f1.n, q.f1.d));
            f1Div.appendChild(Fractions.createText(q.f1.n, q.f1.d));

            const f2Div = document.createElement('div');
            f2Div.style.textAlign = 'center';
            f2Div.appendChild(Fractions.createVisual(q.f2.n, q.f2.d));
            f2Div.appendChild(Fractions.createText(q.f2.n, q.f2.d));

            // Options
            const opts = document.createElement('div');
            opts.className = 'comparison-options';
            ['>', '=', '<'].forEach(sign => {
                const btn = document.createElement('button');
                btn.className = 'comp-btn';
                btn.textContent = sign;
                btn.onclick = () => {
                    opts.querySelectorAll('.comp-btn').forEach(b => b.classList.remove('selected'));
                    btn.classList.add('selected');
                    this.state.currentQuestion.userAnswer = sign;
                };
                opts.appendChild(btn);
            });

            intArea.appendChild(f1Div);
            intArea.appendChild(opts);
            intArea.appendChild(f2Div);

        } else if (q.type === 'add' || q.type === 'subtract') {
            intArea.className = 'interactive-area';

            const equationDiv = document.createElement('div');
            equationDiv.style.display = 'flex';
            equationDiv.style.alignItems = 'center';
            equationDiv.style.gap = '10px';
            equationDiv.style.marginBottom = '20px';

            equationDiv.appendChild(Fractions.createText(q.f1.n, q.f1.d));
            const sign = document.createElement('span');
            sign.textContent = q.type === 'add' ? '+' : '-';
            sign.style.fontWeight = 'bold';
            sign.style.fontSize = '2rem';
            equationDiv.appendChild(sign);
            equationDiv.appendChild(Fractions.createText(q.f2.n, q.f2.d));

            const eqSign = document.createElement('span');
            eqSign.textContent = '=';
            eqSign.style.fontWeight = 'bold';
            eqSign.style.fontSize = '2rem';
            equationDiv.appendChild(eqSign);

            qContainer.appendChild(equationDiv);

            // Fraction Builder for answer
            const builderDiv = document.createElement('div');
            intArea.appendChild(builderDiv);
            // Default denominator to targetD, disallow changing if we just want numerator changes
            this.builder = new FractionBuilder(builderDiv, q.targetD, { canChangeDenominator: false });

        } else if (q.type === 'equivalent') {
            intArea.className = 'interactive-area';

            const refDiv = document.createElement('div');
            refDiv.style.marginBottom = '20px';
            refDiv.appendChild(Fractions.createVisual(q.f1.n, q.f1.d));
            refDiv.appendChild(Fractions.createText(q.f1.n, q.f1.d));

            qContainer.appendChild(refDiv);

            const builderDiv = document.createElement('div');
            intArea.appendChild(builderDiv);
            this.builder = new FractionBuilder(builderDiv, q.f1.d + 1);

        } else {
            // Default builder (identify_parts, split, build_fraction)
            intArea.className = 'interactive-area';

            if (q.displayFraction) {
                qContainer.appendChild(Fractions.createText(q.displayFraction.n, q.displayFraction.d));
            }

            const builderDiv = document.createElement('div');
            intArea.appendChild(builderDiv);

            // Start the builder with 1 part by default so they have to split it,
            // unless it's identify_parts where it should already be split.
            const initialD = q.type === 'identify_parts' ? q.targetD : 1;

            this.builder = new FractionBuilder(builderDiv, initialD, {
                canChangeDenominator: q.type !== 'identify_parts'
            });
        }
    },

    checkAnswer(isBoss = false) {
        const q = this.state.currentQuestion;
        let isCorrect = false;
        let feedbackMsg = '';

        if (q.type === 'compare') {
            if (!q.userAnswer) {
                alert("لطفاً یک گزینه انتخاب کن.");
                return;
            }
            isCorrect = (q.userAnswer === q.answer);
            feedbackMsg = isCorrect ? "عالی بود!" : `اشتباه است. جواب صحیح '${q.answer}' بود.`;
        } else {
            if (!this.builder) return;
            const userFraction = this.builder.getFraction();

            if (q.type === 'equivalent') {
                const userVal = userFraction.n / userFraction.d;
                // Check if equivalent but NOT exactly the same fraction
                if (userVal === q.targetValue && userFraction.d !== q.f1.d) {
                    isCorrect = true;
                    feedbackMsg = "آفرین! یک کسر مساوی ساختی.";
                } else if (userFraction.d === q.f1.d) {
                    feedbackMsg = "باید کسری متفاوت اما با مقدار یکسان بسازی (مخرج باید تغییر کند).";
                } else {
                    feedbackMsg = "این کسر با کسر اولیه مساوی نیست.";
                }
            } else {
                if (q.type === 'split') {
                    // For split type, we only care about the denominator
                    if (userFraction.d === q.targetD) {
                        isCorrect = true;
                        feedbackMsg = "عالی! شکل به درستی تقسیم شد.";
                    } else {
                        feedbackMsg = `باید شکل را به ${q.targetD} قسمت تقسیم می‌کردی.`;
                    }
                } else {
                    if (userFraction.n === q.targetN && userFraction.d === q.targetD) {
                        isCorrect = true;
                        feedbackMsg = "درست است! آفرین.";
                    } else {
                        if (userFraction.d !== q.targetD) {
                            feedbackMsg = `مخرج کسر (تعداد کل قسمت‌ها) اشتباه است.`;
                        } else {
                            feedbackMsg = `تعداد قسمت‌های انتخاب شده (صورت) اشتباه است.`;
                        }
                    }
                }
            }
        }

        // Process Result
        if (isCorrect) {
            Sound.playSuccess();
            Storage.addCorrect();

            // Score calc
            let points = 10;
            this.state.combo++;
            if (this.state.combo >= 3) {
                points += 5; // Combo bonus
                feedbackMsg += " 🔥 (Combo Bonus!)";
            }
            this.state.score += points;

            if (isBoss) {
                this.state.bossHealth -= 10;
                Sound.playHit();
                UI.updateBossHealth(this.state.bossHealth);
                if (this.state.bossHealth <= 0) {
                    feedbackMsg = "تو جادوگر را شکست دادی!";
                }
            }

        } else {
            Sound.playError();
            Storage.addWrong();
            this.state.combo = 0;
            this.state.lives--;
            this.state.score = Math.max(0, this.state.score - 5);

            if (!isBoss && this.state.lives <= 0) {
                feedbackMsg = "جان شما تمام شد! دوباره تلاش کن.";
            } else if (isBoss) {
                 feedbackMsg = "جادوگر به تو حمله کرد! جان کم شد.";
            }
        }

        this.updateStatsUI();
        UI.showFeedback(isCorrect, feedbackMsg, isBoss);

        // Handle death in normal level
        if (!isBoss && this.state.lives <= 0) {
            setTimeout(() => {
                UI.hideFeedback();
                this.showMap();
            }, 2000);
        }
    },

    completeLevel() {
        Sound.playUnlock();

        // Calculate stars (3 max)
        const stars = Math.max(1, this.state.lives);
        Storage.saveLevelStars(this.state.currentLevelConfig.id, stars);

        // Unlock next
        Storage.unlockLevel(this.state.currentLevelConfig.id + 1);
        Storage.updateBestScore(this.state.score);

        alert(`مرحله کامل شد! ⭐ ${stars} ستاره گرفتی.`);
        this.showMap();
    },

    endGame(victory) {
        Storage.updateBestScore(this.state.score);
        Storage.saveLevelStars(8, this.state.lives);

        UI.showScreen('end');

        document.getElementById('end-score').textContent = this.state.score;
        document.getElementById('end-correct').textContent = Storage.get('totalCorrect');
        document.getElementById('end-wrong').textContent = Storage.get('totalWrong');

        let totalStars = Object.values(Storage.get('stars')).reduce((a, b) => a + b, 0);
        document.getElementById('end-stars').textContent = totalStars;

        const title = document.querySelector('#screen-end .title');
        const subtitle = document.querySelector('#screen-end .subtitle');
        if (victory) {
            Sound.playUnlock();
            title.textContent = "🎉 تبریک! 🎉";
            subtitle.textContent = "تو جادوگر کسرها را شکست دادی و جنگل را نجات دادی!";
        } else {
            Sound.playError();
            title.textContent = "💀 شکست خوردی! 💀";
            subtitle.textContent = "جادوگر قوی‌تر بود. بیشتر تمرین کن و دوباره برگرد.";
        }
    }
};

// Initialize when DOM is loaded
window.addEventListener('DOMContentLoaded', () => {
    Game.init();
});
