import { AsyncLocalStorage } from 'async_hooks';
import { IAsyncContext, IQueueStore, QueueItem, QueueTarget } from '../interfaces';

export class AsyncContextProvider implements IAsyncContext {
  private _als: AsyncLocalStorage<IQueueStore>;

  private _sharedCacheStorage: Map<string, unknown>;

  constructor() {
    this._als = new AsyncLocalStorage();
    this._sharedCacheStorage = new Map();
  }

  public UNSAFE_getStore() {
    return this._als.getStore();
  }

  private getStoreOrFail(): IQueueStore {
    const store = this._als.getStore();

    if (!store) {
      throw new Error('AsyncContext is not initialized');
    }

    return store;
  }

  queueBeforeRes(cb: () => QueueItem): void {
    const store = this.getStoreOrFail();

    store.beforeRes.push(cb);
  }

  run(cb: () => void): void {
    this._als.run(
      {
        afterRes: [],
        beforeRes: [],
        cache: new Map(),
      },
      cb,
    );
  }

  queue(cb: () => QueueTarget): void {
    const store = this.getStoreOrFail();

    store.afterRes.push(cb);
  }

  flush(): void {
    const store = this.getStoreOrFail();

    store?.afterRes.forEach(async cb => {
      const item = cb() as any;
      try {
        const res = await item();
      } catch (err) {
        this.logError(err);
      }
    });
  }

  async flushBeforeRes(): Promise<void> {
    const store = this.getStoreOrFail();

    await Promise.all(store.beforeRes.map(e => e()));

    store.beforeRes = [];
  }

  public get hasPendingTasks(): boolean {
    return !!this._als.getStore()?.beforeRes?.length;
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
