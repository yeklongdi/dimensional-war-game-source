export type Point = { col: number; row: number };
export type Grid = { width: number; height: number; tiles: ('floor' | 'wall' | 'crate')[] };
export type DamageType = 'bludgeoning' | 'slashing' | 'piercing' | 'acid' | 'cold' | 'fire' | 'lightning' | 'thunder' | 'necrotic' | 'poison' | 'radiant';
export type RngState = { kind: 'seeded'; seed: number; value: number; draws: number }
  | { kind: 'sequence'; values: readonly number[]; index: number; draws: number };
export type D20Roll = { dice: number[]; chosen: number; mode: 'normal' | 'advantage' | 'disadvantage' };
export type DamageRoll = { expression: string; dice: number[]; sides: number; modifier: number; total: number; critical: boolean };
export type Attack = {
  id: string; name: string; kind: 'melee' | 'ranged'; bonus: number;
  damage: string; damageType: DamageType; reach?: number;
  range?: { normal: number; max: number }; martial?: boolean; finesse?: boolean; magical?: boolean;
};
export type Combatant = {
  id: string; name: string; team: 'player' | 'enemy';
  abilities: { str: number; dex: number; con: number; int: number | null; wis: number; cha: number };
  ac: number; maxHp: number; speed: number; attacks: Attack[]; features: string[];
  resistances: DamageType[]; immunities: DamageType[]; vulnerabilities: DamageType[];
};
export type Resources = { movement: number; action: boolean; bonus: boolean; reaction: boolean; martialAttack: boolean; disengaged: boolean; dodging: boolean };
export type Unit = Combatant & {
  position: Point; hp: number; tempHp: number;
  status: 'active' | 'unconscious' | 'stable' | 'dead' | 'defeated'; prone: boolean;
  saves: { successes: number; failures: number }; resources: Resources;
};
export type DamageReport = {
  raw: number; adjusted: number; modifiers: string[]; hpBefore: number; hpAfter: number;
  tempBefore: number; tempAfter: number; failureAdded: number;
};
export type InitiativeEntry = { actor: string; roll: D20Roll; bonus: number; total: number; dex: number; team: 'player' | 'enemy'; stableIndex: number };
export type EventData =
  | { kind: 'initiative'; actor: string; roll: D20Roll; bonus: number; total: number; rank: number }
  | { kind: 'turn'; actor: string }
  | { kind: 'move'; actor: string; from: Point; to: Point; remaining: number }
  | { kind: 'attack'; actor: string; target: string; attack: string; source: 'action' | 'bonus' | 'reaction'; roll: D20Roll; bonus: number; total: number; ac: number; cover: number; advantages: string[]; disadvantages: string[]; hit: boolean; critical: boolean }
  | { kind: 'damage'; actor: string; target: string; roll: DamageRoll; damageType: DamageType; report: DamageReport }
  | { kind: 'condition'; actor: string; status: Unit['status'] }
  | { kind: 'death-save'; actor: string; roll: D20Roll; successes: number; failures: number; outcome: string }
  | { kind: 'reaction'; actor: string; target: string; decision: 'pending' | 'attack' | 'decline' }
  | { kind: 'resource'; actor: string; action: 'dash' | 'disengage' | 'dodge' }
  | { kind: 'ai'; actor: string; decision: 'move' | 'attack' | 'end'; target?: string; destination?: Point }
  | { kind: 'temp-hp'; actor: string; amount: number }
  | { kind: 'tutorial'; notice: TutorialNotice }
  | { kind: 'inspiration'; actor: string; purpose: PendingRoll['kind']; original: number[]; replacement?: number; dieIndex?: number; adopted: number[]; chosen: number; remaining: number }
  | { kind: 'result'; outcome: 'win' | 'lose'; reason: 'eliminated' | 'dead' | 'stable' };
export type BattleEvent = EventData & { seq: number; round: number };
export type BattleDefinition = {
  id: string; title: string; map: string[]; spawnOrder: string[];
  heroLoadout?: { primary?: Attack; tempHp?: number; inspiration?: number };
  opening?: 'sword'; tutorial?: boolean; victoryText?: string;
};
export type TutorialNotice = 'move' | 'attack' | 'bonus';
export type PendingRoll =
  | { kind: 'initiative'; actor: string; roll: D20Roll; entries: InitiativeEntry[] }
  | { kind: 'attack'; actor: string; target: string; attack: Attack; source: 'action' | 'bonus' | 'reaction'; roll: D20Roll }
  | { kind: 'damage'; actor: string; target: string; attack: Attack; roll: DamageRoll }
  | { kind: 'death-save'; actor: string; roll: D20Roll };
export type BattleState = {
  id: string; title: string; session: number; revision: number; seed: number;
  grid: Grid; units: Unit[]; order: InitiativeEntry[]; turnIndex: number; round: number;
  rng: RngState; initialRng: RngState; aiMoved: boolean; awaitingEnd: boolean;
  pendingMove?: { actor: string; path: Point[]; index: number; reactors: string[] | null };
  pendingReaction?: { reactor: string; moving: string };
  inspiration?: Record<string, number>; pendingRoll?: PendingRoll;
  opening?: 'sword'; tutorial?: { seen: TutorialNotice[]; notice?: TutorialNotice };
  result?: { outcome: 'win' | 'lose'; reason: 'eliminated' | 'dead' | 'stable' };
  log: BattleEvent[];
};
export type Command =
  | { kind: 'move'; actor: string; to: Point; path?: readonly Point[] }
  | { kind: 'attack'; actor: string; target: string; attackId: string; resource: 'action' | 'bonus' }
  | { kind: 'dash' | 'disengage' | 'dodge' | 'end'; actor: string }
  | { kind: 'step' } | { kind: 'advance-turn' }
  | { kind: 'react'; take: boolean }
  | { kind: 'inspire'; dieIndex: number | null } | { kind: 'finish-opening' };
export type Envelope = { token: string; origin: 'player' | 'ai' | 'system'; command: Command };
export type BattleTransition = { state: BattleState; events: BattleEvent[]; rejectedReason?: string };
export type BattleMode = 'idle' | 'move' | 'attack' | 'bonus' | 'skills';
