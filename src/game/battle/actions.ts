import type { BattleMode, Envelope } from './types.js';
import type { PlanningAction } from './planning.js';

export type BattleAction =
  | PlanningAction
  | { type: 'command'; envelope: Envelope }
  | { type: 'restart'; token: string }
  | { type: 'continue-story'; token: string }
  | { type: 'mode'; token: string; mode: BattleMode };
