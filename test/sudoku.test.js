import test from 'node:test';
import assert from 'node:assert/strict';
import { candidatesFor, conflicts, hintFor, isCompleteAndValid, removePeerCandidate, solve } from '../static/sudoku/sudoku-core.js';
import { zonedTimeToEpoch } from '../backend/lambda/timezone.mjs';
import { isValidGameState } from '../backend/lambda/validation.mjs';

const toBoard = (text) => Array.from({ length: 9 }, (_, row) => [...text.slice(row * 9, row * 9 + 9)].map(Number));
const production = [
  '530070000600195000098000060800060003400803001700020006060000280000419005000080079',
  '000260701680070090190004500820100040004602900050003028009300074040050036703018000',
  '300000000005009000200504000020000700160000058704310600000890100000067080000005437',
  '000000907000420180000705026100904000050000040000507009920108000034059000507000000',
  '500070000000190008108040007050000020006803791000004806960037000207009005040206009',
  '200080300060070084030500209000105408000000000402706000301007040720040060004010003',
  '000600910002000008108300000000060000400000001000020850060500004280019000340006070',
  '000000000000003085001020000000507000004000100090000000500000073002010000000040009',
  '100007090030020008009600500005300900010080002600004000300000010040000007007000300',
  '000000010400000000020000000000050407008000300001090000300400200050100000000806000'
];

test('detects row, column and box conflicts', () => {
  const grid = toBoard('550000000000000000000000000000000000000000000000000000000000000000000000000000');
  assert.equal(conflicts(grid).size, 2);
  grid[0][1] = 0; grid[1][0] = 5; assert.equal(conflicts(grid).size, 2);
  grid[1][0] = 0; grid[1][1] = 5; assert.equal(conflicts(grid).size, 2);
});
test('calculates candidates and removes a peer candidate', () => {
  const grid = toBoard(production[0]); assert.deepEqual(candidatesFor(grid, 0, 2), [1, 2, 4]);
  const changed = removePeerCandidate({ '0:2': [1,2,4], '4:4': [3,4] }, 0, 0, 4);
  assert.deepEqual(changed.notes['0:2'], [1,2]); assert.deepEqual(changed.notes['4:4'], [3,4]);
});
test('all ten production puzzles are valid and uniquely solvable', { timeout: 30000 }, () => {
  production.forEach((puzzle, index) => { const found = solve(toBoard(puzzle), 2); assert.equal(found.length, 1, `Sudoku ${index + 1}`); assert.ok(isCompleteAndValid(found[0])); });
});
test('logical hints describe an actual derived step and respect levels', () => {
  const grid = toBoard(production[0]); const soft = hintFor(grid, 1); const direct = hintFor(grid, 4);
  assert.match(soft.text, /deducción/i); assert.ok(!/debe ser/.test(soft.text)); assert.match(direct.text, /debe ser/);
});
test('production policy progression preserves tools and restricts expert help', async () => {
  const source = await import('node:fs/promises').then((fs) => fs.readFile(new URL('../backend/lambda/puzzle-data.mjs', import.meta.url), 'utf8'));
  assert.match(source, /\['10','Experto'/); assert.match(source, /solutionErrorCheck: false, hintMaxLevel: 1, maxHints: 1, allowReveal: false/);
  assert.match(source, /manualNotes: true.*autoRemoveCandidates: true.*duplicateWarnings: true/s);
});
test('unlock dates are explicit and use the configured timezone', async () => {
  const source = await import('node:fs/promises').then((fs) => fs.readFile(new URL('../backend/lambda/puzzle-data.mjs', import.meta.url), 'utf8'));
  for (const day of ['09-30','10-02','10-05','10-07','10-10','10-12','10-14','10-16','10-18','10-19']) assert.match(source, new RegExp(`2026-${day}T00:00:00'`));
  assert.equal(zonedTimeToEpoch('2026-09-30T00:00:00', 'America/Montevideo'), Date.parse('2026-09-30T03:00:00.000Z'));
  assert.equal(zonedTimeToEpoch('2026-09-30T00:00:00', 'UTC'), Date.parse('2026-09-30T00:00:00.000Z'));
});
test('rejects malformed or oversized client game state before persistence', () => {
  const policy = { maxHints: 2 };
  const valid = { schemaVersion: 1, puzzleId: '01', board: toBoard(production[0]), notes: {}, elapsedMs: 1200, hintsUsed: 0, autoCandidateFills: 0, history: [], historyIndex: -1 };
  assert.ok(isValidGameState(valid, '01', policy));
  assert.equal(isValidGameState({ ...valid, board: [[0]] }, '01', policy), false);
  assert.equal(isValidGameState({ ...valid, hintsUsed: 3 }, '01', policy), false);
  assert.equal(isValidGameState({ ...valid, notes: { '9:0': [1] } }, '01', policy), false);
});
