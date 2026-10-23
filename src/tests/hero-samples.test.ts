import { describe, expect, it } from 'vitest';
import { heroRecipes } from '../game/visual/hero.js';
import { resolveVisual } from '../game/visual/resolve.js';
import { sampleAnimation } from '../game/visual/animation.js';
import { assetUrl } from '../game/asset-url.js';
import { emptyState } from '../game/state.js';
import { resumeScene } from '../game/story/restore.js';
import { reduceGame } from '../game/story/player.js';
import { storyLibrary } from '../game/story/library.js';
import registration from '../../public/assets/portraits/hero-layered-v3/registration.json';
import approvals from '../../art/hero-layered-v3/review.json';

const digest = (path: string) => registration.layers.find(layer => layer.file === path)!.sha256;
const frameFiles = [...new Set(heroRecipes.flatMap(recipe => recipe.layers.flatMap(layer => layer.frames)))];

describe('v3五个独立批准的真实样板', () => {
  it.each(heroRecipes)('$id 正式解析为分层，姿态／表情／位置仍由原剧情决定', recipe => {
    expect(recipe.approved).toBe(true); expect(recipe.candidateReady).toBe(true);
    const actor = Object.freeze({ actor: '男高', visible: true, asset: 'char_male_high_normal', position: 'right',
      pose: recipe.pose, expression: recipe.expression });
    const plan = resolveVisual(actor);
    expect(plan.kind).toBe('layered'); expect(plan.key).toBe(recipe.id);
    expect(plan.diagnostic).toBeUndefined(); expect(plan).not.toHaveProperty('position');
    expect(actor.position).toBe('right');
    expect(recipe.layers.every(layer => layer.offset[0] === 0 && layer.offset[1] === 0 && !layer.registration)).toBe(true);
  });
  it('只绑定33张实际运行帧，母版与失败审查不作为运行资源', () => {
    expect(frameFiles).toHaveLength(33); expect(registration.layers).toHaveLength(33);
    expect(registration.canvas).toEqual([1024, 1536]); expect(registration.anchor).toEqual([512, 1536]);
    for (const url of frameFiles) {
      expect(url).toContain('/assets/portraits/hero-layered-v3/');
      expect(url).not.toContain('masters'); expect(url).not.toContain('candidate');
    }
  });
  it('33张新帧在正式项目子路径下仍绑定同一资源，不落到域名根目录', () => {
    for (const url of frameFiles) {
      const relative = '/assets/' + url.split('/assets/')[1]!;
      const deployed = assetUrl(relative, '/dimensional-war-game-source/');
      expect(deployed).toBe('/dimensional-war-game-source' + relative);
      expect(assetUrl(relative, '/')).toBe(relative);
    }
  });
  it('五个组合均有独立视觉批准记录，未把静态回退登记为动态样板', () => {
    expect(approvals.map(item => item.id)).toEqual(heroRecipes.map(item => item.id));
    expect(approvals.map(item => item.reviewOrder)).toEqual([1, 2, 3, 4, 5]);
    expect(approvals.every(item => item.approved && item.evidence.length >= 4)).toBe(true);
  });
  it('五种表情的静止眉眼、静止嘴和说话嘴均有实际不同的像素文件', () => {
    for (const [channel, index] of [['eyes', 0], ['mouth', 0], ['mouth', 1]] as const) {
      const hashes = heroRecipes.map(recipe => digest('public' + recipe.layers.find(layer => layer.channel === channel)!.frames[index]!));
      expect(new Set(hashes).size).toBe(5);
    }
    for (const recipe of heroRecipes) {
      const eyes = recipe.layers.find(layer => layer.channel === 'eyes')!;
      expect(new Set(eyes.frames.map(url => digest('public' + url))).size).toBe(3);
    }
  });
  it('行李、握持手与前臂整组与身体同步，呼吸不能让手离开提手', () => {
    for (const recipe of heroRecipes.filter(item => item.pose === '携带行李、站立')) {
      const body = recipe.layers.find(layer => layer.id === 'body')!, grip = recipe.layers.find(layer => layer.id === 'luggage')!;
      for (const time of [0, 750, 1050, 2100, 3150, 4200]) {
        expect(sampleAnimation(recipe, grip, time, false)).toEqual(sampleAnimation(recipe, body, time, false));
      }
    }
  });
  it('准备样板只转动同母版整臂，不保留肘部接缝或多余手臂', () => {
    const recipe = heroRecipes[4]!, arms = recipe.layers.filter(layer => layer.motion.includes('left') || layer.motion.includes('right'));
    expect(arms.map(layer => layer.id)).toEqual(['arm-left', 'arm-right']);
    expect(arms.map(layer => sampleAnimation(recipe, layer, 0, false, 425).rotate)).toEqual([-7, 7]);
    expect(arms.every(layer => sampleAnimation(recipe, layer, 0, false).rotate === 0)).toBe(true);
  });
});

describe('真实剧情组合与场景头恢复', () => {
  it('P001使用紧张行李；P002先继承，再按原SHOW更新到微笑', () => {
    const first = resumeScene(emptyState(), storyLibrary, 'prologue', 'p001', 1).state;
    expect(resolveVisual(first.actors['男高']!).key).toBe('hero_luggage_nervous');
    let second = resumeScene(emptyState(), storyLibrary, 'prologue', 'p002', 2).state;
    const position = second.actors['男高']!.position;
    expect(resolveVisual(second.actors['男高']!).key).toBe('hero_luggage_nervous');
    for (let count = 0; count < 20 && second.actors['男高']!.expression !== '放松、微笑'; count++) {
      expect(second.waiting?.kind).toBe('text');
      second = reduceGame(second, { type: 'advance', token: second.waiting!.token }, storyLibrary).state;
    }
    expect(second.actors['男高']!.pose).toBe('携带行李、站立'); expect(second.actors['男高']!.position).toBe(position);
    expect(resolveVisual(second.actors['男高']!).key).toBe('hero_luggage_relaxed');
  });
  it('A006/A007继承匹配准备疑惑；禁用选择不改变状态', () => {
    const six = resumeScene(emptyState(), storyLibrary, 'act1', 'a006', 3).state;
    expect(resolveVisual(six.actors['男高']!).key).toBe('hero_prepare_puzzled');
    const seven = resumeScene(emptyState(), storyLibrary, 'act1', 'a007', 4).state;
    expect(resolveVisual(seven.actors['男高']!).key).toBe('hero_prepare_puzzled');
    expect(seven.waiting?.kind).toBe('choice');
    const denied = reduceGame(seven, { type: 'choose', token: seven.waiting!.token, index: 1 }, storyLibrary);
    expect(denied.state).toBe(seven);
  });
  it('P003坐姿得意仍是静态回退，批准普通得意不篡改坐姿', () => {
    const three = resumeScene(emptyState(), storyLibrary, 'prologue', 'p003', 5).state;
    expect(three.actors['男高']!.pose).toBe('坐在沙发上');
    expect(resolveVisual(three.actors['男高']!).kind).toBe('static');
  });
});
