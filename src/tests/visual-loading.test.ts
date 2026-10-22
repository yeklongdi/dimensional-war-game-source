import { describe, expect, it, vi } from 'vitest';
import { loadLayers, VisualLease } from '../game/visual/loading.js';
import { heroRecipes } from '../game/visual/hero.js';
import { visualClock } from '../game/ui/layered-figure.js';

function deferred<T>() {
  let resolve!: (value: T) => void, reject!: (reason: unknown) => void;
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
const flush = async () => { await Promise.resolve(); await Promise.resolve(); };
describe('加载原子交付与修订号生命周期', () => {
  it('原生动画时钟保留Window接收者，包装后的取消可用于实例释放', () => {
    const cancelled: number[] = [];
    const host = {
      requestAnimationFrame(_callback: FrameRequestCallback): number { expect(this).toBe(host); return 17; },
      cancelAnimationFrame(id: number): void { expect(this).toBe(host); cancelled.push(id); },
    };
    vi.stubGlobal('window', host);
    try { const id = visualClock.request(() => {}); visualClock.cancel(id); expect(cancelled).toEqual([17]); }
    finally { vi.unstubAllGlobals(); }
  });
  it('当前组合全部成功才交付，不提前提供半套图层', async () => {
    const pending = deferred<string>();
    const recipe = heroRecipes[0]!, last = recipe.layers.at(-1)!.frames.at(-1)!;
    let ready = false;
    const loading = loadLayers(recipe, url => url === last ? pending.promise : Promise.resolve(url)).then(value => { ready = true; return value; });
    await flush(); expect(ready).toBe(false);
    pending.resolve(last); const result = await loading;
    expect(ready).toBe(true); expect(result.size).toBe(new Set(recipe.layers.flatMap(layer => [...layer.frames])).size);
  });
  it('同一URL只解码一次，输入配置不可变', async () => {
    const recipe = heroRecipes[0]!, before = JSON.stringify(recipe), calls: string[] = [];
    await loadLayers(recipe, async url => { calls.push(url); return url; });
    expect(new Set(calls).size).toBe(calls.length); expect(JSON.stringify(recipe)).toBe(before);
  });
  it('任一层失败拒绝整套，不把静态asset标坏', async () => {
    const recipe = heroRecipes[0]!, before = JSON.stringify(recipe);
    await expect(loadLayers(recipe, async url => { if (url.endsWith('eyes-half-v2.png')) throw new Error('decode failed'); return url; })).rejects.toThrow('decode failed');
    expect(JSON.stringify(recipe)).toBe(before);
  });
  it('请求等待期间保留现有画面，全部成功才一次替换', async () => {
    const pending = deferred<string>(), lease = new VisualLease(); let frame = 'old';
    lease.request('new', () => pending.promise, result => { frame = result; }, () => { frame = 'fallback'; });
    expect(frame).toBe('old'); pending.resolve('new'); await flush(); expect(frame).toBe('new');
  });
  it('连续更新后过期成功与失败均不覆盖当前组合', async () => {
    const old = deferred<string>(), current = deferred<string>(), third = deferred<string>();
    const lease = new VisualLease(), ready = vi.fn(), failed = vi.fn();
    lease.request('first', () => old.promise, ready, failed);
    lease.request('second', () => current.promise, ready, failed);
    lease.request('third', () => third.promise, ready, failed);
    current.reject('旧失败'); old.resolve('旧成功'); third.resolve('最新成功'); await flush();
    expect(ready.mock.calls).toEqual([['最新成功']]); expect(failed).not.toHaveBeenCalled();
  });
  it('相同外观的逐字或说话者更新不重载、不重播', async () => {
    const lease = new VisualLease(), ready = vi.fn(), load = vi.fn(async () => 'image');
    for (let index = 0; index < 80; ++index) lease.request('same', load, ready, vi.fn());
    await flush(); expect(load).toHaveBeenCalledTimes(1); expect(ready).toHaveBeenCalledTimes(1);
  });
  it.each(['resolve', 'reject'] as const)('释放后旧会话%s无效，也不能新建请求', async method => {
    const pending = deferred<string>(), lease = new VisualLease(), ready = vi.fn(), failed = vi.fn();
    lease.request('old-session', () => pending.promise, ready, failed); lease.dispose();
    pending[method]('late'); await flush();
    const load = vi.fn(async () => 'new'); lease.request('new', load, ready, failed);
    expect(ready).not.toHaveBeenCalled(); expect(failed).not.toHaveBeenCalled(); expect(load).not.toHaveBeenCalled();
  });
  it('当前失败只回报一次，下一请求可成功，旧失败不能取消恢复', async () => {
    const lease = new VisualLease(), failed = vi.fn(), ready = vi.fn();
    lease.request('bad', async () => { throw new Error('bad'); }, ready, failed); await flush();
    lease.request('bad', async () => 'not reloaded', ready, failed); await flush();
    expect(failed).toHaveBeenCalledTimes(1);
    lease.request('fallback', async () => 'static', ready, failed); await flush(); expect(ready).toHaveBeenCalledWith('static');
  });
});
