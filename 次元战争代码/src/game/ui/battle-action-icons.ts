export type ActionIcon = 'sword' | 'move' | 'dash' | 'disengage' | 'shield' | 'fist' | 'end'
  | 'fire' | 'frost' | 'lightning' | 'poison' | 'acid' | 'burst' | 'missile' | 'heart'
  | 'wind' | 'potion' | 'scroll' | 'bow' | 'swords';

const paths: Record<ActionIcon, string> = {
  sword: 'M5 19 19 5V2h-3L3 15m3-3 6 6M3 21l3-3m-4-3 7 7',
  move: 'm14 3 3 2-2 4-4 2-3 6-4 2m7-8 4 3 1 6m-1-13 3 3 3-1M4 8h4M2 12h4',
  dash: 'm13 4 4 2-3 5-5 1-3 6-4 2m12-9 4 3 2 6M2 6h6M1 10h4m12-4 3 3h3',
  disengage: 'M10 4H4v16h6m4-13 5 5-5 5m-6-5h13',
  shield: 'm12 2 8 3v7c0 5-8 10-8 10S4 17 4 12V5l8-3Zm-4 10 3 3 5-6',
  fist: 'M6 12V6a2 2 0 0 1 4 0v5-7a2 2 0 0 1 4 0v7-5a2 2 0 0 1 4 0v6-3a2 2 0 0 1 4 0v6l-5 7H9l-6-8a2 2 0 0 1 3-2Z',
  end: 'M4 12h15m-6-6 6 6-6 6M4 5v14',
  fire: 'M13 2c1 7-7 7-7 13a6 6 0 0 0 12 0c0-3-1-5-3-7 0 4-3 4-2-6Zm-1 11c-5 5-2 8 1 7 3-1 1-5-1-7Z',
  frost: 'M12 2v20M3 7l18 10M3 17 21 7M9 4l3 3 3-3M9 20l3-3 3 3M3 10l4-1-1-4m12 14-1-4 4-1M3 14l4 1-1 4M18 5l-1 4 4 1',
  lightning: 'm14 2-9 12h7l-2 8 9-13h-7l2-7Z',
  poison: 'M6 16v-3a8 8 0 1 1 12 0v3l-3 1v4H9v-4l-3-1Zm2-6h1m6 0h1m-5 4h2m-1 4v3',
  acid: 'M12 2S5 10 5 14a7 7 0 0 0 14 0c0-4-7-12-7-12ZM8 14c0 3 2 4 4 4m7-14 3 3m-2 4h3',
  burst: 'm12 1 2 7 6-4-3 7 6 2-7 2 3 7-7-5-5 6 1-8-7-1 7-3-4-6 7 3 1-7Z',
  missile: 'm3 19 6-3 7-12 4-2-1 5L9 18l-6 1Zm1-9 3-3m5 14 4-3M2 15l2-2',
  heart: 'M12 21 3 12a6 6 0 0 1 9-8 6 6 0 0 1 9 8l-9 9Zm0-14v8m-4-4h8',
  wind: 'M3 8h12c6 0 6-6 2-6-2 0-3 1-3 2M2 12h18c4 0 4 5 0 5M5 16h7c5 0 5 6 1 6-2 0-3-1-3-2',
  potion: 'M9 2h6m-5 0v7l-5 8c-1 2 0 5 3 5h8c3 0 4-3 3-5l-5-8V2M7 15h10m-5 1v4m-2-2h4',
  scroll: 'M6 3h13c4 0 4 5 0 5h-2M6 3c-4 0-4 5 0 5h2V3m0 5v13h10c4 0 4-5 0-5h-1V8M10 9h4m-4 4h4m-3 8c3 0 3-5 0-5',
  bow: 'M5 3c17 0 17 18 0 18L5 3Zm0 0 7 9-7 9m3-9h14m-4-4 4 4-4 4',
  swords: 'm3 3 3 1 12 14m-2 2 5-5M3 21l6-6m-4-1 5 5M21 3l-3 1L6 18m12 0 3 3',
};

/** 统一使用本地图形，不下载素材或引入图标运行库。 */
export function actionIcon(name: ActionIcon) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24'); svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('fill', 'none'); svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '1.6'); svg.setAttribute('stroke-linecap', 'round'); svg.setAttribute('stroke-linejoin', 'round');
  const path = document.createElementNS(svg.namespaceURI, 'path'); path.setAttribute('d', paths[name]);
  svg.append(path); return svg;
}
