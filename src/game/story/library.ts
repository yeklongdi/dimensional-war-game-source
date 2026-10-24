import prologue from '../../content/prologue-v2/prologue.json';
import act1 from '../../content/prologue-v2/act1.json';
import part3 from '../../content/prologue-v2/prologue_3.json';
import part4 from '../../content/prologue-v2/prologue_4.json';
import type { Act } from '../../content/types.js';
import type { StoryLibrary } from '../state.js';

export const storyLibrary: StoryLibrary = {
  prologue: prologue as Act,
  act1: act1 as Act,
  prologue_3: part3 as Act,
  prologue_4: part4 as Act,
};
export const contentVersion = 'prologue_four_parts_v1';
