// games/koenigsberg/koenigsberg.js

/**
 * مسئله پل‌های کونیگسبرگ و مسیرهای اویلری
 * Königsberg Bridges & Eulerian Paths
 */

// ==========================================
// 1. Data Structures & Initial Levels
// ==========================================

const LEVELS = [
  // مرحله تاریخی (غیرممکن)
  // Historically: Central island is D. Landmasses are A, B, C.
  // Connections:
  // D to A: 2 bridges
  // D to B: 2 bridges
  // D to C: 1 bridge
  // A to B: 1 bridge
  // A to C: 1 bridge
  // Wait, the historical map is: North(A), South(B), East(C), Island(D)
  // A is connected to D by 2 bridges. A to C by 1.
  // B is connected to D by 2 bridges. B to C by 1.
  // C is connected to D by 1 bridge.
  // This yields: A=3, B=3, C=3, D=5. Perfect!
  {
    id: 1,
    name: 'کونیگسبرگ',
    nodes: [
      { id: 'A', x: 0.5, y: 0.2, label: 'A' }, // North
      { id: 'B', x: 0.5, y: 0.8, label: 'B' }, // South
      { id: 'C', x: 0.8, y: 0.5, label: 'C' }, // East
      { id: 'D', x: 0.3, y: 0.5, label: 'D' }  // Island
    ],
    edges: [
      { id: 'e1', n1: 'D', n2: 'A', curved: 0.2 },
      { id: 'e2', n1: 'D', n2: 'A', curved: -0.2 },
      { id: 'e3', n1: 'D', n2: 'B', curved: 0.2 },
      { id: 'e4', n1: 'D', n2: 'B', curved: -0.2 },
      { id: 'e5', n1: 'D', n2: 'C', curved: 0 },
      { id: 'e6', n1: 'A', n2: 'C', curved: 0 },
      { id: 'e7', n1: 'B', n2: 'C', curved: 0 }
    ],
    solvable: false
  },
  // پازل‌های رسم یک‌خطی (صرفا چند نمونه)
  {
    id: 2,
    name: 'پاکت نامه',
    nodes: [
      { id: '1', x: 0.3, y: 0.3 },
      { id: '2', x: 0.7, y: 0.3 },
      { id: '3', x: 0.7, y: 0.7 },
      { id: '4', x: 0.3, y: 0.7 },
      { id: '5', x: 0.5, y: 0.15 }
    ],
    edges: [
      { id: 'e1', n1: '1', n2: '2' },
      { id: 'e2', n1: '2', n2: '3' },
      { id: 'e3', n1: '3', n2: '4' },
      { id: 'e4', n1: '4', n2: '1' },
      { id: 'e5', n1: '1', n2: '3' },
      { id: 'e6', n1: '2', n2: '4' },
      { id: 'e7', n1: '1', n2: '5' },
      { id: 'e8', n1: '2', n2: '5' }
    ],
    solvable: true
  },
  {
    id: 3,
    name: 'ستاره',
    nodes: [
      { id: '1', x: 0.5, y: 0.1 },
      { id: '2', x: 0.8, y: 0.9 },
      { id: '3', x: 0.1, y: 0.4 },
      { id: '4', x: 0.9, y: 0.4 },
      { id: '5', x: 0.2, y: 0.9 }
    ],
    edges: [
      { id: 'e1', n1: '1', n2: '2' },
      { id: 'e2', n1: '2', n2: '3' },
      { id: 'e3', n1: '3', n2: '4' },
      { id: 'e4', n1: '4', n2: '5' },
      { id: 'e5', n1: '5', n2: '1' },
      { id: 'e6', n1: '1', n2: '3' },
      { id: 'e7', n1: '3', n2: '5' },
      { id: 'e8', n1: '5', n2: '2' },
      { id: 'e9', n1: '2', n2: '4' },
      { id: 'e10', n1: '4', n2: '1' }
    ],
    solvable: true
  },
  {
    id: 4, name: 'خانه با X', solvable: true,
    nodes: [ {id:'1', x:0.5, y:0.1}, {id:'2', x:0.2, y:0.4}, {id:'3', x:0.8, y:0.4}, {id:'4', x:0.2, y:0.9}, {id:'5', x:0.8, y:0.9} ],
    edges: [
      {id:'e1', n1:'1', n2:'2'}, {id:'e2', n1:'1', n2:'3'}, {id:'e3', n1:'2', n2:'3'},
      {id:'e4', n1:'2', n2:'4'}, {id:'e5', n1:'3', n2:'5'}, {id:'e6', n1:'4', n2:'5'},
      {id:'e7', n1:'2', n2:'5'}, {id:'e8', n1:'3', n2:'4'}
    ]
  },
  {
    id: 5, name: 'الماس', solvable: true,
    nodes: [ {id:'1', x:0.5, y:0.1}, {id:'2', x:0.2, y:0.5}, {id:'3', x:0.8, y:0.5}, {id:'4', x:0.5, y:0.9} ],
    edges: [
      {id:'e1', n1:'1', n2:'2'}, {id:'e2', n1:'1', n2:'3'}, {id:'e3', n1:'2', n2:'4'},
      {id:'e4', n1:'3', n2:'4'}, {id:'e5', n1:'2', n2:'3'}
    ]
  },
  {
    id: 6, name: 'ساعت شنی', solvable: true,
    nodes: [ {id:'1', x:0.2, y:0.2}, {id:'2', x:0.8, y:0.2}, {id:'3', x:0.5, y:0.5}, {id:'4', x:0.2, y:0.8}, {id:'5', x:0.8, y:0.8} ],
    edges: [
      {id:'e1', n1:'1', n2:'2'}, {id:'e2', n1:'1', n2:'3'}, {id:'e3', n1:'2', n2:'3'},
      {id:'e4', n1:'3', n2:'4'}, {id:'e5', n1:'3', n2:'5'}, {id:'e6', n1:'4', n2:'5'}
    ]
  },
  {
    id: 7, name: 'شش ضلعی قطری', solvable: true,
    nodes: [ {id:'1', x:0.5, y:0.1}, {id:'2', x:0.85, y:0.3}, {id:'3', x:0.85, y:0.7}, {id:'4', x:0.5, y:0.9}, {id:'5', x:0.15, y:0.7}, {id:'6', x:0.15, y:0.3} ],
    edges: [
      {id:'e1', n1:'1', n2:'2'}, {id:'e2', n1:'2', n2:'3'}, {id:'e3', n1:'3', n2:'4'},
      {id:'e4', n1:'4', n2:'5'}, {id:'e5', n1:'5', n2:'6'}, {id:'e6', n1:'6', n2:'1'},
      {id:'e7', n1:'1', n2:'4'}, {id:'e8', n1:'2', n2:'5'}, {id:'e9', n1:'3', n2:'6'}
    ]
  },
  {
    id: 8, name: 'پاپیون پیچیده', solvable: true,
    nodes: [ {id:'1', x:0.1, y:0.1}, {id:'2', x:0.4, y:0.1}, {id:'3', x:0.1, y:0.9}, {id:'4', x:0.4, y:0.9}, {id:'5', x:0.6, y:0.1}, {id:'6', x:0.9, y:0.1}, {id:'7', x:0.6, y:0.9}, {id:'8', x:0.9, y:0.9} ],
    edges: [
      {id:'e1', n1:'1', n2:'2'}, {id:'e2', n1:'1', n2:'3'}, {id:'e3', n1:'2', n2:'4'}, {id:'e4', n1:'3', n2:'4'},
      {id:'e5', n1:'5', n2:'6'}, {id:'e6', n1:'5', n2:'7'}, {id:'e7', n1:'6', n2:'8'}, {id:'e8', n1:'7', n2:'8'},
      {id:'e9', n1:'2', n2:'5'}, {id:'e10', n1:'4', n2:'7'}, {id:'e11', n1:'2', n2:'7'}, {id:'e12', n1:'4', n2:'5'}
    ]
  },
  {
    id: 9, name: 'چندوجهی باز', solvable: true,
    nodes: [ {id:'1', x:0.3, y:0.2}, {id:'2', x:0.7, y:0.2}, {id:'3', x:0.2, y:0.5}, {id:'4', x:0.8, y:0.5}, {id:'5', x:0.3, y:0.8}, {id:'6', x:0.7, y:0.8}, {id:'7', x:0.5, y:0.5} ],
    edges: [
      {id:'e1', n1:'1', n2:'2'}, {id:'e2', n1:'1', n2:'3'}, {id:'e3', n1:'2', n2:'4'},
      {id:'e4', n1:'3', n2:'5'}, {id:'e5', n1:'4', n2:'6'}, {id:'e6', n1:'5', n2:'6'},
      {id:'e7', n1:'1', n2:'7'}, {id:'e8', n1:'2', n2:'7'}, {id:'e9', n1:'5', n2:'7'}, {id:'e10', n1:'6', n2:'7'}
    ]
  },
  {
    id: 10, name: 'چندگانه پاکت', solvable: true,
    nodes: [ {id:'1', x:0.3, y:0.3}, {id:'2', x:0.7, y:0.3}, {id:'3', x:0.7, y:0.7}, {id:'4', x:0.3, y:0.7}, {id:'5', x:0.5, y:0.15} ],
    edges: [
      {id:'e1', n1:'1', n2:'2'}, {id:'e2', n1:'2', n2:'3'}, {id:'e3', n1:'3', n2:'4'}, {id:'e4', n1:'4', n2:'1'},
      {id:'e5', n1:'1', n2:'3'}, {id:'e6', n1:'2', n2:'4'}, {id:'e7', n1:'1', n2:'5'}, {id:'e8', n1:'2', n2:'5'},
      {id:'e9', n1:'1', n2:'4', curved: 0.2}, {id:'e10', n1:'2', n2:'3', curved: -0.2}
    ]
  },
  {
    id: 11, name: 'قایق', solvable: true,
    nodes: [ {id:'1', x:0.2, y:0.6}, {id:'2', x:0.8, y:0.6}, {id:'3', x:0.3, y:0.8}, {id:'4', x:0.7, y:0.8}, {id:'5', x:0.5, y:0.2} ],
    edges: [
      {id:'e1', n1:'1', n2:'2'}, {id:'e2', n1:'1', n2:'3'}, {id:'e3', n1:'3', n2:'4'}, {id:'e4', n1:'4', n2:'2'},
      {id:'e5', n1:'1', n2:'5'}, {id:'e6', n1:'2', n2:'5'}, {id:'e7', n1:'5', n2:'3', curved:0.1}
    ]
  }
];

