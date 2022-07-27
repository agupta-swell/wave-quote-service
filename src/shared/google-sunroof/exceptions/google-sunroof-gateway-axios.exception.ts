import { AxiosError } from 'axios';

export class GoogleSunroofGatewayAxiosException extends Error {
  constructor(private readonly axiosError: AxiosError) {
    super(axiosError.message);
    const { error } = axiosError.response?.data ?? {};

    if (error) this.message = `${error.code} - ${error.message} - ${error.status}`;

    Error.captureStackTrace(this, this.constructor);
  }

  get rawError() {
    return this.axiosError;
  }
}
