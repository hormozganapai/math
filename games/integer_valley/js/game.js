/**
 * Main Game Logic Module
 * Handles UI interactions, game loop, rendering maps, and level management.
 */

// --- Audio (Optional, fails gracefully) ---
const sounds = {
    click: new Audio('assets/sounds/click.mp3'),
    success: new Audio('assets/sounds/success.mp3'),
    error: new Audio('assets/sounds/error.mp3'),
    unlock: new Audio('assets/sounds/unlock.mp3'),
    victory: new Audio('assets/sounds/victory.mp3')
};

function playSound(name) {
    if (storage.get('soundEnabled') && sounds[name]) {
        sounds[name].currentTime = 0;
        sounds[name].play().catch(() => {}); // Catch if file not found or blocked
    }
}

// --- DOM Elements ---
const screens = {
    start: document.getElementById('screen-start'),
    map: document.getElementById('screen-map'),
    level: document.getElementById('screen-level'),
    levelComplete: document.getElementById('screen-level-complete'),
    gameOver: document.getElementById('screen-game-over'),
    finished: document.getElementById('screen-finished')
};

const header = document.getElementById('game-header');
const scoreDisplays = document.querySelectorAll('#score-display, #level-score-display, #final-score');
const livesDisplay = document.getElementById('lives-display');
const starsDisplay = document.getElementById('stars-display');

// Map Elements
const mapPath = document.getElementById('map-path');
const mapNodesContainer = document.getElementById('map-nodes');

// Level Elements
const levelTitle = document.getElementById('level-title');
const questionText = document.getElementById('question-text');
const questionExtra = document.getElementById('question-extra');
const optionsContainer = document.getElementById('options-container');
const feedbackArea = document.getElementById('feedback-area');
const feedbackText = document.getElementById('feedback-text');
const btnNextQuestion = document.getElementById('btn-next-question');

// Interactive Number Line
const numberLineContainer = document.getElementById('number-line-container');
const numberLine = document.getElementById('number-line');
const character = document.getElementById('character');
const arrowPath = document.getElementById('arrow-path');

// Boss Elements
const bossArea = document.getElementById('boss-area');
const bossHealth = document.getElementById('boss-health');

// Tutorial Elements
const tutorialOverlay = document.getElementById('tutorial-overlay');
const tutorialText = document.getElementById('tutorial-text');
const tutorialAnimation = document.getElementById('tutorial-animation');

// Game State
let currentLevelData = null;
let currentQuestionData = null;
let currentQuestionIndex = 0;
let questionsPerLevel = 5; // Configurable
let levelScore = 0;
let levelCorrect = 0;
let levelWrong = 0;
let combo = 0;
let hintUsed = false;
let isAnswered = false;
let isBossBattle = false;
let bossHp = 100;

const LEVEL_INFO = [
    { id: 1, name: 'قله مثبت‌ها', icon: '🏔️', tut: 'اعداد بالای صفر مثبت (+) و اعداد پایین صفر منفی (-) هستند.' },
    { id: 2, name: 'دره صفر', icon: '0️⃣', tut: 'صفر مبدأ خط اعداد است. نه مثبت است و نه منفی.' },
    { id: 3, name: 'غار منفی‌ها', icon: '🕳️', tut: 'روی خط اعداد، هرچه به سمت راست برویم اعداد بزرگتر و هرچه به سمت چپ برویم کوچکتر می‌شوند.' },
    { id: 4, name: 'پل خط اعداد', icon: '📏', tut: 'حرکت به سمت مثبت یعنی رفتن به راست، و حرکت به سمت منفی یعنی رفتن به چپ.' },
    { id: 5, name: 'کوه جمع', icon: '➕', tut: 'برای جمع دو عدد: از عدد اول شروع کن، به اندازه عدد دوم (با توجه به علامتش) حرکت کن.' },
    { id: 6, name: 'دره تفریق', icon: '➖', tut: 'تفریق یعنی حرکت در جهت مخالف! تفریق عدد مثبت یعنی حرکت به چپ. تفریق عدد منفی یعنی حرکت به راست.' },
    { id: 7, name: 'غار ضرب', icon: '✖️', tut: 'در ضرب: هم‌علامت‌ها نتیجه مثبت، و مختلف‌العلامت‌ها نتیجه منفی می‌دهند.' },
    { id: 8, name: 'قلعه اعداد', icon: '🏰', tut: 'جادوگر اعداد منتظر توست! تمام قدرت‌هایی که یاد گرفتی را برای شکست او استفاده کن.' }
];

