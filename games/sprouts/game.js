/* games/sprouts/game.js */

// -- State --
let canvas, ctx;
let cw, ch;
let isDrawing = false;
let currentStroke = []; // Array of {x, y} points
let startSpot = null;

let spots = []; // Array of {x, y, id, degree}
let curves = []; // Array of { points: [{x,y}...], spot1, spot2, newSpot }
let initialSpotsCount = 3;
let currentTurn = 1; // 1 or 2
let movesHistory = []; // To support Undo

const SPOT_RADIUS = 10;
const LINE_WIDTH = 4;
const PLAYER_COLORS = {
  1: getComputedStyle(document.documentElement).getPropertyValue('--blue').trim(),
  2: getComputedStyle(document.documentElement).getPropertyValue('--orange').trim(),
  invalid: '#ff4785' // --pink
};

// -- Initialization --
function init() {
  canvas = document.getElementById('game-canvas');
  ctx = canvas.getContext('2d');

  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  bindEvents();
  startNewGame();
}

function resizeCanvas() {
  const container = canvas.parentElement;
  cw = container.clientWidth;
  ch = container.clientHeight;
  canvas.width = cw;
  canvas.height = ch;
  draw();
}

function startNewGame() {
  initialSpotsCount = parseInt(document.getElementById('dot-count').value, 10);
  spots = [];
  curves = [];
  movesHistory = [];
  currentTurn = 1;
  isDrawing = false;
  currentStroke = [];
  startSpot = null;

  // Distribute spots evenly in a circle in the center
  const centerX = cw / 2;
  const centerY = ch / 2;
  const radius = Math.min(cw, ch) * 0.3;

  for (let i = 0; i < initialSpotsCount; i++) {
    const angle = (i / initialSpotsCount) * Math.PI * 2 - Math.PI / 2;
    spots.push({
      id: i + 1,
      x: centerX + Math.cos(angle) * radius,
      y: centerY + Math.sin(angle) * radius,
      degree: 0
    });
  }

  updateUI();
  draw();
}

// -- Topological Rules & Intersection Logic --
function segmentsIntersect(p1, p2, p3, p4) {
  function ccw(A, B, C) {
    return (C.y - A.y) * (B.x - A.x) > (B.y - A.y) * (C.x - A.x);
  }
  return (ccw(p1, p3, p4) !== ccw(p2, p3, p4)) && (ccw(p1, p2, p3) !== ccw(p1, p2, p4));
}

function pointLineDistance(p, v, w) {
  const l2 = (w.x - v.x) ** 2 + (w.y - v.y) ** 2;
  if (l2 === 0) return Math.hypot(p.x - v.x, p.y - v.y);
  let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p.x - (v.x + t * (w.x - v.x)), p.y - (v.y + t * (w.y - v.y)));
}

function simplifyPath(points, tolerance = 2) {
  if (points.length <= 2) return points;
  const result = [points[0]];
  let lastPoint = points[0];
  for (let i = 1; i < points.length - 1; i++) {
    if (Math.hypot(points[i].x - lastPoint.x, points[i].y - lastPoint.y) > tolerance) {
      result.push(points[i]);
      lastPoint = points[i];
    }
  }
  result.push(points[points.length - 1]);
  return result;
}

function checkIntersection(path, excludeStartSpot, excludeEndSpot) {
  // Check self-intersection
  for (let i = 0; i < path.length - 3; i++) {
    for (let j = i + 2; j < path.length - 1; j++) {
      if (segmentsIntersect(path[i], path[i+1], path[j], path[j+1])) return true;
    }
  }

  // Check intersection with existing curves
  for (const curve of curves) {
    const cPoints = curve.points;
    for (let i = 0; i < path.length - 1; i++) {
      for (let j = 0; j < cPoints.length - 1; j++) {
        // Allow starting/ending at the same point (handled by spot checking later)
        if (segmentsIntersect(path[i], path[i+1], cPoints[j], cPoints[j+1])) {
          return true;
        }
      }
    }
  }

  // Check collision with spots
  for (const spot of spots) {
    if (spot === excludeStartSpot || spot === excludeEndSpot) continue;
    for (let i = 0; i < path.length - 1; i++) {
      if (pointLineDistance(spot, path[i], path[i+1]) < SPOT_RADIUS + LINE_WIDTH / 2) {
        return true;
      }
    }
  }

  return false;
}

function isValidMove(startSpot, endSpot, path) {
  if (!startSpot || !endSpot) return false;
  if (startSpot === endSpot) {
    if (startSpot.degree > 1) return false; // Loop needs 2 free degrees
  } else {
    if (startSpot.degree > 2 || endSpot.degree > 2) return false;
  }

  if (path.length < 3) return false; // Too short

  // Ensure path doesn't immediately intersect itself at the ends (happens often with sloppy mouse loops)
  const simplified = simplifyPath(path, 5);
  if (checkIntersection(simplified, startSpot, endSpot)) return false;

  return true;
}

