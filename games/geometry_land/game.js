/**
 * Geometry Land (سرزمین هندسه)
 * Main Game Logic
 */

// Game State
const gameState = {
    bestScore: 0,
    currentScore: 0,
    totalStars: 0,
    unlockedLevels: 1,
    currentLevel: 0,
    totalCorrect: 0,
    totalWrong: 0,
    soundEnabled: true,
    darkMode: false,
    bossHp: 10,
    playerHp: 3,
    consecutiveCorrect: 0,
    levelState: {} // temporary state for current level
};

// Level Definitions
const levels = [
    { id: 1, title: 'جنگل شکل‌ها', x: 150, y: 500, icon: '🌲', type: 'identify' },
    { id: 2, title: 'شهر زاویه‌ها', x: 250, y: 400, icon: '📐', type: 'angle_interactive' },
    { id: 3, title: 'دره مثلث‌ها', x: 400, y: 450, icon: '🔺', type: 'triangle_interactive' },
    { id: 4, title: 'جزیره دایره‌ها', x: 550, y: 350, icon: '⭕', type: 'circle_interactive' },
    { id: 5, title: 'شهر اندازه‌گیری', x: 450, y: 200, icon: '📏', type: 'perimeter_area' },
    { id: 6, title: 'کارگاه هندسه', x: 650, y: 150, icon: '🏗️', type: 'build' },
    { id: 7, title: 'قلعه هندسه', x: 350, y: 80, icon: '🏰', type: 'boss' }
];

// DOM Elements
const els = {
    container: document.getElementById('game-container'),
    screens: document.querySelectorAll('.screen'),
    scoreDisplay: document.getElementById('score-display'),
    btnBack: document.getElementById('btn-back'),
    btnSound: document.getElementById('btn-sound'),
    btnTheme: document.getElementById('btn-theme'),
    btnInfo: document.getElementById('btn-info'),
    toast: document.getElementById('toast'),

    // Start Screen
    statBestScore: document.getElementById('stat-best-score'),
    statTotalStars: document.getElementById('stat-total-stars'),
    btnStart: document.getElementById('btn-start'),

    // Map Screen
    mapNodes: document.getElementById('map-nodes'),
    mapSvg: document.getElementById('map-svg'),

    // Level Screen
    levelTitle: document.getElementById('level-title'),
    progressFill: document.getElementById('progress-fill'),
    instructionText: document.getElementById('instruction-text'),
    interactiveArea: document.getElementById('interactive-area'),
    controlsArea: document.getElementById('controls-area'),
    feedbackArea: document.getElementById('feedback-area'),
    feedbackIcon: document.getElementById('feedback-icon'),
    feedbackText: document.getElementById('feedback-text'),
    btnHint: document.getElementById('btn-hint'),
    btnSubmit: document.getElementById('btn-submit'),
    levelStars: document.querySelector('.level-stars'),

    // Boss Screen
    wizardHpBar: document.getElementById('wizard-hp-bar'),
    playerHpBar: document.getElementById('player-hp-bar'),
    bossQuestion: document.getElementById('boss-question'),
    bossInteractive: document.getElementById('boss-interactive'),
    bossControls: document.getElementById('boss-controls'),

    // End Screen
    finalScore: document.getElementById('final-score'),
    finalStars: document.getElementById('final-stars'),
    finalCorrect: document.getElementById('final-correct'),
    finalWrong: document.getElementById('final-wrong'),
    btnPlayAgain: document.getElementById('btn-play-again'),
    btnBackToMap: document.getElementById('btn-back-to-map'),

    // Audio
    sndClick: document.getElementById('snd-click'),
    sndSuccess: document.getElementById('snd-success'),
    sndError: document.getElementById('snd-error'),
    sndUnlock: document.getElementById('snd-unlock'),
    sndVictory: document.getElementById('snd-victory')
};

// Initialize
function init() {
    loadData();
    updateUI();
    attachEvents();
    renderMap();
    showScreen('screen-start');
}

// Data Management
function loadData() {
    const saved = localStorage.getItem('geometryLandData');
    if (saved) {
        Object.assign(gameState, JSON.parse(saved));
        // Reset volatile state
        gameState.currentScore = 0;
        gameState.consecutiveCorrect = 0;
    }
    applyTheme();
    updateSoundIcon();
}

function saveData() {
    const toSave = {
        bestScore: Math.max(gameState.bestScore, gameState.currentScore),
        totalStars: gameState.totalStars,
        unlockedLevels: gameState.unlockedLevels,
        totalCorrect: gameState.totalCorrect,
        totalWrong: gameState.totalWrong,
        soundEnabled: gameState.soundEnabled,
        darkMode: gameState.darkMode
    };
    localStorage.setItem('geometryLandData', JSON.stringify(toSave));
}

// UI Updates
function updateUI() {
    els.scoreDisplay.textContent = gameState.currentScore;
    els.statBestScore.textContent = Math.max(gameState.bestScore, gameState.currentScore);
    els.statTotalStars.textContent = gameState.totalStars;
}

