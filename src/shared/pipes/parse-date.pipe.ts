/* eslint-disable no-restricted-globals */
import { PipeTransform, Injectable } from '@nestjs/common';
import { ApplicationException } from 'src/app/app.exception';

@Injectable()
export class ParseDatePipe implements PipeTransform<unknown, Date> {
  transform(value: unknown): Date {
    return ParseDatePipe.validate(value);
  }

  static validate(value: any): Date {
    const date = isNaN(value) ? new Date(value) : new Date(+value);

    // eslint-disable-next-line no-restricted-globals
    if (!(date instanceof Date) || isNaN(date.valueOf())) {
      throw ApplicationException.ValidationFailed('Must be a valid date string or timestamp');
    }

    return date;
  }
}
