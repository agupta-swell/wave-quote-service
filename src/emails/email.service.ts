import { Injectable } from '@nestjs/common';
import * as mailgun from 'mailgun-js';
import * as Handlebars from 'handlebars';
import { ApplicationException } from 'src/app/app.exception';

@Injectable()
export class EmailService {
  private mailgunInstance: mailgun.Mailgun;

  private static _templates: Map<string | symbol, HandlebarsTemplateDelegate> = new Map();

  public static register(name: string | symbol, source: string) {
    this._templates.set(name, Handlebars.compile(source));
  }

  constructor() {
    this.mailgunInstance = mailgun({
      apiKey: process.env.MAILGUN_KEY || '',
      domain: process.env.MAILGUN_DOMAIN || '',
    });
  }

  private getTemplate(name: string | symbol): HandlebarsTemplateDelegate {
    const handler = EmailService._templates.get(name);

    if (!handler) {
      console.log(
        '🚀 ~ file: email.service.ts ~ line 26 ~ EmailService ~ getTemplate ~ handler',
        'No registered email template found with name',
        name,
      );
      throw ApplicationException.ServiceError();
    }

    return handler;
  }

  async sendMailByTemplate(
    recipient: string,
    subject: string,
    templateName: string | symbol,
    templatePayload: Record<string, unknown>,
  ): Promise<mailgun.messages.SendResponse> {
    const html = this.getTemplate(templateName)(templatePayload);
    return this.sendMail(recipient, html, subject);
  }

  async sendMail(recipient: string, message: string, subject: string): Promise<mailgun.messages.SendResponse> {
    const mailOptions = {
      from: process.env.MAILGUN_SENDER_EMAIL,
      to: recipient,
      subject,
      html: message,
    };

    return this.mailgunInstance.messages().send(mailOptions, (error, _) => {
      if (error) {
        throw Error(error.message);
      }
    });
  }
}