function showScreen(screenId) {
    els.screens.forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');

    els.btnBack.style.display = (screenId === 'screen-start' || screenId === 'screen-end') ? 'none' : 'block';

    if (screenId === 'screen-map') {
        renderMap();
    }
}

function showToast(message, duration = 2000) {
    els.toast.textContent = message;
    els.toast.classList.add('show');
    setTimeout(() => {
        els.toast.classList.remove('show');
    }, duration);
}

function playSound(sndId) {
    if (!gameState.soundEnabled) return;
    const snd = els[sndId];
    if (snd) {
        snd.currentTime = 0;
        snd.play().catch(e => console.log('Audio play failed', e));
    }
}

function applyTheme() {
    if (gameState.darkMode) {
        document.body.classList.add('dark-mode');
        document.body.classList.remove('light-mode');
        els.btnTheme.innerHTML = '<i class="fas fa-sun"></i>';
    } else {
        document.body.classList.remove('dark-mode');
        document.body.classList.add('light-mode');
        els.btnTheme.innerHTML = '<i class="fas fa-moon"></i>';
    }
}

function updateSoundIcon() {
    els.btnSound.innerHTML = gameState.soundEnabled ? '<i class="fas fa-volume-up"></i>' : '<i class="fas fa-volume-mute"></i>';
}

function addScore(points) {
    gameState.currentScore += points;
    if (points > 0) {
        gameState.totalCorrect++;
        gameState.consecutiveCorrect++;
        if (gameState.consecutiveCorrect >= 3) {
            points += 5; // Combo bonus
            showToast('🔥 کمبو! +5 امتیاز');
        }
    } else {
        gameState.totalWrong++;
        gameState.consecutiveCorrect = 0;
    }
    updateUI();
    saveData();
}

// Events
function attachEvents() {
    els.btnTheme.addEventListener('click', () => {
        gameState.darkMode = !gameState.darkMode;
        applyTheme();
        saveData();
        playSound('sndClick');
    });

    els.btnSound.addEventListener('click', () => {
        gameState.soundEnabled = !gameState.soundEnabled;
        updateSoundIcon();
        saveData();
        playSound('sndClick');
    });

    els.btnInfo.addEventListener('click', () => {
        showToast('طراحی شده برای MathPlay');
        playSound('sndClick');
    });

    els.btnBack.addEventListener('click', () => {
        playSound('sndClick');
        showScreen('screen-map');
    });

    els.btnStart.addEventListener('click', () => {
        playSound('sndClick');
        showScreen('screen-map');
    });

    els.btnPlayAgain.addEventListener('click', () => {
        playSound('sndClick');
        gameState.currentScore = 0;
        updateUI();
        showScreen('screen-map');
    });

    els.btnBackToMap.addEventListener('click', () => {
        playSound('sndClick');
        showScreen('screen-map');
    });

    els.btnSubmit.addEventListener('click', checkAnswer);
    els.btnHint.addEventListener('click', showHint);
}

// Map Logic
function renderMap() {
    els.mapNodes.innerHTML = '';
    els.mapSvg.innerHTML = '';

    // Draw Paths
    for (let i = 0; i < levels.length - 1; i++) {
        const l1 = levels[i];
        const l2 = levels[i+1];

        const path = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        path.setAttribute('x1', l1.x);
        path.setAttribute('y1', l1.y);
        path.setAttribute('x2', l2.x);
        path.setAttribute('y2', l2.y);
        path.setAttribute('stroke', 'var(--map-path)');
        path.setAttribute('stroke-width', '4');
        path.setAttribute('stroke-dasharray', '10, 10');

        if (i < gameState.unlockedLevels - 1) {
            path.setAttribute('stroke', 'var(--accent-color)');
            path.setAttribute('stroke-dasharray', 'none');
        }

        els.mapSvg.appendChild(path);
    }

    // Draw Nodes
    levels.forEach((level, index) => {
        const node = document.createElement('div');
        node.className = 'map-node';
        node.style.left = (level.x / 800 * 100) + '%';
        node.style.top = (level.y / 600 * 100) + '%';
        node.innerHTML = level.icon;

        const label = document.createElement('div');
        label.className = 'node-label';
        label.textContent = level.title;
        node.appendChild(label);

        if (index + 1 < gameState.unlockedLevels) {
            node.classList.add('completed');
        } else if (index + 1 === gameState.unlockedLevels) {
            node.classList.add('unlocked', 'current');
        } else {
            node.classList.add('locked');
            node.innerHTML = '🔒';
        }

        node.addEventListener('click', () => {
            if (index + 1 <= gameState.unlockedLevels) {
                playSound('sndClick');
                startLevel(level);
            }
        });

        els.mapNodes.appendChild(node);
    });
}

