/**
 * Tangram Game Logic
 * MathPlay Platform
 */

// --- Geometric Definitions ---
// Accurate simple coordinate system based on a 400x400 grid.
// We define pieces as they appear in the solved 400x400 square,
// then translate them so their center of bounding box is (0,0).
const EXACT_PIECES = [
    { id: 'lt1', color: 'var(--orange)', orig: [[0,0], [400,0], [200,200]], canFlip: false },
    { id: 'lt2', color: 'var(--blue)', orig: [[0,0], [200,200], [0,400]], canFlip: false },
    { id: 'mt', color: 'var(--teal)', orig: [[400,400], [200,400], [400,200]], canFlip: false },
    { id: 'sq', color: 'var(--yellow)', orig: [[200,200], [300,100], [400,200], [300,300]], canFlip: false },
    { id: 'st1', color: 'var(--pink)', orig: [[400,0], [400,200], [300,100]], canFlip: false },
    { id: 'st2', color: 'var(--violet-dark)', orig: [[200,200], [300,300], [200,400]], canFlip: false },
    { id: 'para', color: 'var(--violet)', orig: [[0,400], [200,400], [300,300], [100,300]], canFlip: true }
];

// Normalize pieces so they are centered at (0,0)
const piecesDef = EXACT_PIECES.map(p => {
    let minX = Math.min(...p.orig.map(pt => pt[0]));
    let maxX = Math.max(...p.orig.map(pt => pt[0]));
    let minY = Math.min(...p.orig.map(pt => pt[1]));
    let maxY = Math.max(...p.orig.map(pt => pt[1]));

    let cx = (minX + maxX) / 2;
    let cy = (minY + maxY) / 2;

    let points = p.orig.map(pt => `${pt[0] - cx},${pt[1] - cy}`).join(' ');

    return {
        id: p.id,
        points: points,
        color: p.color,
        canFlip: p.canFlip,
        cx: cx,
        cy: cy
    };
});

// --- State ---
const State = {
    pieces: {}, // { id: { x, y, rot, flip, node } }
    selectedPieceId: null,
    puzzles: [],
    currentPuzzle: null,
    timer: 0,
    timerInterval: null,
    mode: 'puzzle', // 'puzzle' or 'freeplay'
    hintLevel: 0
};

// --- Initialization ---
function init() {
    renderPieces();
    // Start with pieces scattered
    scatterPieces();
}

function renderPieces() {
    const group = document.getElementById('piecesGroup');
    group.innerHTML = '';

    piecesDef.forEach(def => {
        const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        polygon.setAttribute('points', def.points);
        polygon.setAttribute('fill', def.color);
        polygon.setAttribute('class', 'tangram-piece');
        polygon.setAttribute('id', `piece-${def.id}`);
        polygon.setAttribute('stroke', 'rgba(255,255,255,0.3)');
        polygon.setAttribute('stroke-width', '2');

        group.appendChild(polygon);

        State.pieces[def.id] = {
            id: def.id,
            x: 0,
            y: 0,
            rot: 0,
            flip: false,
            node: polygon,
            def: def
        };

        updatePieceTransform(def.id);
    });
}

function updatePieceTransform(id) {
    const p = State.pieces[id];
    if (!p || !p.node) return;

    // Transform order: Translate -> Rotate -> Scale(Flip)
    const flipScale = p.flip ? -1 : 1;
    // For parallelogram, we flip on X axis.
    p.node.setAttribute('transform', `translate(${p.x}, ${p.y}) rotate(${p.rot}) scale(${flipScale}, 1)`);
}

function scatterPieces() {
    const spacing = 150;
    const startX = -300;
    const startY = 250;

    let i = 0;
    for (let id in State.pieces) {
        const p = State.pieces[id];
        p.x = startX + (i % 4) * spacing;
        p.y = startY + Math.floor(i / 4) * spacing;
        p.rot = 0;
        p.flip = false;
        updatePieceTransform(id);
        i++;
    }
}

// --- Interaction Logic ---
let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;
let pieceStartX = 0;
let pieceStartY = 0;

