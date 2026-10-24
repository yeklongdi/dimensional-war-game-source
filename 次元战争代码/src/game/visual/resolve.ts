import type { ActorState } from '../state.js';
import { overrides } from '../story/config.js';
import { heroRecipes } from './hero.js';
import type { LayerRecipe, VisualPlan } from './types.js';
import { staticPortrait } from './static-portraits.js';
import { heroHalfPortrait } from './hero-half.js';

export function resolveVisual(actor: ActorState, failed: Readonly<Record<string, boolean>> = {}, candidates = false,
  catalog: readonly LayerRecipe[] = heroRecipes): VisualPlan {
  const available = actor.asset && !failed[actor.asset];
  const half = available ? heroHalfPortrait(actor) : undefined;
  const fallback = available ? half?.url ?? overrides.portraits[actor.asset!] : undefined;
  const recipe = actor.actor === '男高' && actor.asset === 'char_male_high_normal'
    ? catalog.find(item => item.pose === actor.pose && item.expression === (actor.expression ?? '默认平静')) : undefined;
  const diagnostic = actor.actor === '男高' && !recipe
    ? `男高「${actor.pose ?? '未指定姿态'}／${actor.expression ?? '未指定表情'}」尚无合格分层，使用明确静态回退。`
    : recipe && !recipe.approved ? `男高分层 ${recipe.id} 仍为待验收候选，正式剧情保留静态回退。` : undefined;
  if (recipe && (recipe.approved || (candidates && recipe.candidateReady))) return { kind: 'layered', key: recipe.id, recipe, fallback, fallbackFrame: half?.frame, diagnostic };
  const still = actor.asset && !failed[actor.asset] ? staticPortrait(actor) : undefined;
  if (still) return { kind: 'static', ...still, diagnostic: [diagnostic, still.diagnostic].filter(Boolean).join(' ') || undefined };
  if (fallback) return { kind: 'static', key: `static:${actor.asset}:${fallback}`, url: fallback, diagnostic };
  return { kind: 'placeholder', key: `placeholder:${actor.asset ?? actor.actor}`, diagnostic };
}
