import { describe, expect, it } from 'vitest';
import { assetBindings, assetUrl } from '../game/asset-url.js';
import { bgmBindings, overrides } from '../game/story/config.js';
import audioMap from '../content/audio-map.json';
import rawOverrides from '../content/overrides.json';
import { staticBindings } from '../game/visual/static-portraits.js';

describe('static hosting base', () => {
  it.each(['/', '/dimensional-war-game/', '/another-release/', './'])('applies %s to every existing media type', base => {
    for (const path of ['/assets/audio/homecoming.wav', '/assets/portraits/hero.png', '/assets/maps/sun-city-painted-v1.png']) {
      expect(assetUrl(path, base)).toBe(`${base}${path.slice(1)}`);
    }
  });

  it('normalizes a missing trailing slash without changing unrelated URLs', () => {
    expect(assetUrl('/assets/audio/liuxie.wav', '/game')).toBe('/game/assets/audio/liuxie.wav');
    for (const path of ['', 'relative.png', 'https://example.com/image.png', '/other/image.png']) {
      expect(assetUrl(path, '/game/')).toBe(path);
    }
  });

  it('creates new bindings and leaves read-only source mappings intact', () => {
    const original = Object.freeze({ hero: '/assets/portraits/hero.png', bgm: '/assets/audio/liuxie.wav' });
    const bound = assetBindings(original, '/game/');
    expect(bound).toEqual({ hero: '/game/assets/portraits/hero.png', bgm: '/game/assets/audio/liuxie.wav' });
    expect(original.hero).toBe('/assets/portraits/hero.png');
    expect(bound).not.toBe(original);
  });

  it('uses Vite base for the real audio and portrait bindings', () => {
    expect(bgmBindings).toEqual(assetBindings(audioMap));
    expect(overrides.portraits).toEqual({ ...assetBindings(rawOverrides.portraits), ...staticBindings });
  });
});