// ==========================================
// 2. Global State
// ==========================================

const GAME = {
  mode: 1, // 1: Historical, 2: Puzzles, 3: Sandbox
  currentLevelIndex: 0,
  graph: {
    nodes: [],
    edges: []
  },
  traversedEdges: new Set(),
  currentPath: [], // Array of node IDs
  traversalHistory: [], // Array of traversed edge IDs for Undo

  // Interaction state
  isDrawing: false,
  startNode: null,
  mouseX: 0,
  mouseY: 0,

  // Sandbox state
  nextNodeId: 1
};

// Timer State
let GAME_startTime = 0;
let GAME_timerInterval = null;

// Elements
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const ui = {
  timerDisplay: document.getElementById('timerDisplay'),
  edgesCount: document.getElementById('edgesCount'),
  totalEdges: document.getElementById('totalEdges'),
  btnReset: document.getElementById('btnReset'),
  btnUndo: document.getElementById('btnUndo'),
  btnHint: document.getElementById('btnHint'),
  btnAutoSolve: document.getElementById('btnAutoSolve'),
  modeBtns: document.querySelectorAll('.mode-btn'),
  levelPanel: document.getElementById('levelPanel'),
  levelGrid: document.getElementById('levelGrid'),
  sandboxPanel: document.getElementById('sandboxPanel'),
  historicalToolsPanel: document.getElementById('historicalToolsPanel'),
  btnAddRemoveBridge: document.getElementById('btnAddRemoveBridge'),
  btnClearSandbox: document.getElementById('btnClearSandbox'),
  sandboxStatus: document.getElementById('sandboxStatus'),
  btnShowInfo: document.getElementById('btnShowInfo'),
  infoModal: document.getElementById('infoModal'),
  victoryModal: document.getElementById('victoryModal'),
  closeModals: document.querySelectorAll('.close-modal'),
  btnNextLevel: document.getElementById('btnNextLevel'),
  canvasWrapper: document.querySelector('.canvas-wrapper')
};

