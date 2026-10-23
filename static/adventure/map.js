/* global L */
let activeMap = null;
let resizeObserver = null;

const category = (destination) => {
  const tags = destination.tags || [];
  if (tags.includes('castle')) return ['castle', '♜', 'Castillo'];
  if (tags.includes('mountain')) return ['mountain', '▲', 'Montaña'];
  if (tags.includes('lake')) return ['lake', '≈', 'Lago'];
  if (tags.includes('coastal') || tags.includes('cliffs')) return ['coast', '⌇', 'Costa o acantilado'];
  if (tags.includes('hiking')) return ['hiking', '↟', 'Caminata'];
  if (tags.includes('village')) return ['village', '⌂', 'Pueblo'];
  if (tags.includes('city')) return ['city', '◆', 'Ciudad'];
  return ['culture', '✦', 'Experiencia cultural'];
};

const statusSymbol = (status) => ({ love: '♥', want: '✦', review: '◌', low: '–' }[status] || '');

const validPoint = (item) => Number.isFinite(item.lat) && Number.isFinite(item.lng) && item.lat >= -90 && item.lat <= 90 && item.lng >= -180 && item.lng <= 180;

export function destroyAdventureMap() {
  resizeObserver?.disconnect();
  resizeObserver = null;
  if (activeMap) activeMap.remove();
  activeMap = null;
}

export function renderAdventureMap(container, { destinations, favorites, selectedId, highlightedIds = [], onSelect }) {
  destroyAdventureMap();
  if (!window.L || !window.L.markerClusterGroup) {
    container.innerHTML = '<p class="a-map-error">No pudimos cargar el mapa interactivo. Revisá tu conexión e intentá recargar.</p>';
    return null;
  }
  const points = destinations.filter(validPoint);
  if (!points.length) {
    container.innerHTML = '<p class="a-map-error">No hay ubicaciones verificadas para los filtros elegidos.</p>';
    return null;
  }
  const map = L.map(container, { zoomControl: false, minZoom: 4, maxZoom: 15, worldCopyJump: false, attributionControl: true });
  activeMap = map;
  L.control.zoom({ position: 'bottomright' }).addTo(map);
  const tileLayer = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap contributors</a>',
    crossOrigin: true
  });
  let tileErrors = 0;
  tileLayer.on('tileerror', () => {
    tileErrors += 1;
    if (tileErrors >= 3) container.closest('.a-map-frame')?.classList.add('a-map-has-error');
  }).addTo(map);
  const clusters = L.markerClusterGroup({
    showCoverageOnHover: false,
    maxClusterRadius: 44,
    chunkedLoading: true,
    iconCreateFunction(cluster) {
      return L.divIcon({ className: 'a-cluster-wrap', html: `<span class="a-cluster">${cluster.getChildCount()}</span>`, iconSize: [42, 42] });
    }
  });
  const bounds = [];
  for (const destination of points) {
    const [kind, symbol, label] = category(destination);
    const favorite = favorites[destination.id];
    const isSelected = selectedId === destination.id;
    const isHighlighted = highlightedIds.includes(destination.id);
    const icon = L.divIcon({
      className: 'a-marker-wrap',
      html: `<span class="a-marker a-marker-${kind} ${isSelected ? 'is-selected' : ''} ${isHighlighted ? 'is-related' : ''}" aria-label="${destination.name}: ${label}"><i>${symbol}</i>${favorite ? `<b aria-hidden="true">${statusSymbol(favorite)}</b>` : ''}</span>`,
      iconSize: [34, 42], iconAnchor: [17, 38], popupAnchor: [0, -35]
    });
    const marker = L.marker([destination.lat, destination.lng], { icon, title: destination.name, keyboard: true });
    marker.bindTooltip(destination.name, { direction: 'top', offset: [0, -30], opacity: .95 });
    marker.on('click', () => onSelect(destination.id, { fromMap: true }));
    clusters.addLayer(marker);
    bounds.push([destination.lat, destination.lng]);
  }
  map.addLayer(clusters);
  const selected = points.find((item) => item.id === selectedId);
  if (selected) map.setView([selected.lat, selected.lng], 8, { animate: false });
  else if (bounds.length === 1) map.setView(bounds[0], 8, { animate: false });
  else map.fitBounds(bounds, { padding: [28, 28], maxZoom: 6, animate: false });
  resizeObserver = new ResizeObserver(() => map.invalidateSize({ pan: false }));
  resizeObserver.observe(container);
  requestAnimationFrame(() => map.invalidateSize({ pan: false }));
  return map;
}

export { validPoint };
