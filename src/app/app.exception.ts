import { HttpException, HttpStatus } from '@nestjs/common';

export class ApplicationException extends HttpException {
  private constructor(response: string = '', status: HttpStatus = HttpStatus.UNPROCESSABLE_ENTITY) {
    super(response, status);
  }

  static EnitityNotFound(id?: string) {
    return new ApplicationException(`Enitity Not Found: ${id}`, HttpStatus.UNPROCESSABLE_ENTITY);
  }

  static EmailNotFound(email?: string) {
    return new ApplicationException(`Email Not Found: ${email}`, HttpStatus.UNAUTHORIZED);
  }

  static EmailDuplicated(email?: string) {
    return new ApplicationException(`Email is already existed: ${email}`, HttpStatus.BAD_REQUEST);
  }

  static NoPermission() {
    return new ApplicationException(`You don't have permission to do this.`, HttpStatus.UNAUTHORIZED);
  }

  static WrongEmail() {
    return new ApplicationException(`Please check your email for change password`, HttpStatus.UNAUTHORIZED);
  }

  static ServiceError() {
    return new ApplicationException(
      `Service is not available, please try again later`,
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}
