import type { LayerRecipe } from './types.js';

export type ImagePort<T> = (url: string) => Promise<T>;
export async function loadLayers<T>(recipe: LayerRecipe, port: ImagePort<T>): Promise<ReadonlyMap<string, T>> {
  if (new Set(recipe.layers.map(layer => layer.id)).size !== recipe.layers.length) throw new Error(`分层配方 ${recipe.id} 存在重复图层`);
  if (!recipe.layers.length || recipe.layers.some(layer => !layer.frames.length)) throw new Error(`分层配方 ${recipe.id} 缺少图层或差分帧`);
  const urls = [...new Set(recipe.layers.flatMap(layer => [...layer.frames]))];
  const loaded = await Promise.all(urls.map(async url => [url, await port(url)] as const));
  return new Map(loaded);
}
export const decodeImage: ImagePort<HTMLImageElement> = async url => {
  const image = new Image();
  image.decoding = 'async'; image.draggable = false;
  image.src = url;
  try { await image.decode(); }
  catch { throw new Error(`图片加载或解码失败：${url}`); }
  return image;
};

/** 每个显示实例独占租期；成功、失败、释放均受同一修订号保护。 */
export class VisualLease {
  private revision = 0;
  private key = '';
  private disposed = false;
  request<T>(key: string, load: () => Promise<T>, ready: (value: T) => void, failed: (error: unknown) => void): void {
    if (this.disposed || key === this.key) return;
    this.key = key;
    const revision = ++this.revision;
    void load().then(value => {
      if (!this.disposed && this.revision === revision) ready(value);
    }, error => {
      if (!this.disposed && this.revision === revision) failed(error);
    });
  }
  dispose(): void { this.disposed = true; ++this.revision; }
}