// --- Initialization ---
function init() {
    updateThemeUI();
    updateStatsUI();
    setupEventListeners();

    // Set best score and last level on start screen
    document.getElementById('best-score-display').innerText = storage.get('bestScore');
    document.getElementById('last-level-display').innerText = storage.get('currentLevel');
}

function switchScreen(screenId) {
    Object.values(screens).forEach(s => s.classList.add('hidden'));
    document.getElementById(screenId).classList.remove('hidden');

    if (screenId === 'screen-start') {
        header.classList.add('hidden');
    } else {
        header.classList.remove('hidden');
    }

    playSound('click');
}

// --- Stats & UI ---
function updateStatsUI() {
    scoreDisplays.forEach(el => el.innerText = storage.get('totalScore') + levelScore);

    const lives = storage.get('lives');
    let hearts = '';
    for(let i=0; i<3; i++) hearts += i < lives ? '❤️' : '🖤';
    livesDisplay.innerText = hearts;

    // Calculate total stars
    let totalStars = 0;
    const starsObj = storage.get('stars');
    for (const key in starsObj) totalStars += starsObj[key];
    starsDisplay.innerText = totalStars;
}

function updateThemeUI() {
    if (storage.get('darkMode')) {
        document.body.classList.add('theme-dark');
        document.body.classList.remove('theme-light');
    } else {
        document.body.classList.add('theme-light');
        document.body.classList.remove('theme-dark');
    }
}

function loseLife() {
    let lives = storage.get('lives');
    lives--;
    storage.set('lives', lives);
    updateStatsUI();

    if (lives <= 0) {
        setTimeout(() => {
            switchScreen('screen-game-over');
        }, 1500);
    }
}

// --- Map Generation ---
function generateMap() {
    mapNodesContainer.innerHTML = '';
    mapPath.innerHTML = '';

    const unlocked = storage.get('unlockedLevels');
    const nodes = [];

    // Positions for a zig-zag path
    const positions = [
        {x: 50, y: 550}, {x: 250, y: 500}, {x: 450, y: 450},
        {x: 500, y: 300}, {x: 300, y: 250}, {x: 100, y: 200},
        {x: 150, y: 50}, {x: 400, y: 50}
    ];

    let pathD = '';

    LEVEL_INFO.forEach((level, index) => {
        const pos = positions[index];
        nodes.push(pos);

        if (index === 0) pathD += `M ${pos.x} ${pos.y} `;
        else pathD += `L ${pos.x} ${pos.y} `;

        const node = document.createElement('div');
        node.className = `map-node ${level.id < unlocked ? 'unlocked' : (level.id === unlocked ? 'current' : 'locked')}`;
        node.style.left = `${pos.x}px`;
        node.style.top = `${pos.y}px`;
        node.innerHTML = level.icon;

        const label = document.createElement('div');
        label.className = 'node-label';
        label.innerText = level.id + '. ' + level.name;
        node.appendChild(label);

        // Stars for unlocked levels
        if (level.id < unlocked || (level.id === unlocked && storage.get('stars')[`level${level.id}`])) {
            const stars = storage.get('stars')[`level${level.id}`] || 0;
            const starsDiv = document.createElement('div');
            starsDiv.style.position = 'absolute';
            starsDiv.style.top = '-20px';
            starsDiv.style.fontSize = '0.8rem';
            let sHTML = '';
            for(let i=0; i<3; i++) sHTML += i < stars ? '⭐' : '☆';
            starsDiv.innerHTML = sHTML;
            node.appendChild(starsDiv);
        }

        if (level.id <= unlocked) {
            node.addEventListener('click', () => startLevel(level.id));
        }

        mapNodesContainer.appendChild(node);
    });

    const pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    pathEl.setAttribute('d', pathD);
    pathEl.setAttribute('stroke', '#ccc');
    pathEl.setAttribute('stroke-width', '4');
    pathEl.setAttribute('fill', 'none');
    pathEl.setAttribute('stroke-dasharray', '10,10');
    mapPath.appendChild(pathEl);
}

