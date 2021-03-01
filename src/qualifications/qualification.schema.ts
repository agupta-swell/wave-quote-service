import { Document, Schema } from 'mongoose';
import {
  APPROVAL_MODE, PROCESS_STATUS, QUALIFICATION_STATUS, VENDOR_ID,
} from './constants';

export const QUALIFICATION_CREDIT = Symbol('QUALIFICATION_CREDIT').toString();

export interface ICustomerNotification {
  sent_on: Date;
  email: string;
}

export const CustomerNotificationSchema = new Schema<ICustomerNotification>(
  {
    sent_on: Date,
    email: String,
  },
  { _id: false },
);

export interface IEventHistory {
  issue_date: Date;
  by: string;
  detail: string;
}

export const EventHistorySchema = new Schema<IEventHistory>(
  {
    issue_date: Date,
    by: String,
    detail: String,
  },
  { _id: false },
);

export interface QualificationCredit extends Document {
  opportunity_id: string;
  started_on: Date;
  process_status: PROCESS_STATUS;
  customer_notifications: ICustomerNotification[];
  event_histories: IEventHistory[];
  vendor_id: VENDOR_ID;
  approval_mode: APPROVAL_MODE;
  approved_by: string;
  qualification_status: QUALIFICATION_STATUS;
  created_by: string;
  created_at: Date;
  updated_by: string;
  updated_at: Date;
}

export const QualificationCreditSchema = new Schema<QualificationCredit>({
  opportunity_id: String,
  started_on: Date,
  process_status: String,
  customer_notifications: [CustomerNotificationSchema],
  event_histories: [EventHistorySchema],
  vendor_id: String,
  approval_mode: String,
  approved_by: String,
  qualification_status: String,
  created_at: { type: Date, default: Date.now },
  created_by: String,
  updated_at: { type: Date, default: Date.now },
  updated_by: String,
});
