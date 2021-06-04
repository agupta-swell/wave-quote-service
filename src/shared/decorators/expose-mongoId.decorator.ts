/* eslint-disable @typescript-eslint/ban-types */
import { ApiProperty, ApiPropertyOptions } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';

interface IExposeMongoIdOpt {
  /**
   * Return props.id if props._id is `undefined`
   */
  eitherId?: boolean;
}

/**
 * Compose `@ApiProperty`, `@Expose`, `@Type`, `@Transform`
 * 
 * Expose object._id to object.id
 * @param apiPropertyOptions
 * @description Used with `strictPlainToClass()`
 */
export const ExposeMongoId = (apiPropertyOptions?: ApiPropertyOptions & IExposeMongoIdOpt): PropertyDecorator => (
  target,
  propertyKey,
) => {
  ApiProperty(apiPropertyOptions)(target, propertyKey);
  Expose()(target, propertyKey);
  Transform(e => (apiPropertyOptions?.eitherId ? e.obj._id || e.obj.id : e.obj._id))(target, propertyKey);
};