// --- Number Line Logic ---
function renderNumberLine(min, max, interactive = false, callback = null) {
    numberLineContainer.classList.remove('hidden');
    numberLine.innerHTML = '';

    // Determine width dynamically based on range
    const tickWidth = 40;
    const totalWidth = (max - min + 1) * tickWidth;
    numberLine.style.width = `${totalWidth}px`;
    numberLineContainer.scrollLeft = totalWidth / 2; // Try to center

    for (let i = min; i <= max; i++) {
        const tick = document.createElement('div');
        tick.className = 'tick' + (i === 0 ? ' zero' : '');
        tick.style.left = `${((i - min) / (max - min)) * 100}%`;

        const label = document.createElement('div');
        label.className = 'tick-label';
        label.innerText = i > 0 ? '+'+i : i;
        tick.appendChild(label);

        if (interactive) {
            tick.addEventListener('click', () => {
                if(callback) callback(i, tick);
            });
        }

        numberLine.appendChild(tick);
    }

    character.style.display = 'none';
    arrowPath.style.display = 'none';
}

function setCharacterPos(val, min, max) {
    character.style.display = 'block';
    const percent = ((val - min) / (max - min)) * 100;
    character.style.left = `${percent}%`;
}

function animateMovement(start, move, min, max) {
    const startPercent = ((start - min) / (max - min)) * 100;
    const endPercent = (((start + move) - min) / (max - min)) * 100;

    arrowPath.style.display = 'block';
    arrowPath.style.left = `${Math.min(startPercent, endPercent)}%`;
    arrowPath.style.width = `0%`; // Start width at 0 for animation

    // Animate arrow width
    setTimeout(() => {
        arrowPath.style.width = `${Math.abs(endPercent - startPercent)}%`;
        arrowPath.style.backgroundColor = move >= 0 ? 'rgba(76, 175, 80, 0.5)' : 'rgba(244, 67, 54, 0.5)';
    }, 50);

    // Move character
    setTimeout(() => {
        setCharacterPos(start + move, min, max);
    }, 500);
}


// --- Gameplay Logic ---
function startLevel(levelId) {
    if(storage.get('lives') <= 0) storage.set('lives', 3); // Reset lives if starting from map

    currentLevelData = LEVEL_INFO.find(l => l.id === levelId);
    isBossBattle = levelId === 8;
    questionsPerLevel = isBossBattle ? 10 : 5;

    currentQuestionIndex = 0;
    levelScore = 0;
    levelCorrect = 0;
    levelWrong = 0;
    combo = 0;
    bossHp = 100;

    updateStatsUI();

    levelTitle.innerText = `مرحله ${levelId}: ${currentLevelData.name}`;

    // Show Tutorial
    tutorialText.innerText = currentLevelData.tut;
    tutorialAnimation.innerHTML = currentLevelData.icon;
    tutorialOverlay.classList.remove('hidden');

    bossArea.classList.add('hidden');
    if (isBossBattle) {
        bossArea.classList.remove('hidden');
        updateBossHp();
    }

    switchScreen('screen-level');
}

document.getElementById('btn-close-tutorial').addEventListener('click', () => {
    tutorialOverlay.classList.add('hidden');
    loadQuestion();
});

