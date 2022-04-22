import { AsyncLocalStorage } from 'async_hooks';
import { IAsyncContext, QueueItem, QueueTarget } from '../interfaces';

export class AsyncContextProvider implements IAsyncContext {
  private _als: AsyncLocalStorage<Array<QueueItem>>;

  private _sharedCacheStorage: Map<string, unknown>;

  constructor() {
    this._als = new AsyncLocalStorage();
    this._sharedCacheStorage = new Map();
  }

  run(cb: () => void): void {
    this._als.run([], cb);
  }

  queue(cb: () => QueueTarget): void {
    const store = this._als.getStore();

    if (!store) {
      throw new Error('AsyncContext is not initialized');
    }

    store.push(cb);
  }

  flush(): void {
    const store = this._als.getStore();

    store?.forEach(async cb => {
      const item = cb() as any;
      try {
        const res = await item();
      } catch (err) {
        this.logError(err);
      }
    });
  }

  private logError(err: unknown) {
    console.error(err);
  }

  public get<T>(key: string): T | undefined {
    return this._sharedCacheStorage.get(key) as T;
  }

  public uncache(key: string): boolean {
    return this._sharedCacheStorage.delete(key);
  }

  public cache<T>(key: string, value: T): void {
    this._sharedCacheStorage.set(key, value);
  }
}
