/* Shared, dependency-free Sudoku domain logic. It intentionally contains no puzzle data. */
export const SIZE = 9;
export const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9];

export const cloneBoard = (board) => board.map((row) => [...row]);
export const boxOf = (row, column) => Math.floor(row / 3) * 3 + Math.floor(column / 3);
export const peersOf = (row, column) => {
  const peers = new Set();
  for (let index = 0; index < SIZE; index += 1) { peers.add(`${row}:${index}`); peers.add(`${index}:${column}`); }
  const startRow = Math.floor(row / 3) * 3; const startColumn = Math.floor(column / 3) * 3;
  for (let r = startRow; r < startRow + 3; r += 1) for (let c = startColumn; c < startColumn + 3; c += 1) peers.add(`${r}:${c}`);
  peers.delete(`${row}:${column}`); return [...peers].map((key) => key.split(':').map(Number));
};

export function conflicts(board) {
  const bad = new Set();
  const inspect = (cells) => {
    const seen = new Map();
    cells.forEach(([r, c]) => { const value = board[r][c]; if (value) { if (seen.has(value)) { bad.add(`${r}:${c}`); bad.add(seen.get(value)); } else seen.set(value, `${r}:${c}`); } });
  };
  for (let i = 0; i < SIZE; i += 1) { inspect(digits.map((_, c) => [i, c])); inspect(digits.map((_, r) => [r, i])); }
  for (let r = 0; r < SIZE; r += 3) for (let c = 0; c < SIZE; c += 3) inspect(Array.from({ length: 9 }, (_, i) => [r + Math.floor(i / 3), c + i % 3]));
  return bad;
}

export function candidatesFor(board, row, column) {
  if (board[row][column]) return [];
  const used = new Set(peersOf(row, column).map(([r, c]) => board[r][c]).filter(Boolean));
  return digits.filter((value) => !used.has(value));
}

export function removePeerCandidate(notes, row, column, value) {
  const next = structuredClone(notes || {}); let changed = false;
  peersOf(row, column).forEach(([r, c]) => { const key = `${r}:${c}`; if (next[key]?.includes(value)) { next[key] = next[key].filter((candidate) => candidate !== value); changed = true; } });
  return { notes: next, changed };
}

export function isCompleteAndValid(board) { return !conflicts(board).size && board.every((row) => row.every(Boolean)); }

export function solve(board, limit = 2) {
  const working = cloneBoard(board); const solutions = [];
  const visit = () => {
    if (solutions.length >= limit) return;
    let best = null;
    for (let r = 0; r < SIZE; r += 1) for (let c = 0; c < SIZE; c += 1) if (!working[r][c]) { const options = candidatesFor(working, r, c); if (!options.length) return; if (!best || options.length < best.options.length) best = { r, c, options }; }
    if (!best) { solutions.push(cloneBoard(working)); return; }
    for (const value of best.options) { working[best.r][best.c] = value; visit(); working[best.r][best.c] = 0; }
  };
  visit(); return solutions;
}

const allUnits = () => {
  const units = [];
  for (let index = 0; index < SIZE; index += 1) {
    units.push({ type: 'row', index, cells: digits.map((_, column) => [index, column]) });
    units.push({ type: 'column', index, cells: digits.map((_, row) => [row, index]) });
  }
  for (let row = 0; row < SIZE; row += 3) for (let column = 0; column < SIZE; column += 3) units.push({ type: 'box', index: boxOf(row, column), cells: Array.from({ length: 9 }, (_, index) => [row + Math.floor(index / 3), column + index % 3]) });
  return units;
};
const cellKey = (row, column) => `${row}:${column}`;
const cellsForKey = (key) => key.split(':').map(Number);

/**
 * Applies a deliberately limited, human-style technique set. It does not guess.
 * A stalled result means the puzzle needs a technique outside this set, not that it
 * has no logical solution.
 */
