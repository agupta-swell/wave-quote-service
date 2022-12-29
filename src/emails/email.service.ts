import { Injectable } from '@nestjs/common';
import * as Handlebars from 'handlebars';
import * as mailgun from 'mailgun-js';
import { ApplicationException } from 'src/app/app.exception';
import { EmailTemplateService } from 'src/email-templates/email-template.service';

@Injectable()
export class EmailService {
  private mailgunInstance: mailgun.Mailgun;

  private static _templates: Map<string | symbol, HandlebarsTemplateDelegate> = new Map();

  public static register(name: string | symbol, source: string) {
    this._templates.set(name, Handlebars.compile(source));
  }

  constructor(private readonly emailTemplateService: EmailTemplateService) {
    this.mailgunInstance = mailgun({
      apiKey: process.env.MAILGUN_KEY || '',
      domain: process.env.MAILGUN_DOMAIN || '',
    });
  }

  private async getTemplate(eventType: string): Promise<HandlebarsTemplateDelegate> {
    const handler = await this.emailTemplateService.getEmailTemplateByEventType(eventType);
    if (!handler) {
      throw ApplicationException.ServiceError();
    }

    return Handlebars.compile(handler.content);
  }

  async sendMailByTemplate(
    recipient: string,
    subject: string,
    eventType: string,
    templatePayload: Record<string, unknown>,
    replyTo?: {
      fullName: string;
      email: string;
    },
  ): Promise<mailgun.messages.SendResponse> {
    const html = (await this.getTemplate(eventType))(templatePayload);

    return this.sendMail(recipient, html, subject, replyTo);
  }

  async sendMail(
    recipient: string,
    message: string,
    subject: string,
    replyTo?: {
      fullName: string;
      email: string;
    },
  ): Promise<mailgun.messages.SendResponse> {
    const mailOptions = {
      from: `Swell Energy <${replyTo ? replyTo.email : process.env.MAILGUN_SENDER_EMAIL}>`,
      to: recipient,
      subject,
      html: message,
      'h:Reply-To': replyTo && `${replyTo.fullName} <${replyTo.email}>`,
    };

    return this.mailgunInstance.messages().send(mailOptions, (error, _) => {
      if (error) {
        throw Error(error.message);
      }
    });
  }
}
