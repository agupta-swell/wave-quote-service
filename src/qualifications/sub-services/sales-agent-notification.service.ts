import { UserService } from './../../users/user.service';
import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { EmailService } from 'src/emails/email.service';
import { OpportunityService } from 'src/opportunities/opportunity.service';
import { ApplicationException } from 'src/app/app.exception';
import { QUALIFICATION_STATUS } from '../constants';
import { ContactService } from 'src/contacts/contact.service';
import { QualificationCredit } from '../qualification.schema';

@Injectable()
export class SalesAgentNotificationService {
  constructor(
    @Inject(forwardRef(() => OpportunityService))
    private readonly opportunityService: OpportunityService,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
    @Inject(forwardRef(() => ContactService))
    private readonly contactService: ContactService,
    private readonly emailService: EmailService,
  ) {
  }

  async sendDecisionEmail(qualification: QualificationCredit, reasons: string[]): Promise<any> {
    const foundOpportunity = await this.opportunityService.getDetailById(qualification.opportunityId);

    if (!foundOpportunity) {
      throw ApplicationException.EntityNotFound(qualification.opportunityId);
    }
    const applicant = await this.contactService.getContactById(qualification.applicants[0].contactId);
    if (!applicant) {
      throw ApplicationException.EntityNotFound('Applicant.');
    }
    const agent = await this.userService.getUserById(foundOpportunity.assignedMember);
    if (!agent) {
      throw ApplicationException.EntityNotFound('Assigned agent.');
    }
    const eventType: string = (qualification.qualificationStatus === QUALIFICATION_STATUS.PENDING && 'Credit Application Pending Decision Update') || 'Credit Application Decision Update';
    const emailSubject: string = eventType.toString();

    // Email sending
    const data = {
      salesRepFullName: `${agent?.profile.firstName} ${agent?.profile.lastName}`,
      applicantFullName: `${applicant.firstName} ${applicant.lastName}`,
      applicationCurrentDecision: qualification.qualificationStatus || '',
      applicationPendingReasons: reasons?.join(',') || ''
    };

    return this.emailService.sendMailByTemplate(agent?.emails[0].address || '', emailSubject, eventType, data)
      .catch(error => console.error(error));
  }
}
