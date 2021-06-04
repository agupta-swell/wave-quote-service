import { ClassTransformOptions } from '@nestjs/common/interfaces/external/class-transform-options.interface';
import { ClassConstructor, plainToClass } from 'class-transformer';

export type SoftPartial<T> = Record<string | number | symbol, unknown> &
  {
    [P in keyof T]?: any;
  };

/**
 * Enforce `plainToClass({excludeExtraneousValues: true})`
 * @returns
 */
export function strictPlainToClass<T>(
  cls: ClassConstructor<T>,
  plain: SoftPartial<T> | null,
  options?: ClassTransformOptions,
): T;
/**
 * Enforce `plainToClass({excludeExtraneousValues: true})`
 * @returns
 */
export function strictPlainToClass<T>(
  cls: ClassConstructor<T>,
  plain: SoftPartial<T>[],
  options?: ClassTransformOptions,
): T[];
export function strictPlainToClass(cls: any, plain: any, options: any) {
  if (!options) {
    return plainToClass(cls, plain, { excludeExtraneousValues: true });
  }

  options.excludeExtraneousValues = true;
  return plainToClass(cls, plainToClass, options);
}
