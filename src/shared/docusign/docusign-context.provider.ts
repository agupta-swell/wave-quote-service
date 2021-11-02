import { AsyncLocalStorage } from 'async_hooks';
import { IDocusignContextStore } from '.';
import { IContext, IIndexable } from './interfaces/IContext';

export class DocusignContextProvider implements IDocusignContextStore {
  private _als: AsyncLocalStorage<IContext<IIndexable>>;

  constructor() {
    this._als = new AsyncLocalStorage();
  }

  run(cb: () => void) {
    this._als.run(
      { genericObject: {}, compiledTemplates: {}, buildTime: 0, docWithPrefillTabIds: [], templateIds: [] },
      cb,
    );
  }

  get<T>(): IContext<T> {
    return (this._als.getStore() || { genericObject: {} }) as any;
  }
}
