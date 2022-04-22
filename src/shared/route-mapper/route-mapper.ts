import { RequestMethod } from '@nestjs/common';
import { join } from 'path';
import { RouteMapperMeta, RouteResolver } from './types';

export class RouteMapper {
  private static readonly MetaStorage: Map<string | symbol, RouteMapperMeta[]> = new Map();

  private static readonly RouteResolvers: Map<string | symbol, RouteResolver[]> = new Map();

  private static isInit: boolean;

  public static register(namespace: string | symbol, meta: RouteMapperMeta): void {
    const found = this.MetaStorage.get(namespace);

    if (!found) {
      this.MetaStorage.set(namespace, [meta]);
      return;
    }

    found.push(meta);
  }

  public static initRoutesMapper(): void {
    if (this.isInit) {
      return;
    }

    this.isInit = true;

    this.MetaStorage.forEach((metas, namespace) => {
      const resolvers = metas.map<RouteResolver>(([ctor, desc]) => {
        const controllerPath = Reflect.getMetadata('path', ctor);

        const routePath = Reflect.getMetadata('path', desc);

        const methodValue = Reflect.getMetadata('method', desc);

        const methodKey = RequestMethod[methodValue];

        if (routePath === '/') return [methodKey, controllerPath];

        const path = join(controllerPath, routePath);

        return [methodKey, path];
      });

      this.RouteResolvers.set(namespace, resolvers);
    });
  }

  public static checkRoute(namespace: string | symbol, method: string, path: string): boolean {
    if (!this.isInit) {
      throw new Error("RouteMapper hasn't been initialized yet");
    }

    const resolvers = this.RouteResolvers.get(namespace);

    if (!resolvers) {
      return false;
    }

    return resolvers.findIndex(e => (method === 'ALL' || e[0] === method) && e[1] === path) !== -1;
  }

  /**
   * Does not support wildcards, parameters
   * @param namespace
   * @param method
   * @param path
   * @returns
   */
  public static checkIncommingReq(namespace: string | symbol, method: string, path: string): boolean {
    const normalizedMethod = method.toUpperCase();
    return (
      this.checkRoute(namespace, normalizedMethod, path) || this.checkRoute(namespace, normalizedMethod, `${path}/`)
    );
  }
}