function setupInteractions() {
    const svg = document.getElementById('tangramCanvas');

    // Global pointer events for dragging
    svg.addEventListener('pointerdown', handlePointerDown);
    svg.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp); // Window to catch out-of-bounds releases

    // UI Controls
    document.getElementById('rotateLeftBtn').addEventListener('click', () => rotateSelected(-45));
    document.getElementById('rotateRightBtn').addEventListener('click', () => rotateSelected(45));
    document.getElementById('flipBtn').addEventListener('click', flipSelected);

    // Desktop UI Controls
    document.getElementById('rotateLeftBtnDesktop').addEventListener('click', () => rotateSelected(-45));
    document.getElementById('rotateRightBtnDesktop').addEventListener('click', () => rotateSelected(45));
    document.getElementById('flipBtnDesktop').addEventListener('click', flipSelected);

    // Wheel rotation
    svg.addEventListener('wheel', (e) => {
        if (State.selectedPieceId) {
            e.preventDefault();
            const direction = e.deltaY > 0 ? 45 : -45;
            rotateSelected(direction);
        }
    }, { passive: false });
}

function getSVGCoordinates(evt) {
    const svg = document.getElementById('tangramCanvas');
    const pt = svg.createSVGPoint();
    pt.x = evt.clientX;
    pt.y = evt.clientY;
    return pt.matrixTransform(svg.getScreenCTM().inverse());
}

function handlePointerDown(e) {
    if (e.target.classList.contains('tangram-piece')) {
        isDragging = true;
        const id = e.target.id.replace('piece-', '');
        selectPiece(id);

        const pt = getSVGCoordinates(e);
        dragStartX = pt.x;
        dragStartY = pt.y;

        const p = State.pieces[id];
        pieceStartX = p.x;
        pieceStartY = p.y;

        e.target.setPointerCapture(e.pointerId);
    } else {
        deselectPiece();
    }
}

function handlePointerMove(e) {
    if (!isDragging || !State.selectedPieceId) return;

    const pt = getSVGCoordinates(e);
    const dx = pt.x - dragStartX;
    const dy = pt.y - dragStartY;

    const p = State.pieces[State.selectedPieceId];
    p.x = pieceStartX + dx;
    p.y = pieceStartY + dy;

    updatePieceTransform(p.id);
}

function handlePointerUp(e) {
    if (isDragging) {
        isDragging = false;
        if (e.target.hasPointerCapture && e.target.hasPointerCapture(e.pointerId)) {
            e.target.releasePointerCapture(e.pointerId);
        }
        snapPiece(State.selectedPieceId);
        checkWinCondition();
    }
}

function selectPiece(id) {
    State.selectedPieceId = id;
    const p = State.pieces[id];

    // Bring to front
    const group = document.getElementById('piecesGroup');
    group.appendChild(p.node);

    // Highlight
    for (let key in State.pieces) {
        State.pieces[key].node.setAttribute('stroke', 'rgba(255,255,255,0.3)');
        State.pieces[key].node.setAttribute('stroke-width', '2');
    }
    p.node.setAttribute('stroke', 'var(--violet)');
    p.node.setAttribute('stroke-width', '4');

    // Enable/disable flip button
    const flipBtn = document.getElementById('flipBtn');
    const flipBtnDesktop = document.getElementById('flipBtnDesktop');
    if (p.def.canFlip) {
        flipBtn.removeAttribute('disabled');
        flipBtnDesktop.removeAttribute('disabled');
    } else {
        flipBtn.setAttribute('disabled', 'true');
        flipBtnDesktop.setAttribute('disabled', 'true');
    }
}

function deselectPiece() {
    State.selectedPieceId = null;
    for (let key in State.pieces) {
        State.pieces[key].node.setAttribute('stroke', 'rgba(255,255,255,0.3)');
        State.pieces[key].node.setAttribute('stroke-width', '2');
    }
    document.getElementById('flipBtn').setAttribute('disabled', 'true');
    document.getElementById('flipBtnDesktop').setAttribute('disabled', 'true');
}

