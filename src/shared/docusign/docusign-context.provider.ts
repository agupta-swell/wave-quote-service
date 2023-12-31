import { AsyncLocalStorage } from 'async_hooks';
import { DOCUSIGN_INTEGRATION_TYPE } from 'src/docusign-integration/constants';
import { IDocusignContextStore } from '.';
import { IContext, IIndexable } from './interfaces/IContext';

export class DocusignContextProvider implements IDocusignContextStore {
  private _als: AsyncLocalStorage<IContext<IIndexable>>;

  private _routesMapper: Array<[string, string]>;

  constructor() {
    this._als = new AsyncLocalStorage();
  }

  run(cb: () => void) {
    this._als.run(
      {
        genericObject: {},
        compiledTemplates: {},
        buildTime: 0,
        docWithPrefillTabIds: [],
        templateIds: [],
        currentPage: 0,
        totalPage: 0,
        serverTemplateIds: [],
        docusignIntegrationType: DOCUSIGN_INTEGRATION_TYPE.DEFAULT,
      },
      cb,
    );
  }

  get<T>(): IContext<T> {
    return (this._als.getStore() || { genericObject: {} }) as any;
  }
}
