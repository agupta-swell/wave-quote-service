import { HttpException } from '@nestjs/common';
import { IEventHistory } from './qualification.schema';

export type QualificationExceptionData = {
  qualificationCreditId: string;
  errorEvent: Partial<IEventHistory>;
}

export class QualificationException extends HttpException {
  constructor(private readonly _error: HttpException, private readonly _data: QualificationExceptionData) {
    super(_error.getResponse(), _error.getStatus());
    this._data = _data;
  }

  get qualificationExceptionData() {
    return this._data;
  }

  get rawError(): Error | undefined {
    return this._error;
  }
}