// ==========================================
// 3. Initialization
// ==========================================

function init() {
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  setupUIEvents();
  loadLevel(GAME.currentLevelIndex);

  // Background animation (Number field)
  createNumberField();
}

function resizeCanvas() {
  const rect = canvas.parentElement.getBoundingClientRect();
  canvas.width = rect.width;
  canvas.height = rect.height;
  render();
}

function startTimer() {
  stopTimer();
  GAME_startTime = Date.now();
  GAME_timerInterval = setInterval(() => {
    const elapsed = Math.floor((Date.now() - GAME_startTime) / 1000);
    const m = String(Math.floor(elapsed / 60)).padStart(2, '0');
    const s = String(elapsed % 60).padStart(2, '0');
    // Convert to Persian numbers
    const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
    const mFa = m.replace(/\d/g, d => persianDigits[d]);
    const sFa = s.replace(/\d/g, d => persianDigits[d]);
    ui.timerDisplay.textContent = `${mFa}:${sFa}`;
  }, 1000);
}

function stopTimer() {
  if (GAME_timerInterval) {
    clearInterval(GAME_timerInterval);
    GAME_timerInterval = null;
  }
}

function loadLevel(index) {
  GAME.traversedEdges.clear();
  GAME.currentPath = [];
  GAME.traversalHistory = [];
  startTimer();

  if (GAME.mode === 1) {
    // Mode 1: Always load Königsberg
    GAME.graph = JSON.parse(JSON.stringify(LEVELS[0]));
  } else if (GAME.mode === 2) {
    // Mode 2: Puzzles
    GAME.graph = JSON.parse(JSON.stringify(LEVELS[index]));
  } else if (GAME.mode === 3) {
    // Mode 3: Sandbox
    GAME.graph = { nodes: [], edges: [] };
    GAME.nextNodeId = 1;
  }

  updateUI();
  render();
}