// Level Management
function startLevel(level) {
    gameState.currentLevel = level.id;
    gameState.levelState = { step: 0, totalSteps: 3, mistakes: 0, hintsUsed: 0 };

    if (level.type === 'boss') {
        gameState.levelState.totalSteps = 10;
        gameState.bossHp = 10;
        gameState.playerHp = 3;
        updateHpBars();
        showScreen('screen-boss');
        loadBossQuestion();
        return;
    }

    els.levelTitle.textContent = level.title;
    els.levelStars.innerHTML = '<i class="far fa-star"></i><i class="far fa-star"></i><i class="far fa-star"></i>';
    hideFeedback();
    updateProgress();
    showScreen('screen-level');
    loadLevelStep();
}

function updateProgress() {
    const percent = (gameState.levelState.step / gameState.levelState.totalSteps) * 100;
    els.progressFill.style.width = percent + '%';
}

function showFeedback(isCorrect, message) {
    els.feedbackArea.className = 'feedback-area ' + (isCorrect ? 'success' : 'error');
    els.feedbackIcon.innerHTML = isCorrect ? '<i class="fas fa-check-circle"></i>' : '<i class="fas fa-times-circle"></i>';
    els.feedbackText.innerHTML = message;

    if (isCorrect) {
        playSound('sndSuccess');
    } else {
        playSound('sndError');
    }
}

function hideFeedback() {
    els.feedbackArea.className = 'feedback-area hidden';
}

// Geometry Engine (SVG based)
function createSvgCanvas(viewBox = "0 0 400 300") {
    els.interactiveArea.innerHTML = '';
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'interactive-svg');
    svg.setAttribute('viewBox', viewBox);
    els.interactiveArea.appendChild(svg);
    return svg;
}

function loadLevelStep() {
    hideFeedback();
    els.btnSubmit.style.display = 'inline-flex';
    els.btnSubmit.textContent = 'بررسی پاسخ';
    els.btnSubmit.disabled = false;
    els.controlsArea.innerHTML = '';

    const type = levels.find(l => l.id === gameState.currentLevel).type;

    // Switch based on level type, generating appropriate content
    switch(type) {
        case 'identify':
            generateIdentifyStep();
            break;
        case 'angle_interactive':
            generateAngleStep();
            break;
        case 'triangle_interactive':
            generateTriangleStep();
            break;
        case 'circle_interactive':
            generateCircleStep();
            break;
        case 'perimeter_area':
            generateMeasurementStep();
            break;
        case 'build':
            generateBuildStep();
            break;
    }
}

// Level Generators
function generateIdentifyStep() {
    const shapes = [
        { id: 'square', name: 'مربع', desc: 'چهار ضلع برابر و چهار زاویه قائم دارد.', draw: (svg) => {
            const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            rect.setAttribute('x', '20'); rect.setAttribute('y', '20');
            rect.setAttribute('width', '60'); rect.setAttribute('height', '60');
            rect.setAttribute('class', 'geo-shape');
            svg.appendChild(rect);
        }},
        { id: 'rectangle', name: 'مستطیل', desc: 'ضلع‌های روبه‌رو برابر و چهار زاویه قائم دارد.', draw: (svg) => {
            const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            rect.setAttribute('x', '10'); rect.setAttribute('y', '30');
            rect.setAttribute('width', '80'); rect.setAttribute('height', '40');
            rect.setAttribute('class', 'geo-shape');
            svg.appendChild(rect);
        }},
        { id: 'triangle', name: 'مثلث', desc: 'سه ضلع و سه زاویه دارد.', draw: (svg) => {
            const poly = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
            poly.setAttribute('points', '50,10 10,90 90,90');
            poly.setAttribute('class', 'geo-shape');
            svg.appendChild(poly);
        }},
        { id: 'circle', name: 'دایره', desc: 'تمام نقاط آن از یک نقطه (مرکز) به یک فاصله هستند.', draw: (svg) => {
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', '50'); circle.setAttribute('cy', '50');
            circle.setAttribute('r', '40');
            circle.setAttribute('class', 'geo-shape');
            svg.appendChild(circle);
        }}
    ];

    // Pick random target
    const targetShape = shapes[Math.floor(Math.random() * shapes.length)];
    gameState.levelState.target = targetShape.id;
    gameState.levelState.explanation = targetShape.desc;

    els.instructionText.innerHTML = `شکلی را پیدا کن که <strong>${targetShape.desc}</strong>`;

    els.interactiveArea.innerHTML = '';
    const grid = document.createElement('div');
    grid.style.display = 'grid';
    grid.style.gridTemplateColumns = '1fr 1fr';
    grid.style.gap = '20px';
    grid.style.padding = '20px';
    grid.style.width = '100%';

    // Shuffle shapes
    const shuffled = [...shapes].sort(() => Math.random() - 0.5);

    shuffled.forEach(shape => {
        const div = document.createElement('div');
        div.className = 'shape-option';
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', '0 0 100 100');
        svg.style.width = '100%';
        svg.style.height = '100px';
        shape.draw(svg);
        div.appendChild(svg);

        div.addEventListener('click', () => {
            document.querySelectorAll('.shape-option').forEach(el => el.classList.remove('selected'));
            div.classList.add('selected');
            gameState.levelState.selected = shape.id;
            playSound('sndClick');
        });

        grid.appendChild(div);
    });

    els.interactiveArea.appendChild(grid);
}

