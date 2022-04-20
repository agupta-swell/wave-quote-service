import { AsyncLocalStorage } from 'async_hooks';
import { IAsyncContext, QueueItem, QueueTarget } from '../interfaces';

export class AsyncContextProvider implements IAsyncContext {
  private _als: AsyncLocalStorage<Array<QueueItem>>;

  constructor() {
    this._als = new AsyncLocalStorage();
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

    store?.forEach(cb => {
      const item = cb();

      if (item instanceof Promise || (typeof item === 'function' && item.constructor.name === 'AsyncFunction')) {
        (item as Promise<unknown>).catch(this.logError);
        return;
      }

      try {
        item();
      } catch (err) {
        this.logError(err);
      }
    });
  }

  private logError(err: unknown) {
    console.error(err);
  }
}
