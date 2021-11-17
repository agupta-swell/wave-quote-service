// eslint-disable-next-line @typescript-eslint/ban-types
export const contextRoutes: Array<[Function, any]> = [];

export const UseDocusignContext = (): MethodDecorator => (target, __, desc) => {
  if (desc.value) {
    contextRoutes.push([target.constructor, desc.value]);
  }
};
