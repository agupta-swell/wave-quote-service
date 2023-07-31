import { HttpException, HttpStatus } from '@nestjs/common';
import { DOCUSIGN_INTEGRATION_TYPE } from 'src/docusign-integration/constants';

export class ApplicationException extends HttpException {
  private constructor(
    response: string | Record<string, any> = '',
    status: HttpStatus = HttpStatus.UNPROCESSABLE_ENTITY,
  ) {
    super(response, status);
  }

  static EntityNotFound(id?: string): ApplicationException {
    return new ApplicationException(`Entity Not Found: ${id || ''}`, HttpStatus.UNPROCESSABLE_ENTITY);
  }

  static EmailNotFound(email?: string): ApplicationException {
    return new ApplicationException(`Email Not Found: ${email || ''}`, HttpStatus.UNAUTHORIZED);
  }

  static EmailDuplicated(email?: string): ApplicationException {
    return new ApplicationException(`Email is already existed: ${email || ''}`, HttpStatus.BAD_REQUEST);
  }

  static NoPermission(): ApplicationException {
    return new ApplicationException("You don't have permission to do this.", HttpStatus.UNAUTHORIZED);
  }

  static WrongEmail(): ApplicationException {
    return new ApplicationException('Please check your email for change password', HttpStatus.UNAUTHORIZED);
  }

  static ServiceError(): ApplicationException {
    return new ApplicationException(
      'Service is not available, please try again later',
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }

  static NullEntityFound(entity: string, id?: string): ApplicationException {
    return new ApplicationException(`${entity} Not Found ${id || ''}`, HttpStatus.UNPROCESSABLE_ENTITY);
  }

  static NotFoundStatus(entity: string, id?: string): ApplicationException {
    return new ApplicationException(`${entity} Not Found ${id || ''}`, HttpStatus.NOT_FOUND);
  }

  static UnprocessableEntity(message: string, id?: string): ApplicationException {
    return new ApplicationException(`${message || ''} ${id || ''}`, HttpStatus.UNPROCESSABLE_ENTITY);
  }

  static SyncSystemDesignFail(opportunityId: string): ApplicationException {
    return new ApplicationException(
      `System Designs are not update by opportunity ${opportunityId} when Utility and Usage have changed`,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
  }

  static ValidationFailed(message?: string): ApplicationException {
    return new ApplicationException(`Validation failed${message ? `: ${message}` : ''}`, HttpStatus.BAD_REQUEST);
  }

  static ExpiredToken(data?: any): ApplicationException {
    return new ApplicationException({ message: 'Your token is expired!!!', data }, HttpStatus.BAD_REQUEST);
  }

  static ExistedEntity(type: string, id?: string): ApplicationException {
    return new ApplicationException(`Can not process with ${type}: ${id || ''}`, HttpStatus.UNPROCESSABLE_ENTITY);
  }

  static NoQuoteConfigAvailable(): ApplicationException {
    return new ApplicationException(
      'Your partner account is not configured with any quoting modes. Please contact Swell to finish setting up your partner account.',
      HttpStatus.NOT_FOUND,
    );
  }

  static InvalidContract(): ApplicationException {
    return new ApplicationException('Contract is not invalid', HttpStatus.UNPROCESSABLE_ENTITY);
  }

  static InvalidDocusignIntegrationConfig(type = DOCUSIGN_INTEGRATION_TYPE.DEFAULT): ApplicationException {
    return new ApplicationException(`${type} Docusign Integration Config is missing.`, HttpStatus.UNPROCESSABLE_ENTITY);
  }

  static maxInstallationAmountExceeded(): ApplicationException {
    return new ApplicationException(
      'The cost of installing this system exceeds the allowed maximum installation amount.',
      HttpStatus.BAD_REQUEST,
    );
  }

  static InvalidDocusignIntegrationType(): ApplicationException {
    return new ApplicationException('Docusign Integration Type is invalid.', HttpStatus.UNPROCESSABLE_ENTITY);
  }

  static FniProcessError(): ApplicationException {
    return new ApplicationException(
      'There was an error processing your request. Please try again. If you are still having issues, contact your sales agent.',
      HttpStatus.BAD_REQUEST,
    );
  }

  static ActiveFniApplicationNotFound(qualificationCreditId): ApplicationException {
    return new ApplicationException(
      `Qualification Credit ${qualificationCreditId} has no ACTIVE fniApplication`,
      HttpStatus.BAD_REQUEST,
    );
  }

  static QualifyQuoteAgainstFinancialProductSettingsError(message: string): ApplicationException {
      return new ApplicationException(
        message,
        HttpStatus.BAD_REQUEST
      );
  }

  static EsaSolverRowNotFound(message: string): ApplicationException {
    return new ApplicationException(
      message,
      HttpStatus.BAD_REQUEST
    );
  }

  static QuoteNotFound(message: string): ApplicationException {
    return new ApplicationException(
      message,
      HttpStatus.BAD_REQUEST
    );
  }

  static maxInstallationAmountExceeded(): ApplicationException {
    return new ApplicationException(
      'The cost of installing this system exceeds the allowed maximum installation amount.',
      HttpStatus.BAD_REQUEST,
    );
  }
}