export function analyzeDifficulty(board) {
  const working = cloneBoard(board);
  const candidates = new Map();
  const units = allUnits();
  const techniques = { nakedSingles: 0, hiddenSingles: 0, lockedCandidates: 0, nakedPairs: 0 };
  for (let row = 0; row < SIZE; row += 1) for (let column = 0; column < SIZE; column += 1) if (!working[row][column]) candidates.set(cellKey(row, column), new Set(candidatesFor(working, row, column)));
  const remove = (key, value) => { const values = candidates.get(key); if (!values?.has(value)) return false; values.delete(value); return true; };
  const place = (row, column, value, technique) => {
    const key = cellKey(row, column); if (!candidates.has(key)) return false;
    working[row][column] = value; candidates.delete(key); techniques[technique] += 1;
    peersOf(row, column).forEach(([peerRow, peerColumn]) => remove(cellKey(peerRow, peerColumn), value));
    return true;
  };
  const invalid = () => [...candidates.values()].some((values) => values.size === 0);
  const nakedSingle = () => {
    for (const [key, values] of candidates) if (values.size === 1) { const [row, column] = cellsForKey(key); return place(row, column, [...values][0], 'nakedSingles'); }
    return false;
  };
  const hiddenSingle = () => {
    for (const unit of units) for (const value of digits) {
      const matches = unit.cells.filter(([row, column]) => candidates.get(cellKey(row, column))?.has(value));
      if (matches.length === 1) return place(matches[0][0], matches[0][1], value, 'hiddenSingles');
    }
    return false;
  };
  const lockedCandidate = () => {
    for (const box of units.filter((unit) => unit.type === 'box')) for (const value of digits) {
      const matches = box.cells.filter(([row, column]) => candidates.get(cellKey(row, column))?.has(value));
      if (matches.length < 2) continue;
      const rows = new Set(matches.map(([row]) => row)); const columns = new Set(matches.map(([, column]) => column));
      if (rows.size === 1) { const row = [...rows][0]; const changed = digits.some((_, column) => !box.cells.some(([boxRow, boxColumn]) => boxRow === row && boxColumn === column) && remove(cellKey(row, column), value)); if (changed) { techniques.lockedCandidates += 1; return true; } }
      if (columns.size === 1) { const column = [...columns][0]; const changed = digits.some((_, row) => !box.cells.some(([boxRow, boxColumn]) => boxRow === row && boxColumn === column) && remove(cellKey(row, column), value)); if (changed) { techniques.lockedCandidates += 1; return true; } }
    }
    return false;
  };
  const nakedPair = () => {
    for (const unit of units) {
      const pairs = new Map();
      unit.cells.forEach(([row, column]) => { const values = candidates.get(cellKey(row, column)); if (values?.size === 2) { const signature = [...values].sort().join(','); pairs.set(signature, [...(pairs.get(signature) || []), cellKey(row, column)]); } });
      for (const [signature, pair] of pairs) if (pair.length === 2) { const values = signature.split(',').map(Number); let changed = false; unit.cells.forEach(([row, column]) => { const key = cellKey(row, column); if (!pair.includes(key)) values.forEach((value) => { changed ||= remove(key, value); }); }); if (changed) { techniques.nakedPairs += 1; return true; } }
    }
    return false;
  };
  let iterations = 0;
  while (!invalid() && candidates.size && iterations < 1000) { iterations += 1; if (nakedSingle() || hiddenSingle() || lockedCandidate() || nakedPair()) continue; break; }
  const solvedLogically = candidates.size === 0 && isCompleteAndValid(working);
  const remainingCells = candidates.size;
  const weightedScore = techniques.nakedSingles + techniques.hiddenSingles * 2 + techniques.lockedCandidates * 8 + techniques.nakedPairs * 12;
  const advancedRequired = !solvedLogically && !invalid();
  const label = advancedRequired ? 'Experto' : weightedScore > 78 ? 'Difícil' : weightedScore > 60 ? 'Medio' : weightedScore > 51 ? 'Fácil / Medio' : 'Fácil';
  return { solvedLogically, advancedRequired, remainingCells, iterations, techniques, weightedScore, label };
}

