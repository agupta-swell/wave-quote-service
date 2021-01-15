import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CustomerPayment, CUSTOMER_PAYMENT } from './customer-payment.schema';

@Injectable()
export class CustomerPaymentService {
  constructor(@InjectModel(CUSTOMER_PAYMENT) private contactModel: Model<CustomerPayment>) {}

  // =====================> INTERNAL <=====================

  async getCustomerPaymentByOpportunityId(opportunityId: string): Promise<CustomerPayment | undefined> {
    const res = await this.contactModel.findOne({ opportunityId });
    return res?.toObject();
  }
}
