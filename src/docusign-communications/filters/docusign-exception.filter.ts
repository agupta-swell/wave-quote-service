import { ExceptionFilter, Catch, ArgumentsHost } from '@nestjs/common';
import { EmailService } from 'src/emails/email.service';
import { IDocusignContextStore } from 'src/shared/docusign';
import { InjectDocusignContext } from 'src/shared/docusign/decorators/inject-docusign-context';
import { DocusignException } from 'src/shared/docusign/docusign.exception';
import { IGenericObject } from '../typing';

@Catch(DocusignException)
export class DocusignExceptionsFilter implements ExceptionFilter {
  constructor(
    private readonly emailService: EmailService,
    @InjectDocusignContext()
    private readonly contextStore: IDocusignContextStore,
  ) {}

  catch(exception: DocusignException, host: ArgumentsHost) {
    console.error(exception.message);

    if (exception.rawError) {
      console.error(exception.rawError);
    }

    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const status = exception.getStatus();

    const docusignContext = this.contextStore.get<IGenericObject>();

    const subject = `Cannot generated contact at ${request.url} for ${
      request.body?.contractId ?? docusignContext.genericObject.contract?._id
    } ${new Date().toISOString()}`;

    const message = `
      Cannot generate contract at ${request.url} <br />
      Message: ${exception.message}; ${exception.rawError?.message} <br />
      Stack: <pre>${exception.rawError?.stack}</pre>
    `;

    response.code(status).send({
      statusCode: status,
      message: exception.isSafe ? exception.getResponse().toString() : 'This contract cannot be sent',
    });

    this.emailService.sendMail(process.env.SUPPORT_MAIL!, message, subject).catch(err => {
      console.error(`Send mail error`, err);
    });
  }
}
