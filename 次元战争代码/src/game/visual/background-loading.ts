import { VisualLease } from './loading.js';

export type BackgroundInput = {
  run: number; actId: string; sceneId: string; id: string; url?: string;
};
export type BackgroundFrame<T> =
  | { status: 'loading' | 'missing'; id: string }
  | { status: 'ready'; id: string; image: T }
  | { status: 'failed'; id: string; message: string };

/** 当前视图独占租期和缓存。只加载访问到的图片；失败允许在新场景重试。 */
export class BackgroundLoader<T> {
  private readonly lease = new VisualLease();
  private readonly cache = new Map<string, Promise<T>>();
  private key = '';
  private disposed = false;
  private readonly decode: (url: string) => Promise<T>;
  private readonly present: (frame: BackgroundFrame<T>) => void;

  constructor(decode: (url: string) => Promise<T>, present: (frame: BackgroundFrame<T>) => void) {
    this.decode = decode; this.present = present;
  }

  update(input: BackgroundInput): void {
    const key = JSON.stringify([input.run, input.actId, input.sceneId, input.id, input.url]);
    if (this.disposed || key === this.key) return;
    this.key = key;
    this.present({ status: input.url ? 'loading' : 'missing', id: input.id });
    // 未绑定也建立新租期，防止上一次有图请求的晚到回调覆盖渐变。
    this.lease.request(key, async () => input.url ? this.image(input.url) : undefined,
      image => { if (image !== undefined) this.present({ status: 'ready', id: input.id, image }); },
      () => this.present({ status: 'failed', id: input.id,
        message: `背景 ${input.id} 加载或解码失败，使用当前场景渐变占位。` }));
  }

  private image(url: string): Promise<T> {
    let pending = this.cache.get(url);
    if (!pending) {
      pending = Promise.resolve().then(() => this.decode(url)).catch((error: unknown) => {
        this.cache.delete(url); throw error;
      });
      this.cache.set(url, pending);
    }
    return pending;
  }

  dispose(): void {
    this.disposed = true; this.lease.dispose(); this.cache.clear();
  }
}
