export const REWARD_TYPES = new Set(['PHOTO', 'TEXT', 'AUDIO', 'VIDEO', 'SONG', 'VOUCHER', 'CHOICE', 'FINAL', 'STORY']);

export const teAmoMasDataset = {
  endDate: '2026-09-25', messages: { marcos: 19909, claudia: 17182 }, teAmoMessages: { marcos: 133, claudia: 120 },
  historicalEvents: {
    firstMas: { date: '28 de febrero de 2026', messages: [{ author: 'Marcos', text: 'Te quiero Clau' }, { author: 'Claudia', text: 'Yo mas' }] },
    firstTeAmo: { date: '17 de marzo de 2026', messages: [{ author: 'Claudia', text: 'Gracias por acompañarme 🥰' }, { author: 'Marcos', text: 'Obvio que te iba a acompañar' }, { author: 'Marcos', text: 'Yo te amo' }] },
    masExample: { date: '20 de marzo de 2026', messages: [{ author: 'Claudia', text: 'Te amo' }, { author: 'Marcos', text: 'Yo mas' }] },
    finalExample: { date: '25 de septiembre de 2026', messages: [{ author: 'Claudia', text: 'Te amo' }, { author: 'Marcos', text: 'Te amo +' }] }
  }
};
export const teAmoMasMetrics = (dataset = teAmoMasDataset) => ({ totalMessages: dataset.messages.marcos + dataset.messages.claudia, totalTeAmoMessages: dataset.teAmoMessages.marcos + dataset.teAmoMessages.claudia, rawDifference: dataset.teAmoMessages.marcos - dataset.teAmoMessages.claudia, teAmoPer1000Marcos: dataset.teAmoMessages.marcos / dataset.messages.marcos * 1000, teAmoPer1000Claudia: dataset.teAmoMessages.claudia / dataset.messages.claudia * 1000 });

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
    { id: 'reward-01', puzzleId: '01', type: 'STORY', title: 'Dos fotos', message: 'Dos fotos', enabled: true,
      scenes: [
        { id: 'primera-recompensa', layout: 'intro', title: 'Primera recompensa.', text: ['Para esta no tuve que buscar demasiado.', 'Elegí dos fotos.'], action: 'VER LA PRIMERA' },
        { id: 'primera-foto', layout: 'photo-led', asset: { key: 'rewards/reward-01/1era.jpg', alt: 'La primera fotografía de Marcos y Claudia juntos.' }, photoFirst: true, text: ['Nuestra primera foto juntos.', 'Todavía estábamos aprendiendo a sacarnos fotos.', 'Algunas cosas, por suerte, salieron bastante mejor.'], action: 'SIGUIENTE' },
        { id: 'diciembre', layout: 'sparse', text: ['La segunda es del 5 de diciembre.', 'Probablemente para vos sea simplemente una foto.', 'Para mí no.'], action: 'VER FOTO' },
        { id: 'sin-vuelta-atras', layout: 'photo-led landscape', asset: { key: 'rewards/reward-01/5dic.jpg', alt: 'Una fotografía de Marcos y Claudia del 5 de diciembre.' }, photoFirst: true, staged: true, text: ['Me acuerdo de mirarte ese día y darme cuenta de algo bastante simple:', 'ya no había vuelta atrás.', 'Estaba completamente entregado.', 'Lo cual, considerando que todavía era diciembre, debería haberme preocupado un poco más.'] },
        { id: 'como-funciona', layout: 'final', text: ['Y así funciona esto.', 'Mientras estés lejos, cada Sudoku va a tener algo nuestro esperándote del otro lado.', 'A veces va a ser un recuerdo.', 'A veces algo que probablemente me tomé demasiado en serio.', 'Y alguna cosa que todavía no sabés.', 'Esta era la primera.', 'Buen viaje, amor.', 'Nos vemos en el próximo.'] }
      ] },
    {
      id: 'reward-02', puzzleId: '02', type: 'STORY', title: 'Nuestra historia hasta ahora', message: 'Nuestra historia hasta ahora', enabled: true,
      scenes: [
        { id: 'intro', layout: 'intro', title: 'Nuestra historia hasta ahora', text: ['Algunas cosas empiezan sin que uno se dé cuenta de que están empezando.', 'Esta es una de esas.'], action: 'EMPEZAR' },
        { id: 'noviembre', layout: 'conversation', date: '9 de noviembre de 2025', title: 'Antes de que esto tuviera nombre', messages: [{ author: 'Marcos', text: 'Me importa muy poco honestamente, te quiero ver, me gusta pasar tiempo contigo' }, { author: 'Claudia', text: 'Me encanta!!' }], text: ['En ese momento parecía simplemente eso: ganas de vernos.'] },
        { id: 'diciembre', layout: 'conversation playful', date: '6 de diciembre de 2025', title: 'Después apareció esto...', messages: [{ author: 'Claudia', text: 'Sabes que…creo que ya te estoy extrañando un poco, solo un poco' }, { author: 'Marcos', text: 'Nope, porque yo también te extraño' }, { author: 'Claudia', text: 'Decís que es absurdo?' }, { author: 'Marcos', text: 'No sabía que esto era un número discreto, para mí es una variable binaria' }], text: ['Evidentemente el romanticismo nunca estuvo peleado con ser ingeniero.'] },
        { id: 'enero', layout: 'photo-story', date: 'Enero de 2026', title: 'Batman tenía un problema.', text: ['Había una parte muy importante de mi vida que todavía no conocías.', 'Y eso hacía que algunos días nuestros mundos tuvieran que seguir separados.'], messages: [{ author: 'Claudia', text: 'Por qué me haces feliz' }, { author: 'Marcos', text: 'Vos me haces feliz...' }, { author: 'Marcos', text: 'yo también te quiero involucrar más en mi vida' }, { author: 'Marcos', text: 'Realmente me gustaría que te conocieran, porque ellos me ven bien, y vos sos la razón.' }], asset: { key: 'rewards/reward-02/19enero.jpg', alt: 'Una fotografía de Marcos y Claudia en enero de 2026.' }, after: ['Todavía faltaba para que eso pasara.', 'Pero creo que para entonces yo ya sabía que quería que pasara.'] },
        { id: 'marzo', layout: 'sparse', moments: [{ date: '17 de marzo de 2026', messages: [{ author: 'Marcos', text: 'Yo te amo' }] }, { date: '20 de marzo de 2026', messages: [{ author: 'Claudia', text: 'Te amo' }, { author: 'Marcos', text: 'Yo mas' }] }] },
        { id: 'abril', layout: 'conversation', date: '7 de abril de 2026', text: ['En algún momento también cambió cómo nos hablábamos.'], messages: [{ author: 'Claudia', text: 'Que bueno amor te haya ido bien!!' }, { author: 'Marcos', text: 'Te amo... Me gusta que me digas amor' }, { author: 'Marcos', text: 'Amor' }, { author: 'Claudia', text: 'Creo que es mejor que mi princeso 😂' }], moments: [{ date: '21 de abril de 2026', text: ['Y hasta intentamos resolver una cuestión bastante importante...'], messages: [{ author: 'Claudia', text: 'Empezamos a hablar el 7/10 por instagram 🙂' }, { author: 'Marcos', text: 'vos decis que deberiamos poner una fecha? quizas la primera vez que te vi en persona...' }] }], after: ['Todavía no sé exactamente qué día empezó todo.', 'Por suerte, tampoco importa demasiado.'] },
        { id: 'mayo', layout: 'photo-led', date: '8 de mayo de 2026', title: 'Ya éramos nosotros.', asset: { key: 'rewards/reward-02/8mayo.jpg', alt: 'Una fotografía de Marcos y Claudia en mayo de 2026.' }, moments: [{ date: '22 de mayo de 2026', messages: [{ author: 'Claudia', text: 'Te amo mucho y soy muy feliz a tu lado. Te voy a extrañar mucho.' }, { author: 'Marcos', text: 'me olvidé de poner una foto nuestra que imprimí para que te lleves de recuerdo' }] }] },
        { id: 'septiembre', layout: 'present', text: ['Después hubo muchas cosas más.'], beats: ['Entrenamientos.', 'Cenas.', 'Viajes.', 'Días buenos.', 'Algún día no tan bueno.', 'Mimos.', 'Risas.', 'Planes.', 'Muchísimos mensajes.'], after: ['Y un montón de vida en el medio.'], date: '20 de septiembre de 2026', asset: { key: 'rewards/reward-02/20septiembre.jpg', alt: 'Una fotografía de Marcos y Claudia en septiembre de 2026.' }, caption: 'Nosotros, hoy.' },
        { id: 'final', layout: 'final', text: ['En unos días te toca irte lejos por un tiempo.', 'Hice esto porque quería encontrar una forma de acompañarte un poquito durante el viaje.', 'Así que escondí algunos pedacitos de nosotros entre números.', 'No sustituye tenerte cerca, pero por ahora tendrá que servir.'], final: 'Te amo. Más.' }
      ]
    },
    { id: 'reward-03', puzzleId: '03', type: 'VIDEO', title: 'TODO_REWARD_03_TITLE', message: 'TODO_REWARD_03_MESSAGE', asset: { key: 'rewards/reward-03/video.mp4', alt: 'TODO_REWARD_03_VIDEO_DESCRIPTION' }, poster: { key: 'rewards/reward-03/poster.jpg', alt: 'TODO_REWARD_03_POSTER_ALT' }, transcript: 'TODO_REWARD_03_TRANSCRIPT', enabled: true },
    { id: 'reward-04', puzzleId: '04', type: 'CHOICE', title: 'TODO_REWARD_04_TITLE', message: 'TODO_REWARD_04_MESSAGE', permanent: true, showAllChoices: false, options: [{ id: 'tierna', label: 'TODO_REWARD_04_OPTION_A', description: 'TODO_REWARD_04_OPTION_A_DESCRIPTION' }, { id: 'peligrosa', label: 'TODO_REWARD_04_OPTION_B', description: 'TODO_REWARD_04_OPTION_B_DESCRIPTION' }], enabled: true },
    { id: 'reward-05', puzzleId: '05', type: 'STORY', storyKind: 'te-amo-mas', title: 'Te amo más', message: 'Te amo más', dataset: teAmoMasDataset, enabled: true,
      scenes: [
        { id: 'investigacion', layout: 'analysis-intro', text: ['Hay una discusión que tenemos hace tiempo.', 'Vos decís:', '"Te amo."', 'Y yo, inevitablemente:', '"Te amo más."', 'Así que decidí que ya era hora de determinar si tengo alguna evidencia para semejante afirmación.'], final: 'Con datos.', action: 'COMENZAR INVESTIGACIÓN' },
        { id: 'hipotesis', layout: 'hypothesis', label: 'HIPÓTESIS', title: 'Marcos ama más.', text: ['Evidencia disponible: {totalMessages} mensajes.', 'Esto debería ser fácil.'], action: 'ANALIZAR' },
        { id: 'prediccion-te-amo', layout: 'prediction', text: ['Antes de mirar los resultados...', '¿Quién escribió "te amo" más veces?'], interaction: 'predictionTeAmo', action: 'VER RESULTADO' },
        { id: 'victoria', layout: 'results', metric: 'raw', text: ['Diferencia: {rawDifference}', 'Caso cerrado.', 'Te amo más.'], action: 'CONTINUAR' },
        { id: 'objecion', layout: 'objection', text: ['Aunque...', 'hay un pequeño problema con mi impecable metodología.', 'Yo también escribí más.', 'Bastante más.', 'Claudia tiene derecho a impugnar el estudio.'], action: 'NORMALIZAR AFECTO' },
        { id: 'normalizacion', layout: 'normalized', text: ['"te amo" por cada 1.000 mensajes', '...', 'No vamos a hablar de esta estadística.', '¿Desea Claudia cerrar la investigación ahora?'], interaction: 'closeInvestigation' },
        { id: 'pregunta-incorrecta', layout: 'wrong-question', text: ['Un momento.', 'Estamos midiendo la cosa equivocada.', 'La discusión nunca fue quién dice más veces "te amo".', 'Vos decís:', 'Te amo.', 'Yo digo:', 'Te amo más.', 'El "más" es parte fundamental de la hipótesis.'] },
        { id: 'evidencia', layout: 'evidence', title: 'Evidencia documental', event: 'masExample', text: ['Hay evidencia abundante de que llevo meses insistiendo con el "más".', 'Eso no demuestra nada.', 'Pero demuestra constancia.'] },
        { id: 'giro', layout: 'twist', text: ['Pero encontré algo peor.', 'Técnicamente...', 'esto lo empezaste vos.'], event: 'firstMas', after: ['Esto fue antes del primer "te amo" que aparece en el historial.', 'Caso reabierto.'] },
        { id: 'primer-te-amo', layout: 'prediction', text: ['Ya que llegamos hasta acá...', '¿Quién escribió el primer "te amo" que aparece en nuestro historial?'], interaction: 'predictionFirstTeAmo', action: 'VER RESULTADO', event: 'firstTeAmo', after: ['Punto para mí.', 'No sé exactamente qué punto, pero punto para mí.'] },
        { id: 'ultimo-indicio', layout: 'evidence', title: 'Y la investigación llega casi hasta hoy.', event: 'finalExample', text: ['Cinco minutos.', 'Ni siquiera pude dejar pasar cinco minutos sin agregarle algo.'] },
        { id: 'resultados', layout: 'summary', title: 'RESULTADOS DE LA INVESTIGACIÓN', action: 'CONTINUAR', interaction: 'methodology' },
        { id: 'revision', layout: 'peer-review', title: 'Conclusión científica', text: ['Después de analizar {totalMessages} mensajes y encontrar {totalTeAmoMessages} mensajes con "te amo", no pude demostrar científicamente que te amo más.', 'De hecho, algunas estadísticas son bastante inconvenientes para mi hipótesis.', 'El estudio presenta además un pequeño conflicto de interés:', 'fue diseñado, ejecutado y revisado por Marcos.', 'Nivel de rigor científico: discutible.', 'Pero hay una cosa que los datos sí demuestran.', 'Llevo meses diciéndote que te amo más.'], action: 'VER CONCLUSIÓN DE MARCOS' },
        { id: 'final', layout: 'final', text: ['No necesito ganar esta discusión.', 'Me alcanza con poder seguir teniéndola contigo durante mucho tiempo.', 'Te amo.'], final: 'Más.' }
      ] },
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
    if (reward.type === 'STORY') {
      if (!Array.isArray(reward.scenes) || reward.scenes.length < 2) errors.push(`${label} must contain story scenes`);
      reward.scenes?.forEach((scene, sceneIndex) => { if (!scene.id) errors.push(`${label}.scenes[${sceneIndex}] needs an id`); if (scene.asset) validateAsset(scene.asset, `${label}.scenes[${sceneIndex}]`, errors); });
    }
  });
  if (mapped.size !== puzzleIds.length) errors.push('every production puzzle must have exactly one reward');
  if (config.pieces?.enabled) validateBlocks(config.pieces.finalReward?.blocks, 'pieces.finalReward', errors);
  return errors;
}

export const rewardById = (id) => rewardConfig.rewards.find((reward) => reward.id === id && reward.enabled);
export const rewardByPuzzleId = (puzzleId) => rewardConfig.rewards.find((reward) => reward.puzzleId === puzzleId && reward.enabled);
