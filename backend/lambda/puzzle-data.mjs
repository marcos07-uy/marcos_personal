const policy = (overrides) => ({ manualNotes: true, autoRemoveCandidates: true, highlightPeers: true, highlightSameNumbers: true, duplicateWarnings: true, autoCandidates: false, maxAutoCandidateFills: 0, solutionErrorCheck: true, maxHints: null, hintMaxLevel: 4, allowReveal: true, ...overrides });

// The single source of truth for public puzzle metadata and initial boards.
export const rawPuzzles = [
  ['01','Fácil','2026-09-30T19:30:00','435269781682571493197834562820100040004602900050003028009300074040050036703018000', policy({ autoCandidates: true, maxAutoCandidateFills: 2, maxHints: 5, hintMaxLevel: 4, allowReveal: true })],
  ['02','Accesible','2026-10-03T00:00:00','530070000600195000098000060800060003400803001700020006060000280000419005000080079', policy({ maxHints: 3, hintMaxLevel: 4, allowReveal: true })],
  ['03','Accesible','2026-10-07T00:00:00','245080300060070084030500209000105408000000000402706000301007040720040060004010003', policy({ maxHints: 2, hintMaxLevel: 4, allowReveal: true })],
  ['04','Accesible','2026-10-10T00:00:00','534678912672000008108300000000060000400000001000020850060500004280019000340006070', policy({ maxHints: 2, hintMaxLevel: 4, allowReveal: true })],
  ['05','Un poco menos accesible','2026-10-15T00:00:00','800020700040030026070500801000905602000000000608304000709003060380060040006090007', policy({ hintMaxLevel: 3, maxHints: 2, allowReveal: true })],
  ['06','Quizás un poco complicado','2026-10-18T00:00:00','000400190008000002902700000000040000600000009000080250040500006820091000760004030', policy({ autoCandidates: true, maxAutoCandidateFills: 1, solutionErrorCheck: true, hintMaxLevel: 3, maxHints: 2, allowReveal: false })]
];
