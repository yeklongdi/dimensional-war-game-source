import type { ActorState, GameState } from '../state.js';
import { placement, slotX } from '../story/config.js';
import { element } from './elements.js';

export const isStoryProp = (actor: ActorState): boolean => !!actor.asset?.startsWith('prop_');
/** 道具占位有独立图层，不复用人物首字、名字牌或口型。 */
export function renderProps(root: HTMLElement, state: GameState): void {
  root.replaceChildren();
  for (const prop of Object.values(state.actors).filter(actor => actor.visible && isStoryProp(actor))) {
    const card = element('div', 'story-prop-placeholder'); card.dataset.prop = prop.actor;
    card.style.left = `${slotX[placement(prop.position).slot]}px`;
    card.append(element('span', 'story-prop-title', prop.actor), element('small', '', '道具占位'));
    root.append(card);
  }
}
