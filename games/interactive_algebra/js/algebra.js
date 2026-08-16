// --- AST & Parser ---

export class Term {
    constructor(coefficient, variable, sign = 1, group = null) {
        this.coefficient = coefficient;
        this.variable = variable;
        this.sign = sign; // 1 for positive, -1 for negative
        this.group = group; // Expression (for parentheses)
        this.id = Math.random().toString(36).substr(2, 9);
    }

    clone() {
        return new Term(this.coefficient, this.variable, this.sign, this.group ? this.group.clone() : null);
    }

    toString() {
        let str = '';
        if (this.sign === -1) str += '-';
        if (this.coefficient !== 1 || (!this.variable && !this.group)) str += this.coefficient;
        if (this.group) {
            str += `(${this.group.toString()})`;
        } else if (this.variable) {
            str += this.variable;
        }
        return str;
    }
}

export class Expression {
    constructor(terms = []) {
        this.terms = terms; // Array of Term objects
    }

    clone() {
        return new Expression(this.terms.map(t => t.clone()));
    }

    toString() {
        if (this.terms.length === 0) return '0';
        return this.terms.map((t, i) => {
            let termStr = t.toString();
            if (i > 0 && t.sign === 1) {
                termStr = '+' + termStr;
            }
            return termStr;
        }).join(' ').replace(/\+ /g, '+ ').replace(/- /g, '- ');
    }
}

export class Equation {
    constructor(left, right) {
        this.left = left; // Expression
        this.right = right; // Expression
    }

    clone() {
        return new Equation(this.left.clone(), this.right.clone());
    }

    toString() {
        return `${this.left.toString()} = ${this.right.toString()}`;
    }
}

export function parseTerm(termStr) {
    termStr = termStr.trim();
    if (!termStr) return null;

    let sign = 1;
    if (termStr.startsWith('-')) {
        sign = -1;
        termStr = termStr.substring(1).trim();
    } else if (termStr.startsWith('+')) {
        sign = 1;
        termStr = termStr.substring(1).trim();
    }

    // Check for parentheses e.g. "3(x+4)"
    const parenMatch = termStr.match(/^([\d\.]*)\((.*)\)$/);
    if (parenMatch) {
        let coefficient = 1;
        if (parenMatch[1]) {
            coefficient = parseFloat(parenMatch[1]);
        }
        const innerExpr = parseExpression(parenMatch[2]);
        return new Term(coefficient, '', sign, innerExpr);
    }

    let coefMatch = termStr.match(/^[\d\.]+/);
    let coefficient = 1;
    let variable = '';

    if (coefMatch) {
        coefficient = parseFloat(coefMatch[0]);
        variable = termStr.substring(coefMatch[0].length).trim();
    } else {
        variable = termStr;
    }

    return new Term(coefficient, variable, sign);
}

export function parseExpression(exprStr) {
    exprStr = exprStr.replace(/\s+/g, ''); // Remove spaces
    if (!exprStr) return new Expression([new Term(0, '', 1)]);

    // Split by + or - but respect parentheses
    const termStrings = [];
    let currentTerm = '';
    let parenDepth = 0;

    for (let i = 0; i < exprStr.length; i++) {
        const char = exprStr[i];
        if (char === '(') parenDepth++;
        if (char === ')') parenDepth--;

        if ((char === '+' || char === '-') && i !== 0 && parenDepth === 0) {
            termStrings.push(currentTerm);
            currentTerm = char;
        } else {
            currentTerm += char;
        }
    }
    termStrings.push(currentTerm);

    const terms = termStrings.map(t => parseTerm(t)).filter(t => t !== null);
    if (terms.length === 0) return new Expression([new Term(0, '', 1)]);
    return new Expression(terms);
}

export function parseEquation(eqStr) {
    const parts = eqStr.split('=');
    if (parts.length !== 2) throw new Error("معادله باید دقیقا یک علامت مساوی داشته باشد.");

    const left = parseExpression(parts[0]);
    const right = parseExpression(parts[1]);

    return new Equation(left, right);
}

// Global state
if (typeof window !== 'undefined') {
    window.algebraState = {
        history: [],
        redoHistory: [],
        currentEquation: null
    };
} else {
    // For Node.js testing
    global.algebraState = {
        history: [],
        redoHistory: [],
        currentEquation: null
    };
}

// --- UI Rendering ---

