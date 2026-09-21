// Public, fictional local-only preview fixture. Never add personal content here.
const unavailable = { available: false, alt: 'Contenido pendiente' };
export const devRewards = [
  { id: 'reward-01', puzzleId: '01', type: 'PHOTO', title: 'TODO_REWARD_01_TITLE', message: 'TODO_REWARD_01_MESSAGE', caption: 'TODO_REWARD_01_CAPTION', media: unavailable },
  { id: 'reward-02', puzzleId: '02', type: 'SONG', title: 'TODO_REWARD_02_TITLE', message: 'TODO_REWARD_02_MESSAGE', song: { title: 'TODO_REWARD_02_SONG_TITLE', artist: 'TODO_REWARD_02_ARTIST', url: 'https://example.com/TODO_REWARD_02_SONG' } },
  { id: 'reward-03', puzzleId: '03', type: 'VIDEO', title: 'TODO_REWARD_03_TITLE', message: 'TODO_REWARD_03_MESSAGE', media: unavailable, poster: unavailable, transcript: 'TODO_REWARD_03_TRANSCRIPT' },
  { id: 'reward-04', puzzleId: '04', type: 'CHOICE', title: 'TODO_REWARD_04_TITLE', message: 'TODO_REWARD_04_MESSAGE', choice: { permanent: true, selectedOptionId: null, options: [{ id: 'tierna', label: 'TODO_REWARD_04_OPTION_A', description: 'TODO_REWARD_04_OPTION_A_DESCRIPTION' }, { id: 'peligrosa', label: 'TODO_REWARD_04_OPTION_B', description: 'TODO_REWARD_04_OPTION_B_DESCRIPTION' }] } },
  { id: 'reward-05', puzzleId: '05', type: 'VOUCHER', title: 'TODO_REWARD_05_TITLE', message: 'TODO_REWARD_05_MESSAGE', validFrom: '2026-10-21', expiresAt: null, conditions: 'TODO_REWARD_05_CONDITIONS' },
  { id: 'reward-06', puzzleId: '06', type: 'FINAL', title: 'TODO_REWARD_06_TITLE', message: 'TODO_REWARD_06_MESSAGE', blocks: [{ type: 'TEXT', message: 'TODO_REWARD_06_FINAL_MESSAGE' }, { type: 'PHOTO', message: '', caption: 'TODO_REWARD_06_PHOTO_CAPTION', media: unavailable }, { type: 'VIDEO', message: '', media: unavailable, transcript: 'TODO_REWARD_06_VIDEO_TRANSCRIPT' }] }
];
export const devMetaReward = { enabled: true, pieces: 6, totalPieces: 6, unlocked: true, reward: { id: 'meta-final-06', type: 'FINAL', title: 'TODO_REWARD_META_TITLE', message: 'TODO_REWARD_META_MESSAGE', blocks: [{ type: 'TEXT', message: 'TODO_REWARD_META_FINAL_MESSAGE' }, { type: 'PHOTO', message: '', media: unavailable }] } };
