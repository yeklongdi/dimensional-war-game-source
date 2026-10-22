import type { ActorState, TextWait } from '../state.js';

export type Vec = readonly [number, number];
export type Motion = 'body' | 'head' | 'hair' | 'hem' | 'upper-left' | 'lower-left' | 'upper-right' | 'lower-right' | 'prop';
export type Layer = {
  id: string; z: number; offset: Vec; pivot: Vec; motion: Motion;
  frames: readonly string[]; channel?: 'eyes' | 'mouth';
  registration?: readonly { offset: Vec; scale: Vec; pivot: Vec }[];
};
export type AnimationLimits = { blink: boolean; mouth: boolean; breathe: boolean; sway: boolean; prepare: boolean };
export type LayerRecipe = {
  id: string; canvas: Vec; anchor: Vec; layers: readonly Layer[]; limits: AnimationLimits;
  pose: string; expression: string; approved: boolean; candidateReady: boolean;
};
export type VisualPlan =
  | { kind: 'layered'; key: string; recipe: LayerRecipe; fallback?: string; diagnostic?: string }
  | { kind: 'static'; key: string; url: string; diagnostic?: string }
  | { kind: 'placeholder'; key: string; diagnostic?: string };
export type SpeechInput = Pick<ActorState, 'actor' | 'visible'> & { supported: boolean; mouthAllowed: boolean; prop: boolean };
export function isTalking(actor: SpeechInput, waiting: TextWait | null): boolean {
  return actor.visible && actor.supported && actor.mouthAllowed && !actor.prop && waiting?.textKind === 'dialogue'
    && waiting.speaker === actor.actor && waiting.revealed > 0 && waiting.revealed < Array.from(waiting.text).length;
}

export type Frame = { x: number; y: number; rotate: number; frame: number };