function getPathMidpoint(points) {
  // Find a point approximately in the middle of the path length
  let totalDist = 0;
  const dists = [0];
  for (let i = 1; i < points.length; i++) {
    const d = Math.hypot(points[i].x - points[i-1].x, points[i].y - points[i-1].y);
    totalDist += d;
    dists.push(totalDist);
  }
  const targetDist = totalDist / 2;
  for (let i = 1; i < dists.length; i++) {
    if (dists[i] >= targetDist) {
      const p1 = points[i-1];
      const p2 = points[i];
      const ratio = (targetDist - dists[i-1]) / (dists[i] - dists[i-1]);
      return {
        x: p1.x + (p2.x - p1.x) * ratio,
        y: p1.y + (p2.y - p1.y) * ratio
      };
    }
  }
  return points[Math.floor(points.length / 2)];
}

function executeMove(startSpot, endSpot, rawPath) {
  const path = simplifyPath(rawPath, 2);

  // Snap ends exactly to spots
  path[0] = {x: startSpot.x, y: startSpot.y};
  path[path.length - 1] = {x: endSpot.x, y: endSpot.y};

  const midPos = getPathMidpoint(path);
  const newSpot = {
    id: spots.length + 1,
    x: midPos.x,
    y: midPos.y,
    degree: 2 // Has two connections implicitly from being in the middle of a line
  };

  startSpot.degree++;
  endSpot.degree++;

  spots.push(newSpot);
  curves.push({
    points: path,
    startSpot,
    endSpot,
    newSpot,
    player: currentTurn
  });

  movesHistory.push({ startSpot, endSpot, newSpot });

  checkGameOver();
  if (!document.getElementById('gameover-modal').classList.contains('active')) {
    currentTurn = currentTurn === 1 ? 2 : 1;
    updateUI();
    updateMathStats(); // Update stats dynamically

    // Check if AI needs to play
    const mode = document.getElementById('game-mode').value;
    if (currentTurn === 2 && mode.startsWith('pve')) {
      setTimeout(() => playAI(mode), 800);
    }
  }
}

// -- AI --
function generateValidPathBetween(s1, s2) {
  // A simple heuristic path generator. In a real environment, we'd use pathfinding (like A*)
  // around obstacles (curves and spots). Here we create a simple arc or line and check if valid.

  const p1 = {x: s1.x, y: s1.y};
  const p2 = {x: s2.x, y: s2.y};

  // Try direct line first
  let path = [p1, {x: (p1.x+p2.x)/2, y: (p1.y+p2.y)/2}, p2];
  if (isValidMove(s1, s2, path)) return path;

  // Try bezier curve arcs
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const dist = Math.hypot(dx, dy);

  // Try different offsets for control points
  const offsets = [dist * 0.5, -dist * 0.5, dist, -dist];

  for (const offset of offsets) {
    const mx = (p1.x + p2.x) / 2 - (dy / dist) * offset;
    const my = (p1.y + p2.y) / 2 + (dx / dist) * offset;

    // Sample curve
    path = [];
    const steps = 20;
    for (let t = 0; t <= steps; t++) {
      const u = t / steps;
      const x = (1-u)**2 * p1.x + 2*(1-u)*u * mx + u**2 * p2.x;
      const y = (1-u)**2 * p1.y + 2*(1-u)*u * my + u**2 * p2.y;
      path.push({x, y});
    }

    if (isValidMove(s1, s2, path)) return path;
  }

  return null; // Failed to find a simple valid path
}

