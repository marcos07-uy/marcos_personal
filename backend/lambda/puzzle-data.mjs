const policy = (overrides) => ({ manualNotes: true, autoRemoveCandidates: true, highlightPeers: true, highlightSameNumbers: true, duplicateWarnings: true, autoCandidates: false, maxAutoCandidateFills: 0, solutionErrorCheck: true, maxHints: null, hintMaxLevel: 4, allowReveal: true, ...overrides });

// The single source of truth for public puzzle metadata and initial boards.
export const rawPuzzles = [
  ['01','Fácil','2026-09-30T00:00:00','530070000600195000098000060800060003400803001700020006060000280000419005000080079', policy({ autoCandidates: true, maxAutoCandidateFills: 1, maxHints: 5, hintMaxLevel: 4, allowReveal: true })],
  ['02','Fácil','2026-10-02T00:00:00','000260701680070090190004500820100040004602900050003028009300074040050036703018000', policy({ maxHints: 3, hintMaxLevel: 4, allowReveal: true })],
  ['03','Fácil / Medio','2026-10-05T00:00:00','300000000005009000200504000020000700160000058704310600000890100000067080000005437', policy({ maxHints: 1, hintMaxLevel: 4, allowReveal: true })],
  ['04','Medio','2026-10-07T00:00:00','000000907000420180000705026100904000050000040000507009920108000034059000507000000', policy({ maxHints: 3, hintMaxLevel: 3, allowReveal: false })],
  ['05','Medio','2026-10-10T00:00:00','500070000000190008108040007050000020006803791000004806960037000207009005040206009', policy({ hintMaxLevel: 2, maxHints: 5, allowReveal: false })],
  ['06','Medio / Difícil','2026-10-12T00:00:00','200080300060070084030500209000105408000000000402706000301007040720040060004010003', policy({ autoCandidates: false, hintMaxLevel: 2, maxHints: 4, allowReveal: false })],
  ['07','Difícil','2026-10-14T00:00:00','000600910002000008108300000000060000400000001000020850060500004280019000340006070', policy({ autoCandidates: false, hintMaxLevel: 2, maxHints: 3, allowReveal: false, solutionErrorCheck: true })],
  ['08','Difícil','2026-10-16T00:00:00','000000000000003085001020000000507000004000100090000000500000073002010000000040009', policy({ autoCandidates: false, hintMaxLevel: 2, maxHints: 2, allowReveal: false })],
  ['09','Muy difícil','2026-10-18T00:00:00','100007090030020008009600500005300900010080002600004000300000010040000007007000300', policy({ autoCandidates: false, solutionErrorCheck: false, hintMaxLevel: 1, maxHints: 1, allowReveal: false })],
  ['10','Experto','2026-10-19T00:00:00','000000010400000000020000000000050407008000300001090000300400200050100000000806000', policy({ autoCandidates: false, solutionErrorCheck: false, hintMaxLevel: 1, maxHints: 1, allowReveal: false })]
];
