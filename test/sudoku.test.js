import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeDifficulty, candidatesFor, conflicts, hintFor, isCompleteAndValid, removePeerCandidate, solve } from '../static/sudoku/sudoku-core.js';
import { zonedTimeToEpoch } from '../backend/lambda/timezone.mjs';
import { isValidGameState } from '../backend/lambda/validation.mjs';
import { rewardConfig, teAmoMasDataset, teAmoMasMetrics, validateRewardConfig } from '../backend/lambda/reward-config.mjs';

const toBoard = (text) => Array.from({ length: 9 }, (_, row) => [...text.slice(row * 9, row * 9 + 9)].map(Number));
const production = [
  '000260701680070090190004500820100040004602900050003028009300074040050036703018000',
  '530070000600195000098000060800060003400803001700020006060000280000419005000080079',
  '200080300060070084030500209000105408000000000402706000301007040720040060004010003',
  '000600910002000008108300000000060000400000001000020850060500004280019000340006070',
  '000000000000003085001020000000507000004000100090000000500000073002010000000040009',
  '100007090030020008009600500005300900010080002600004000300000010040000007007000300'
];

test('detects row, column and box conflicts', () => {
  const grid = toBoard('550000000000000000000000000000000000000000000000000000000000000000000000000000');
  assert.equal(conflicts(grid).size, 2);
  grid[0][1] = 0; grid[1][0] = 5; assert.equal(conflicts(grid).size, 2);
  grid[1][0] = 0; grid[1][1] = 5; assert.equal(conflicts(grid).size, 2);
});
test('calculates candidates and removes a peer candidate', () => {
  const grid = toBoard(production[1]); assert.deepEqual(candidatesFor(grid, 0, 2), [1, 2, 4]);
  const changed = removePeerCandidate({ '0:2': [1,2,4], '4:4': [3,4] }, 0, 0, 4);
  assert.deepEqual(changed.notes['0:2'], [1,2]); assert.deepEqual(changed.notes['4:4'], [3,4]);
});
test('all six production puzzles are valid, uniquely solvable and match Lambda private solutions', { timeout: 30000 }, async () => {
  const lambda = await import('node:fs/promises').then((fs) => fs.readFile(new URL('../backend/lambda/index.mjs', import.meta.url), 'utf8'));
  production.forEach((puzzle, index) => { const found = solve(toBoard(puzzle), 2); assert.equal(found.length, 1, `Sudoku ${index + 1}`); assert.ok(isCompleteAndValid(found[0])); assert.match(lambda, new RegExp(`'${String(index + 1).padStart(2, '0')}': '${found[0].flat().join('')}'`)); });
});
test('difficulty analysis matches the six-level progression', () => {
  const reports = production.map((puzzle) => analyzeDifficulty(toBoard(puzzle)));
  assert.deepEqual(reports.map((report) => report.label), ['Fácil', 'Fácil', 'Fácil / Medio', 'Medio', 'Difícil', 'Experto']);
  assert.deepEqual(reports.slice(0, 5).map((report) => report.weightedScore), [45, 51, 56, 70, 92]);
  assert.equal(reports[5].advancedRequired, true);
  assert.equal(reports[5].solvedLogically, false);
});
test('logical hints describe an actual derived step and respect levels', () => {
  const grid = toBoard(production[0]); const soft = hintFor(grid, 1); const direct = hintFor(grid, 4);
  assert.match(soft.text, /deducción/i); assert.ok(!/debe ser/.test(soft.text)); assert.match(direct.text, /debe ser/);
});
test('production policy progression preserves tools and restricts the sixth expert puzzle', async () => {
  const source = await import('node:fs/promises').then((fs) => fs.readFile(new URL('../backend/lambda/puzzle-data.mjs', import.meta.url), 'utf8'));
  assert.match(source, /\['06','Experto'/); assert.match(source, /solutionErrorCheck: false, hintMaxLevel: 1, maxHints: 1, allowReveal: false/);
  assert.match(source, /manualNotes: true.*autoRemoveCandidates: true.*duplicateWarnings: true/s);
});
test('unlock dates are explicit and use the configured timezone', async () => {
  const source = await import('node:fs/promises').then((fs) => fs.readFile(new URL('../backend/lambda/puzzle-data.mjs', import.meta.url), 'utf8'));
  for (const day of ['09-30','10-02','10-05','10-07','10-10','10-16']) assert.match(source, new RegExp(`2026-${day}T00:00:00'`));
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
test('offline support caches only the Sudoku shell and never API responses', async () => {
  const serviceWorker = await import('node:fs/promises').then((fs) => fs.readFile(new URL('../static/sudoku/sw.js', import.meta.url), 'utf8'));
  const app = await import('node:fs/promises').then((fs) => fs.readFile(new URL('../static/sudoku/app.js', import.meta.url), 'utf8'));
  assert.match(serviceWorker, /url\.pathname\.startsWith\('\/api\/'\)/);
  assert.match(app, /Sin conexión\. Podés seguir jugando sin cerrar esta pestaña/);
  assert.match(app, /navigator\.serviceWorker\.register\('\/sudoku\/sw\.js'/);
});
test('reward configuration maps every puzzle once and validates all supported placeholders', () => {
  assert.deepEqual(validateRewardConfig(rewardConfig), []);
  assert.deepEqual(rewardConfig.rewards.map((reward) => reward.puzzleId), ['01', '02', '03', '04', '05', '06']);
  assert.deepEqual(rewardConfig.rewards.map((reward) => reward.type), ['STORY', 'STORY', 'VIDEO', 'CHOICE', 'STORY', 'FINAL']);
  assert.equal(rewardConfig.pieces.enabled, true);
});
test('Reward #2 is the nine-scene private story associated with Sudoku #2', () => {
  const story = rewardConfig.rewards.find((reward) => reward.id === 'reward-02');
  assert.equal(story.puzzleId, '02'); assert.equal(story.title, 'Nuestra historia hasta ahora'); assert.equal(story.scenes.length, 9);
  assert.deepEqual(story.scenes.filter((scene) => scene.asset).map((scene) => scene.asset.key), ['rewards/reward-02/19enero.jpg', 'rewards/reward-02/8mayo.jpg', 'rewards/reward-02/20septiembre.jpg']);
  assert.equal(story.scenes.at(-1).final, 'Te amo. Más.');
  assert.ok(!JSON.stringify(story).includes('/tmp/'));
});
test('Reward #1 is the five-scene private photo story associated with Sudoku #1', async () => {
  const renderer = await import('../static/sudoku/rewards.js'); const reward = rewardConfig.rewards.find((item) => item.id === 'reward-01');
  assert.equal(reward.puzzleId, '01'); assert.equal(reward.scenes.length, 5);
  assert.deepEqual(reward.scenes.filter((scene) => scene.asset).map((scene) => scene.asset.key), ['rewards/reward-01/1era.jpg', 'rewards/reward-01/5dic.jpg']);
  const december = reward.scenes.find((scene) => scene.id === 'sin-vuelta-atras');
  assert.match(renderer.storySceneMarkup(reward, { ...december, hasMedia: true, media: { available: false }, asset: undefined }, 3), /Contenido pendiente/);
  assert.ok(!renderer.storySceneMarkup(reward, { ...december, hasMedia: false, asset: undefined }, 3).includes('ya no había vuelta atrás'));
  assert.match(renderer.storySceneMarkup(reward, { ...december, hasMedia: false, asset: undefined }, 3, { 'stage:sin-vuelta-atras': true }), /ya no había vuelta atrás/);
});
test('Reward #5 derives its audited Te amo más statistics from one dataset', () => {
  const reward = rewardConfig.rewards.find((item) => item.id === 'reward-05'); const metrics = teAmoMasMetrics();
  assert.equal(reward.puzzleId, '05'); assert.equal(reward.storyKind, 'te-amo-mas'); assert.equal(reward.scenes.length, 14);
  assert.equal(metrics.totalMessages, 37091); assert.equal(metrics.totalTeAmoMessages, 253); assert.equal(metrics.rawDifference, 13);
  assert.equal(metrics.teAmoPer1000Marcos, 133 / 19909 * 1000); assert.equal(metrics.teAmoPer1000Claudia, 120 / 17182 * 1000); assert.ok(metrics.teAmoPer1000Claudia > metrics.teAmoPer1000Marcos);
  assert.equal(teAmoMasDataset.historicalEvents.firstMas.date, '28 de febrero de 2026'); assert.equal(teAmoMasDataset.historicalEvents.firstTeAmo.messages.at(-1).author, 'Marcos'); assert.equal(teAmoMasDataset.historicalEvents.finalExample.date, '25 de septiembre de 2026');
});
test('reward validation rejects unsafe mappings, broken choices and invalid final blocks', () => {
  const broken = structuredClone(rewardConfig); broken.rewards[0].puzzleId = '99'; broken.rewards[3].options = [{ id: 'same' }, { id: 'same' }]; broken.rewards[5].blocks = [];
  const errors = validateRewardConfig(broken);
  assert.ok(errors.some((error) => /valid puzzle/.test(error)));
  assert.ok(errors.some((error) => /at least two/.test(error)));
  assert.ok(errors.some((error) => /at least one block/.test(error)));
});
test('reward API keeps private access server-authorized and supports an authenticated developer preview only', async () => {
  const lambda = await import('node:fs/promises').then((fs) => fs.readFile(new URL('../backend/lambda/index.mjs', import.meta.url), 'utf8'));
  const preview = await import('node:fs/promises').then((fs) => fs.readFile(new URL('../static/sudoku/dev-rewards.js', import.meta.url), 'utf8'));
  assert.match(lambda, /Completá el Sudoku correspondiente para abrir esta recompensa/);
  assert.match(lambda, /HeadObjectCommand/);
  assert.match(lambda, /getSignedUrl/);
  assert.match(lambda, /session\.developerMode && \['reward-01', 'reward-02', 'reward-05'\]\.includes\(reward\.id\)/);
  assert.ok(!preview.includes('rewards/reward-'));
  assert.match(preview, /TODO_REWARD_01_TITLE/);
});
test('story renderer supports all scenes, controls, missing private media and reduced motion', async () => {
  const renderer = await import('../static/sudoku/rewards.js'); const app = await import('node:fs/promises').then((fs) => fs.readFile(new URL('../static/sudoku/app.js', import.meta.url), 'utf8')); const css = await import('node:fs/promises').then((fs) => fs.readFile(new URL('../static/css/custom.css', import.meta.url), 'utf8'));
  const story = rewardConfig.rewards.find((reward) => reward.id === 'reward-02');
  story.scenes.forEach((scene, index) => { const markup = renderer.storySceneMarkup(story, { ...scene, hasMedia: Boolean(scene.asset), media: scene.asset ? { available: false } : undefined, asset: undefined }, index); assert.match(markup, /reward-story/); if (scene.asset) assert.match(markup, /Contenido pendiente/); });
  assert.match(app, /storyProgressKey/); assert.match(app, /id="previous"/); assert.match(app, /Volver a mis recompensas/); assert.match(css, /prefers-reduced-motion: reduce/); assert.match(css, /env\(safe-area-inset-bottom\)/);
  assert.match(app, /REVELAR RECUERDO/); assert.match(css, /story-layout-landscape/);
});
test('Reward #5 renders derived Spanish statistics and gates its interactive branches', async () => {
  const renderer = await import('../static/sudoku/rewards.js'); const app = await import('node:fs/promises').then((fs) => fs.readFile(new URL('../static/sudoku/app.js', import.meta.url), 'utf8'));
  const reward = rewardConfig.rewards.find((item) => item.id === 'reward-05'); const raw = reward.scenes.find((scene) => scene.id === 'victoria'); const normalized = reward.scenes.find((scene) => scene.id === 'normalizacion');
  reward.scenes.forEach((scene, index) => assert.match(renderer.storySceneMarkup(reward, scene, index, { predictionTeAmo: 'marcos', predictionFirstTeAmo: 'marcos', predictionFirstTeAmoRevealed: true, closeInvestigation: 'yes' }), /analysis-story/));
  assert.match(renderer.storySceneMarkup(reward, raw, 3), /133/); assert.match(renderer.storySceneMarkup(reward, raw, 3), /120/);
  const rates = renderer.storySceneMarkup(reward, normalized, 5); assert.match(rates, /6,68/); assert.match(rates, /6,98/); assert.match(rates, /SÍ, OBVIAMENTE/);
  assert.match(app, /data-story-choice/); assert.match(app, /Revealed/); assert.match(app, /gated/);
});
test('administrator controls and the shared wall remain server-authorized', async () => {
  const lambda = await import('node:fs/promises').then((fs) => fs.readFile(new URL('../backend/lambda/index.mjs', import.meta.url), 'utf8'));
  const terraform = await import('node:fs/promises').then((fs) => fs.readFile(new URL('../infra/terraform/aws/sudoku.tf', import.meta.url), 'utf8'));
  const app = await import('node:fs/promises').then((fs) => fs.readFile(new URL('../static/sudoku/app.js', import.meta.url), 'utf8'));
  assert.match(lambda, /ADMIN_ACCESS_CODE/);
  assert.match(lambda, /api\.resend\.com\/emails/);
  assert.match(lambda, /sudoku-unlock-notification/);
  assert.match(lambda, /resetRecordId/);
  assert.match(lambda, /path === '\/admin\/status'/);
  assert.match(lambda, /DeleteCommand/);
  assert.match(lambda, /const wall = path\.match/);
  assert.match(terraform, /dynamodb:Query/);
  assert.match(terraform, /sudoku_admin_access_code/);
  assert.match(terraform, /RESEND_API_KEY/);
  assert.match(app, /Muro de mensajes/);
  assert.match(app, /Un espacio compartido durante este desafío/);
  assert.match(app, /embedded-wall/);
  assert.match(app, /Progreso de Claudia/);
});
