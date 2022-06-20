/* eslint-disable @typescript-eslint/ban-types */
import { registerDecorator, ValidationOptions, ValidationArguments, isMimeType, isBase64 } from 'class-validator';

export function IsBase64ByMime(mime: string, validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isStringOrNull',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown) {
          if (!value || typeof value !== 'string') return false;

          const parts = value.split(',');

          const mimeType = parts[0].split(':')[1].split(';')[0];

          if (mimeType !== mime) return false;

          const base64 = parts.at(-1);

          return isBase64(base64);
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must a valid base64 encode of ${mime}`;
        },
      },
    });
  };
}
