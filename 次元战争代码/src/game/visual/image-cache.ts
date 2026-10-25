import type { ImagePort } from './loading.js';

type Entry<T> = { promise: Promise<T>; value?: T; ready: boolean };

/** 由控制器持有，跨视图复用解码结果；失败不缓存，不持有剧情或存档状态。 */
export class ImageCache<T> {
  private readonly entries = new Map<string, Entry<T>>();
  private disposed = false;
  private readonly decode: ImagePort<T>;
  private readonly capacity: number;

  constructor(decode: ImagePort<T>, capacity = 32) { this.decode = decode; this.capacity = capacity; }

  readonly load: ImagePort<T> = url => {
    if (this.disposed) return Promise.reject(new Error('图片缓存已释放'));
    const previous = this.entries.get(url);
    if (previous) { this.touch(url, previous); return previous.promise; }
    const entry: Entry<T> = { ready: false, promise: Promise.resolve().then(() => this.decode(url)) };
    entry.promise = entry.promise.then(value => {
      if (!this.disposed && this.entries.get(url) === entry) {
        entry.value = value; entry.ready = true; this.trim();
      }
      return value;
    }, (error: unknown) => {
      if (this.entries.get(url) === entry) this.entries.delete(url);
      throw error;
    });
    this.entries.set(url, entry);
    return entry.promise;
  };

  readonly peek = (url: string): T | undefined => {
    const entry = this.entries.get(url);
    if (!entry?.ready) return undefined;
    this.touch(url, entry); return entry.value;
  };

  private touch(url: string, entry: Entry<T>): void {
    this.entries.delete(url); this.entries.set(url, entry);
  }

  private trim(): void {
    for (const [url, entry] of this.entries) {
      if (this.entries.size <= this.capacity) break;
      if (entry.ready) this.entries.delete(url);
    }
  }

  dispose(): void { this.disposed = true; this.entries.clear(); }
}
