import { ExceptionFilter, Catch, ArgumentsHost } from '@nestjs/common';
import { EmailService } from 'src/emails/email.service';
import { DocusignException } from './docusign.exception';

@Catch(DocusignException)
export class DocusignExceptionsFilter implements ExceptionFilter {
  constructor(private readonly emailService: EmailService) {}

  catch(exception: DocusignException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const status = exception.getStatus();

    const subject = `Cannot generated contact at ${request.url} for ${
      request.body.contractId
    } ${new Date().toISOString()}`;
    const message = `
      Cannot generated contact at ${request.url} <br />
      Request body: ${JSON.stringify(request.body || {})} <br />
      Message: ${exception.message}; ${exception.rawError?.message} <br />
      Stack: <pre>${exception.rawError?.stack}</pre>
    `;

    response.code(status).send({
      statusCode: status,
      message: 'This contract cannot be sent',
    });

    this.emailService.sendMail(process.env.SUPPORT_MAIL!, message, subject).catch(err => {
      console.log(`Send mail error`, err);
    });
  }
}
