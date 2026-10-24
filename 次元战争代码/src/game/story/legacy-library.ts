import prologue from '../../content/prologue.json';
import act1 from '../../content/act1.json';
import type { Act } from '../../content/types.js';
import type { StoryLibrary } from '../state.js';

/** 仅校验只读旧档；不进入新版播放器，不迁移旧进度。 */
export const legacyLibrary: StoryLibrary = { prologue: prologue as Act, act1: act1 as Act };