function generateAngleStep() {
    const targetAngle = Math.floor(Math.random() * 15) * 10 + 30; // 30 to 170 step 10
    let type = 'تند (حاد)';
    if(targetAngle == 90) type = 'قائم';
    if(targetAngle > 90) type = 'باز (منفرجه)';
    if(targetAngle == 180) type = 'نیم‌صفحه (مستقیم)';

    els.instructionText.innerHTML = `با جابه‌جا کردن نقطه قرمز، یک زاویه <strong>${targetAngle} درجه</strong> (${type}) بساز.`;

    const svg = createSvgCanvas("0 0 400 300");

    // Base line
    const l1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    l1.setAttribute('x1', '200'); l1.setAttribute('y1', '200');
    l1.setAttribute('x2', '350'); l1.setAttribute('y2', '200');
    l1.setAttribute('class', 'geo-line');
    svg.appendChild(l1);

    // Moving line
    const l2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    l2.setAttribute('x1', '200'); l2.setAttribute('y1', '200');
    l2.setAttribute('x2', '200'); l2.setAttribute('y2', '50');
    l2.setAttribute('class', 'geo-line');
    svg.appendChild(l2);

    // Angle arc
    const arc = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    arc.setAttribute('class', 'geo-angle');
    svg.appendChild(arc);

    // Control point
    const pt = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    pt.setAttribute('cx', '200'); pt.setAttribute('cy', '50');
    pt.setAttribute('r', '10');
    pt.setAttribute('class', 'geo-point');
    svg.appendChild(pt);

    // Text display
    const txt = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    txt.setAttribute('x', '220'); txt.setAttribute('y', '190');
    txt.setAttribute('class', 'geo-text');
    txt.textContent = '90°';
    svg.appendChild(txt);

    // Initial state
    gameState.levelState.currentAngle = 90;
    gameState.levelState.targetAngle = targetAngle;

    // Drag logic
    let isDragging = false;
    pt.addEventListener('mousedown', () => isDragging = true);
    pt.addEventListener('touchstart', (e) => { isDragging = true; e.preventDefault(); });

    const updateAngle = (clientX, clientY) => {
        if (!isDragging) return;
        const rect = svg.getBoundingClientRect();
        // SVG to screen coordinate mapping approximation
        const svgW = rect.width;
        const svgH = rect.height;
        const ptX = ((clientX - rect.left) / svgW) * 400;
        const ptY = ((clientY - rect.top) / svgH) * 300;

        let dx = ptX - 200;
        let dy = ptY - 200;

        let angleRad = Math.atan2(-dy, dx); // negative dy because y grows down
        if (angleRad < 0) angleRad = 0;
        if (angleRad > Math.PI) angleRad = Math.PI;

        let angleDeg = Math.round((angleRad * 180) / Math.PI);
        // snap to 5 degrees
        angleDeg = Math.round(angleDeg / 5) * 5;

        gameState.levelState.currentAngle = angleDeg;

        const r = 150;
        const newX = 200 + r * Math.cos(angleDeg * Math.PI / 180);
        const newY = 200 - r * Math.sin(angleDeg * Math.PI / 180);

        pt.setAttribute('cx', newX);
        pt.setAttribute('cy', newY);
        l2.setAttribute('x2', newX);
        l2.setAttribute('y2', newY);

        txt.textContent = angleDeg + '°';

        // Update arc
        const arcR = 40;
        const arcX = 200 + arcR * Math.cos(angleDeg * Math.PI / 180);
        const arcY = 200 - arcR * Math.sin(angleDeg * Math.PI / 180);
        const largeArc = angleDeg > 180 ? 1 : 0;
        const d = `M 240 200 A ${arcR} ${arcR} 0 ${largeArc} 0 ${arcX} ${arcY} L 200 200 Z`;
        arc.setAttribute('d', d);
    };

    window.addEventListener('mousemove', (e) => updateAngle(e.clientX, e.clientY));
    window.addEventListener('touchmove', (e) => {
        if(isDragging) {
            updateAngle(e.touches[0].clientX, e.touches[0].clientY);
            e.preventDefault();
        }
    }, {passive: false});

    window.addEventListener('mouseup', () => isDragging = false);
    window.addEventListener('touchend', () => isDragging = false);

    // initialize visually
    updateAngle(svg.getBoundingClientRect().left + svg.getBoundingClientRect().width/2, svg.getBoundingClientRect().top);
}

