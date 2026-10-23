import type { Act, Option } from '../content/types.js';
import type { BattleDefinition, BattleMode, BattleState, Combatant, RngState } from './battle/types.js';
import type { ProgressState } from './save-format.js';
import type { LevelId } from '../content/levels.js';
import type { LocationId } from '../content/map-locations.js';
import type { MapCamera, MapViewport } from './map-camera.js';
import type { MovementDraft } from './battle/movement-preview.js';
import type { SystemState } from './system-types.js';
import type { Settings } from './settings.js';

export type StoryLibrary = Readonly<Record<string, Act>>;
export type TextKind = 'stage' | 'dialogue' | 'inner' | 'narration';
export type Origin = { nodeIndex: number; optionIndex?: number; optionNodeIndex?: number };
export type ActorState = {
  actor: string; visible: boolean; position: string;
  asset?: string; pose?: string; expression?: string;
};
type WaitBase = { token: string; origin: Origin };
export type TextWait = WaitBase & {
  kind: 'text'; textKind: TextKind; text: string; speaker?: string; revealed: number;
};
export type ChoiceWait = WaitBase & {
  kind: 'choice'; prompt: string; options: Option[]; choiceNodeIndex: number;
};
export type Waiting =
  | TextWait | ChoiceWait
  | (WaitBase & { kind: 'battle'; battleId: string })
  | (WaitBase & { kind: 'end' })
  | (WaitBase & { kind: 'error'; message: string });
export type Branch = {
  choiceNodeIndex: number; optionIndex: number; index: number;
  returnToChoice: boolean; visibleMetaNodeIndex?: number;
};
export type HiddenNote = {
  actId: string; sceneId: string; origin: Origin; kind: string; raw: string;
};
export type BattleReturn = {
  battleId: string; waitToken: string; actId: string; sceneId: string; nodeIndex: number; branch?: Branch;
  attempt: number; definition: BattleDefinition; combatants: Combatant[]; initialRng: RngState;
};
export type GameState = {
  system?: SystemState; settings?: Settings;
  screen: 'menu' | 'map' | 'story' | 'battle' | 'battle-debug'; battle?: BattleState; battleMode?: BattleMode;
  movementDraft?: MovementDraft;
  progress?: ProgressState;
  activeLevelId?: LevelId;
  map?: { selected: LocationId; camera: MapCamera; viewport: MapViewport; popupOpen: boolean; unlock: boolean };
  battleReturn?: BattleReturn; battleSerial?: number; campaignSeed?: number;
  run: number; sequence: number; actId: string; sceneId: string; nodeIndex: number;
  branch?: Branch; waiting: Waiting | null; flags: Record<string, boolean>;
  actors: Record<string, ActorState>; backgroundId: string; bgmId: string;
  sceneTitle: string; time: string; debugOpen: boolean;
  hiddenNotes: Record<string, HiddenNote>; warnings: Record<string, string>;
  failedAssets: Record<string, boolean>;
};
export type Effect =
  | { kind: 'bgm' | 'sfx'; id: string }
  | { kind: 'warn'; key: string; message: string };
export type Transition = { state: GameState; effects: Effect[]; completedLevelId?: LevelId };
export type Action =
  | { type: 'advance' | 'complete-battle' | 'enter-act1' | 'restart'; token: string }
  | { type: 'choose'; token: string; index: number }
  | { type: 'reveal'; token: string; count: number }
  | { type: 'toggle-debug' }
  | { type: 'warning'; key: string; message: string }
  | { type: 'asset-failed'; id: string; message: string };

export function emptyState(run = 1): GameState {
  return {
    screen: 'story',
    run, sequence: 0, actId: 'prologue', sceneId: 'p001', nodeIndex: 0,
    waiting: null, flags: {}, actors: {}, backgroundId: '', bgmId: '',
    sceneTitle: '', time: '', debugOpen: false, hiddenNotes: {}, warnings: {}, failedAssets: {},
  };
}

export function warning(state: GameState, effects: Effect[], key: string, message: string) {
  if (state.warnings[key] !== undefined) return;
  state.warnings[key] = message;
  effects.push({ kind: 'warn', key, message });
}