function setupUIEvents() {
  // Mode selection
  ui.modeBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      ui.modeBtns.forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      GAME.mode = parseInt(e.target.dataset.mode);

      // Update panels
      ui.levelPanel.style.display = GAME.mode === 2 ? 'block' : 'none';
      ui.sandboxPanel.style.display = GAME.mode === 3 ? 'block' : 'none';
      ui.historicalToolsPanel.style.display = GAME.mode === 1 ? 'block' : 'none';
      ui.btnAutoSolve.style.display = GAME.mode !== 3 ? 'inline-block' : 'none';

      if (GAME.mode === 2) {
        buildLevelGrid();
        GAME.currentLevelIndex = 1; // start from first puzzle
      } else {
        GAME.currentLevelIndex = 0;
      }
      loadLevel(GAME.currentLevelIndex);
    });
  });

  // Reset
  ui.btnReset.addEventListener('click', () => {
    GAME.traversedEdges.clear();
    GAME.currentPath = [];
    GAME.traversalHistory = [];
    startTimer();
    updateUI();
    render();
  });

  // Undo
  ui.btnUndo.addEventListener('click', () => {
    if (GAME.traversalHistory.length > 0) {
      const lastEdgeId = GAME.traversalHistory.pop();
      GAME.traversedEdges.delete(lastEdgeId);
      GAME.currentPath.pop();
      if (GAME.currentPath.length === 0) {
        GAME.startNode = null;
      }
      updateUI();
      render();
    }
  });

  // Canvas events
  canvas.addEventListener('mousedown', handlePointerDown);
  canvas.addEventListener('mousemove', handlePointerMove);
  window.addEventListener('mouseup', handlePointerUp);

  canvas.addEventListener('touchstart', handlePointerDown, {passive: false});
  canvas.addEventListener('touchmove', handlePointerMove, {passive: false});
  window.addEventListener('touchend', handlePointerUp);
}

