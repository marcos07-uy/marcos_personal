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
const paragraphs = (items = '', className = '') => (Array.isArray(items) ? items : [items]).filter(Boolean).map((item) => `<p class="${className}">${esc(item)}</p>`).join('');
const messages = (items = []) => items.map((item) => `<article class="story-message ${item.author === 'Claudia' ? 'claudia' : 'marcos'}"><small>${esc(item.author)}</small><p>${esc(item.text)}</p></article>`).join('');
const moment = (item) => `<section class="story-moment">${item.date ? `<p class="story-date">${esc(item.date)}</p>` : ''}${paragraphs(item.text, 'story-copy')}${messages(item.messages)}</section>`;
export function storySceneMarkup(reward, scene, index) {
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
