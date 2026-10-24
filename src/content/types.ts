export type NodeAnnotations = { meta?: boolean; placeholder?: boolean };

export type ShowNode = NodeAnnotations & {
  kind: 'show';
  actor: string;
  asset?: string;
  position?: string;
  expression?: string;
  pose?: string;
  /** 状态差量：只更新给出的字段，沿用已有素材和其他状态。 */
  update?: true;
};

export type Option = NodeAnnotations & {
  index: number;
  text: string;
  enabled: boolean;
  nodes: StoryNode[];
};

export type ChoiceNode = NodeAnnotations & {
  kind: 'choice';
  prompt: string;
  options: Option[];
};

export type StoryNode = NodeAnnotations & (
  | ShowNode
  | { kind: 'hide'; actor: string }
  | { kind: 'stage' | 'narration'; text: string }
  | { kind: 'dialogue' | 'inner'; speaker: string; text: string }
  | ChoiceNode
  | { kind: 'set'; flag: string; value?: boolean; note: string }
  | { kind: 'call'; name: string; args?: Record<string, string> }
  | { kind: 'check'; raw: string }
  | { kind: 'jump'; target: string }
  | { kind: 'end' }
  | { kind: 'sfx' | 'bgm' | 'background'; name: string }
  | { kind: 'meta'; directive: string; raw: string; meta: true }
  | { kind: 'unknown'; raw: string; meta: true }
);

export type Scene = {
  id: string;
  title: string;
  time: string;
  background?: string;
  bgm?: string;
  nodes: StoryNode[];
  meta: { sourceFile: string; line: number };
};

export type Act = { id: string; title: string; scenes: Scene[] };

export type DiagnosticCategory =
  | 'placeholder' | 'meta' | 'variable' | 'check' | 'unknown'
  | 'missing_asset' | 'pending_call' | 'unresolved_jump' | 'missing_prompt';

export type Diagnostic = {
  actId: string;
  sceneId: string;
  sourceFile: string;
  line: number;
  raw: string;
  categories: DiagnosticCategory[];
  details: string[];
  resolutions: string[];
};

export type ContentIndex = {
  acts: { id: string; title: string; file: string; sceneCount: number }[];
  warningCount: number;
  warnings: Diagnostic[];
};

export type ParseOptions = { id: string; title: string; sourceFile: string };
export type ParseResult = { act: Act; warnings: Diagnostic[] };
export type StorySources = { prologue: string; act1: string };
export type ExportBundle = { acts: Act[]; index: ContentIndex; questions: string };
