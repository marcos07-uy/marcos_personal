const SIZE = 9;
const MAX_HISTORY = 80;
const MAX_STATE_BYTES = 180_000;

export function isBoard(value) {
  return Array.isArray(value) && value.length === SIZE && value.every((row) => Array.isArray(row) && row.length === SIZE && row.every((cell) => Number.isInteger(cell) && cell >= 0 && cell <= 9));
}

function isNotes(value, board) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  return Object.entries(value).every(([key, candidates]) => {
    const match = /^(\d):(\d)$/.exec(key); if (!match) return false;
    const row = Number(match[1]); const column = Number(match[2]);
    return row < SIZE && column < SIZE && board[row][column] === 0 && Array.isArray(candidates) && candidates.length <= SIZE && candidates.every((candidate) => Number.isInteger(candidate) && candidate >= 1 && candidate <= 9) && new Set(candidates).size === candidates.length;
  });
}

function isSnapshot(value) { return value && isBoard(value.board) && isNotes(value.notes, value.board); }

export function isValidGameState(state, puzzleId, policy) {
  if (!state || typeof state !== 'object' || state.puzzleId !== puzzleId || state.schemaVersion !== 1 || !isBoard(state.board) || !isNotes(state.notes, state.board)) return false;
  if (!Number.isInteger(state.elapsedMs) || state.elapsedMs < 0 || state.elapsedMs > 1000 * 60 * 60 * 24 * 365 * 3) return false;
  if (!Number.isInteger(state.hintsUsed) || state.hintsUsed < 0 || (policy.maxHints !== null && state.hintsUsed > policy.maxHints)) return false;
  if (!Number.isInteger(state.autoCandidateFills) || state.autoCandidateFills < 0 || state.autoCandidateFills > (policy.maxAutoCandidateFills || 0)) return false;
  if (!Array.isArray(state.history) || state.history.length > MAX_HISTORY || !Number.isInteger(state.historyIndex) || state.historyIndex < -1 || state.historyIndex >= state.history.length) return false;
  if (!state.history.every((move) => move && isSnapshot(move.before) && isSnapshot(move.after))) return false;
  try { return Buffer.byteLength(JSON.stringify(state), 'utf8') <= MAX_STATE_BYTES; } catch { return false; }
}

export function parseBody(body) {
  try { return JSON.parse(body || '{}'); } catch { return null; }
}

const ANSWERS = new Set(['landscape', 'activities', 'walks', 'experience', 'evenings', 'transfers', 'keep', 'pace']);
const MAX_TEXT = 180;

export function isValidAdventureProfile(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  if (!value.answers || typeof value.answers !== 'object' || Array.isArray(value.answers)) return false;
  if (!Object.keys(value.answers).every((key) => ANSWERS.has(key) && typeof value.answers[key] === 'string' && value.answers[key].length <= 80)) return false;
  if (!Array.isArray(value.dreams) || value.dreams.length > 3 || !value.dreams.every((item) => typeof item === 'string' && item.trim().length <= MAX_TEXT)) return false;
  return value.completed === undefined || typeof value.completed === 'boolean';
}

export function isValidAdventureFavorite(value) {
  return value && typeof value === 'object' && typeof value.destinationId === 'string' && /^[a-z0-9-]{2,80}$/.test(value.destinationId)
    && ['love', 'want', 'review', 'low'].includes(value.status);
}
