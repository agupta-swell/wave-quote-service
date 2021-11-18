import { AsyncLocalStorage } from 'async_hooks';
import { join } from 'path';
import { RequestMethod } from '@nestjs/common';
import { IDocusignContextStore } from '.';
import { IContext, IIndexable } from './interfaces/IContext';
import { IDocusignContextRouteMapper } from './interfaces';
import { contextRoutes } from './decorators/docusign-context-route.decorator';

export class DocusignContextProvider implements IDocusignContextStore, IDocusignContextRouteMapper {
  private _als: AsyncLocalStorage<IContext<IIndexable>>;

  private _routesMapper: Array<[string, string]>;

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

  public initRoutesMapper() {
    this._routesMapper = contextRoutes.map(([ctor, desc]) => {
      const controllerPath = Reflect.getMetadata('path', ctor);

      const routePath = Reflect.getMetadata('path', desc);

      const methodValue = Reflect.getMetadata('method', desc);

      const methodKey = RequestMethod[methodValue];

      const path = join(controllerPath, routePath);

      return [methodKey, path];
    });
  }

  checkRoute(method: string, path: string): boolean {
    if (!this._routesMapper) {
      return false;
    }

    return this._routesMapper.findIndex(e => e[0] === method && e[1] === path) !== -1;
  }
}