function buildLevelGrid() {
  ui.levelGrid.innerHTML = '';
  // Skip the first level (Königsberg)
  for (let i = 1; i < LEVELS.length; i++) {
    const btn = document.createElement('button');
    btn.className = `level-btn ${GAME.currentLevelIndex === i ? 'active' : ''}`;
    btn.textContent = i;
    btn.addEventListener('click', () => {
      GAME.currentLevelIndex = i;
      document.querySelectorAll('.level-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      loadLevel(i);
    });
    ui.levelGrid.appendChild(btn);
  }
}

function updateUI() {
  ui.edgesCount.textContent = GAME.traversedEdges.size;
  ui.totalEdges.textContent = GAME.graph.edges.length;
}

function getNodePos(node) {
  const padding = 60;
  const w = canvas.width - padding * 2;
  const h = canvas.height - padding * 2;
  return {
    x: padding + node.x * w,
    y: padding + node.y * h
  };
}

function getNodeById(id) {
  return GAME.graph.nodes.find(n => n.id === id);
}

function getEdgePath(edge) {
  const n1 = getNodeById(edge.n1);
  const n2 = getNodeById(edge.n2);
  const p1 = getNodePos(n1);
  const p2 = getNodePos(n2);

  if (edge.curved) {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const dist = Math.sqrt(dx*dx + dy*dy);
    const midX = (p1.x + p2.x) / 2;
    const midY = (p1.y + p2.y) / 2;

    // Normal vector
    const nx = -dy / dist;
    const ny = dx / dist;

    const cpX = midX + nx * edge.curved * dist;
    const cpY = midY + ny * edge.curved * dist;
    return { p1, p2, cpX, cpY, isCurve: true };
  }
  return { p1, p2, isCurve: false };
}

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw edges
  GAME.graph.edges.forEach(edge => {
    const path = getEdgePath(edge);
    const isTraversed = GAME.traversedEdges.has(edge.id);

    ctx.beginPath();
    ctx.moveTo(path.p1.x, path.p1.y);

    if (path.isCurve) {
      ctx.quadraticCurveTo(path.cpX, path.cpY, path.p2.x, path.p2.y);
    } else {
      ctx.lineTo(path.p2.x, path.p2.y);
    }

    ctx.lineWidth = 6;
    ctx.lineCap = 'round';

    if (isTraversed) {
      ctx.strokeStyle = '#00BFA6'; // teal
      ctx.shadowColor = '#00BFA6';
      ctx.shadowBlur = 10;
    } else {
      ctx.strokeStyle = '#E3E7F5'; // line
      ctx.shadowBlur = 0;
    }

    ctx.stroke();
    ctx.shadowBlur = 0; // reset
  });

  // Draw current dragging line
  if (GAME.isDrawing && GAME.startNode) {
    const startPos = getNodePos(GAME.startNode);
    ctx.beginPath();
    ctx.moveTo(startPos.x, startPos.y);
    ctx.lineTo(GAME.mouseX, GAME.mouseY);
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#7C4DFF'; // violet
    ctx.setLineDash([10, 10]);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Draw nodes
  GAME.graph.nodes.forEach(node => {
    const pos = getNodePos(node);

    // Node background
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 20, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    ctx.lineWidth = 4;

    // Highlight if active
    if (GAME.currentPath.length > 0 && GAME.currentPath[GAME.currentPath.length - 1] === node.id) {
      ctx.strokeStyle = '#FF6B35'; // orange
    } else {
      ctx.strokeStyle = '#1E2148'; // ink
    }

    ctx.stroke();

    // Node label
    ctx.fillStyle = '#1E2148';
    ctx.font = 'bold 16px Vazirmatn, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(node.label || node.id, pos.x, pos.y);

    // Node Degree Indicator
    let degree = 0;
    GAME.graph.edges.forEach(e => {
      if (e.n1 === node.id || e.n2 === node.id) degree++;
    });

    // Draw badge
    const badgeR = 12;
    const badgeX = pos.x + 16;
    const badgeY = pos.y - 16;

    ctx.beginPath();
    ctx.arc(badgeX, badgeY, badgeR, 0, Math.PI * 2);
    ctx.fillStyle = (degree % 2 === 0) ? '#00BFA6' : '#FF6B35'; // Teal for even, Orange for odd
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Degree text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 12px Vazirmatn, sans-serif';
    ctx.fillText(degree.toString().replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]), badgeX, badgeY);
  });
}

// ==========================================
// 4. Interaction (Mouse / Touch)
// ==========================================