export function renderTerm(term, isFirst) {
    const el = document.createElement('div');
    el.className = 'term';
    el.dataset.id = term.id;

    // Add sign if it's not the first positive term
    if (term.sign === -1) {
        const signEl = document.createElement('span');
        signEl.className = 'sign';
        signEl.textContent = '-';
        el.appendChild(signEl);
    } else if (!isFirst) {
        const signEl = document.createElement('span');
        signEl.className = 'sign';
        signEl.textContent = '+';
        el.appendChild(signEl);
    }

    if (term.coefficient !== 1 || (!term.variable && !term.group)) {
        const coefEl = document.createElement('span');
        coefEl.className = 'coef';
        coefEl.textContent = term.coefficient;
        el.appendChild(coefEl);
    }

    if (term.group) {
        const parenOpen = document.createElement('span');
        parenOpen.className = 'paren';
        parenOpen.textContent = '(';
        el.appendChild(parenOpen);

        // Render inner expression but without "side" constraints since it's nested
        term.group.terms.forEach((innerTerm, index) => {
            el.appendChild(renderTerm(innerTerm, index === 0));
        });

        const parenClose = document.createElement('span');
        parenClose.className = 'paren';
        parenClose.textContent = ')';
        el.appendChild(parenClose);
    } else if (term.variable) {
        const varEl = document.createElement('span');
        varEl.className = 'var';
        varEl.textContent = term.variable;
        el.appendChild(varEl);
    }

    return el;
}

export function renderExpression(expr, sideName) {
    const sideEl = document.createElement('div');
    sideEl.className = `side ${sideName}`;
    sideEl.dataset.side = sideName;

    if (expr.terms.length === 0) {
        const zeroTerm = new Term(0, '', 1);
        sideEl.appendChild(renderTerm(zeroTerm, true));
    } else {
        expr.terms.forEach((term, index) => {
            const termEl = renderTerm(term, index === 0);
            termEl.dataset.side = sideName;
            termEl.dataset.index = index;
            sideEl.appendChild(termEl);
        });
    }

    return sideEl;
}

export function renderEquation(equation, isLastStep = false) {
    const rowEl = document.createElement('div');
    rowEl.className = 'equation-row';
    if (isLastStep) rowEl.classList.add('last-step');

    const leftEl = renderExpression(equation.left, 'left');
    const equalsEl = document.createElement('div');
    equalsEl.className = 'equals-sign';
    equalsEl.textContent = '=';
    const rightEl = renderExpression(equation.right, 'right');

    rowEl.appendChild(leftEl);
    rowEl.appendChild(equalsEl);
    rowEl.appendChild(rightEl);

    return rowEl;
}

export function updateWorkspace() {
    const workspace = document.getElementById('workspace');
    workspace.innerHTML = '';

    if (window.algebraState.history.length === 0) {
        workspace.innerHTML = '<div class="workspace-empty">یک معادله وارد کنید یا از مثال‌ها انتخاب کنید.</div>';
        document.getElementById('undo-btn').disabled = true;
        document.getElementById('redo-btn').disabled = true;
        return;
    }

    document.getElementById('undo-btn').disabled = window.algebraState.history.length <= 1;
    document.getElementById('redo-btn').disabled = window.algebraState.redoHistory.length === 0;

    window.algebraState.history.forEach((eq, index) => {
        const isLast = index === window.algebraState.history.length - 1;
        const rowEl = renderEquation(eq, isLast);
        if (isLast && index > 0) {
            rowEl.classList.add('animated-row');
        }
        workspace.appendChild(rowEl);

        // Add event listeners to the last row
        if (isLast) {
            attachDragListeners(rowEl);
        }
    });

    // Scroll to bottom
    const container = document.querySelector('.workspace-container');
    container.scrollTop = container.scrollHeight;
}

// --- Drag and Drop ---

let dragState = {
    element: null,
    termId: null,
    startX: 0,
    startY: 0,
    ghost: null,
    sourceSide: null,
    sourceIndex: null
};

export function attachDragListeners(rowEl) {
    // Only attach to top-level terms in a side, not nested ones
    const topLevelTerms = Array.from(rowEl.querySelectorAll('.side > .term'));
    topLevelTerms.forEach(termEl => {
        termEl.addEventListener('pointerdown', handlePointerDown);

        // Add double click to expand if it contains a group
        termEl.addEventListener('dblclick', handleDoubleClick);
    });
}

function handleDoubleClick(e) {
    const termEl = e.currentTarget;
    const side = termEl.dataset.side;
    const index = parseInt(termEl.dataset.index, 10);

    expandParentheses(side, index);
}

export function expandParentheses(side, index) {
    const state = typeof window !== 'undefined' ? window.algebraState : global.algebraState;
    const eq = state.currentEquation;
    const newEq = eq.clone();

    const sideExpr = side === 'left' ? newEq.left : newEq.right;
    const targetTerm = sideExpr.terms[index];

    if (!targetTerm.group) return;

    const expandedTerms = targetTerm.group.terms.map(innerTerm => {
        const newCoef = targetTerm.coefficient * innerTerm.coefficient;
        const newSign = targetTerm.sign * innerTerm.sign;
        return new Term(newCoef, innerTerm.variable, newSign, innerTerm.group ? innerTerm.group.clone() : null);
    });

    // Replace the group term with the expanded terms
    sideExpr.terms.splice(index, 1, ...expandedTerms);

    state.history.push(newEq);
    state.redoHistory = []; // Clear redo history on new action
    state.currentEquation = newEq.clone();
    if (typeof window !== 'undefined') updateWorkspace();
}

