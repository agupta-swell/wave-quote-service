import { Document, Schema } from 'mongoose';
import {
  APPLICANT_TYPE,
  APPROVAL_MODE,
  MILESTONE_STATUS,
  PROCESS_STATUS,
  QUALIFICATION_STATUS,
  QUALIFICATION_TYPE,
  VENDOR_ID,
} from './constants';

export const QUALIFICATION_CREDIT = 'QUALIFICATION_CREDIT';

export interface ICustomerNotification {
  label: string;
  type: string;
  sentOn: Date;
  email: string;
}

export const CustomerNotificationSchema = new Schema<Document<ICustomerNotification>>(
  {
    label: String,
    type: String,
    sent_on: Date,
    email: String,
  },
  { _id: false },
);

export interface IEventHistory {
  issueDate: Date;
  by: string;
  detail: string;
  userId?: string;
  qualificationCategory?: string;
}

export const EventHistorySchema = new Schema<Document<IEventHistory>>(
  {
    issue_date: Date,
    by: String,
    detail: String,
    user_id: {
      type: String,
      required: false,
    },
    qualification_category: {
      type: String,
      required: false,
    },
  },
  { _id: false },
);

export interface IApplicant {
  contactId: string;
  type: APPLICANT_TYPE;
  agreementTerm1CheckedAt?: Date;
  jointIntentionDisclosureCheckedAt?: Date;
  creditCheckAuthorizedAt?: Date;
}

export const ApplicantSchema = new Schema<Document<IApplicant>>(
  {
    contact_id: String,
    type: String,
    agreement_term_1_checked_at: {
      type: Date,
      required: false,
    },
    joint_intention_disclosure_checked_at: {
      type: Date,
      required: false,
    },
    credit_check_authorized_at: {
      type: Date,
      required: false,
    },
  },
  { _id: false },
);

export interface QualificationCredit extends Document {
  opportunityId: string;
  type: QUALIFICATION_TYPE;
  startedOn: Date;
  milestone: MILESTONE_STATUS;
  processStatus: PROCESS_STATUS;
  customerNotifications: ICustomerNotification[];
  eventHistories: IEventHistory[];
  vendorId: VENDOR_ID;
  approvalMode: APPROVAL_MODE;
  approvedBy: string;
  qualificationStatus: QUALIFICATION_STATUS;
  hasApplicantConsent?: boolean;
  hasCoApplicantConsent?: boolean;
  hasCoApplicant?: boolean;
  applicationSentOn: Date;
  applicants: IApplicant[];
  createdBy: string;
  createdAt: Date;
  updatedBy: string;
  updatedAt: Date;
}

export const QualificationCreditSchema = new Schema<QualificationCredit>({
  opportunity_id: String,
  type: String,
  started_on: Date,
  milestone: String,
  process_status: String,
  customer_notifications: [CustomerNotificationSchema],
  event_histories: [EventHistorySchema],
  vendor_id: String,
  approval_mode: String,
  approved_by: String,
  qualification_status: String,
  has_applicant_consent: Boolean,
  has_co_applicant_consent: Boolean,
  has_co_applicant: Boolean,
  application_sent_on: Date,
  applicants: [ApplicantSchema],
  created_at: { type: Date, default: Date.now },
  created_by: String,
  updated_at: { type: Date, default: Date.now },
  updated_by: String,
});
