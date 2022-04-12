import { RouteMapper } from './route-mapper';

export const UseRouteMapper = (namespace: string | symbol): MethodDecorator => (target, __, desc) => {
  if (desc.value) {
    RouteMapper.register(namespace, [target.constructor, desc.value]);
  }
};
