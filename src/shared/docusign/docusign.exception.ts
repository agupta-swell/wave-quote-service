import { HttpException, HttpStatus } from '@nestjs/common';

export class DocusignException extends HttpException {
  constructor(
    private readonly _error?: Error,
    private readonly _appMessage?: string,
    private readonly _isSafe = false,
  ) {
    super(_appMessage ?? 'This contract cannot be generated', HttpStatus.BAD_REQUEST);
  }

  get rawError(): Error | undefined {
    return this._error;
  }

  get isSafe(): boolean {
    return this._isSafe;
  }
}
