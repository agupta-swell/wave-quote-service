import { Injectable } from '@nestjs/common';
import * as mailgun from 'mailgun-js';

@Injectable()
export class EmailService {
  private mailgunInstance: mailgun.Mailgun;
  constructor() {
    this.mailgunInstance = mailgun({
      apiKey: process.env.MAILGUN_KEY,
      domain: process.env.MAILGUN_DOMAIN,
    });
  }

  sendMail(recipient: string, message: string, subject: string) {
    const mailOptions = {
      from: process.env.MAILGUN_SENDER_EMAIL,
      to: recipient,
      subject,
      html: message,
    };

    return this.mailgunInstance.messages().send(mailOptions, (error, body) => {
      if (error) {
        throw Error(error.message);
      }
    });
  }
}
