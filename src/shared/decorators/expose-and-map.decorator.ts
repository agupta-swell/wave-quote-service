import { ApiProperty, ApiPropertyOptions } from '@nestjs/swagger';
import { ClassConstructor, Expose, Transform, TransformFnParams } from 'class-transformer';
import { strictPlainToClass } from '../transform/strict-plain-to-class';
import { IExposeSkipTransform } from './interfaces';

type TransformFn = (params: TransformFnParams) => any;

export interface IExposeAndMap {
  /**
   * Change root for the target (usage in nested object )
   *
   */
  root: string;

  /**
   * Check top level object if `root` is undefined
   */
  checkParent?: boolean;
}

/**
 * Compose `@ApiProperty`, `@Expose`, `@Type`, `@Transform`
 *
 * Passing `root` in option to change the source of the target
 * @param apiPropertyOptions
 * @description Used with `strictPlainToClass()`
 */
export function ExposeAndMap(
  apiPropertyOptions: ApiPropertyOptions & IExposeSkipTransform & IExposeAndMap,
): PropertyDecorator;

/**
 * Compose `@ApiProperty`, `@Expose`, `@Type`, `@Transform`
 *
 * Explicitly map the target to specific value
 * @param apiPropertyOptions
 * @param transformFn return value for target
 * @description Used with `strictPlainToClass()`
 */
export function ExposeAndMap(
  apiPropertyOptions: ApiPropertyOptions & IExposeSkipTransform,
  transformFn: TransformFn,
): PropertyDecorator;
export function ExposeAndMap(apiPropertyOptions: any, transformFn?: any): PropertyDecorator {
  return (target, propertyKey) => {
    const { type, root, skipTransform, checkParent } = apiPropertyOptions;

    const cls: ClassConstructor<any> | undefined = (Array.isArray(type) ? type[0] : type) as any;

    const isClassConstructor = !skipTransform && cls && typeof cls === 'function';
    ApiProperty(apiPropertyOptions)(target, propertyKey);
    Expose()(target, propertyKey);
    Transform(params => {
      if (root) {
        const obj = params.obj[root];

        if (!obj) {
          if (!checkParent) return null;
          const value = params.obj[propertyKey];
          return isClassConstructor ? strictPlainToClass(<any>cls, value) : value;
        }

        const value = obj[propertyKey];
        return isClassConstructor ? strictPlainToClass(<any>cls, value) : value;
      }
      const obj = transformFn(params);
      return isClassConstructor ? strictPlainToClass(<any>cls, obj) : obj;
    })(target, propertyKey);
  };
}