function generateTriangleStep() {
    els.instructionText.innerHTML = `رأس قرمز را جابه‌جا کن تا یک <strong>مثلث قائم‌الزاویه</strong> بسازی (یک زاویه 90 درجه).`;
    const svg = createSvgCanvas("0 0 400 300");

    // Fixed points
    const p1 = {x: 100, y: 250};
    const p2 = {x: 300, y: 250};

    const poly = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    poly.setAttribute('class', 'geo-shape');
    svg.appendChild(poly);

    const pt = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    pt.setAttribute('class', 'geo-point');
    pt.setAttribute('r', '10');
    svg.appendChild(pt);

    const txt = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    txt.setAttribute('class', 'geo-text');
    svg.appendChild(txt);

    let currentP3 = {x: 200, y: 100};

    const updateTriangle = () => {
        poly.setAttribute('points', `${p1.x},${p1.y} ${p2.x},${p2.y} ${currentP3.x},${currentP3.y}`);
        pt.setAttribute('cx', currentP3.x);
        pt.setAttribute('cy', currentP3.y);

        // Calculate angles (law of cosines)
        const a2 = Math.pow(p2.x - currentP3.x, 2) + Math.pow(p2.y - currentP3.y, 2);
        const b2 = Math.pow(p1.x - currentP3.x, 2) + Math.pow(p1.y - currentP3.y, 2);
        const c2 = Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2);

        const a = Math.sqrt(a2);
        const b = Math.sqrt(b2);
        const c = Math.sqrt(c2);

        let A = Math.round(Math.acos((b2 + c2 - a2) / (2 * b * c)) * 180 / Math.PI);
        let B = Math.round(Math.acos((a2 + c2 - b2) / (2 * a * c)) * 180 / Math.PI);
        let C = 180 - A - B;

        txt.setAttribute('x', currentP3.x + 15);
        txt.setAttribute('y', currentP3.y - 15);
        txt.textContent = `${C}°`;

        gameState.levelState.angles = [A, B, C];
    };

    let isDragging = false;
    pt.addEventListener('mousedown', () => isDragging = true);
    pt.addEventListener('touchstart', (e) => { isDragging = true; e.preventDefault(); });

    const onMove = (clientX, clientY) => {
        if (!isDragging) return;
        const rect = svg.getBoundingClientRect();
        const ptX = ((clientX - rect.left) / rect.width) * 400;
        const ptY = ((clientY - rect.top) / rect.height) * 300;

        // Snap to grid for easier 90deg formation
        currentP3.x = Math.round(ptX / 25) * 25;
        currentP3.y = Math.round(ptY / 25) * 25;

        updateTriangle();
    };

    window.addEventListener('mousemove', (e) => onMove(e.clientX, e.clientY));
    window.addEventListener('touchmove', (e) => {
        if(isDragging) {
            onMove(e.touches[0].clientX, e.touches[0].clientY);
            e.preventDefault();
        }
    }, {passive: false});

    window.addEventListener('mouseup', () => isDragging = false);
    window.addEventListener('touchend', () => isDragging = false);

    updateTriangle();
    gameState.levelState.targetCondition = (angles) => angles.includes(90);
}

function generateCircleStep() {
    const tasks = [
        { id: 'radius', name: 'شعاع', desc: 'پاره‌خطی که مرکز را به محیط دایره وصل می‌کند.' },
        { id: 'diameter', name: 'قطر', desc: 'پاره‌خطی که از مرکز می‌گذرد و دو نقطه محیط را به هم وصل می‌کند.' }
    ];
    const task = tasks[Math.floor(Math.random() * tasks.length)];
    gameState.levelState.task = task.id;

    els.instructionText.innerHTML = `با جابه‌جا کردن نقاط قرمز، یک <strong>${task.name}</strong> بساز.`;

    const svg = createSvgCanvas("0 0 400 300");

    const cx = 200, cy = 150, r = 100;

    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', cx); circle.setAttribute('cy', cy); circle.setAttribute('r', r);
    circle.setAttribute('class', 'geo-shape');
    circle.style.fill = 'transparent';
    svg.appendChild(circle);

    const center = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    center.setAttribute('cx', cx); center.setAttribute('cy', cy); center.setAttribute('r', 5);
    center.setAttribute('fill', 'var(--text-primary)');
    svg.appendChild(center);

    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('class', 'geo-line');
    svg.appendChild(line);

    let p1 = {x: cx + r, y: cy};
    let p2 = {x: cx, y: cy - r};

    const pt1 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    pt1.setAttribute('class', 'geo-point'); pt1.setAttribute('r', 10);
    svg.appendChild(pt1);

    const pt2 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    pt2.setAttribute('class', 'geo-point'); pt2.setAttribute('r', 10);
    svg.appendChild(pt2);

    const updateLine = () => {
        pt1.setAttribute('cx', p1.x); pt1.setAttribute('cy', p1.y);
        pt2.setAttribute('cx', p2.x); pt2.setAttribute('cy', p2.y);

        line.setAttribute('x1', p1.x); line.setAttribute('y1', p1.y);
        line.setAttribute('x2', p2.x); line.setAttribute('y2', p2.y);

        // Calculate distance of both points to center
        const d1 = Math.sqrt(Math.pow(p1.x - cx, 2) + Math.pow(p1.y - cy, 2));
        const d2 = Math.sqrt(Math.pow(p2.x - cx, 2) + Math.pow(p2.y - cy, 2));

        gameState.levelState.d1 = d1;
        gameState.levelState.d2 = d2;

        // distance from line to center
        const A = p2.y - p1.y;
        const B = p1.x - p2.x;
        const C = p2.x * p1.y - p1.x * p2.y;
        let dist = 0;
        if (A !== 0 || B !== 0) {
            dist = Math.abs(A * cx + B * cy + C) / Math.sqrt(A*A + B*B);
        }
        gameState.levelState.distToCenter = dist;

        // Length of the line
        const length = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
        gameState.levelState.lineLength = length;
    };

    let activePt = null;

    const startDrag = (pt, e) => { activePt = pt; };
    pt1.addEventListener('mousedown', (e) => startDrag(1, e));
    pt2.addEventListener('mousedown', (e) => startDrag(2, e));
    pt1.addEventListener('touchstart', (e) => { startDrag(1, e); e.preventDefault(); });
    pt2.addEventListener('touchstart', (e) => { startDrag(2, e); e.preventDefault(); });

    const onMove = (clientX, clientY) => {
        if (!activePt) return;
        const rect = svg.getBoundingClientRect();
        const mx = ((clientX - rect.left) / rect.width) * 400;
        const my = ((clientY - rect.top) / rect.height) * 300;

        const distToCenter = Math.sqrt(Math.pow(mx - cx, 2) + Math.pow(my - cy, 2));
        let newX, newY;

        if (distToCenter < 20) {
            newX = cx;
            newY = cy;
        } else {
            const angle = Math.atan2(my - cy, mx - cx);
            newX = cx + r * Math.cos(angle);
            newY = cy + r * Math.sin(angle);
        }

        if (activePt === 1) {
            p1 = {x: newX, y: newY};
        } else {
            p2 = {x: newX, y: newY};
        }

        updateLine();
    };

    window.addEventListener('mousemove', (e) => onMove(e.clientX, e.clientY));
    window.addEventListener('touchmove', (e) => {
        if(activePt) {
            onMove(e.touches[0].clientX, e.touches[0].clientY);
            e.preventDefault();
        }
    }, {passive: false});

    window.addEventListener('mouseup', () => activePt = null);
    window.addEventListener('touchend', () => activePt = null);

    updateLine();
}

