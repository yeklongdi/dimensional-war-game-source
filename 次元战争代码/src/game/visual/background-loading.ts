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
  private current?: { run: number; actId: string; id: string; url?: string; status: BackgroundFrame<T>['status'] };
  private readonly ready = new Map<string, T>();
  private disposed = false;
  private readonly decode: (url: string) => Promise<T>;
  private readonly present: (frame: BackgroundFrame<T>) => void;
  private readonly peek?: (url: string) => T | undefined;

  constructor(decode: (url: string) => Promise<T>, present: (frame: BackgroundFrame<T>) => void,
    peek?: (url: string) => T | undefined) {
    this.decode = decode; this.present = present; this.peek = peek;
  }

  update(input: BackgroundInput): void {
    const key = JSON.stringify([input.run, input.actId, input.sceneId, input.id, input.url]);
    if (this.disposed || key === this.key) return;
    this.key = key;
    // 同会话沿用同图不清屏，也不撤销仍在途的请求；失败才允许新场景重试。
    if (this.current?.run === input.run && this.current.actId === input.actId
      && this.current.id === input.id && this.current.url === input.url && this.current.status !== 'failed') return;
    this.current = { ...input, status: input.url ? 'loading' : 'missing' };
    const cached = input.url ? this.peek?.(input.url) ?? this.ready.get(input.url) : undefined;
    if (cached !== undefined) {
      this.lease.request(key, async () => cached, () => {}, () => {});
      this.deliver({ status: 'ready', id: input.id, image: cached }); return;
    }
    this.deliver({ status: input.url ? 'loading' : 'missing', id: input.id });
    // 未绑定也建立新租期，防止上一次有图请求的晚到回调覆盖渐变。
    this.lease.request(key, async () => input.url ? this.image(input.url) : undefined,
      image => { if (image !== undefined) this.deliver({ status: 'ready', id: input.id, image }); },
      () => this.deliver({ status: 'failed', id: input.id,
        message: `背景 ${input.id} 加载或解码失败，使用当前场景渐变占位。` }));
  }

  private deliver(frame: BackgroundFrame<T>): void {
    if (this.current) this.current.status = frame.status;
    this.present(frame);
  }

  private image(url: string): Promise<T> {
    // 有控制器级缓存时不再额外强持有全部图片，保留其淘汰边界。
    if (this.peek) return this.decode(url);
    let pending = this.cache.get(url);
    if (!pending) {
      pending = Promise.resolve().then(() => this.decode(url)).then(image => {
        if (!this.disposed && !this.peek) this.ready.set(url, image);
        return image;
      }).catch((error: unknown) => {
        this.cache.delete(url); throw error;
      });
      this.cache.set(url, pending);
    }
    return pending;
  }

  dispose(): void {
    this.disposed = true; this.lease.dispose(); this.cache.clear(); this.ready.clear();
  }
}
