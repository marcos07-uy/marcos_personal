import { rawPuzzles } from '../backend/lambda/puzzle-data.mjs';
import { analyzeDifficulty } from '../static/sudoku/sudoku-core.js';

const toBoard = (text) => Array.from({ length: 9 }, (_, row) => [...text.slice(row * 9, row * 9 + 9)].map(Number));
for (const [id, configuredDifficulty, , initialBoard] of rawPuzzles) {
  const report = analyzeDifficulty(toBoard(initialBoard));
  console.log(JSON.stringify({ id, configuredDifficulty, ...report }));
}
