import { PipeTransform, Injectable } from '@nestjs/common';
import { Types, ObjectId } from 'mongoose';
import { ApplicationException } from 'src/app/app.exception';

@Injectable()
export class ParseObjectIdPipe implements PipeTransform<any, any> {
  transform(value: unknown): ObjectId | null {
    return ParseObjectIdPipe.validate(value);
  }

  static validate(value: unknown): ObjectId | null {
    if (value === '-1') {
      return null;
    }

    if (typeof value !== 'string' || !Types.ObjectId.isValid(<string>value)) {
      throw ApplicationException.ValidationFailed('Must be a valid Mongo ObjectID String');
    }

    return (new Types.ObjectId(<string>value) as unknown) as ObjectId;
  }
}
