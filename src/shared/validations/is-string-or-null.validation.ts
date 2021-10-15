import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

export function IsStringOrNull(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isStringOrNull',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, _args: ValidationArguments) {
          return value === null || typeof value === 'string';
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must a string or null`;
        },
      },
    });
  };
}