function handlePointerDown(e) {
    if (e.button !== 0) return; // Only left click/touch

    const termEl = e.currentTarget;

    // Setup drag state
    dragState.element = termEl;
    dragState.termId = termEl.dataset.id;
    dragState.sourceSide = termEl.dataset.side;
    dragState.sourceIndex = parseInt(termEl.dataset.index, 10);
    dragState.startX = e.clientX;
    dragState.startY = e.clientY;

    termEl.classList.add('dragging');

    // Create ghost
    const ghost = termEl.cloneNode(true);
    ghost.classList.remove('dragging');
    ghost.classList.add('drag-ghost');

    const rect = termEl.getBoundingClientRect();
    ghost.style.left = `${rect.left}px`;
    ghost.style.top = `${rect.top}px`;
    ghost.style.width = `${rect.width}px`;
    ghost.style.height = `${rect.height}px`;

    document.body.appendChild(ghost);
    dragState.ghost = ghost;

    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerup', handlePointerUp);

    // Prevent default to avoid text selection
    e.preventDefault();
}

function handlePointerMove(e) {
    if (!dragState.ghost) return;

    const dx = e.clientX - dragState.startX;
    const dy = e.clientY - dragState.startY;

    dragState.ghost.style.transform = `translate(${dx}px, ${dy}px)`;

    // Highlight drop targets
    document.querySelectorAll('.droppable-target').forEach(el => el.classList.remove('droppable-target'));

    // Find what we're hovering over
    // Hide ghost temporarily to get element underneath
    dragState.ghost.style.display = 'none';
    const elemBelow = document.elementFromPoint(e.clientX, e.clientY);
    dragState.ghost.style.display = 'flex';

    if (!elemBelow) return;

    // Is it another term?
    const targetTerm = elemBelow.closest('.term');
    if (targetTerm && targetTerm !== dragState.element) {
        targetTerm.classList.add('droppable-target');
        return;
    }

    // Is it the other side?
    const targetSide = elemBelow.closest('.side');
    if (targetSide && targetSide.dataset.side !== dragState.sourceSide) {
        targetSide.classList.add('droppable-target');
    }
}

function handlePointerUp(e) {
    document.removeEventListener('pointermove', handlePointerMove);
    document.removeEventListener('pointerup', handlePointerUp);

    if (dragState.element) {
        dragState.element.classList.remove('dragging');
    }

    if (dragState.ghost) {
        dragState.ghost.remove();
    }

    document.querySelectorAll('.droppable-target').forEach(el => el.classList.remove('droppable-target'));

    // Handle Drop Logic
    dragState.ghost.style.display = 'none';
    const elemBelow = document.elementFromPoint(e.clientX, e.clientY);

    if (elemBelow) {
        const targetTerm = elemBelow.closest('.term');
        const targetSide = elemBelow.closest('.side');

        if (targetTerm && targetTerm !== dragState.element) {
            handleDropOnTerm(targetTerm);
        } else if (targetSide && targetSide.dataset.side !== dragState.sourceSide) {
            handleDropOnSide(targetSide);
        }
    }

    // Reset state
    dragState = {
        element: null,
        termId: null,
        startX: 0,
        startY: 0,
        ghost: null,
        sourceSide: null,
        sourceIndex: null
    };
}

function handleDropOnTerm(targetTermEl) {
    const targetSide = targetTermEl.dataset.side;
    const targetIndex = parseInt(targetTermEl.dataset.index, 10);

    // Must be on the same side to combine
    if (targetSide !== dragState.sourceSide) return;

    const state = typeof window !== 'undefined' ? window.algebraState : global.algebraState;
    const eq = state.currentEquation;
    const sideExpr = targetSide === 'left' ? eq.left : eq.right;

    const sourceTerm = sideExpr.terms[dragState.sourceIndex];
    const targetTerm = sideExpr.terms[targetIndex];

    // Check if like terms (same variable part)
    if (sourceTerm.variable === targetTerm.variable) {
        // Create new equation state
        const newEq = eq.clone();
        const newSideExpr = targetSide === 'left' ? newEq.left : newEq.right;

        // Calculate new coefficient
        const sourceVal = sourceTerm.coefficient * sourceTerm.sign;
        const targetVal = targetTerm.coefficient * targetTerm.sign;
        const newVal = sourceVal + targetVal;

        // Remove source and target, insert new combined term
        const newTerms = newSideExpr.terms.filter((_, i) => i !== dragState.sourceIndex && i !== targetIndex);

        if (newVal !== 0 || !targetTerm.variable) {
            const combinedTerm = new Term(Math.abs(newVal), targetTerm.variable, newVal < 0 ? -1 : 1);
            // Insert at target's original position (adjusted for removal)
            const insertIndex = targetIndex > dragState.sourceIndex ? targetIndex - 1 : targetIndex;
            newTerms.splice(insertIndex, 0, combinedTerm);
        }

        newSideExpr.terms = newTerms;

        state.history.push(newEq);
        state.redoHistory = []; // Clear redo history on new action
        state.currentEquation = newEq.clone();
        if (typeof window !== 'undefined') updateWorkspace();
    }
}