function generateMeasurementStep() {
    const w = Math.floor(Math.random() * 5) + 3; // 3 to 7
    const h = Math.floor(Math.random() * 4) + 2; // 2 to 5

    const isArea = Math.random() > 0.5;

    if (isArea) {
        els.instructionText.innerHTML = `مساحت این مستطیل چند مربع کوچک است؟ (طول=${w}، عرض=${h})`;
        gameState.levelState.answer = w * h;
    } else {
        els.instructionText.innerHTML = `محیط این مستطیل چقدر است؟ (حصاری که دور آن کشیده می‌شود)`;
        gameState.levelState.answer = (w + h) * 2;
    }

    const svg = createSvgCanvas("0 0 400 300");
    const gridSz = 30;
    const startX = 200 - (w * gridSz) / 2;
    const startY = 150 - (h * gridSz) / 2;

    // Draw Grid representing area
    for(let i=0; i<w; i++) {
        for(let j=0; j<h; j++) {
            const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            rect.setAttribute('x', startX + i*gridSz);
            rect.setAttribute('y', startY + j*gridSz);
            rect.setAttribute('width', gridSz);
            rect.setAttribute('height', gridSz);
            rect.setAttribute('class', 'geo-shape');
            svg.appendChild(rect);
        }
    }

    // Labels
    const txtW = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    txtW.setAttribute('x', 200); txtW.setAttribute('y', startY - 10);
    txtW.setAttribute('class', 'geo-text');
    txtW.setAttribute('text-anchor', 'middle');
    txtW.textContent = `طول = ${w}`;
    svg.appendChild(txtW);

    const txtH = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    txtH.setAttribute('x', startX - 40); txtH.setAttribute('y', 150);
    txtH.setAttribute('class', 'geo-text');
    txtH.textContent = `عرض = ${h}`;
    svg.appendChild(txtH);

    // Input control
    els.controlsArea.innerHTML = `
        <input type="number" id="num-answer" placeholder="پاسخ را وارد کن..." style="padding: 10px; border-radius: 8px; border: 2px solid var(--border-color); font-size: 1.1rem; width: 200px;">
    `;
}

function generateBuildStep() {
    els.instructionText.innerHTML = `با قرار دادن مقادیر مناسب در کادرها، یک ساختمان بساز که <strong>مساحت آن 24</strong> باشد.`;

    els.interactiveArea.innerHTML = `
        <div style="font-size: 4rem; margin-bottom: 20px;" id="building-preview">🏗️</div>
    `;

    els.controlsArea.innerHTML = `
        <div style="display: flex; gap: 10px; align-items: center; background: var(--bg-secondary); padding: 15px; border-radius: 8px; box-shadow: var(--card-shadow);">
            <label>طول:</label>
            <input type="number" id="build-w" style="width: 60px; padding: 5px; border-radius: 4px; border: 1px solid var(--border-color);" min="1">
            <span>×</span>
            <label>عرض:</label>
            <input type="number" id="build-h" style="width: 60px; padding: 5px; border-radius: 4px; border: 1px solid var(--border-color);" min="1">
            <span>= 24</span>
        </div>
    `;
}

