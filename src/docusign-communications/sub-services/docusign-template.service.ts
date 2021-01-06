import { Injectable } from '@nestjs/common';
import * as accounting from 'accounting-js';
import * as dayjs from 'dayjs';
import { IDefaultContractor, IGenericObject, ITabData } from '../typing';

enum DOCUSIGN_TEMPLATE {
  first = '50bf8fd6-cf25-4ee0-b63d-2720e66a4789',
  second = '864dead0-03df-4a5a-b83c-ffb0d0c5f588',
}

@Injectable()
export class DocusignTemplateService {
  buildTemplateData(
    docusignTemplateId: string,
    genericObject: IGenericObject,
    defaultContractor: IDefaultContractor,
  ): ITabData {
    const tabsData: ITabData = {} as any;
    const { contact, opportunity, recordOwner, customerPayment, roofTopDesign, isCash, utilityName } = genericObject;
    const now = dayjs().format('MM/DD/YYYY');
    const next3Date = dayjs(new Date().getTime() + 3 * 24 * 60 * 60 * 1000);

    let obj = {};
    switch (docusignTemplateId) {
      case DOCUSIGN_TEMPLATE.first: {
        obj['Text Owner Name 1 - 2'] = contact.firstName;
        obj['Text Owner Name 2 - 2'] = contact.lastName;
        obj[`Text Contractor's Company Name 1 - 2`] = opportunity.contractorCompanyName;
        obj[`Text Name Signer 1 - 3`] = opportunity.contractorSigner;
        obj[`Text Contractor's Title`] = 'CEO';
        tabsData.textTabs.push(obj);
        return tabsData;
      }

      case DOCUSIGN_TEMPLATE.second: {
        obj['Contractor address'] = opportunity.isPrimeContractor
          ? defaultContractor.address1
          : opportunity.contractorAddress1;
        obj['Contractor city-state-zip'] = opportunity.isPrimeContractor
          ? defaultContractor.address2
          : opportunity.contractorAddress2;
        obj['Contractor name'] = opportunity.isPrimeContractor
          ? defaultContractor.companyName
          : opportunity.contractorCompanyName;
        obj['Gross contract amount'] = accounting.formatMoney(opportunity.amount);
        obj['Text Base Price - 1'] = accounting.formatMoney(customerPayment.amount);
        obj[`Text Contractor's Address - 10`] = opportunity.isPrimeContractor
          ? `${defaultContractor.address1}, ${defaultContractor.address2}`
          : `${opportunity.contractorAddress1}, ${opportunity.contractorAddress2}`;
        obj[`Text Contractor's Address - 9`] = opportunity.isPrimeContractor
          ? `${defaultContractor.address1}, ${defaultContractor.address2}`
          : `${opportunity.contractorAddress1}, ${opportunity.contractorAddress2}`;
        obj[`Text Contractor's Address 1 - 1`] = opportunity.isPrimeContractor
          ? defaultContractor.address1
          : opportunity.contractorAddress1;
        obj[`Text Contractor's Address 1 - 7`] = opportunity.isPrimeContractor
          ? defaultContractor.address1
          : opportunity.contractorAddress1;
        obj[`Text Contractor's Address 2 - 1`] = opportunity.isPrimeContractor
          ? defaultContractor.address2
          : opportunity.contractorAddress2;
        obj[`Text Contractor's Address 2 - 7`] = opportunity.isPrimeContractor
          ? defaultContractor.address2
          : opportunity.contractorAddress2;
        obj[`Text Contractor's Company Name - 10`] = opportunity.isPrimeContractor
          ? defaultContractor.companyName
          : opportunity.contractorCompanyName;
        obj[`Text Contractor's Company Name - 7`] = opportunity.isPrimeContractor
          ? defaultContractor.companyName
          : opportunity.contractorCompanyName;
        obj[`Text Contractor's Company Name - 9`] = opportunity.isPrimeContractor
          ? defaultContractor.companyName
          : opportunity.contractorCompanyName;
        obj[`Text Contractor's Company Name 1 - 1`] = opportunity.isPrimeContractor
          ? defaultContractor.companyName
          : opportunity.contractorCompanyName;
        obj[`Text Contractor's Company Name 2 - 1`] = opportunity.isPrimeContractor
          ? defaultContractor.companyName
          : opportunity.contractorCompanyName;
        obj[`Text Contractor's Email - 10`] = opportunity.contractorEmail;
        obj[`Text Contractor's Email - 9`] = opportunity.contractorEmail;
        obj[`Text Contractor's Tittle 2`] = 'CEO';
        obj[`Text Credits - 1`] = customerPayment.credit || 0;
        obj[`Text CSCB License # - 1`] = `CSLB# ${
          opportunity.isPrimeContractor ? defaultContractor.license : opportunity.contractorLicense
        }`;
        obj[`Text Date - 1`] = now;
        obj[`Text Date - 10`] = now;
        obj[`Text Date - 9`] = now;
        obj[`Text Date 2 - 10`] = next3Date;
        obj[`Text Date 2 - 9`] = next3Date;
        obj[`Text Deposit - 1`] = accounting.formatMoney(customerPayment.deposit);
        obj[`Text Deposit - 7`] = accounting.formatMoney(customerPayment.deposit);
        obj[`Text Email - 1`] = contact.email;
        obj[`Text Est Rebate - 1`] = accounting.formatMoney(customerPayment.rebate);
        obj[`Text Guaranteed - 1`] = customerPayment.rebateGuaranteed ? '✓' : '';
        obj[`Text Name Signer 1 - 2`] = opportunity.isPrimeContractor
          ? defaultContractor.signer
          : opportunity.contractorSigner;
        obj[`Text Net Agreement Price - 1`] = customerPayment.netAmount;
        obj[`Text Opp City - 1`] = contact.city;
        obj[`Text Opp City State Zip - 1`] = `${contact.city}, ${contact.state} ${contact.zip}`;
        obj[`Text Opp City State Zip - 7`] = `${contact.city}, ${contact.state} ${contact.zip}`;
        obj[`Text Opp Id - 1`] = opportunity._id;
        obj[`Text Opp Owner - 1`] = recordOwner
          ? `${recordOwner.profile.firstName} ${recordOwner.profile.lastName}`
          : '';
        obj[`Text Opp Owner Email - 1`] = recordOwner ? recordOwner?.emails[0].address : '';
        obj[`Text Opp Owner HIS - 1`] = recordOwner.hisNumber ?? '';
        obj[`Text Opp Owner Phone - 1`] = recordOwner?.profile?.cellPhone ? recordOwner?.profile?.cellPhone : '';
        obj[`Text Opp State - 1`] = contact.state;
        obj[`Text Opp Street 1 - 1`] = contact.address1;
        obj[`Text Opp Street 1 - 7`] = contact.address1;
        obj[`Text Opp Street 2 - 1`] = contact.address2;
        obj[`Text Opp Street 2 - 7`] = contact.address2;
        obj[`Text Opp Zip - 1`] = contact.zip;
        obj[`Text Owner Name 1 - 1`] = contact.firstName;
        obj[`Text Owner Name 1 - 7`] = contact.firstName;
        obj[`Text Owner Name 2 - 1`] = contact.lastName;
        obj[`Text Owner Name 2 - 7`] = contact.lastName;
        obj[`Text Phone - 1`] = contact.cellPhone;
        obj[`Text Prg Incentives - 1`] = accounting.formatMoney(customerPayment.programIncentiveDiscount);
        obj[`Text Utility Program - 1`] = utilityName;
        obj[`Text Adders - 1`] = roofTopDesign.adders.reduce((acc, item, index) => {
          if (index === 0) return item.adder_model_data_snapshot.adder;
          return `${acc}, ${item.adder_model_data_snapshot.adder}`;
        }, '');
        obj[`Text Amount Due Approved - 1`] = isCash
          ? ''
          : accounting.formatMoney(customerPayment.netAmount - customerPayment.deposit);
        obj[`Text Amount Due Owner - 1`] = accounting.formatMoney(
          isCash ? customerPayment.netAmount : customerPayment.deposit,
        );
        obj[`Text Approved Financier - 1`] = isCash ? 'Cash' : 'Finance';
        obj[`Text Cash Payment 1 - 1`] = accounting.formatMoney(isCash ? customerPayment.payment1 : 0);
        obj[`Text Cash Payment 2 - 1`] = accounting.formatMoney(isCash ? customerPayment.payment2 : 0);
        obj[`Text Final Payment`] = isCash
          ? accounting.formatMoney(customerPayment.payment1 + customerPayment.payment2)
          : '';
        obj[`Text Finance Payment 1 - 1`] = accounting.formatMoney(isCash ? 0 : customerPayment.payment1);
        obj[`Text Finance Payment 2 - 1`] = accounting.formatMoney(isCash ? 0 : customerPayment.payment2);
        obj[`Text Payment 1 - 1`] = accounting.formatMoney(
          isCash ? customerPayment.payment1 : customerPayment.payment1 + customerPayment.payment2,
        );
        obj[`Text Payment 1 COF - 7`] = isCash ? accounting.formatMoney(customerPayment.payment1) : '';
        obj[`Text Payment 1 Label - 1`] = isCash ? '1' : '';
        obj[`Text Payment 1 Label - 7`] = isCash ? '1' : '';
        obj[`Text Payment 1 Timing - 1`] = isCash
          ? 'Due upon substantial completion'
          : 'Per the financier disbursement schedule to contractor';
        obj[`Text Payment 1 Timing - 7`] = isCash
          ? 'Due upon substantial completion'
          : 'Per the financier disbursement schedule to contractor';
        obj[`Text Payment 2 - 1`] = isCash ? accounting.formatMoney(customerPayment.payment2) : '';
        obj[`Text Payment 2 - 7`] = isCash ? accounting.formatMoney(customerPayment.payment2) : '';
        obj[`Text Payment 2 Label - 1`] = isCash ? 'Payment 2' : '';
        obj[`Text Payment 2 Label - 7`] = isCash ? 'Payment 2' : '';
        obj[`Text Payment 2 Timing 1 - 1`] = isCash ? 'Due upon building department inspection approval' : '';
        obj[`Text Payment 2 Timing 1 - 7`] = isCash ? 'Due upon building department inspection approval' : '';
        obj[`Text Project Adders - 1`] = roofTopDesign.adders.length > 0 ? 'Project Adders:' : '';

        break;
      }

      default:
        break;
    }
    return;
  }
}