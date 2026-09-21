import crypto from 'node:crypto';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { S3Client, GetObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { zonedTimeToEpoch } from './timezone.mjs';
import { isBoard, isValidGameState, parseBody } from './validation.mjs';
import { rawPuzzles } from './puzzle-data.mjs';
import { rewardById, rewardByPuzzleId, rewardConfig, validateRewardConfig } from './reward-config.mjs';

const db = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const s3 = new S3Client({});
const TABLE = process.env.PROGRESS_TABLE;
const REWARDS_BUCKET = process.env.REWARDS_BUCKET;
const ACCESS_CODE = process.env.ACCESS_CODE;
const DEVELOPER_ACCESS_CODE = process.env.DEVELOPER_ACCESS_CODE;
const SESSION_SECRET = process.env.SESSION_SECRET;
const TZ = process.env.UNLOCK_TIMEZONE || 'America/Montevideo';
const board = (text) => Array.from({ length: 9 }, (_, r) => [...text.slice(r * 9, r * 9 + 9)].map(Number));
// These solutions remain inside Lambda. Their uniqueness is verified in the automated test suite,
// rather than recalculated during every cold start.
const solutionStrings = {
  '01': '435269781682571493197834562826195347374682915951743628519326874248957136763418259',
  '02': '534678912672195348198342567859761423426853791713924856961537284287419635345286179',
  '03': '245981376169273584837564219976125438513498627482736951391657842728349165654812793',
  '04': '534678912672195348198342567859761423426853791713924856961537284287419635345286179',
  '05': '987654321246173985351928746128537694634892157795461832519286473472319568863745219',
  '06': '162857493534129678789643521475312986913586742628794135356478219241935867897261354'
};
const puzzles = rawPuzzles.map(([id, difficulty, unlockLocal, initial, assistancePolicy], index) => ({ id, type: 'classic-9x9', difficulty, difficultyScore: index + 1, unlockLocal, unlockAt: zonedTimeToEpoch(unlockLocal, TZ), initialBoard: board(initial), solution: board(solutionStrings[id]), assistancePolicy, rewardId: `reward-${id}` }));
const rewardConfigErrors = validateRewardConfig(rewardConfig, puzzles.map((puzzle) => puzzle.id));
if (rewardConfigErrors.length) throw new Error(`Invalid reward configuration: ${rewardConfigErrors.join('; ')}`);
const now = () => Date.now(); const safe = (p) => (({ solution, ...rest }) => rest)(p);
const json = (statusCode, body) => ({ statusCode, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'access-control-allow-origin': process.env.ALLOWED_ORIGIN || '*', 'access-control-allow-headers': 'content-type,authorization', 'access-control-allow-methods': 'GET,POST,OPTIONS' }, body: JSON.stringify(body) });
function sign(payload) { const raw = Buffer.from(JSON.stringify(payload)).toString('base64url'); return `${raw}.${crypto.createHmac('sha256', SESSION_SECRET).update(raw).digest('base64url')}`; }
function user(event) { const token = event.headers?.authorization?.replace(/^Bearer\s+/i, ''); if (!token) return null; const [raw, mac] = token.split('.'); const expected = crypto.createHmac('sha256', SESSION_SECRET).update(raw).digest('base64url'); if (!mac || mac.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(mac), Buffer.from(expected))) return null; try { const claim = JSON.parse(Buffer.from(raw, 'base64url')); return claim.exp > Math.floor(now()/1000) ? { id: claim.sub, developerMode: claim.developerMode === true } : null; } catch { return null; } }
function available(puzzle, developerMode = false) { return developerMode || now() >= puzzle.unlockAt; }
async function progress(userId, puzzleId) { return (await db.send(new GetCommand({ TableName: TABLE, Key: { userId, puzzleId } }))).Item; }
const rewardRecordId = (rewardId) => `REWARD#${rewardId}`;
async function rewardState(userId, rewardId) { return progress(userId, rewardRecordId(rewardId)); }
async function saveRewardState(userId, rewardId, current, changes) { const record = { userId, puzzleId: rewardRecordId(rewardId), rewardId, openedAt: current?.openedAt || null, selectedOptionId: current?.selectedOptionId || null, updatedAt: now(), revision: (current?.revision || 0) + 1, ...changes }; await db.send(new PutCommand({ TableName: TABLE, Item: record })); return record; }
async function media(asset) {
  if (!asset?.key || !REWARDS_BUCKET) return { available: false, alt: asset?.alt || 'Contenido pendiente' };
  try { await s3.send(new HeadObjectCommand({ Bucket: REWARDS_BUCKET, Key: asset.key })); return { available: true, url: await getSignedUrl(s3, new GetObjectCommand({ Bucket: REWARDS_BUCKET, Key: asset.key }), { expiresIn: 300 }), alt: asset.alt || '' }; }
  catch (error) { console.warn('Reward media unavailable', { name: error?.name, rewardAsset: asset.key }); return { available: false, alt: asset.alt || 'Contenido pendiente' }; }
}
async function publicBlock(block) {
  const output = { type: block.type, title: block.title || '', message: block.message || '', caption: block.caption || '', transcript: block.transcript || '' };
  if (block.asset) output.media = await media(block.asset);
  if (block.poster) output.poster = await media(block.poster);
  if (block.song) output.song = { title: block.song.title || '', artist: block.song.artist || '', url: block.song.url };
  if (block.validFrom) Object.assign(output, { validFrom: block.validFrom, expiresAt: block.expiresAt || null, conditions: block.conditions || '' });
  return output;
}
async function publicReward(reward, state) {
  const output = { id: reward.id, puzzleId: reward.puzzleId, type: reward.type, title: reward.title, message: reward.message, openedAt: state?.openedAt || null };
  if (['PHOTO', 'AUDIO', 'VIDEO'].includes(reward.type)) { output.media = await media(reward.asset); if (reward.poster) output.poster = await media(reward.poster); output.caption = reward.caption || ''; output.transcript = reward.transcript || ''; }
  if (reward.type === 'SONG') output.song = reward.song;
  if (reward.type === 'VOUCHER') Object.assign(output, { validFrom: reward.validFrom, expiresAt: reward.expiresAt || null, conditions: reward.conditions || '' });
  if (reward.type === 'CHOICE') { const selected = reward.options.find((option) => option.id === state?.selectedOptionId) || null; output.choice = { permanent: reward.permanent === true, selectedOptionId: selected?.id || null, options: selected && !reward.showAllChoices ? [selected] : reward.options }; }
  if (reward.type === 'FINAL') output.blocks = await Promise.all(reward.blocks.map(publicBlock));
  return output;
}
async function completionStatus(userId) { const entries = await Promise.all(puzzles.map(async (puzzle) => [puzzle.id, await progress(userId, puzzle.id)])); return Object.fromEntries(entries); }
function unlocked(reward, completions) { return Boolean(completions[reward.puzzleId]?.completedAt); }
async function rewardSlots(userId) { const completions = await completionStatus(userId); return Promise.all(rewardConfig.rewards.map(async (reward, index) => { const isUnlocked = unlocked(reward, completions); const state = isUnlocked ? await rewardState(userId, reward.id) : null; return isUnlocked ? { slot: index + 1, unlocked: true, reward: await publicReward(reward, state) } : { slot: index + 1, unlocked: false, puzzleId: reward.puzzleId, message: `Completá el Sudoku #${reward.puzzleId} para desbloquearla.` }; })); }
async function metaReward(userId) { const completions = await completionStatus(userId); const pieces = puzzles.filter((puzzle) => completions[puzzle.id]?.completedAt).length; const enabled = rewardConfig.pieces?.enabled === true; if (!enabled) return { enabled: false, pieces: 0, totalPieces: puzzles.length, unlocked: false }; if (pieces !== puzzles.length) return { enabled: true, pieces, totalPieces: puzzles.length, unlocked: false }; const final = rewardConfig.pieces.finalReward; return { enabled: true, pieces, totalPieces: puzzles.length, unlocked: true, reward: { id: final.id, type: final.type, title: final.title, message: final.message, blocks: await Promise.all(final.blocks.map(publicBlock)) } };
}
export async function handler(event) {
  if (event.requestContext?.http?.method === 'OPTIONS') return json(204, {});
  const path = event.rawPath.replace(/^\/api\/sudoku/, '') || '/'; const method = event.requestContext?.http?.method;
  if (path === '/session' && method === 'POST') { const input = parseBody(event.body); if (!input || typeof input.accessCode !== 'string' || input.accessCode.length > 256) return json(400, { error: 'Solicitud inválida.' }); const supplied = input.accessCode; const matches = (code) => code && supplied.length === code.length && crypto.timingSafeEqual(Buffer.from(supplied), Buffer.from(code)); const developerMode = matches(DEVELOPER_ACCESS_CODE); if (!developerMode && !matches(ACCESS_CODE)) return json(401, { error: 'Código de acceso incorrecto.' }); return json(200, { token: sign({ sub: developerMode ? 'marcos-development' : 'claudia', developerMode, exp: Math.floor(now()/1000) + 60 * 60 * 24 * 14 }), developerMode }); }
  const session = user(event); if (!session) return json(401, { error: 'Tu sesión terminó. Ingresá nuevamente.' }); const userId = session.id;
  if (path === '/puzzles' && method === 'GET') { const list = await Promise.all(puzzles.map(async (p) => { const saved = await progress(userId, p.id); return { ...safe(p), available: available(p, session.developerMode), progress: saved ? { completedAt: saved.completedAt || null, percent: saved.percent || 0, updatedAt: saved.updatedAt } : null }; })); return json(200, { timezone: TZ, serverTime: new Date(now()).toISOString(), developerMode: session.developerMode, puzzles: list }); }
  if (path === '/rewards' && method === 'GET') return json(200, { rewards: await rewardSlots(userId), meta: await metaReward(userId) });
  if (path === '/rewards/meta' && method === 'GET') { const meta = await metaReward(userId); if (!meta.unlocked) return json(403, { error: 'Todavía no encontraste las seis piezas.' }); return json(200, meta); }
  const rewardMatch = path.match(/^\/rewards\/(reward-\d{2})(?:\/(open|choice))?$/);
  if (rewardMatch) {
    const reward = rewardById(rewardMatch[1]); if (!reward) return json(404, { error: 'Recompensa inexistente.' });
    const completions = await completionStatus(userId); if (!unlocked(reward, completions)) return json(403, { error: 'Completá el Sudoku correspondiente para abrir esta recompensa.' });
    const action = rewardMatch[2]; const current = await rewardState(userId, reward.id);
    if (!action && method === 'GET') return json(200, { reward: await publicReward(reward, current) });
    if (action === 'open' && method === 'POST') { const saved = await saveRewardState(userId, reward.id, current, { openedAt: current?.openedAt || now() }); return json(200, { reward: await publicReward(reward, saved) }); }
    if (action === 'choice' && method === 'POST') {
      if (reward.type !== 'CHOICE') return json(400, { error: 'Esta recompensa no requiere una elección.' }); const input = parseBody(event.body); const option = reward.options.find((candidate) => candidate.id === input?.optionId); if (!option) return json(400, { error: 'La opción elegida no es válida.' });
      if (reward.permanent && current?.selectedOptionId && current.selectedOptionId !== option.id) return json(409, { error: 'Esta elección es permanente y ya no puede cambiarse.' });
      if (reward.permanent && !current?.selectedOptionId && input?.confirmedPermanent !== true) return json(400, { error: 'Confirmá que esta elección no podrá cambiarse.' });
      const saved = await saveRewardState(userId, reward.id, current, { selectedOptionId: option.id, openedAt: current?.openedAt || now() }); return json(200, { reward: await publicReward(reward, saved) });
    }
    return json(405, { error: 'Operación no permitida.' });
  }
  const id = path.match(/^\/puzzles\/(\d{2})(?:\/(progress|hint|complete|reward))?$/); if (!id) return json(404, { error: 'No encontrado.' }); const puzzle = puzzles.find((item) => item.id === id[1]); if (!puzzle) return json(404, { error: 'Sudoku inexistente.' }); if (!available(puzzle, session.developerMode)) return json(423, { error: `Este Sudoku se desbloquea el ${new Intl.DateTimeFormat('es-UY', { dateStyle: 'long', timeZone: TZ }).format(new Date(puzzle.unlockAt))}.` });
  const action = id[2];
  if (!action && method === 'GET') return json(200, safe(puzzle));
  if (action === 'progress') { if (method === 'GET') return json(200, { progress: await progress(userId, puzzle.id) || null }); if (method === 'POST') { const data = parseBody(event.body); if (!data || !Number.isInteger(data.baseRevision) || data.baseRevision < 0 || !isValidGameState(data.state, puzzle.id, puzzle.assistancePolicy)) return json(400, { error: 'Progreso inválido.' }); const current = await progress(userId, puzzle.id); if (current && data.baseRevision !== current.revision) return json(409, { error: 'Existe una versión más reciente.', progress: current }); const record = { userId, puzzleId: puzzle.id, state: data.state, percent: Math.round(data.state.board.flat().filter(Boolean).length / 81 * 100), completedAt: current?.completedAt || null, updatedAt: now(), revision: (current?.revision || 0) + 1 }; await db.send(new PutCommand({ TableName: TABLE, Item: record })); return json(200, { revision: record.revision, updatedAt: record.updatedAt }); } }
  if (action === 'hint' && method === 'POST') { const data = parseBody(event.body); if (!puzzle.assistancePolicy.allowReveal || !data || !Number.isInteger(data.baseRevision) || !isValidGameState(data.state, puzzle.id, puzzle.assistancePolicy)) return json(400, { error: 'Esta pista no está disponible.' }); const current = await progress(userId, puzzle.id); if (current && data.baseRevision !== current.revision) return json(409, { error: 'Existe una versión más reciente.', progress: current }); const used = data.state.hintsUsed; if (puzzle.assistancePolicy.maxHints !== null && used >= puzzle.assistancePolicy.maxHints) return json(429, { error: 'Ya usaste todas las pistas de este Sudoku.' }); let target = null; for (let row = 0; row < 9 && !target; row += 1) for (let column = 0; column < 9; column += 1) if (!data.state.board[row][column]) { target = { row, column, value: puzzle.solution[row][column] }; break; } if (!target) return json(400, { error: 'No hay celdas vacías para ayudar.' }); const nextState = { ...data.state, hintsUsed: used + 1 }; const record = { userId, puzzleId: puzzle.id, state: nextState, percent: Math.round(data.state.board.flat().filter(Boolean).length / 81 * 100), completedAt: current?.completedAt || null, updatedAt: now(), revision: (current?.revision || 0) + 1 }; await db.send(new PutCommand({ TableName: TABLE, Item: record })); return json(200, { ...target, hintsUsed: nextState.hintsUsed, revision: record.revision, updatedAt: record.updatedAt }); }
  if (action === 'complete' && method === 'POST') { const data = parseBody(event.body); if (!data || !isBoard(data.board) || JSON.stringify(data.board) !== JSON.stringify(puzzle.solution)) return json(400, { error: 'El tablero no es una solución correcta.' }); const current = await progress(userId, puzzle.id); const completedAt = current?.completedAt || now(); const record = { userId, puzzleId: puzzle.id, state: { ...(current?.state || {}), board: data.board, completedAt }, percent: 100, completedAt, updatedAt: now(), revision: (current?.revision || 0) + 1 }; await db.send(new PutCommand({ TableName: TABLE, Item: record })); return json(200, { completedAt, revision: record.revision, rewardId: puzzle.rewardId }); }
  if (action === 'reward' && method === 'GET') { const saved = await progress(userId, puzzle.id); if (!saved?.completedAt) return json(403, { error: 'Completá este Sudoku para abrir su recompensa.' }); const reward = rewardByPuzzleId(puzzle.id); return json(200, { reward: await publicReward(reward, await rewardState(userId, reward.id)) }); }
  return json(405, { error: 'Operación no permitida.' });
}