function rotateSelected(degrees) {
    if (!State.selectedPieceId) return;
    const p = State.pieces[State.selectedPieceId];
    p.rot = (p.rot + degrees) % 360;
    if (p.rot < 0) p.rot += 360;
    updatePieceTransform(p.id);
}

function flipSelected() {
    if (!State.selectedPieceId) return;
    const p = State.pieces[State.selectedPieceId];
    if (p.def.canFlip) {
        p.flip = !p.flip;
        updatePieceTransform(p.id);
    }
}

// --- Game Flow and Validation ---
async function loadPuzzles() {
    try {
        const response = await fetch('tangram-puzzles.json');
        const data = await response.json();
        State.puzzles = data.puzzles;

        // Setup categories
        const categories = [...new Set(State.puzzles.map(p => p.category))];
        const catSelect = document.getElementById('categoryFilter');
        categories.forEach(cat => {
            const opt = document.createElement('option');
            opt.value = cat;
            opt.textContent = cat;
            catSelect.appendChild(opt);
        });

        // Event listeners for filters
        catSelect.addEventListener('change', renderPuzzleList);
        document.getElementById('difficultyFilter').addEventListener('change', renderPuzzleList);

        renderPuzzleList();
        if (State.puzzles.length > 0) {
            loadPuzzle(State.puzzles[0].id);
        }
    } catch (e) {
        console.error("Failed to load puzzles", e);
    }
}

function renderPuzzleList() {
    const list = document.getElementById('puzzleList');
    list.innerHTML = '';

    const catFilter = document.getElementById('categoryFilter').value;
    const diffFilter = document.getElementById('difficultyFilter').value;

    let filteredPuzzles = State.puzzles;

    if (catFilter !== 'all') {
        filteredPuzzles = filteredPuzzles.filter(p => p.category === catFilter);
    }

    if (diffFilter !== 'all') {
        filteredPuzzles = filteredPuzzles.filter(p => p.difficulty == diffFilter);
    }

    filteredPuzzles.forEach(puzzle => {
        const item = document.createElement('div');
        item.className = 'puzzle-item';
        item.textContent = puzzle.name;
        item.onclick = () => loadPuzzle(puzzle.id);
        if (State.currentPuzzle && State.currentPuzzle.id === puzzle.id) {
            item.classList.add('active');
        }
        list.appendChild(item);
    });
}

function loadPuzzle(id) {
    const puzzle = State.puzzles.find(p => p.id === id);
    if (!puzzle) return;

    State.mode = 'puzzle';
    State.currentPuzzle = puzzle;
    renderPuzzleList();

    // UI updates
    document.getElementById('exportBtn').style.display = 'none';
    document.getElementById('hintBtn').style.display = 'inline-flex';
    document.getElementById('solveBtn').style.display = 'inline-flex';
    document.getElementById('freePlayBtn').classList.remove('active-mode');

    State.hintLevel = 0;

    // Create silhouette
    createSilhouette(puzzle);

    // Reset pieces
    scatterPieces();

    // Reset Timer
    startTimer();

    document.getElementById('victoryModal').style.display = 'none';
}

function activateFreePlay() {
    State.mode = 'freeplay';
    State.currentPuzzle = null;

    // UI updates
    document.getElementById('exportBtn').style.display = 'inline-flex';
    document.getElementById('hintBtn').style.display = 'none';
    document.getElementById('solveBtn').style.display = 'none';
    document.getElementById('freePlayBtn').classList.add('active-mode');

    // Clear active state in puzzle list
    document.querySelectorAll('.puzzle-item').forEach(el => el.classList.remove('active'));

    // Clear silhouette
    document.getElementById('silhouetteGroup').innerHTML = '';

    // Reset Timer
    clearInterval(State.timerInterval);
    State.timer = 0;
    updateTimerDisplay();

    // Bring pieces to center
    scatterPieces();
}

