import { Transform, Expose } from 'class-transformer';

const CallableWrapperTypeCtors = [String, Number, Boolean];

type CallableWrapperType = string | number | boolean;

type TypeFromKey<T, KeyType> = { [K in keyof T]: KeyType extends T[K] ? K : never }[keyof T];

/**
 * Assign default value if key does not exist in object
 * @param val
 * @returns
 */
export function Default(): <Key extends string, T extends Record<Key, CallableWrapperType>>(
  target: T,
  key: Key,
) => void;
export function Default<Val>(defaultValue: Val): <T>(target: T, key: TypeFromKey<T, Val>) => void;
export function Default<Val>(transformer: () => Val): <T>(target: T, key: TypeFromKey<T, Val>) => void;

export function Default(transformer?: any): PropertyDecorator {
  return (target, propertyKey) => {
    Expose()(target, propertyKey);
    Transform(({ key, obj, value }) => {
      if (key in obj) return value;

      const type = Reflect.getMetadata('design:type', target, propertyKey);

      if (!transformer) {
        if (CallableWrapperTypeCtors.includes(type as any)) {
          return (type as any)();
        }

        return value;
      }

      if (typeof transformer === 'function') return transformer();

      return transformer;
    })(target, propertyKey);
  };
}
