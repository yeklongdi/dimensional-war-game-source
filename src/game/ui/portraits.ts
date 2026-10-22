import type { Action, GameState } from '../state.js';
import { actorColor, displayName, overrides, placement, slotX } from '../story/config.js';
import { element } from './elements.js';

export function renderPortraits(root: HTMLElement, state: GameState, dispatch: (action: Action) => void) {
  const visible = Object.values(state.actors).filter(actor => actor.visible);
  const speaker = state.waiting?.kind === 'text' ? state.waiting.speaker : undefined;
  const cards = visible.map(actor => {
    const name = displayName(state.actId, actor.actor);
    const { slot, rear } = placement(actor.position);
    const peers = visible.filter(other => placement(other.position).slot === slot);
    const offset = (peers.findIndex(other => other.actor === actor.actor) - (peers.length - 1) / 2) * 136;
    const card = element('div', 'portrait');
    card.dataset.actor = actor.actor;
    card.dataset.asset = actor.asset ?? '';
    card.dataset.position = actor.position;
    card.dataset.slot = slot;
    card.dataset.speaking = String(actor.actor === speaker);
    card.dataset.rear = String(rear);
    card.style.left = `${slotX[slot] + offset}px`;
    card.style.setProperty('--actor-color', actorColor(actor.actor));
    const url = actor.asset && !state.failedAssets[actor.asset] ? overrides.portraits[actor.asset] : undefined;
    if (url) {
      const image = element('img', 'portrait-image');
      image.src = url;
      image.alt = name;
      image.draggable = false;
      image.addEventListener('error', () => dispatch({ type: 'asset-failed', id: actor.asset!, message: `立绘 ${actor.asset} 无法读取，使用色块占位。` }), { once: true });
      card.append(image);
    } else {
      card.classList.add('portrait-placeholder');
      card.append(element('span', 'portrait-initial', Array.from(name)[0] ?? '?'));
      card.append(element('span', 'portrait-name', name));
      card.append(element('span', 'placeholder-label', '立绘占位'));
    }
    return card;
  });
  root.replaceChildren(...cards);
}
