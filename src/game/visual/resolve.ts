import type { ActorState } from '../state.js';
import { overrides } from '../story/config.js';
import { heroRecipes } from './hero.js';
import type { VisualPlan } from './types.js';

export function resolveVisual(actor: ActorState, failed: Readonly<Record<string, boolean>> = {}, candidates = false): VisualPlan {
  const fallback = actor.asset && !failed[actor.asset] ? overrides.portraits[actor.asset] : undefined;
  const recipe = actor.actor === '男高' && actor.asset === 'char_male_high_normal'
    ? heroRecipes.find(item => item.pose === actor.pose && item.expression === (actor.expression ?? '默认平静')) : undefined;
  const diagnostic = actor.actor === '男高' && !recipe
    ? `男高「${actor.pose ?? '未指定姿态'}／${actor.expression ?? '未指定表情'}」尚无合格分层，使用明确静态回退。`
    : recipe && !recipe.approved ? `男高分层 ${recipe.id} 仍为待验收候选，正式剧情保留静态回退。` : undefined;
  if (recipe && (recipe.approved || (candidates && recipe.candidateReady))) return { kind: 'layered', key: recipe.id, recipe, fallback, diagnostic };
  if (fallback) return { kind: 'static', key: `static:${actor.asset}:${diagnostic ?? ''}`, url: fallback, diagnostic };
  return { kind: 'placeholder', key: `placeholder:${actor.asset ?? actor.actor}`, diagnostic };
}
