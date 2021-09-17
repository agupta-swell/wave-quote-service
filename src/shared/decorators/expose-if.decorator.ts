import { ExposeAndMap } from './expose-and-map.decorator';

/**
 * Compose `@ApiProperty`, `@Expose`, `@Type`, `@Transform`
 *
 * @description Used with `strictPlainToClass()`
 */
export const ExposeIf = <T = Record<string, unknown>>(validator: (obj: T) => boolean) =>
  ExposeAndMap({}, ({ obj, value }) => {
    if (validator(obj)) {
      return value;
    }
  });