function loadQuestion() {
    feedbackArea.classList.add('hidden');
    optionsContainer.innerHTML = '';
    questionExtra.innerHTML = '';
    numberLineContainer.classList.add('hidden');
    hintUsed = false;
    isAnswered = false;

    currentQuestionData = QuestionGenerator.getQuestionForLevel(currentLevelData.id, currentQuestionIndex + 1);

    questionText.innerHTML = currentQuestionData.question;
    if (currentQuestionData.equation) {
        questionExtra.innerHTML = currentQuestionData.equation;
    }

    // Setup Interactive Types
    if (currentQuestionData.type === 'number-line-find') {
        renderNumberLine(currentQuestionData.range[0], currentQuestionData.range[1], true, (selectedVal, tickEl) => {
            handleAnswer(selectedVal, tickEl);
        });
    } else {
        // Standard Multiple Choice
        currentQuestionData.options.forEach(opt => {
            const btn = document.createElement('button');
            btn.className = 'option-btn';
            btn.innerHTML = `<span dir="ltr">${opt}</span>`;
            btn.onclick = () => handleAnswer(opt, btn);
            optionsContainer.appendChild(btn);
        });

        // Show non-interactive number line if movement involved to help visualization
        if (currentQuestionData.type === 'number-line-move' || currentQuestionData.type === 'number-line-equation') {
            renderNumberLine(currentQuestionData.range[0], currentQuestionData.range[1], false);
            setCharacterPos(currentQuestionData.start, currentQuestionData.range[0], currentQuestionData.range[1]);
        }
    }
}

function handleAnswer(selected, element) {
    if (isAnswered) return;
    isAnswered = true;

    // Disable further clicks
    const allBtns = optionsContainer.querySelectorAll('.option-btn');
    allBtns.forEach(b => b.disabled = true);

    const isCorrect = selected == currentQuestionData.correct;

    if (isCorrect) {
        playSound('success');
        if (element) element.classList.add('correct');

        let pts = 10;
        if (combo >= 2) pts += 5; // Combo bonus
        if (hintUsed) pts -= 3;

        levelScore += Math.max(pts, 0);
        levelCorrect++;
        combo++;
        storage.addCorrect();

        showFeedback(true, 'آفرین! درست گفتی.<br>' + currentQuestionData.feedback);

        if (isBossBattle) {
            bossHp -= 10;
            updateBossHp();
        }

    } else {
        playSound('error');
        if (element) element.classList.add('wrong');

        combo = 0;
        levelScore -= 2; // Penalty
        levelWrong++;
        storage.addWrong();
        loseLife();

        // Find correct button and highlight
        allBtns.forEach(b => {
            if(b.innerText.trim() == currentQuestionData.correct) b.classList.add('correct');
        });

        showFeedback(false, 'اشتباه بود.<br>' + currentQuestionData.feedback);
    }

    // Show movement animation if applicable, regardless of right/wrong
    if (currentQuestionData.type === 'number-line-move' || currentQuestionData.type === 'number-line-equation') {
        animateMovement(currentQuestionData.start, currentQuestionData.move, currentQuestionData.range[0], currentQuestionData.range[1]);
    }

    updateStatsUI();
    btnNextQuestion.classList.remove('hidden');
}

function updateBossHp() {
    bossHealth.style.width = `${Math.max(0, bossHp)}%`;
}

function showFeedback(isSuccess, text) {
    feedbackArea.className = `feedback-area ${isSuccess ? 'success' : 'error'}`;
    feedbackText.innerHTML = text;
    feedbackArea.classList.remove('hidden');
}

btnNextQuestion.addEventListener('click', () => {
    currentQuestionIndex++;
    if (currentQuestionIndex < questionsPerLevel && storage.get('lives') > 0) {
        loadQuestion();
    } else if (storage.get('lives') > 0) {
        finishLevel();
    }
});

function finishLevel() {
    storage.updateScore(levelScore);

    // Calculate Stars
    let stars = 1;
    const accuracy = levelCorrect / questionsPerLevel;
    if (accuracy === 1) stars = 3;
    else if (accuracy >= 0.8) stars = 2;

    storage.saveLevelStars(currentLevelData.id, stars);

    // Setup result screen
    document.getElementById('level-score-display').innerText = levelScore;
    document.getElementById('level-correct-display').innerText = `${levelCorrect} از ${questionsPerLevel}`;

    for(let i=1; i<=3; i++) {
        const starEl = document.getElementById(`star-${i}`);
        if(i <= stars) starEl.classList.add('active');
        else starEl.classList.remove('active');
    }

    // Unlock next level
    if (currentLevelData.id < 8) {
        storage.unlockLevel(currentLevelData.id + 1);
        playSound('unlock');
    } else {
        // Game Finished!
        playSound('victory');
        showGameFinished();
        return;
    }

    switchScreen('screen-level-complete');
}

