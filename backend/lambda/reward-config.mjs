export const REWARD_TYPES = new Set(['PHOTO', 'TEXT', 'AUDIO', 'VIDEO', 'SONG', 'VOUCHER', 'CHOICE', 'FINAL']);

// This file is packaged only with Lambda. Replace TODO_REWARD values and asset keys here.
// Never place private media under static/ or content/.
export const rewardConfig = {
  pieces: {
    enabled: true,
    finalReward: {
      id: 'meta-final-06', type: 'FINAL', title: 'TODO_REWARD_META_TITLE', message: 'TODO_REWARD_META_MESSAGE',
      blocks: [{ type: 'TEXT', message: 'TODO_REWARD_META_FINAL_MESSAGE' }, { type: 'PHOTO', asset: { key: 'rewards/meta-final/final.jpg', alt: 'TODO_REWARD_META_FINAL_ALT' }, caption: 'TODO_REWARD_META_FINAL_CAPTION' }]
    }
  },
  rewards: [
    { id: 'reward-01', puzzleId: '01', type: 'PHOTO', title: 'TODO_REWARD_01_TITLE', message: 'TODO_REWARD_01_MESSAGE', caption: 'TODO_REWARD_01_CAPTION', asset: { key: 'rewards/reward-01/photo.jpg', alt: 'TODO_REWARD_01_ALT' }, enabled: true },
    { id: 'reward-02', puzzleId: '02', type: 'SONG', title: 'TODO_REWARD_02_TITLE', message: 'TODO_REWARD_02_MESSAGE', song: { title: 'TODO_REWARD_02_SONG_TITLE', artist: 'TODO_REWARD_02_ARTIST', url: 'https://example.com/TODO_REWARD_02_SONG' }, enabled: true },
    { id: 'reward-03', puzzleId: '03', type: 'VIDEO', title: 'TODO_REWARD_03_TITLE', message: 'TODO_REWARD_03_MESSAGE', asset: { key: 'rewards/reward-03/video.mp4', alt: 'TODO_REWARD_03_VIDEO_DESCRIPTION' }, poster: { key: 'rewards/reward-03/poster.jpg', alt: 'TODO_REWARD_03_POSTER_ALT' }, transcript: 'TODO_REWARD_03_TRANSCRIPT', enabled: true },
    { id: 'reward-04', puzzleId: '04', type: 'CHOICE', title: 'TODO_REWARD_04_TITLE', message: 'TODO_REWARD_04_MESSAGE', permanent: true, showAllChoices: false, options: [{ id: 'tierna', label: 'TODO_REWARD_04_OPTION_A', description: 'TODO_REWARD_04_OPTION_A_DESCRIPTION' }, { id: 'peligrosa', label: 'TODO_REWARD_04_OPTION_B', description: 'TODO_REWARD_04_OPTION_B_DESCRIPTION' }], enabled: true },
    { id: 'reward-05', puzzleId: '05', type: 'VOUCHER', title: 'TODO_REWARD_05_TITLE', message: 'TODO_REWARD_05_MESSAGE', validFrom: '2026-10-21', expiresAt: null, conditions: 'TODO_REWARD_05_CONDITIONS', enabled: true },
    { id: 'reward-06', puzzleId: '06', type: 'FINAL', title: 'TODO_REWARD_06_TITLE', message: 'TODO_REWARD_06_MESSAGE', blocks: [{ type: 'TEXT', message: 'TODO_REWARD_06_FINAL_MESSAGE' }, { type: 'PHOTO', asset: { key: 'rewards/reward-06/final-photo.jpg', alt: 'TODO_REWARD_06_PHOTO_ALT' }, caption: 'TODO_REWARD_06_PHOTO_CAPTION' }, { type: 'VIDEO', asset: { key: 'rewards/reward-06/final-video.mp4', alt: 'TODO_REWARD_06_VIDEO_DESCRIPTION' }, transcript: 'TODO_REWARD_06_VIDEO_TRANSCRIPT' }], enabled: true }
  ]
};

const isUrl = (value) => { try { const url = new URL(value); return ['https:', 'http:'].includes(url.protocol); } catch { return false; } };
const validateAsset = (asset, label, errors) => { if (!asset || typeof asset.key !== 'string' || !asset.key.startsWith('rewards/')) errors.push(`${label} must have a private rewards/ asset key`); };
const validateBlocks = (blocks, label, errors) => { if (!Array.isArray(blocks) || !blocks.length) { errors.push(`${label} must contain at least one block`); return; } blocks.forEach((block, index) => { if (!REWARD_TYPES.has(block.type)) errors.push(`${label}.blocks[${index}] has an unsupported type`); if (['PHOTO', 'AUDIO', 'VIDEO'].includes(block.type)) validateAsset(block.asset, `${label}.blocks[${index}]`, errors); }); };

export function validateRewardConfig(config = rewardConfig, puzzleIds = ['01', '02', '03', '04', '05', '06']) {
  const errors = []; const ids = new Set(); const mapped = new Set();
  if (!Array.isArray(config.rewards)) return ['rewards must be an array'];
  config.rewards.forEach((reward, index) => {
    const label = `rewards[${index}]`;
    if (!reward.id || ids.has(reward.id)) errors.push(`${label} has a duplicate or missing id`); ids.add(reward.id);
    if (!puzzleIds.includes(reward.puzzleId) || mapped.has(reward.puzzleId)) errors.push(`${label} must map once to a valid puzzle`); mapped.add(reward.puzzleId);
    if (!REWARD_TYPES.has(reward.type)) errors.push(`${label} has an unsupported type`);
    if (!reward.title || !reward.message) errors.push(`${label} needs title and message`);
    if (['PHOTO', 'AUDIO', 'VIDEO'].includes(reward.type)) validateAsset(reward.asset, label, errors);
    if (reward.type === 'SONG' && (!reward.song || !isUrl(reward.song.url))) errors.push(`${label} needs a valid song URL`);
    if (reward.type === 'CHOICE' && (!Array.isArray(reward.options) || reward.options.length < 2 || new Set(reward.options.map((option) => option.id)).size !== reward.options.length)) errors.push(`${label} needs at least two uniquely identified options`);
    if (reward.type === 'FINAL') validateBlocks(reward.blocks, label, errors);
  });
  if (mapped.size !== puzzleIds.length) errors.push('every production puzzle must have exactly one reward');
  if (config.pieces?.enabled) validateBlocks(config.pieces.finalReward?.blocks, 'pieces.finalReward', errors);
  return errors;
}

export const rewardById = (id) => rewardConfig.rewards.find((reward) => reward.id === id && reward.enabled);
export const rewardByPuzzleId = (puzzleId) => rewardConfig.rewards.find((reward) => reward.puzzleId === puzzleId && reward.enabled);
