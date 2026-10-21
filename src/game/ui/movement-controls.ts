import type { GameState } from '../state.js';
import type { BattleAction } from '../battle/actions.js';
import type { MovementOverlay } from '../battle/movement-preview.js';
import type { PlanningAction } from '../battle/planning.js';
import { currentDraft } from '../battle/movement-preview.js';
import { button, element } from './elements.js';

/** 按钮只创建一次；预览重绘不替换当前聚焦元素。 */
export class MovementControls {
  readonly root = element('section', 'movement-planning-controls');
  private readonly summary = element('p', 'movement-budget');
  private readonly hint = element('p', 'movement-hint');
  private readonly buttons: Record<'confirm' | 'undo' | 'clear' | 'cancel', HTMLButtonElement>;
  private send?: (operation: 'confirm' | 'undo' | 'clear' | 'cancel') => void;

  constructor(dispatch: (action: BattleAction) => void) {
    this.root.hidden = true; this.root.setAttribute('aria-label', '移动路线规划');
    this.hint.setAttribute('role', 'status');
    const row = element('div', 'movement-buttons');
    const make = (label: string, operation: 'confirm' | 'undo' | 'clear' | 'cancel') => {
      const node = button(label, `move-${operation}`, () => this.send?.(operation)); row.append(node); return node;
    };
    this.buttons = { confirm: make('确认移动', 'confirm'), undo: make('撤回一点', 'undo'), clear: make('清空路线', 'clear'), cancel: make('取消移动', 'cancel') };
    this.root.append(this.summary, row, this.hint);
    this.render = (game, overlay) => {
      const draft = currentDraft(game);
      this.root.hidden = !draft || overlay?.kind !== 'planning';
      if (!draft || !overlay) { this.send = undefined; return; }
      this.send = operation => dispatch({ type: 'plan', run: game.run, token: draft.token, actor: draft.actor, operation });
      this.summary.textContent = `已选 ${overlay.selectedSteps} 步 · ${overlay.selectedSteps * 5} 尺　可再规划 ${overlay.remainingSteps * 5} 尺　悬停仅预览`;
      this.buttons.confirm.disabled = overlay.selectedSteps === 0;
      this.buttons.undo.disabled = draft.waypoints.length === 0;
      this.buttons.clear.disabled = draft.waypoints.length === 0 && !draft.hover;
      this.hint.textContent = '';
    };
  }
  render: (game: GameState, overlay?: MovementOverlay) => void;
  showHint(message: string) { this.hint.textContent = message; }
}

export function planningInput(game: GameState, operation: PlanningAction['operation'], point?: { col: number; row: number }): PlanningAction | undefined {
  const draft = currentDraft(game);
  if (!draft) return undefined;
  const base = { type: 'plan' as const, run: game.run, token: draft.token, actor: draft.actor };
  if (operation === 'hover' || operation === 'add') return point ? { ...base, operation, point } : undefined;
  return { ...base, operation };
}