function playAI(mode) {
  const aliveSpots = spots.filter(s => s.degree < 3);
  if (aliveSpots.length === 0) {
    endGame();
    return;
  }

  // Shuffle spots to avoid deterministic behavior
  aliveSpots.sort(() => Math.random() - 0.5);

  let bestMove = null;

  // Easy: pick first valid path
  // Medium: Try to find a move that leaves spots with degree 1 or 2 (keep them alive).
  // Since our path generator is basic, we just try pairs until one works.

  for (let i = 0; i < aliveSpots.length; i++) {
    for (let j = i; j < aliveSpots.length; j++) {
      const s1 = aliveSpots[i];
      const s2 = aliveSpots[j];

      if (s1 === s2 && s1.degree > 1) continue; // Loop needs 2 free degrees
      if (s1 !== s2 && (s1.degree > 2 || s2.degree > 2)) continue;

      const path = generateValidPathBetween(s1, s2);
      if (path) {
        bestMove = { s1, s2, path };
        if (mode === 'pve-easy') {
           break; // Take the first found
        }
        // Medium could evaluate if it isolates nodes, but we'll just keep looking
        // and take the last found one which might be more "tangled" and thus trickier.
      }
    }
    if (bestMove && mode === 'pve-easy') break;
  }

  if (bestMove) {
    // Animate drawing
    let currentStep = 0;
    isDrawing = true;
    startSpot = bestMove.s1;
    currentStroke = [];

    const interval = setInterval(() => {
      if (currentStep < bestMove.path.length) {
        currentStroke.push(bestMove.path[currentStep]);
        draw();
        currentStep++;
      } else {
        clearInterval(interval);
        isDrawing = false;
        currentStroke = [];
        startSpot = null;
        executeMove(bestMove.s1, bestMove.s2, bestMove.path);
        draw();
      }
    }, 20); // ms per segment
  } else {
    // AI couldn't find a move, meaning game over (or AI gave up due to simple pathfinding)
    // We treat it as AI having no moves.
    endGame();
  }
}

function checkGameOver() {
  // A naive check: Are there any valid moves left?
  // Proper full graph theory check is complex.
  // Simple check: count available degrees. If total available degrees < 2, game is over.
  // Wait, degree 2 is enough for a loop or connecting 2 degree-1 nodes.
  let aliveSpots = spots.filter(s => s.degree < 3);
  let possible = false;

  if (aliveSpots.length > 0) {
    // If there is a spot with degree < 2, it can form a loop.
    if (aliveSpots.some(s => s.degree < 2)) possible = true;
    // If there are at least 2 spots, they can be connected.
    if (aliveSpots.length > 1) possible = true;
  }

  // NOTE: True reachability check (checking if drawing a line is topologically possible without intersections)
  // is computationally intensive. In typical Sprouts, we rely on the player declaring game over, or we use bounds.
  // For this web app, we'll assume game is over when no topological moves are obviously left or max moves reached.

  const n = initialSpotsCount;
  const maxMoves = 3 * n - 1;

  if (!possible || curves.length >= maxMoves) {
    endGame();
  }
}

function endGame() {
  const mode = document.getElementById('play-style').value;
  let winner;

  // Normal: last to move wins. So the current player who just made the move wins.
  // In our flow, currentTurn hasn't swapped yet when endGame is called from executeMove, wait, it gets called before swap.
  if (mode === 'normal') {
    winner = currentTurn;
  } else {
    // Misère: last to move loses.
    winner = currentTurn === 1 ? 2 : 1;
  }

  document.getElementById('status-banner').className = 'status-banner game-over';
  document.getElementById('status-banner').textContent = `پایان بازی! بازیکن ${winner} برنده شد`;

  document.getElementById('gameover-title').textContent = `بازیکن ${winner} برنده شد!`;
  document.getElementById('gameover-message').textContent = mode === 'normal' ? 'شما آخرین حرکت ممکن را انجام دادید.' : 'حریف شما آخرین حرکت را انجام داد (حالت معکوس).';
  document.getElementById('gameover-moves').textContent = curves.length;

  document.getElementById('gameover-modal').classList.add('active');
}

// -- Canvas Interaction --
function bindEvents() {
  canvas.addEventListener('pointerdown', handlePointerDown);
  canvas.addEventListener('pointermove', handlePointerMove);
  canvas.addEventListener('pointerup', handlePointerUp);
  canvas.addEventListener('pointercancel', handlePointerUp);

  // UI buttons
  document.getElementById('btn-new-game').addEventListener('click', startNewGame);
  document.getElementById('btn-play-again').addEventListener('click', () => {
    document.getElementById('gameover-modal').classList.remove('active');
    startNewGame();
  });

  document.getElementById('btn-undo').addEventListener('click', () => {
    if (movesHistory.length > 0) {
      const lastMove = movesHistory.pop();
      // Restore degrees
      lastMove.startSpot.degree--;
      lastMove.endSpot.degree--;

      // Remove new spot
      spots = spots.filter(s => s.id !== lastMove.newSpot.id);

      // Remove curve
      curves.pop();

      // Revert turn (if PvE, we might need to revert twice)
      const mode = document.getElementById('game-mode').value;
      if (mode.startsWith('pve') && currentTurn === 1) {
        if (movesHistory.length > 0) {
          const aiMove = movesHistory.pop();
          aiMove.startSpot.degree--;
          aiMove.endSpot.degree--;
          spots = spots.filter(s => s.id !== aiMove.newSpot.id);
          curves.pop();
          // Turn remains 1
        }
      } else {
        currentTurn = currentTurn === 1 ? 2 : 1;
      }

      updateUI();
      draw();
    }
  });

  document.getElementById('btn-cancel-stroke').addEventListener('click', () => {
    isDrawing = false;
    currentStroke = [];
    startSpot = null;
    draw();
  });

  // Modals
  document.getElementById('btn-math-analysis').addEventListener('click', () => {
    updateMathStats();
    document.getElementById('math-modal').classList.add('active');
  });
  document.getElementById('close-math-modal').addEventListener('click', () => {
    document.getElementById('math-modal').classList.remove('active');
  });

  document.getElementById('btn-help').addEventListener('click', () => {
    document.getElementById('help-modal').classList.add('active');
  });
  document.getElementById('close-help-modal').addEventListener('click', () => {
    document.getElementById('help-modal').classList.remove('active');
  });

  document.getElementById('close-gameover-modal').addEventListener('click', () => {
    document.getElementById('gameover-modal').classList.remove('active');
  });
}