function showGameFinished() {
    document.getElementById('final-score').innerText = storage.get('totalScore');
    document.getElementById('final-correct').innerText = storage.get('totalCorrect');
    document.getElementById('final-wrong').innerText = storage.get('totalWrong');

    const totalQ = storage.get('totalCorrect') + storage.get('totalWrong');
    const percent = totalQ > 0 ? Math.round((storage.get('totalCorrect') / totalQ) * 100) : 0;
    document.getElementById('final-percent').innerText = percent;

    switchScreen('screen-finished');
}

// --- Hints ---
document.getElementById('btn-hint').addEventListener('click', () => {
    if (hintUsed) return;
    hintUsed = true;

    let hintText = "راهنمایی: ";
    if (currentQuestionData.type === 'multiple-choice' && currentQuestionData.options) {
         // remove one wrong option
         const allBtns = optionsContainer.querySelectorAll('.option-btn');
         for (let b of allBtns) {
             if (b.innerText.trim() != currentQuestionData.correct) {
                 b.disabled = true;
                 b.style.opacity = '0.3';
                 break; // remove only one
             }
         }
         hintText += "یک گزینه اشتباه حذف شد.";
    } else if (currentQuestionData.type.includes('number-line')) {
        hintText += "به خط اعداد و علامت‌ها دقت کن.";
        if(currentQuestionData.start !== undefined) {
             renderNumberLine(currentQuestionData.range[0], currentQuestionData.range[1], false);
             setCharacterPos(currentQuestionData.start, currentQuestionData.range[0], currentQuestionData.range[1]);
        }
    }

    showFeedback(false, hintText);
    feedbackArea.className = 'feedback-area'; // Neutral
    feedbackArea.classList.remove('hidden');
    btnNextQuestion.classList.add('hidden'); // Keep hidden until answered
});


// --- Event Listeners ---
function setupEventListeners() {
    document.getElementById('btn-start').addEventListener('click', () => {
        generateMap();
        switchScreen('screen-map');
    });

    // Top Bar Controls
    document.getElementById('btn-home').addEventListener('click', () => {
        switchScreen('screen-start');
    });

    document.getElementById('btn-sound').addEventListener('click', (e) => {
        const soundEnabled = !storage.get('soundEnabled');
        storage.set('soundEnabled', soundEnabled);
        e.target.innerText = soundEnabled ? '🔊' : '🔇';
    });

    document.getElementById('btn-theme').addEventListener('click', () => {
        const isDark = !storage.get('darkMode');
        storage.set('darkMode', isDark);
        updateThemeUI();
    });

    // Navigation from Result Screens
    document.getElementById('btn-back-to-map').addEventListener('click', () => {
        generateMap();
        switchScreen('screen-map');
    });

    document.getElementById('btn-next-level').addEventListener('click', () => {
        if (currentLevelData.id < 8) {
            startLevel(currentLevelData.id + 1);
        }
    });

    document.getElementById('btn-retry-level').addEventListener('click', () => {
        storage.set('lives', 3);
        startLevel(currentLevelData.id);
    });

    document.getElementById('btn-map-from-fail').addEventListener('click', () => {
        storage.set('lives', 3);
        generateMap();
        switchScreen('screen-map');
    });

    document.getElementById('btn-play-again').addEventListener('click', () => {
        storage.resetProgress();
        generateMap();
        switchScreen('screen-map');
    });

    document.getElementById('btn-finish-map').addEventListener('click', () => {
        generateMap();
        switchScreen('screen-map');
    });
}

// Set initial sound icon state
document.getElementById('btn-sound').innerText = storage.get('soundEnabled') ? '🔊' : '🔇';

// Start App
init();