function handleDropOnSide(targetSideEl) {
    const targetSideStr = targetSideEl.dataset.side;
    if (targetSideStr === dragState.sourceSide) return; // Same side, do nothing

    const state = typeof window !== 'undefined' ? window.algebraState : global.algebraState;
    const eq = state.currentEquation;
    const newEq = eq.clone();

    const fromExpr = dragState.sourceSide === 'left' ? newEq.left : newEq.right;
    const toExpr = targetSideStr === 'left' ? newEq.left : newEq.right;

    const termToMove = fromExpr.terms[dragState.sourceIndex];

    // Check for division (if the source side has ONLY this one term and it has a coefficient != 1 and a variable)
    if (fromExpr.terms.length === 1 && termToMove.variable && termToMove.coefficient !== 1) {
        const divisor = termToMove.coefficient * termToMove.sign;

        if (divisor === 0) {
            if (typeof alert !== 'undefined') alert("تقسیم بر صفر مجاز نیست!");
            return;
        }

        // Remove coefficient from source term
        termToMove.coefficient = 1;
        termToMove.sign = 1; // It becomes just 'x' or whatever

        // Divide all terms on the target side
        toExpr.terms = toExpr.terms.map(t => {
            const currentVal = t.coefficient * t.sign;
            const newVal = currentVal / divisor;
            return new Term(Math.abs(newVal), t.variable, newVal < 0 ? -1 : 1);
        });

    } else {
        // Standard transposition
        // Extract term
        const extractedTerm = fromExpr.terms.splice(dragState.sourceIndex, 1)[0];

        // Flip sign
        extractedTerm.sign *= -1;

        // Add to new side
        toExpr.terms.push(extractedTerm);
    }

    state.history.push(newEq);
    state.redoHistory = []; // Clear redo history on new action
    state.currentEquation = newEq.clone();
    if (typeof window !== 'undefined') updateWorkspace();
}

// UI Initialization
export function initUI() {
    const loadBtn = document.getElementById('load-equation');
    const customInput = document.getElementById('custom-equation');
    const exampleSelect = document.getElementById('example-select');
    const undoBtn = document.getElementById('undo-btn');
    const redoBtn = document.getElementById('redo-btn');
    const resetBtn = document.getElementById('reset-btn');

    loadBtn.addEventListener('click', () => {
        const val = customInput.value.trim();
        if (val) loadEquation(val);
    });

    exampleSelect.addEventListener('change', (e) => {
        const val = e.target.value;
        if (val) {
            customInput.value = val;
            loadEquation(val);
            e.target.value = ''; // reset select
        }
    });

    undoBtn.addEventListener('click', () => {
        if (window.algebraState.history.length > 1) {
            const popped = window.algebraState.history.pop();
            window.algebraState.redoHistory.push(popped);
            window.algebraState.currentEquation = window.algebraState.history[window.algebraState.history.length - 1].clone();
            updateWorkspace();
        }
    });

    redoBtn.addEventListener('click', () => {
        if (window.algebraState.redoHistory.length > 0) {
            const redoEq = window.algebraState.redoHistory.pop();
            window.algebraState.history.push(redoEq);
            window.algebraState.currentEquation = redoEq.clone();
            updateWorkspace();
        }
    });

    resetBtn.addEventListener('click', () => {
        if (window.algebraState.history.length > 0) {
            const firstEq = window.algebraState.history[0];
            window.algebraState.history = [firstEq];
            window.algebraState.redoHistory = [];
            window.algebraState.currentEquation = firstEq.clone();
            updateWorkspace();
        }
    });

    updateWorkspace();
}

function loadEquation(eqStr) {
    try {
        const eq = parseEquation(eqStr);
        window.algebraState.history = [eq];
        window.algebraState.redoHistory = [];
        window.algebraState.currentEquation = eq.clone();
        updateWorkspace();
    } catch (e) {
        alert(e.message);
    }
}

if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', initUI);
}
