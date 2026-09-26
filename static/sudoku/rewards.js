const esc = (value = '') => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[char]);
const date = (value) => value ? new Intl.DateTimeFormat('es-UY', { dateStyle: 'long' }).format(new Date(`${value}T00:00:00`)) : 'sin vencimiento';
const missing = () => '<div class="reward-missing" role="status">Contenido pendiente</div>';
const media = (asset, type, extra = '') => {
  if (!asset?.available || !asset.url) return missing();
  if (type === 'PHOTO') return `<img class="reward-photo" src="${esc(asset.url)}" alt="${esc(asset.alt)}">`;
  if (type === 'AUDIO') return `<audio class="reward-audio" controls preload="metadata"><source src="${esc(asset.url)}">Tu navegador no puede reproducir este audio.</audio>`;
  if (type === 'VIDEO') return `<video class="reward-video" controls playsinline preload="metadata" ${extra}><source src="${esc(asset.url)}">Tu navegador no puede reproducir este video.</video>`;
  return missing();
};
const voucher = (reward) => `<section class="reward-voucher"><p>VALE OFICIAL</p><h2>${esc(reward.title)}</h2><p>${esc(reward.message)}</p><dl><dt>Válido desde</dt><dd>${esc(date(reward.validFrom))}</dd><dt>Vencimiento</dt><dd>${esc(date(reward.expiresAt))}</dd>${reward.conditions ? `<dt>Condiciones</dt><dd>${esc(reward.conditions)}</dd>` : ''}</dl></section>`;
const song = (item) => `<div class="reward-song"><p>${esc(item.song?.title || 'Canción pendiente')}${item.song?.artist ? ` · ${esc(item.song.artist)}` : ''}</p>${item.song?.url ? `<a class="sudoku-primary reward-link" href="${esc(item.song.url)}" target="_blank" rel="noopener noreferrer">Abrir canción</a>` : missing()}</div>`;
const choice = (reward) => `<section class="reward-choice"><p>${reward.choice?.selectedOptionId ? 'Tu elección' : 'Elegí sabiamente…'}</p>${(reward.choice?.options || []).map((option) => `<button class="reward-choice-option ${option.id === reward.choice.selectedOptionId ? 'selected' : ''}" data-choice="${esc(option.id)}" ${reward.choice?.selectedOptionId && reward.choice?.permanent ? 'disabled' : ''}><strong>${esc(option.label)}</strong><small>${esc(option.description || '')}</small></button>`).join('')}</section>`;
const format = (value, digits = 0) => new Intl.NumberFormat('es-UY', { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(value);
const storyMetrics = (dataset) => ({ totalMessages: dataset.messages.marcos + dataset.messages.claudia, totalTeAmoMessages: dataset.teAmoMessages.marcos + dataset.teAmoMessages.claudia, rawDifference: dataset.teAmoMessages.marcos - dataset.teAmoMessages.claudia, teAmoPer1000Marcos: dataset.teAmoMessages.marcos / dataset.messages.marcos * 1000, teAmoPer1000Claudia: dataset.teAmoMessages.claudia / dataset.messages.claudia * 1000 });
const interpolate = (value, metrics) => String(value).replace(/\{(totalMessages|totalTeAmoMessages|rawDifference)\}/g, (_, key) => format(metrics[key]));
const paragraphs = (items = '', className = '', metrics = {}) => (Array.isArray(items) ? items : [items]).filter(Boolean).map((item) => `<p class="${className}">${esc(interpolate(item, metrics))}</p>`).join('');
const messages = (items = []) => items.map((item) => `<article class="story-message ${item.author === 'Claudia' ? 'claudia' : 'marcos'}"><small>${esc(item.author)}</small><p>${esc(item.text)}</p></article>`).join('');
const moment = (item) => `<section class="story-moment">${item.date ? `<p class="story-date">${esc(item.date)}</p>` : ''}${paragraphs(item.text, 'story-copy')}${messages(item.messages)}</section>`;
const metricCard = (name, value, detail = '') => `<article class="analysis-metric"><small>${esc(name)}</small><strong>${esc(value)}</strong>${detail ? `<span>${esc(detail)}</span>` : ''}</article>`;
const eventMarkup = (event) => `<section class="story-moment"><p class="story-date">${esc(event.date)}</p>${messages(event.messages)}</section>`;
const methodology = (dataset, metrics) => `<aside class="analysis-methodology"><h2>Metodología</h2><dl><dt>Período analizado</dt><dd>Hasta el ${esc(formatDate(dataset.endDate))}</dd><dt>Mensajes analizados</dt><dd>${format(metrics.totalMessages)}</dd><dt>Marcos</dt><dd>${format(dataset.messages.marcos)}</dd><dt>Claudia</dt><dd>${format(dataset.messages.claudia)}</dd><dt>Mensajes con "te amo"</dt><dd>${format(metrics.totalTeAmoMessages)}</dd><dt>Criterio</dt><dd>Se contaron los mensajes de cada persona que contienen explícitamente la expresión "te amo" y luego se comparó también su frecuencia respecto del total de mensajes enviados por cada uno.</dd></dl><p>Sí, me tomé esto demasiado en serio.</p></aside>`;
const formatDate = (iso) => new Intl.DateTimeFormat('es-UY', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${iso}T00:00:00Z`));
function teAmoMasMarkup(reward, scene, index, state) {
  const dataset = reward.dataset; const metrics = storyMetrics(dataset); const event = scene.event ? dataset.historicalEvents[scene.event] : null;
  const title = scene.title ? `<h1 id="story-title-${index}">${esc(scene.title)}</h1>` : `<h1 id="story-title-${index}" class="visually-hidden">${esc(reward.title)}</h1>`;
  let feature = '';
  if (scene.metric === 'raw') feature = `<div class="analysis-grid">${metricCard('MARCOS', format(dataset.teAmoMessages.marcos))}${metricCard('CLAUDIA', format(dataset.teAmoMessages.claudia))}</div><p class="analysis-label">mensajes que contienen "te amo"</p>`;
  if (scene.layout === 'objection') feature = `<div class="analysis-grid">${metricCard('MARCOS', format(dataset.messages.marcos), 'mensajes')}${metricCard('CLAUDIA', format(dataset.messages.claudia), 'mensajes')}</div>`;
  if (scene.layout === 'normalized') feature = `<div class="analysis-grid analysis-rates">${metricCard('MARCOS', format(metrics.teAmoPer1000Marcos, 2))}${metricCard('CLAUDIA', format(metrics.teAmoPer1000Claudia, 2))}</div>${state.closeInvestigation === 'yes' ? '<p class="analysis-response">Solicitud rechazada por el investigador principal.</p>' : ''}<div class="analysis-choices"><button data-story-choice="closeInvestigation:yes" class="sudoku-secondary">SÍ, OBVIAMENTE</button><button data-story-choice="closeInvestigation:no" class="sudoku-primary">NO, QUIERO VER CÓMO MARCOS INTENTA SALVAR ESTO</button></div>`;
  if (scene.layout === 'prediction') { const key = scene.interaction; const selected = state[key]; feature = selected ? `<p class="analysis-response">Predicción registrada.</p>` : `<div class="analysis-choices"><button data-story-choice="${key}:claudia" class="sudoku-secondary">CLAUDIA</button><button data-story-choice="${key}:marcos" class="sudoku-primary">MARCOS</button></div>`; if (scene.event && state[`${key}Revealed`]) feature += `${eventMarkup(event)}${paragraphs(scene.after, 'story-copy story-after', metrics)}`; }
  if (scene.layout === 'evidence' || scene.layout === 'twist') feature = eventMarkup(event);
  if (scene.layout === 'summary') feature = `<div class="analysis-summary">${metricCard('Mensajes analizados', format(metrics.totalMessages))}${metricCard('Mensajes explícitos con "te amo"', format(metrics.totalTeAmoMessages))}${metricCard('Más mensajes totales', 'Marcos')}${metricCard('Más mensajes con "te amo"', 'Marcos')}${metricCard('Mayor frecuencia de "te amo"', 'Claudia')}${metricCard('Primer "te amo" en el historial', 'Marcos')}${metricCard('Primer "más" afectivo documentado', 'Claudia')}${metricCard('Quien abusó sistemáticamente del "más"', 'Marcos')}</div>${state.methodology ? methodology(dataset, metrics) : '<button data-story-choice="methodology:open" class="sudoku-text-button">Ver metodología</button>'}`;
  return `<section class="reward-story analysis-story story-layout-${esc(scene.layout || 'standard')}" data-scene="${index}" tabindex="-1" aria-labelledby="story-title-${index}"><header>${scene.label ? `<p class="story-date">${esc(scene.label)}</p>` : ''}${title}</header>${paragraphs(scene.text, 'story-copy', metrics)}${feature}${paragraphs(scene.after, 'story-copy story-after', metrics)}${scene.final ? `<p class="story-final">${esc(scene.final)}</p>` : ''}</section>`;
}
export function storySceneMarkup(reward, scene, index, state = {}) {
  if (reward.storyKind === 'te-amo-mas') return teAmoMasMarkup(reward, scene, index, state);
  const photo = scene.media?.available && scene.media.url ? `<figure class="story-photo"><img src="${esc(scene.media.url)}" alt="${esc(scene.media.alt)}"><figcaption>${esc(scene.caption || '')}</figcaption></figure>` : (scene.hasMedia || scene.asset) ? missing() : '';
  const title = scene.title ? `<h1>${esc(scene.title)}</h1>` : '';
  const date = scene.date ? `<p class="story-date">${esc(scene.date)}</p>` : '';
  const beats = scene.beats?.length ? `<div class="story-beats">${scene.beats.map((beat) => `<p>${esc(beat)}</p>`).join('')}</div>` : '';
  return `<section class="reward-story story-layout-${esc(scene.layout || 'standard')}" data-scene="${index}" tabindex="-1" aria-labelledby="story-title-${index}"><header>${date}${scene.title ? title.replace('<h1>', `<h1 id="story-title-${index}">`) : `<h1 id="story-title-${index}" class="visually-hidden">${esc(reward.title)}</h1>`}</header>${paragraphs(scene.text, 'story-copy')}${messages(scene.messages)}${scene.moments?.map(moment).join('') || ''}${beats}${photo}${paragraphs(scene.after, 'story-copy story-after')}${scene.final ? `<p class="story-final">${esc(scene.final)}</p>` : ''}</section>`;
}
export const blockMarkup = (block) => {
  const header = block.message ? `<p>${esc(block.message)}</p>` : '';
  if (block.type === 'PHOTO') return `<article class="reward-block">${header}${media(block.media, 'PHOTO')}${block.caption ? `<small>${esc(block.caption)}</small>` : ''}</article>`;
  if (block.type === 'AUDIO') return `<article class="reward-block">${header}${media(block.media, 'AUDIO')}${block.transcript ? `<details><summary>Transcripción</summary><p>${esc(block.transcript)}</p></details>` : ''}</article>`;
  if (block.type === 'VIDEO') return `<article class="reward-block">${header}${media(block.media, 'VIDEO', block.poster?.available ? `poster="${esc(block.poster.url)}"` : '')}${block.transcript ? `<details><summary>Transcripción</summary><p>${esc(block.transcript)}</p></details>` : ''}</article>`;
  if (block.type === 'SONG') return `<article class="reward-block">${header}${song(block)}</article>`;
  if (block.type === 'VOUCHER') return voucher(block);
  return `<article class="reward-block">${header}</article>`;
};
export function rewardMarkup(reward) {
  const header = `<header class="reward-detail-header"><p class="sudoku-kicker">RECOMPENSA</p><h1>${esc(reward.title)}</h1><p>${esc(reward.message)}</p></header>`;
  if (reward.type === 'TEXT') return header;
  if (reward.type === 'PHOTO') return `${header}${media(reward.media, 'PHOTO')}${reward.caption ? `<p class="reward-caption">${esc(reward.caption)}</p>` : ''}`;
  if (reward.type === 'AUDIO') return `${header}${media(reward.media, 'AUDIO')}${reward.transcript ? `<details><summary>Transcripción</summary><p>${esc(reward.transcript)}</p></details>` : ''}`;
  if (reward.type === 'VIDEO') return `${header}${media(reward.media, 'VIDEO', reward.poster?.available ? `poster="${esc(reward.poster.url)}"` : '')}${reward.transcript ? `<details><summary>Transcripción</summary><p>${esc(reward.transcript)}</p></details>` : ''}`;
  if (reward.type === 'SONG') return `${header}${song(reward)}`;
  if (reward.type === 'VOUCHER') return `${header}${voucher(reward)}`;
  if (reward.type === 'CHOICE') return `${header}${choice(reward)}`;
  if (reward.type === 'FINAL') return `${header}<div class="reward-final-blocks">${(reward.blocks || []).map(blockMarkup).join('')}</div>`;
  if (reward.type === 'STORY') return storySceneMarkup(reward, reward.scenes?.[0] || {}, 0);
  return `${header}<div class="reward-missing">Contenido pendiente</div>`;
}
export function rewardsListMarkup(slots, meta) {
  const cards = slots.map((slot) => slot.unlocked ? `<button class="reward-slot unlocked" data-reward="${esc(slot.reward.id)}"><span aria-hidden="true">✓</span><span><strong>${esc(slot.reward.title)}</strong><small>Disponible para volver a verla</small></span></button>` : `<div class="reward-slot locked"><span aria-hidden="true">🔒</span><span><strong>Recompensa ${slot.slot}</strong><small>${esc(slot.message)}</small></span></div>`).join('');
  const pieces = meta?.enabled ? `<section class="reward-pieces ${meta.unlocked ? 'complete' : ''}"><p>${meta.unlocked ? 'ENCONTRASTE LAS 6 PIEZAS' : `${meta.pieces} / ${meta.totalPieces} piezas encontradas`}</p>${meta.unlocked ? '<button id="open-meta" class="sudoku-primary">Descubrir</button>' : '<small>Seguí jugando para encontrar las piezas.</small>'}</section>` : '';
  return `<section class="sudoku-shell rewards-screen"><button class="sudoku-back" id="back">‹ Volver a los Sudokus</button><header><p class="sudoku-kicker">MIS RECOMPENSAS</p><h1>Mis recompensas</h1><p>Todo lo que ya desbloqueaste sigue siendo tuyo.</p></header>${pieces}<div class="reward-slots">${cards}</div></section>`;
}
