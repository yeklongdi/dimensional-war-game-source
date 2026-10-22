import prologue from '../../content/prologue.json';
import act1 from '../../content/act1.json';
import type { Act } from '../../content/types.js';
import type { StoryLibrary } from '../state.js';

export const storyLibrary: StoryLibrary = {
  prologue: prologue as Act,
  act1: act1 as Act,
};