// Logic check
function checkAnswer() {
    const type = levels.find(l => l.id === gameState.currentLevel).type;
    let isCorrect = false;
    let feedbackMsg = '';

    switch(type) {
        case 'identify':
            if (!gameState.levelState.selected) {
                showToast('لطفاً یک شکل را انتخاب کن!');
                return;
            }
            isCorrect = (gameState.levelState.selected === gameState.levelState.target);
            if(isCorrect) {
                feedbackMsg = `آفرین! این شکل دقیقاً ${gameState.levelState.explanation} است.`;
            } else {
                feedbackMsg = `اشتباه بود. شکلی که باید پیدا می‌کردی ویژگی‌های زیر را داشت: ${gameState.levelState.explanation}`;
            }
            break;

        case 'angle_interactive':
            const current = gameState.levelState.currentAngle;
            const target = gameState.levelState.targetAngle;
            if (Math.abs(current - target) <= 5) {
                isCorrect = true;
                feedbackMsg = `عالی! تو دقیقاً زاویه ${target} درجه را ساختی.`;
            } else {
                let diff = current > target ? 'بیشتر' : 'کمتر';
                feedbackMsg = `دقت کن! زاویه‌ای که ساختی ${current} درجه است که ${diff} از ${target} درجه است.`;
            }
            break;

        case 'triangle_interactive':
            if (gameState.levelState.angles.includes(90)) {
                isCorrect = true;
                feedbackMsg = `آفرین! یک مثلث قائم‌الزاویه (دارای زاویه 90 درجه) ساختی.`;
            } else {
                feedbackMsg = `هیچکدام از زاویه‌های این مثلث 90 درجه نیست. سعی کن یکی از اضلاع را کاملاً عمود بر دیگری قرار دهی. زاویه‌های فعلی: ${gameState.levelState.angles.join('°, ')}°`;
            }
            break;

        case 'circle_interactive':
            const dist = gameState.levelState.distToCenter;
            const d1 = gameState.levelState.d1;
            const d2 = gameState.levelState.d2;
            const len = gameState.levelState.lineLength;

            if (gameState.levelState.task === 'diameter') {
                if (dist < 10 && Math.abs(d1 - 100) < 5 && Math.abs(d2 - 100) < 5 && len > 180) {
                    isCorrect = true;
                    feedbackMsg = `احسنت! قطر پاره‌خطی است که دقیقاً از مرکز عبور می‌کند و دو سر آن روی محیط است.`;
                } else if (dist < 10 && (d1 < 10 || d2 < 10)) {
                    feedbackMsg = `اشتباه است. خطی که ساختی شعاع است. قطر باید از مرکز بگذرد و هر دو سر آن روی محیط باشد.`;
                } else {
                    feedbackMsg = `اشتباه است. خطی که ساختی از مرکز نمی‌گذرد (به آن وتر می‌گویند) یا دو سر آن روی محیط نیست.`;
                }
            } else if (gameState.levelState.task === 'radius') {
                const isP1Center = d1 < 10;
                const isP2Center = d2 < 10;
                const isP1Edge = Math.abs(d1 - 100) < 5;
                const isP2Edge = Math.abs(d2 - 100) < 5;

                if ((isP1Center && isP2Edge) || (isP2Center && isP1Edge)) {
                    isCorrect = true;
                    feedbackMsg = `درست است! شعاع دقیقاً از مرکز شروع می‌شود و به محیط می‌رسد.`;
                } else if (dist < 10 && isP1Edge && isP2Edge) {
                    feedbackMsg = `اشتباه است. این یک قطر است! شعاع فقط از مرکز تا محیط است.`;
                } else {
                    feedbackMsg = `نه، شعاع باید از مرکز شروع شود و به محیط برسد.`;
                }
            }
            break;

        case 'perimeter_area':
            const input = document.getElementById('num-answer');
            if(!input || !input.value) {
                showToast('لطفاً پاسخ را وارد کن.'); return;
            }
            const val = parseInt(input.value);
            isCorrect = (val === gameState.levelState.answer);
            if(isCorrect) {
                feedbackMsg = `عالیه! پاسخ کاملاً درست است.`;
            } else {
                feedbackMsg = `اشتباه بود. دوباره محاسبه کن. (جواب درست ${gameState.levelState.answer} بود)`;
            }
            break;

        case 'build':
            const bw = parseInt(document.getElementById('build-w').value);
            const bh = parseInt(document.getElementById('build-h').value);
            if(!bw || !bh) {
                showToast('لطفاً اعداد را وارد کن.'); return;
            }
            if (bw * bh === 24) {
                isCorrect = true;
                feedbackMsg = `آفرین! یک ساختمان با ابعاد ${bw} در ${bh} ساختی که مساحت آن 24 است.`;
                document.getElementById('building-preview').innerHTML = '🏢';
            } else {
                feedbackMsg = `مساحت (طول × عرض) برابر ${bw * bh} شد، در حالی که باید 24 می‌شد.`;
            }
            break;
    }

    showFeedback(isCorrect, feedbackMsg);

    if (isCorrect) {
        addScore(10 - (gameState.levelState.hintsUsed * 3));
        els.btnSubmit.textContent = 'مرحله بعد';
        els.btnSubmit.removeEventListener('click', checkAnswer);
        els.btnSubmit.addEventListener('click', nextStep, {once: true});

        // Visual indicator
        document.querySelector(`.level-stars i:nth-child(${gameState.levelState.step + 1})`).classList.replace('far', 'fas');
    } else {
        addScore(-2); // Penalize slightly
        gameState.levelState.mistakes++;
    }
}

