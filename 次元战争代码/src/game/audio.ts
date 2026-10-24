import { bgmBindings, sfxBindings } from './story/config.js';

type Failure = (id: string, message: string) => void;
import type { Settings } from './settings.js';

/** 音频是 IO 适配器；剧情中的音乐 id 仍由 GameState 管理。 */
export class AudioController {
  readonly element = document.createElement('audio');
  private unlocked = false;
  private generation = 0;
  private desiredId = '';
  private desiredUrl = '';
  private readonly sounds = new Set<HTMLAudioElement>();
  private readonly fail: Failure;
  private disposed = false;
  private bgmGain = 65;
  private sfxGain = 100;
  private envelope = 0;

  constructor(fail: Failure) {
    this.fail = fail;
    this.element.loop = true;
    this.element.preload = 'auto';
    this.element.volume = 0;
    this.element.dataset.testid = 'bgm-player';
    this.element.dataset.audioState = 'locked';
  }

  unlock() {
    if (this.disposed) return;
    this.unlocked = true;
    if (this.element.getAttribute('src') && this.element.paused) void this.play(this.generation);
  }
  setSettings(settings: Settings) {
    this.bgmGain = settings.bgm; this.sfxGain = settings.sfx;
    this.element.volume = this.envelope * this.bgmGain / 100;
    this.element.dataset.actualVolume = String(this.element.volume);
    this.element.dataset.userVolume = String(this.bgmGain); this.element.dataset.envelope = String(this.envelope);
    for (const sound of this.sounds) sound.volume = this.sfxGain / 100;
  }

  setBgm(id: string) {
    if (this.disposed) return;
    const url = bgmBindings[id] ?? '';
    this.desiredId = id;
    this.element.dataset.assetId = id;
    if (this.desiredUrl === url) return;
    this.desiredUrl = url;
    const generation = ++this.generation;
    void this.switchBgm(url, generation);
  }

  private async switchBgm(url: string, generation: number) {
    if (!this.element.paused) await this.fade(0, generation);
    if (generation !== this.generation) return;
    this.element.pause();
    this.envelope = 0; this.element.volume = 0;
    if (!url) {
      this.element.removeAttribute('src');
      this.element.load();
      this.element.dataset.audioState = 'silent';
      return;
    }
    this.element.src = url;
    this.element.onerror = () => {
      if (!this.disposed && generation === this.generation) this.fail(this.desiredId, `音频 ${this.desiredId} 无法读取，静默处理。`);
    };
    this.element.load();
    if (this.unlocked) await this.play(generation);
  }

  private async play(generation: number) {
    try {
      await this.element.play();
      if (generation !== this.generation) return;
      this.element.dataset.audioState = 'playing';
      await this.fade(1, generation);
    } catch (error) {
      if (generation !== this.generation) return;
      if (error instanceof DOMException && (error.name === 'NotAllowedError' || error.name === 'AbortError')) {
        this.element.dataset.audioState = 'waiting-for-gesture';
      } else {
        this.element.dataset.audioState = 'silent';
        this.fail(this.desiredId, `音频 ${this.desiredId} 播放失败，静默处理。`);
      }
    }
  }

  private fade(target: number, generation: number): Promise<void> {
    const initial = this.envelope;
    const start = performance.now();
    return new Promise(resolve => {
      const tick = (now: number) => {
        if (generation !== this.generation) return resolve();
        const progress = Math.min(1, (now - start) / 500);
        this.envelope = Math.max(0, Math.min(1, initial + (target - initial) * progress));
        this.element.volume = this.envelope * this.bgmGain / 100;
        this.element.dataset.actualVolume = String(this.element.volume);
        this.element.dataset.envelope = String(this.envelope);
        if (progress === 1) resolve();
        else requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }

  playSfx(id: string) {
    const url = sfxBindings[id];
    if (!url || !this.unlocked || this.disposed) return;
    const sound = new Audio(url);
    sound.volume = this.sfxGain / 100;
    const generation = this.generation;
    this.sounds.add(sound);
    sound.addEventListener('ended', () => this.sounds.delete(sound), { once: true });
    sound.addEventListener('error', () => {
      this.sounds.delete(sound);
      if (!this.disposed && generation === this.generation) this.fail(id, `音效 ${id} 无法读取，静默处理。`);
    }, { once: true });
    void sound.play().catch(() => this.sounds.delete(sound));
  }

  stopSfx() { for (const sound of this.sounds) sound.pause(); this.sounds.clear(); }
  resetSession() {
    this.generation++; this.stopSfx(); this.desiredId = ''; this.desiredUrl = '';
    this.element.onerror = null; this.element.pause(); this.element.removeAttribute('src'); this.element.load();
    this.envelope = 0; this.element.volume = 0; this.element.dataset.assetId = ''; this.element.dataset.audioState = 'silent';
  }
  dispose() {
    this.disposed = true; this.generation++;
    this.stopSfx(); this.element.pause(); this.element.removeAttribute('src'); this.element.load(); this.element.remove();
  }
}