function getHoveredNode(x, y) {
  for (const node of GAME.graph.nodes) {
    const pos = getNodePos(node);
    const dx = pos.x - x;
    const dy = pos.y - y;
    if (dx*dx + dy*dy < 25*25) { // 25px radius hit area
      return node;
    }
  }
  return null;
}

function handlePointerDown(e) {
  const rect = canvas.getBoundingClientRect();
  const x = (e.clientX || e.touches[0].clientX) - rect.left;
  const y = (e.clientY || e.touches[0].clientY) - rect.top;

  const node = getHoveredNode(x, y);

  if (GAME.mode === 3) {
    // Sandbox mode
    if (node) {
      GAME.isDrawing = true;
      GAME.startNode = node;
      GAME.mouseX = x;
      GAME.mouseY = y;
    } else {
      // Create new node
      const padding = 60;
      const w = canvas.width - padding * 2;
      const h = canvas.height - padding * 2;
      const normX = (x - padding) / w;
      const normY = (y - padding) / h;

      if (normX >= 0 && normX <= 1 && normY >= 0 && normY <= 1) {
        GAME.graph.nodes.push({
          id: GAME.nextNodeId.toString(),
          x: normX,
          y: normY
        });
        GAME.nextNodeId++;
        updateSandboxStatus();
      }
    }
  } else {
    // Play modes
    if (node) {
      // If path is empty, can start anywhere. Else, must continue from last node.
      if (GAME.currentPath.length === 0 || GAME.currentPath[GAME.currentPath.length - 1] === node.id) {
        GAME.isDrawing = true;
        GAME.startNode = node;
        GAME.mouseX = x;
        GAME.mouseY = y;
      } else {
        shakeCanvas();
      }
    }
  }
  render();
}

function handlePointerMove(e) {
  if (!GAME.isDrawing) return;
  e.preventDefault(); // prevent scrolling on touch

  const rect = canvas.getBoundingClientRect();
  GAME.mouseX = (e.clientX || e.touches[0].clientX) - rect.left;
  GAME.mouseY = (e.clientY || e.touches[0].clientY) - rect.top;

  // Check if reached another node
  const hoverNode = getHoveredNode(GAME.mouseX, GAME.mouseY);
  if (hoverNode && hoverNode.id !== GAME.startNode.id) {
    tryConnect(GAME.startNode, hoverNode);
  }

  render();
}

function handlePointerUp() {
  GAME.isDrawing = false;
  GAME.startNode = null;
  render();
}

function tryConnect(n1, n2) {
  if (GAME.mode === 3) {
    // Sandbox: Create edge
    // Check for existing edges between these nodes to calculate curve
    let existingCount = 0;
    GAME.graph.edges.forEach(e => {
      if ((e.n1 === n1.id && e.n2 === n2.id) || (e.n1 === n2.id && e.n2 === n1.id)) {
        existingCount++;
      }
    });

    let curveVal = 0;
    if (existingCount > 0) {
      // Alternate curves: 0.1, -0.1, 0.2, -0.2...
      const magnitude = Math.ceil(existingCount / 2) * 0.15;
      const sign = (existingCount % 2 === 0) ? -1 : 1;
      curveVal = magnitude * sign;
    }

    GAME.graph.edges.push({
      id: `e${Date.now()}`,
      n1: n1.id,
      n2: n2.id,
      curved: curveVal
    });
    GAME.isDrawing = false;
    updateSandboxStatus();
    render();
    return;
  }

  // Play modes: Traverse edge
  // Find untraversed edge between n1 and n2
  const edge = GAME.graph.edges.find(e =>
    !GAME.traversedEdges.has(e.id) &&
    ((e.n1 === n1.id && e.n2 === n2.id) || (e.n1 === n2.id && e.n2 === n1.id))
  );

  if (edge) {
    GAME.traversedEdges.add(edge.id);
    GAME.traversalHistory.push(edge.id);
    if (GAME.currentPath.length === 0) GAME.currentPath.push(n1.id);
    GAME.currentPath.push(n2.id);

    // Update start node for continuous drawing
    GAME.startNode = n2;

    updateUI();
    checkWinCondition();
  } else {
    // Edge doesn't exist or already traversed
    GAME.isDrawing = false;
    shakeCanvas();
  }
}

