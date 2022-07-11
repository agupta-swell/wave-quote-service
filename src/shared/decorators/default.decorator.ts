import { Expose, Transform } from 'class-transformer';

const CallableWrapperTypeCtors = [String, Number, Boolean];

type CallableWrapperType = string | number | boolean;

type TypeFromKey<T, KeyType> = { [K in keyof T]: KeyType extends T[K] ? K : never }[keyof T];

interface IDefaultOption {
  ignoreNull?: boolean;
}

/**
 * Assign default value if key does not exist in object
 * @param val
 * @returns
 */
export function Default(
  option?: IDefaultOption,
): <Key extends string, T extends Record<Key, CallableWrapperType>>(target: T, key: Key) => void;
export function Default<Val>(
  defaultValue: Val,
  option?: IDefaultOption,
): <T>(target: T, key: TypeFromKey<T, Val>) => void;
export function Default<Val>(
  transformer: () => Val,
  option?: IDefaultOption,
): <T>(target: T, key: TypeFromKey<T, Val>) => void;

export function Default(transformer?: any, option?: IDefaultOption): PropertyDecorator {
  return (target, propertyKey) => {
    Expose()(target, propertyKey);
    Transform(({ key, obj, value }) => {
      let val = transformer;

      let defaultOption: IDefaultOption = {};

      if (typeof option === 'object') defaultOption = option;
      else if (typeof transformer === 'object' && 'ignoreNull' in transformer) {
        defaultOption = transformer;
        val = null;
      }

      if (typeof defaultOption.ignoreNull === 'boolean') {
        if (defaultOption.ignoreNull && value !== null) {
          return value;
        }
      } else if (key in obj) return value;

      const type = Reflect.getMetadata('design:type', target, propertyKey);

      if (!val) {
        if (CallableWrapperTypeCtors.includes(type as any)) {
          return (type as any)();
        }

        return value;
      }

      if (typeof transformer === 'function') return transformer();

      return val;
    })(target, propertyKey);
  };
}