function getPointerPos(e) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top
  };
}

function getHoveredSpot(pos) {
  for (const spot of spots) {
    const dx = pos.x - spot.x;
    const dy = pos.y - spot.y;
    if (dx * dx + dy * dy <= (SPOT_RADIUS * 2) * (SPOT_RADIUS * 2)) {
      return spot;
    }
  }
  return null;
}

function handlePointerDown(e) {
  if (e.button !== 0 && e.pointerType === 'mouse') return; // Left click only
  const pos = getPointerPos(e);
  const spot = getHoveredSpot(pos);

  if (spot && spot.degree < 3) {
    isDrawing = true;
    startSpot = spot;
    currentStroke = [{ x: spot.x, y: spot.y }];
    draw();
  }
}

function handlePointerMove(e) {
  if (!isDrawing) return;
  const pos = getPointerPos(e);
  currentStroke.push(pos);
  draw();
}

function handlePointerUp(e) {
  if (!isDrawing) return;
  isDrawing = false;
  const pos = getPointerPos(e);
  const endSpot = getHoveredSpot(pos);

  if (endSpot && endSpot.degree < 3) {
    currentStroke.push({x: endSpot.x, y: endSpot.y});
    if (isValidMove(startSpot, endSpot, currentStroke)) {
      executeMove(startSpot, endSpot, currentStroke);
    }
  }

  currentStroke = [];
  startSpot = null;
  draw();
}

// -- Drawing --
function draw() {
  ctx.clearRect(0, 0, cw, ch);

  // Draw completed curves (placeholder for now)
  for (const curve of curves) {
    drawCurve(curve.points, PLAYER_COLORS[curve.player], false);
  }

  // Draw current stroke
  if (currentStroke.length > 0) {
    // Determine color based on validation (to be implemented next step)
    let color = PLAYER_COLORS[currentTurn];
    drawCurve(currentStroke, color, true);
  }

  // Draw spots
  for (const spot of spots) {
    ctx.beginPath();
    ctx.arc(spot.x, spot.y, SPOT_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = spot.degree === 3 ? '#999' : '#1E2148';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#fff';
    ctx.stroke();

    // Draw degree indicators
    if (spot.degree < 3) {
      const remaining = 3 - spot.degree;
      ctx.fillStyle = '#fff';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(remaining.toString(), spot.x, spot.y);
    } else {
      // Draw a small "x" or lock for dead spots
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(spot.x - 3, spot.y - 3);
      ctx.lineTo(spot.x + 3, spot.y + 3);
      ctx.moveTo(spot.x + 3, spot.y - 3);
      ctx.lineTo(spot.x - 3, spot.y + 3);
      ctx.stroke();
    }
  }
}

function drawCurve(points, color, isDashed) {
  if (points.length < 2) return;
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.strokeStyle = color;
  ctx.lineWidth = LINE_WIDTH;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  if (isDashed) {
    ctx.setLineDash([10, 10]);
  } else {
    ctx.setLineDash([]);
  }
  ctx.stroke();
  ctx.setLineDash([]);
}

function updateUI() {
  const banner = document.getElementById('status-banner');
  banner.className = 'status-banner player' + currentTurn;
  banner.textContent = `نوبت بازیکن ${currentTurn} (${currentTurn === 1 ? 'آبی' : 'نارنجی'})`;
}

function updateMathStats() {
  const n = initialSpotsCount;
  const moves = curves.length;
  const alive = spots.filter(s => s.degree < 3).length;

  document.getElementById('stat-moves').textContent = moves;
  document.getElementById('stat-alive').textContent = alive;
  document.getElementById('math-n-val').textContent = `N=${n}`;

  const minMoves = 2 * n;
  const maxMoves = 3 * n - 1;
  document.getElementById('math-bounds').innerHTML = `${minMoves} &le; Moves &le; ${maxMoves}`;
}

document.addEventListener('DOMContentLoaded', init);
