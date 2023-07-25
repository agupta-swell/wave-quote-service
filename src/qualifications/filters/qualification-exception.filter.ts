import { ExceptionFilter, Catch, ArgumentsHost } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { QualificationCredit, QUALIFICATION_CREDIT, IEventHistory } from '../qualification.schema';
import { QualificationException } from '../qualification.exception';
import { PROCESS_STATUS, QUALIFICATION_CATEGORY, QUALIFICATION_TYPE } from '../constants';

@Catch(QualificationException)
export class QualificationExceptionsFilter implements ExceptionFilter {
  constructor(
    @InjectModel(QUALIFICATION_CREDIT) private readonly qualificationCreditModel: Model<QualificationCredit>,
  ) {}

  async catch(exception: QualificationException, host: ArgumentsHost) {
    console.error(exception.message);

    if (exception.rawError) {
      console.error(exception.rawError);
    }

    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    const status = exception.getStatus();
    const {
      qualificationExceptionData: { qualificationCreditId, errorEvent },
    } = exception;

    const qualificationCredit = await this.qualificationCreditModel.findById(qualificationCreditId);
    if (qualificationCredit) {
      const qualificationCategory =
        qualificationCredit.type === QUALIFICATION_TYPE.HARD
          ? QUALIFICATION_CATEGORY.HARD_CREDIT
          : QUALIFICATION_CATEGORY.SOFT_CREDIT;

      const event: IEventHistory = {
        issueDate: new Date(),
        qualificationCategory,
        detail: 'Processing has failed',
        by: '',
        userId: '',
        ...errorEvent,
      }

      qualificationCredit.processStatus = PROCESS_STATUS.ERROR;
      qualificationCredit.eventHistories.push(event);
      await qualificationCredit.save();
    }

    response.code(status).send({
      statusCode: status,
      message: exception.getResponse().toString() ?? 'Processing has failed',
    });
  }
}
