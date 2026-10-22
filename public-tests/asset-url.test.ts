import { describe, expect, it } from 'vitest';
import { assetBindings, assetUrl } from '../src/game/asset-url.js';

describe('asset URL base handling', () => {
  it('resolves assets at the domain root and under a project page', () => {
    expect(assetUrl('/assets/maps/demo-map.svg', '/')).toBe('/assets/maps/demo-map.svg');
    expect(assetUrl('/assets/portraits/demo-actor.svg', '/dimensional-war-game-source/')).toBe('/dimensional-war-game-source/assets/portraits/demo-actor.svg');
  });
  it('keeps non-asset URLs unchanged and does not mutate bindings', () => {
    const input = Object.freeze({ actor: '/assets/portraits/demo-actor.svg', external: 'https://example.invalid/x' });
    expect(assetBindings(input, '/base/')).toEqual({ actor: '/base/assets/portraits/demo-actor.svg', external: 'https://example.invalid/x' });
    expect(input.actor).toBe('/assets/portraits/demo-actor.svg');
  });
});