function shakeCanvas() {
  ui.canvasWrapper.classList.remove('shake');
  void ui.canvasWrapper.offsetWidth; // trigger reflow
  ui.canvasWrapper.classList.add('shake');
}

function checkWinCondition() {
  if (GAME.mode !== 3 && GAME.graph.edges.length > 0 && GAME.traversedEdges.size === GAME.graph.edges.length) {
    stopTimer();
    setTimeout(() => {
      ui.victoryModal.style.display = 'flex';
    }, 500);
  }
}

// ==========================================
// 5. Algorithms & UI Logic
// ==========================================

function getDegrees() {
  const degrees = {};
  GAME.graph.nodes.forEach(n => degrees[n.id] = 0);
  GAME.graph.edges.forEach(e => {
    if (degrees[e.n1] !== undefined) degrees[e.n1]++;
    if (degrees[e.n2] !== undefined) degrees[e.n2]++;
  });
  return degrees;
}

function updateSandboxStatus() {
  if (GAME.mode !== 3) return;
  const degrees = getDegrees();
  let oddCount = 0;
  for (const id in degrees) {
    if (degrees[id] % 2 !== 0) oddCount++;
  }

  if (GAME.graph.edges.length === 0) {
    ui.sandboxStatus.textContent = 'رسم را شروع کنید';
    ui.sandboxStatus.className = 'status-indicator mt-4';
  } else if (oddCount === 0) {
    ui.sandboxStatus.textContent = 'دارای مدار اویلری (رسم یک‌خطی بسته)';
    ui.sandboxStatus.className = 'status-indicator mt-4 success';
  } else if (oddCount === 2) {
    ui.sandboxStatus.textContent = 'دارای مسیر اویلری (رسم یک‌خطی باز)';
    ui.sandboxStatus.className = 'status-indicator mt-4 success';
  } else {
    ui.sandboxStatus.textContent = `غیرقابل رسم (${oddCount} راس با درجه فرد)`;
    ui.sandboxStatus.className = 'status-indicator mt-4 error';
  }
}

function autoSolve() {
  if (GAME.mode === 3 || GAME.graph.edges.length === 0) return;

  const degrees = getDegrees();
  let oddNodes = [];
  for (const id in degrees) {
    if (degrees[id] % 2 !== 0) oddNodes.push(id);
  }

  if (oddNodes.length > 2) {
    alert('این گراف مسیر اویلری ندارد و قابل حل نیست!');
    return;
  }

  // Hierholzer's Algorithm implementation
  // Find start node
  let startNodeId = GAME.graph.nodes[0].id; // default
  if (oddNodes.length === 2) {
    startNodeId = oddNodes[0]; // Must start at odd node if path
  }

  // Build adjacency list (cloning edges)
  let adj = {};
  GAME.graph.nodes.forEach(n => adj[n.id] = []);
  GAME.graph.edges.forEach(e => {
    adj[e.n1].push({ to: e.n2, id: e.id });
    adj[e.n2].push({ to: e.n1, id: e.id });
  });

  let stack = [startNodeId];
  let circuit = [];
  let usedEdges = new Set();

  while (stack.length > 0) {
    let curr = stack[stack.length - 1];

    // Find unused edge from curr
    let nextEdge = null;
    let nextNode = null;
    let edgeIndex = -1;

    for (let i = 0; i < adj[curr].length; i++) {
      let e = adj[curr][i];
      if (!usedEdges.has(e.id)) {
        nextEdge = e.id;
        nextNode = e.to;
        edgeIndex = i;
        break;
      }
    }

    if (nextEdge) {
      usedEdges.add(nextEdge);
      stack.push(nextNode);
    } else {
      circuit.push(stack.pop());
    }
  }

  circuit.reverse();

  // Visualizer playback
  GAME.traversedEdges.clear();
  GAME.currentPath = [];
  updateUI();
  render();

  let i = 0;
  function animateStep() {
    if (i < circuit.length - 1) {
      let n1Id = circuit[i];
      let n2Id = circuit[i+1];

      // Find edge
      let edge = GAME.graph.edges.find(e =>
        !GAME.traversedEdges.has(e.id) &&
        ((e.n1 === n1Id && e.n2 === n2Id) || (e.n1 === n2Id && e.n2 === n1Id))
      );

      if (edge) {
        GAME.traversedEdges.add(edge.id);
        if (GAME.currentPath.length === 0) GAME.currentPath.push(n1Id);
        GAME.currentPath.push(n2Id);
        updateUI();
        render();
      }
      i++;
      setTimeout(animateStep, 400);
    }
  }

  animateStep();
}