function exportCustomPuzzle() {
    const piecesData = [];
    for (let id in State.pieces) {
        const p = State.pieces[id];
        piecesData.push({
            id: p.id,
            x: Math.round(p.x),
            y: Math.round(p.y),
            rot: p.rot,
            flip: p.flip
        });
    }

    const customPuzzle = {
        id: "custom_" + Date.now(),
        category: "ساخت کاربر",
        name: "طرح سفارشی",
        difficulty: 3,
        pieces: piecesData
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(customPuzzle, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "tangram_custom_puzzle.json");
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}

function createSilhouette(puzzle) {
    const group = document.getElementById('silhouetteGroup');
    group.innerHTML = '';

    // Build union of pieces by rendering them in their target positions
    // In SVG, we can just render the pieces in black, merged together via CSS or filter, or just individual polygons
    puzzle.pieces.forEach(pData => {
        const def = piecesDef.find(d => d.id === pData.id);
        if (def) {
            const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
            polygon.setAttribute('points', def.points);
            polygon.setAttribute('class', 'tangram-silhouette');
            const flipScale = pData.flip ? -1 : 1;
            polygon.setAttribute('transform', `translate(${pData.x}, ${pData.y}) rotate(${pData.rot}) scale(${flipScale}, 1)`);
            polygon.setAttribute('data-piece-id', pData.id); // Stored for hint sorting
            group.appendChild(polygon);
        }
    });
}

function snapPiece(id) {
    if (State.mode === 'freeplay' || !State.currentPuzzle) return;
    const p = State.pieces[id];

    // Find matching targets (accounting for identical pieces)
    let possibleTargets = [];
    if (id === 'lt1' || id === 'lt2') {
        possibleTargets = State.currentPuzzle.pieces.filter(tp => tp.id === 'lt1' || tp.id === 'lt2');
    } else if (id === 'st1' || id === 'st2') {
        possibleTargets = State.currentPuzzle.pieces.filter(tp => tp.id === 'st1' || tp.id === 'st2');
    } else {
        possibleTargets = State.currentPuzzle.pieces.filter(tp => tp.id === id);
    }

    for (const target of possibleTargets) {
        // Check if this target slot is already accurately occupied by another piece of the same type.
        // We only skip if another *different* piece is already snapped to this target perfectly.
        // (For a simple snap check, we just see if the current piece 'p' matches 'target').

        // Flip check
        if (p.def.canFlip && p.flip !== target.flip) continue;

        // Rotation matching with symmetries
        let rotDiff = Math.abs(p.rot - target.rot) % 360;
        if (rotDiff > 180) rotDiff = 360 - rotDiff;

        let isRotMatch = false;
        if (p.id === 'sq') {
            isRotMatch = (rotDiff % 90 === 0);
        } else if (p.id === 'para') {
            isRotMatch = (rotDiff % 180 === 0);
        } else {
            isRotMatch = (rotDiff === 0);
        }

        if (!isRotMatch) continue;

        // Distance check
        const dx = p.x - target.x;
        const dy = p.y - target.y;
        const dist = Math.sqrt(dx*dx + dy*dy);

        if (dist < 40) { // Snap threshold
            p.x = target.x;
            p.y = target.y;

            if (p.id === 'sq' || p.id === 'para') {
                 p.rot = target.rot; // Force strict visual rotation for symmetric pieces when snapped
            }

            updatePieceTransform(p.id);
            break; // Snapped, stop checking other targets
        }
    }
}

function checkWinCondition() {
    if (State.mode === 'freeplay' || !State.currentPuzzle) return;

    // We need to check if every target slot is filled by a valid piece.
    // Keep track of which pieces are used so we don't double count.
    let usedPieceIds = new Set();
    let isWin = true;

    for (const tp of State.currentPuzzle.pieces) {
        let slotFilled = false;

        // Determine valid piece types for this slot
        let validTypes = [tp.id];
        if (tp.id === 'lt1' || tp.id === 'lt2') validTypes = ['lt1', 'lt2'];
        if (tp.id === 'st1' || tp.id === 'st2') validTypes = ['st1', 'st2'];

        for (const type of validTypes) {
            if (usedPieceIds.has(type)) continue;

            const p = State.pieces[type];

            // Flip
            if (p.def.canFlip && p.flip !== tp.flip) continue;

            // Rotation
            let rotDiff = Math.abs(p.rot - tp.rot) % 360;
            if (rotDiff > 180) rotDiff = 360 - rotDiff;

            let isRotMatch = false;
            if (p.id === 'sq') {
                isRotMatch = (rotDiff % 90 === 0);
            } else if (p.id === 'para') {
                isRotMatch = (rotDiff % 180 === 0);
            } else {
                isRotMatch = (rotDiff === 0);
            }
            if (!isRotMatch) continue;

            // Position
            const dx = p.x - tp.x;
            const dy = p.y - tp.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            if (dist > 5) continue;

            // If all checks pass, this slot is filled by 'type'
            slotFilled = true;
            usedPieceIds.add(type);
            break;
        }

        if (!slotFilled) {
            isWin = false;
            break;
        }
    }

    if (isWin) {
        clearInterval(State.timerInterval);
        document.getElementById('victoryModal').style.display = 'flex';
    }
}

function showHint() {
    if (!State.currentPuzzle) return;

    State.hintLevel++;
    if (State.hintLevel > 3) State.hintLevel = 3;

    const group = document.getElementById('silhouetteGroup');
    const polys = Array.from(group.querySelectorAll('polygon'));

    let piecesToShow = 0;
    if (State.hintLevel === 1) piecesToShow = 1;      // Outline of 1 piece (prefer large triangle if available)
    else if (State.hintLevel === 2) piecesToShow = 3; // Outlines of 3 pieces
    else if (State.hintLevel === 3) piecesToShow = 7; // Full wireframe (all 7 pieces)

    // Sort so large triangles are shown first
    polys.sort((a, b) => {
        const aId = a.getAttribute('data-piece-id');
        const bId = b.getAttribute('data-piece-id');
        const aVal = (aId === 'lt1' || aId === 'lt2') ? -1 : 1;
        const bVal = (bId === 'lt1' || bId === 'lt2') ? -1 : 1;
        return aVal - bVal;
    });

    // Reset all
    polys.forEach(poly => {
        poly.style.opacity = '0.15';
        poly.style.fill = '#333';
        poly.style.stroke = 'none';
    });

    // Apply hints
    for (let i = 0; i < Math.min(piecesToShow, polys.length); i++) {
        polys[i].style.opacity = '0.8';
        polys[i].style.fill = 'none';
        polys[i].style.stroke = 'var(--violet)';
        polys[i].style.strokeWidth = '4';
    }
}

function solvePuzzle() {
    if (!State.currentPuzzle) return;
    State.currentPuzzle.pieces.forEach(tp => {
        const p = State.pieces[tp.id];
        p.x = tp.x;
        p.y = tp.y;
        p.rot = tp.rot;
        p.flip = tp.flip;
        updatePieceTransform(p.id);
    });
    checkWinCondition();
}

// Timer Logic
function startTimer() {
    clearInterval(State.timerInterval);
    State.timer = 0;
    updateTimerDisplay();
    State.timerInterval = setInterval(() => {
        State.timer++;
        updateTimerDisplay();
    }, 1000);
}

function updateTimerDisplay() {
    const mins = Math.floor(State.timer / 60);
    const secs = State.timer % 60;
    document.getElementById('timerDisplay').textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Setup buttons
document.getElementById('freePlayBtn').addEventListener('click', activateFreePlay);
document.getElementById('exportBtn').addEventListener('click', exportCustomPuzzle);
document.getElementById('resetBtn').addEventListener('click', () => {
    if (State.mode === 'freeplay') {
        scatterPieces();
    } else if (State.currentPuzzle) {
        loadPuzzle(State.currentPuzzle.id);
    }
});
document.getElementById('hintBtn').addEventListener('click', showHint);
document.getElementById('solveBtn').addEventListener('click', solvePuzzle);
document.getElementById('nextPuzzleBtn').addEventListener('click', () => {
    const idx = State.puzzles.findIndex(p => p.id === State.currentPuzzle.id);
    const next = State.puzzles[(idx + 1) % State.puzzles.length];
    loadPuzzle(next.id);
});

// Modify init to call setupInteractions and load puzzles
const originalInit = init;
init = function() {
    originalInit();
    setupInteractions();
    loadPuzzles();
};

// Run init
window.addEventListener('DOMContentLoaded', init);