function nextStep() {
    els.btnSubmit.addEventListener('click', checkAnswer); // Restore listener
    gameState.levelState.step++;
    updateProgress();

    if (gameState.levelState.step >= gameState.levelState.totalSteps) {
        levelComplete();
    } else {
        gameState.levelState.hintsUsed = 0;
        loadLevelStep();
    }
}

function showHint() {
    gameState.levelState.hintsUsed++;
    showToast('راهنمایی اعمال شد (-3 امتیاز). به آموزش روی صفحه دقت کن.');
    addScore(-3);
}

function levelComplete() {
    playSound('sndUnlock');

    // Calculate Stars
    let starsEarned = 3;
    if (gameState.levelState.mistakes > 0) starsEarned = 2;
    if (gameState.levelState.mistakes > 2) starsEarned = 1;

    gameState.totalStars += starsEarned;

    if (gameState.currentLevel === gameState.unlockedLevels) {
        gameState.unlockedLevels++;
        showToast('🔓 مرحله جدید باز شد!', 3000);
    }

    saveData();
    showScreen('screen-map');
}


// --- Boss Logic ---
const bossQuestions = [
    { q: "مجموع زوایای داخلی یک مثلث چند درجه است؟", a: [180], options: [90, 180, 360, 270] },
    { q: "مساحت مستطیلی با طول 4 و عرض 3 چقدر است؟", a: [12], options: [7, 12, 14, 24] },
    { q: "زاویه 120 درجه چه نوع زاویه‌ای است؟", a: ["منفرجه"], options: ["حاد", "قائم", "منفرجه", "مستقیم"] },
    { q: "خطی که از مرکز دایره می‌گذرد و دو سر آن روی محیط است؟", a: ["قطر"], options: ["شعاع", "وتر", "قطر", "کمان"] },
    { q: "محیط مربعی به ضلع 5 چقدر است؟", a: [20], options: [25, 20, 10, 15] },
];

function loadBossQuestion() {
    if (gameState.bossHp <= 0) {
        victory();
        return;
    }
    if (gameState.playerHp <= 0) {
        showToast('شکست خوردی! دوباره تلاش کن.');
        setTimeout(() => showScreen('screen-map'), 2000);
        return;
    }

    const qData = bossQuestions[Math.floor(Math.random() * bossQuestions.length)];
    els.bossQuestion.textContent = qData.q;

    // Randomize options
    const shuffledOptions = [...qData.options].sort(() => Math.random() - 0.5);

    els.bossControls.innerHTML = '';
    const grid = document.createElement('div');
    grid.style.display = 'grid';
    grid.style.gridTemplateColumns = '1fr 1fr';
    grid.style.gap = '10px';

    shuffledOptions.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'secondary-btn';
        btn.textContent = opt;
        btn.onclick = () => {
            if (qData.a.includes(opt)) {
                // Hit Boss
                playSound('sndSuccess');
                gameState.bossHp--;
                showToast('⚔️ ضربه موفق!');
                addScore(20);
                document.querySelector('.wizard').classList.add('pulse');
                setTimeout(() => document.querySelector('.wizard').classList.remove('pulse'), 500);
            } else {
                // Player takes damage
                playSound('sndError');
                gameState.playerHp--;
                showToast('💔 آسیب دیدی!');
                document.querySelector('.player').classList.add('pulse');
                setTimeout(() => document.querySelector('.player').classList.remove('pulse'), 500);
            }
            updateHpBars();
            setTimeout(loadBossQuestion, 1500);
        };
        grid.appendChild(btn);
    });

    els.bossControls.appendChild(grid);
}

function updateHpBars() {
    els.wizardHpBar.style.width = (gameState.bossHp * 10) + '%';
    els.playerHpBar.style.width = (gameState.playerHp * 33.3) + '%';
}

function victory() {
    playSound('sndVictory');
    els.finalScore.textContent = gameState.currentScore;
    els.finalStars.textContent = gameState.totalStars;
    els.finalCorrect.textContent = gameState.totalCorrect;
    els.finalWrong.textContent = gameState.totalWrong;

    saveData();
    showScreen('screen-end');
}

// Start game
window.addEventListener('DOMContentLoaded', init);