// Add event listeners for UI buttons
ui.btnShowInfo.addEventListener('click', () => {
  ui.infoModal.style.display = 'flex';
});

ui.closeModals.forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.target.closest('.modal-overlay').style.display = 'none';
  });
});

ui.btnNextLevel.addEventListener('click', () => {
  ui.victoryModal.style.display = 'none';
  if (GAME.mode === 2 && GAME.currentLevelIndex < LEVELS.length - 1) {
    GAME.currentLevelIndex++;
    document.querySelectorAll('.level-btn').forEach((b, i) => {
      b.classList.remove('active');
      if (i === GAME.currentLevelIndex - 1) b.classList.add('active'); // i is index for grid which skips lvl 0
    });
    loadLevel(GAME.currentLevelIndex);
  }
});

ui.btnAutoSolve.addEventListener('click', autoSolve);

ui.btnClearSandbox.addEventListener('click', () => {
  GAME.graph.nodes = [];
  GAME.graph.edges = [];
  GAME.nextNodeId = 1;
  GAME.traversedEdges.clear();
  GAME.traversalHistory = [];
  GAME.currentPath = [];
  updateSandboxStatus();
  render();
});

ui.btnAddRemoveBridge.addEventListener('click', () => {
  if (GAME.mode !== 1) return;
  const bridgeId = 'e8_magic';
  const existingIndex = GAME.graph.edges.findIndex(e => e.id === bridgeId);

  if (existingIndex > -1) {
    // Remove it
    GAME.graph.edges.splice(existingIndex, 1);
  } else {
    // Add it (connecting A and B changes their parity from 3 to 4. D remains 5, C remains 3. Now only C and D are odd -> solvable path!)
    GAME.graph.edges.push({ id: bridgeId, n1: 'A', n2: 'B', curved: 0.1 });
  }

  GAME.traversedEdges.clear();
  GAME.traversalHistory = [];
  GAME.currentPath = [];
  updateUI();
  render();
});

ui.btnHint.addEventListener('click', () => {
  if (GAME.mode === 3 || GAME.graph.edges.length === 0) return;
  const degrees = getDegrees();
  let oddNodes = [];
  for (const id in degrees) {
    if (degrees[id] % 2 !== 0) oddNodes.push(id);
  }

  if (oddNodes.length > 2) {
    alert('این گراف قابل رسم نیست! (بیش از دو راس درجه فرد دارد)');
  } else if (oddNodes.length === 2) {
    alert(`برای حل، باید از گره ${oddNodes[0]} یا ${oddNodes[1]} شروع کنید.`);
  } else {
    alert('تمام رئوس درجه زوج دارند. از هر نقطه‌ای می‌توانید شروع کنید!');
  }
});

// Background effect
function createNumberField() {
  const field = document.getElementById('numberField');
  const symbols = ['∞', 'π', '∑', '∫', '∆', 'e', 'θ', 'x', 'y'];

  for(let i=0; i<15; i++) {
    const span = document.createElement('span');
    span.textContent = symbols[Math.floor(Math.random() * symbols.length)];
    span.style.left = `${Math.random() * 100}%`;
    span.style.top = `${Math.random() * 100}%`;
    span.style.fontSize = `${Math.random() * 40 + 20}px`;
    span.style.animationDuration = `${Math.random() * 20 + 10}s`;
    span.style.animationDelay = `-${Math.random() * 10}s`;
    field.appendChild(span);
  }
}

// Global Animation for number field
const style = document.createElement('style');
style.textContent = `
@keyframes floatUp {
  0% { transform: translateY(100vh) rotate(0deg); opacity: 0; }
  10% { opacity: 0.1; }
  90% { opacity: 0.1; }
  100% { transform: translateY(-10vh) rotate(360deg); opacity: 0; }
}
`;
document.head.appendChild(style);

window.onload = init;
