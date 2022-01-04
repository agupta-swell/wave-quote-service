import { ArgumentMetadata, BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';

@Injectable()
export class ValidationPipe implements PipeTransform<any> {
  async transform(value: any, arg: ArgumentMetadata) {
    const { metatype } = arg;

    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }
    const object = plainToClass(metatype, value);

    const errors = await validate(object);

    if (errors.length > 0) {
      const data = errors.map(err => ({
        property: err.property,
        children: err.children,
        constraints: err.constraints,
      }));
      throw new BadRequestException({ message: 'Validation failed', errors: data });
    }
    return object;
  }

  private toValidate(metatype: Function): boolean {
    const types: Function[] = [String, Boolean, Number, Array, Object, Date];
    return !types.includes(metatype);
  }
}
