/* eslint-disable consistent-return */
/* eslint-disable @typescript-eslint/ban-types */
import { ApiProperty, ApiPropertyOptions } from '@nestjs/swagger';
import { Expose, Type, Transform } from 'class-transformer';
import { strictPlainToClass } from '../transform/strict-plain-to-class';
import { IExposeSkipTransform } from './interfaces';

interface IExposePropDefaultValue {
  /**
   * Default value if the target is `null` or `undefined`
   *
   * Works with `skipTransform: true` or `noTransformDefault: true`
   */
  default?: any;

  noTransformDefault?: boolean;
}

/**
 * Compose `@ApiProperty`, `@Expose`, `@Type`, `@Transform`
 *
 * @description Used with `strictPlainToClass()`
 */
export const ExposeProp = (
  apiPropertyOptions?: ApiPropertyOptions & IExposePropDefaultValue & IExposeSkipTransform,
): PropertyDecorator => (target, propertyKey) => {
  ApiProperty(apiPropertyOptions)(target, propertyKey);
  Expose()(target, propertyKey);

  if (!apiPropertyOptions) return;

  if (apiPropertyOptions.skipTransform) {
    if (apiPropertyOptions.default) {
      Transform(params => params?.value ?? apiPropertyOptions.default)(target, propertyKey);
      return;
    }
    return;
  }

  if (apiPropertyOptions.type) {
    if (apiPropertyOptions.default) {
      Transform(params => {
        if ((params.value === undefined || params.value === null) && apiPropertyOptions.noTransformDefault) {
          return apiPropertyOptions.default;
        }

        const val = params.value || apiPropertyOptions.noTransformDefault;

        const cls =
          // eslint-disable-next-line no-nested-ternary
          typeof apiPropertyOptions.type === 'function'
            ? apiPropertyOptions.type
            : Array.isArray(apiPropertyOptions.type) && typeof apiPropertyOptions.type[0] === 'function'
            ? apiPropertyOptions.type[0]
            : undefined;

        return cls ? strictPlainToClass(<any>cls, val) : val;
      })(target, propertyKey);
      return;
    }
    const cls = Array.isArray(apiPropertyOptions.type)
      ? apiPropertyOptions.type[0]
      : (apiPropertyOptions.type as Function);

    Type(() => cls)(target, propertyKey);
  }
};