export function nextLogicalStep(board) {
  const possibilities = [];
  for (let r = 0; r < SIZE; r += 1) for (let c = 0; c < SIZE; c += 1) if (!board[r][c]) { const values = candidatesFor(board, r, c); if (values.length === 1) return { technique: 'single-visible', row: r, column: c, value: values[0], unit: 'cell' }; possibilities.push({ r, c, values }); }
  const units = [];
  for (let i = 0; i < SIZE; i += 1) { units.push({ type: 'fila', index: i, cells: digits.map((_, c) => [i, c]) }); units.push({ type: 'columna', index: i, cells: digits.map((_, r) => [r, i]) }); }
  for (let r = 0; r < SIZE; r += 3) for (let c = 0; c < SIZE; c += 3) units.push({ type: 'bloque', index: boxOf(r, c), cells: Array.from({ length: 9 }, (_, i) => [r + Math.floor(i / 3), c + i % 3]) });
  for (const unit of units) for (const value of digits) { const matches = unit.cells.filter(([r, c]) => !board[r][c] && candidatesFor(board, r, c).includes(value)); if (matches.length === 1) return { technique: 'single-oculto', row: matches[0][0], column: matches[0][1], value, unit: unit.type, unitIndex: unit.index }; }
  // Locked candidate: all possible positions for a digit in a box share one row or column.
  for (let boxRow = 0; boxRow < 9; boxRow += 3) for (let boxColumn = 0; boxColumn < 9; boxColumn += 3) for (const value of digits) {
    const matches = Array.from({ length: 9 }, (_, index) => [boxRow + Math.floor(index / 3), boxColumn + index % 3]).filter(([r, c]) => !board[r][c] && candidatesFor(board, r, c).includes(value));
    if (matches.length > 1 && new Set(matches.map(([r]) => r)).size === 1) return { technique: 'candidato-bloqueado', value, unit: 'fila', unitIndex: matches[0][0], row: matches[0][0], column: matches[0][1] };
    if (matches.length > 1 && new Set(matches.map(([, c]) => c)).size === 1) return { technique: 'candidato-bloqueado', value, unit: 'columna', unitIndex: matches[0][1], row: matches[0][0], column: matches[0][1] };
  }
  // Naked pair: the same two candidates occur in exactly two cells of one unit.
  for (const unit of units) {
    const pairs = new Map();
    unit.cells.forEach(([r, c]) => { if (!board[r][c]) { const values = candidatesFor(board, r, c); if (values.length === 2) { const key = values.join(','); pairs.set(key, [...(pairs.get(key) || []), [r, c]]); } } });
    for (const [key, cells] of pairs) if (cells.length === 2) { const values = key.split(',').map(Number); const affected = unit.cells.some(([r, c]) => !cells.some(([pr, pc]) => pr === r && pc === c) && !board[r][c] && candidatesFor(board, r, c).some((value) => values.includes(value))); if (affected) return { technique: 'par-desnudo', unit: unit.type, unitIndex: unit.index, row: cells[0][0], column: cells[0][1] }; }
  }
  return possibilities.length ? { technique: 'explorar', row: possibilities[0].r, column: possibilities[0].c, unit: 'cell' } : null;
}

export function hintFor(board, maxLevel) {
  const step = nextLogicalStep(board); if (!step) return { level: 1, text: 'No encontré una deducción sencilla en este momento. Revisá tus notas.' };
  const names = { 'single-visible': 'una celda con un único candidato', 'single-oculto': `un único lugar posible en la ${step.unit}`, 'candidato-bloqueado': `un candidato bloqueado para el ${step.value}`, 'par-desnudo': 'un par desnudo de candidatos' };
  const signature = `${step.technique}:${step.row}:${step.column}:${step.value || ''}`;
  if (maxLevel <= 1) return { level: 1, signature, row: step.row, column: step.column, text: step.unit === 'cell' ? 'Hay una deducción posible cerca de una celda con pocas opciones.' : `Hay una deducción posible en la ${step.unit} ${step.unitIndex + 1}.` };
  if (maxLevel === 2) return { level: 2, signature, row: step.row, column: step.column, text: `Buscá ${names[step.technique] || 'una relación entre candidatos'} en la ${step.unit === 'cell' ? 'zona seleccionada' : `${step.unit} ${step.unitIndex + 1}`}.` };
  const position = `fila ${String.fromCharCode(65 + step.row)}, columna ${step.column + 1}`;
  if (maxLevel === 3) return { level: 3, signature, text: `En ${position} hay ${names[step.technique] || 'una deducción'}; podés determinar su valor.`, row: step.row, column: step.column };
  return { level: 4, signature, text: `En ${position} el valor debe ser ${step.value}.`, reveal: step.value, row: step.row, column: step.column };
}

export function emptyState(puzzle, now = Date.now()) { return { schemaVersion: 1, puzzleId: puzzle.id, board: cloneBoard(puzzle.initialBoard), notes: {}, elapsedMs: 0, hintsUsed: 0, autoCandidateFills: 0, completedAt: null, history: [], historyIndex: -1, updatedAt: now, revision: 0 }; }
