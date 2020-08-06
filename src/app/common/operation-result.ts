export enum ResultStatus {
  OK,
  FAIL,
  ERROR,
}

export class OperationResult<D> {
  constructor(
    public readonly status: ResultStatus,
    public readonly data?: D,
    public readonly message?: string,
    public readonly error?: Error,
  ) {}

  isOk() {
    return this.status === ResultStatus.OK;
  }

  isFail() {
    return this.status === ResultStatus.FAIL;
  }

  isError() {
    return this.status === ResultStatus.ERROR;
  }

  static ok<D>(data?: D) {
    return new OperationResult(ResultStatus.OK, data);
  }

  static fail<D>(error: Error) {
    return new OperationResult<D>(ResultStatus.FAIL, (error as any).data, error.message, error);
  }

  static error<D>(error: Error, data?: D) {
    return new OperationResult(ResultStatus.ERROR, data, error.message, error);
  }
}
