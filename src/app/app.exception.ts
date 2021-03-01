import { HttpException, HttpStatus } from '@nestjs/common';

export class ApplicationException extends HttpException {
  private constructor(
    response: string | Record<string, any> = '',
    status: HttpStatus = HttpStatus.UNPROCESSABLE_ENTITY,
  ) {
    super(response, status);
  }

  static EnitityNotFound(id?: string) {
    return new ApplicationException(`Enitity Not Found: ${id || ''}`, HttpStatus.UNPROCESSABLE_ENTITY);
  }

  static EmailNotFound(email?: string) {
    return new ApplicationException(`Email Not Found: ${email || ''}`, HttpStatus.UNAUTHORIZED);
  }

  static EmailDuplicated(email?: string) {
    return new ApplicationException(`Email is already existed: ${email || ''}`, HttpStatus.BAD_REQUEST);
  }

  static NoPermission() {
    return new ApplicationException('You don\'t have permission to do this.', HttpStatus.UNAUTHORIZED);
  }

  static WrongEmail() {
    return new ApplicationException('Please check your email for change password', HttpStatus.UNAUTHORIZED);
  }

  static ServiceError() {
    return new ApplicationException(
      'Service is not available, please try again later',
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }

  static NullEnitityFound(enitity: string, id?: string) {
    return new ApplicationException(`${enitity} Not Found ${id || ''}`, HttpStatus.UNPROCESSABLE_ENTITY);
  }

  static NotFoundStatus(enitity: string, id?: string) {
    return new ApplicationException(`${enitity} Not Found ${id || ''}`, HttpStatus.NOT_FOUND);
  }

  static UnprocessableEnity(message: string, id?: string) {
    return new ApplicationException(`${message || ''} ${id || ''}`, HttpStatus.UNPROCESSABLE_ENTITY);
  }

  static SyncSystemDesignFail(opportunityId: string) {
    return new ApplicationException(
      `System Designs are not update by opportunity ${opportunityId} when Utility and Usage have changed`,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
  }

  static ValidationFailed(message?: string) {
    return new ApplicationException(`Validation failed${message ? `: ${message}` : ''}`, HttpStatus.BAD_REQUEST);
  }

  static ExpiredToken(data?: any) {
    return new ApplicationException({ message: 'Your token is expired!!!', data }, HttpStatus.BAD_REQUEST);
  }

  static ExistedEntity(type: string, id?: string) {
    return new ApplicationException(`Can not process with ${type}: ${id || ''}`, HttpStatus.UNPROCESSABLE_ENTITY);
  }
}
