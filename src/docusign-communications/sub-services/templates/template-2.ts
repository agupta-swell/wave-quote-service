import * as accounting from 'accounting-js';
import * as dayjs from 'dayjs';
import { sumBy } from 'lodash';
import { LeanDocument } from 'mongoose';
import { Contact } from 'src/contacts/contact.schema';
import { CustomerPayment } from 'src/customer-payments/customer-payment.schema';
import { IDefaultContractor } from 'src/docusign-communications/typing';
import { Opportunity } from 'src/opportunities/opportunity.schema';
import { IRoofTopSchema } from 'src/system-designs/system-design.schema';
import { User } from 'src/users/user.schema';

interface IParam {
  opportunity: LeanDocument<Opportunity>;
  defaultContractor: IDefaultContractor;
  customerPayment: CustomerPayment;
  contact: Contact;
  recordOwner: User;
  utilityName: string;
  roofTopDesign: IRoofTopSchema;
  isCash: boolean;
}

export function getTemplate2Data(param: IParam) {
  const {
    opportunity,
    defaultContractor,
    customerPayment,
    contact,
    recordOwner,
    utilityName,
    roofTopDesign,
    isCash,
  } = param;

  const now = dayjs().format('MM/DD/YYYY');
  const next3Date = dayjs(new Date().getTime() + 3 * 24 * 60 * 60 * 1000);

  const obj = {};
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
  obj["Text Contractor's Address - 10"] = opportunity.isPrimeContractor
    ? `${defaultContractor.address1}, ${defaultContractor.address2}`
    : `${opportunity.contractorAddress1}, ${opportunity.contractorAddress2}`;
  obj["Text Contractor's Address - 9"] = opportunity.isPrimeContractor
    ? `${defaultContractor.address1}, ${defaultContractor.address2}`
    : `${opportunity.contractorAddress1}, ${opportunity.contractorAddress2}`;
  obj["Text Contractor's Address 1 - 1"] = opportunity.isPrimeContractor
    ? defaultContractor.address1
    : opportunity.contractorAddress1;
  obj["Text Contractor's Address 1 - 7"] = opportunity.isPrimeContractor
    ? defaultContractor.address1
    : opportunity.contractorAddress1;
  obj["Text Contractor's Address 2 - 1"] = opportunity.isPrimeContractor
    ? defaultContractor.address2
    : opportunity.contractorAddress2;
  obj["Text Contractor's Address 2 - 7"] = opportunity.isPrimeContractor
    ? defaultContractor.address2
    : opportunity.contractorAddress2;
  obj["Text Contractor's Company Name - 10"] = opportunity.isPrimeContractor
    ? defaultContractor.companyName
    : opportunity.contractorCompanyName;
  obj["Text Contractor's Company Name - 7"] = opportunity.isPrimeContractor
    ? defaultContractor.companyName
    : opportunity.contractorCompanyName;
  obj["Text Contractor's Company Name - 9"] = opportunity.isPrimeContractor
    ? defaultContractor.companyName
    : opportunity.contractorCompanyName;
  obj["Text Contractor's Company Name 1 - 1"] = opportunity.isPrimeContractor
    ? defaultContractor.companyName
    : opportunity.contractorCompanyName;
  obj["Text Contractor's Company Name 2 - 1"] = opportunity.isPrimeContractor
    ? defaultContractor.companyName
    : opportunity.contractorCompanyName;
  obj["Text Contractor's Email - 10"] = opportunity.contractorEmail;
  obj["Text Contractor's Email - 9"] = opportunity.contractorEmail;
  obj["Text Contractor's Tittle 2"] = 'CEO';
  obj['Text Credits - 1'] = customerPayment.credit || 0;
  obj['Text CSCB License # - 1'] = `CSLB# ${
    opportunity.isPrimeContractor ? defaultContractor.license : opportunity.contractorLicense
  }`;
  obj['Text Date - 1'] = now;
  obj['Text Date - 10'] = now;
  obj['Text Date - 9'] = now;
  obj['Text Date 2 - 10'] = next3Date;
  obj['Text Date 2 - 9'] = next3Date;
  obj['Text Deposit - 1'] = accounting.formatMoney(customerPayment.deposit);
  obj['Text Deposit - 7'] = accounting.formatMoney(customerPayment.deposit);
  obj['Text Email - 1'] = contact.email;
  obj['Text Est Rebate - 1'] = accounting.formatMoney(customerPayment.rebate);
  obj['Text Guaranteed - 1'] = customerPayment.rebateGuaranteed ? '✓' : '';
  obj['Text Name Signer 1 - 2'] = opportunity.isPrimeContractor
    ? defaultContractor.signer
    : opportunity.contractorSigner;
  obj['Text Net Agreement Price - 1'] = customerPayment.netAmount;
  obj['Text Opp City - 1'] = contact.city;
  obj['Text Opp City State Zip - 1'] = `${contact.city}, ${contact.state} ${contact.zip}`;
  obj['Text Opp City State Zip - 7'] = `${contact.city}, ${contact.state} ${contact.zip}`;
  obj['Text Opp Id - 1'] = opportunity._id;
  obj['Text Opp Owner - 1'] = recordOwner ? `${recordOwner.profile.firstName} ${recordOwner.profile.lastName}` : '';
  obj['Text Opp Owner Email - 1'] = recordOwner ? recordOwner?.emails[0].address : '';
  obj['Text Opp Owner HIS - 1'] = recordOwner.hisNumber ?? '';
  obj['Text Opp Owner Phone - 1'] = recordOwner?.profile?.cellPhone ? recordOwner?.profile?.cellPhone : '';
  obj['Text Opp State - 1'] = contact.state;
  obj['Text Opp Street 1 - 1'] = contact.address1;
  obj['Text Opp Street 1 - 7'] = contact.address1;
  obj['Text Opp Street 2 - 1'] = contact.address2;
  obj['Text Opp Street 2 - 7'] = contact.address2;
  obj['Text Opp Zip - 1'] = contact.zip;
  obj['Text Owner Name 1 - 1'] = contact.firstName;
  obj['Text Owner Name 1 - 7'] = contact.firstName;
  obj['Text Owner Name 2 - 1'] = contact.lastName;
  obj['Text Owner Name 2 - 7'] = contact.lastName;
  obj['Text Phone - 1'] = contact.cellPhone;
  obj['Text Prg Incentives - 1'] = accounting.formatMoney(customerPayment.programIncentiveDiscount);
  obj['Text Utility Program - 1'] = utilityName;
  obj['Text Adders - 1'] = roofTopDesign.adders.reduce((acc, item, index) => {
    if (index === 0) return item.adder_model_data_snapshot.adder;
    return `${acc}, ${item.adder_model_data_snapshot.adder}`;
  }, '');
  obj['Text Amount Due Approved - 1'] = isCash
    ? ''
    : accounting.formatMoney(customerPayment.netAmount - customerPayment.deposit);
  obj['Text Amount Due Owner - 1'] = accounting.formatMoney(
    isCash ? customerPayment.netAmount : customerPayment.deposit,
  );
  obj['Text Approved Financier - 1'] = isCash ? 'Cash' : 'Finance';
  obj['Text Cash Payment 1 - 1'] = accounting.formatMoney(isCash ? customerPayment.payment1 : 0);
  obj['Text Cash Payment 2 - 1'] = accounting.formatMoney(isCash ? customerPayment.payment2 : 0);
  obj['Text Final Payment'] = isCash ? accounting.formatMoney(customerPayment.payment1 + customerPayment.payment2) : '';
  obj['Text Finance Payment 1 - 1'] = accounting.formatMoney(isCash ? 0 : customerPayment.payment1);
  obj['Text Finance Payment 2 - 1'] = accounting.formatMoney(isCash ? 0 : customerPayment.payment2);
  obj['Text Payment 1 - 1'] = accounting.formatMoney(
    isCash ? customerPayment.payment1 : customerPayment.payment1 + customerPayment.payment2,
  );
  obj['Text Payment 1 COF - 7'] = isCash ? accounting.formatMoney(customerPayment.payment1) : '';
  obj['Text Payment 1 Label - 1'] = isCash ? '1' : '';
  obj['Text Payment 1 Label - 7'] = isCash ? '1' : '';
  obj['Text Payment 1 Timing - 1'] = isCash
    ? 'Due upon substantial completion'
    : 'Per the financier disbursement schedule to contractor';
  obj['Text Payment 1 Timing - 7'] = isCash
    ? 'Due upon substantial completion'
    : 'Per the financier disbursement schedule to contractor';
  obj['Text Payment 2 - 1'] = isCash ? accounting.formatMoney(customerPayment.payment2) : '';
  obj['Text Payment 2 - 7'] = isCash ? accounting.formatMoney(customerPayment.payment2) : '';
  obj['Text Payment 2 Label - 1'] = isCash ? 'Payment 2' : '';
  obj['Text Payment 2 Label - 7'] = isCash ? 'Payment 2' : '';
  obj['Text Payment 2 Timing 1 - 1'] = isCash ? 'Due upon building department inspection approval' : '';
  obj['Text Payment 2 Timing 1 - 7'] = isCash ? 'Due upon building department inspection approval' : '';
  obj['Text Project Adders - 1'] = roofTopDesign.adders.length > 0 ? 'Project Adders:' : '';
  obj['Text ES kW rollup - 1'] =
    sumBy(roofTopDesign.storage, item => item.quantity * item.storage_model_data_snapshot.sizeW) / 1000;
  obj['Text kW rollup - 1'] =
    sumBy(roofTopDesign.panel_array, item => item.number_of_panels * item.panel_model_data_snapshot.sizeW) / 1000;
  obj['Text ES kWh rollup - 1'] = sumBy(
    roofTopDesign.storage,
    item => item.quantity * item.storage_model_data_snapshot.sizekWh,
  );
  obj['Text PV Inverter Product - 1'] = roofTopDesign.inverters
    .map(item => item.inverter_model_data_snapshot.name)
    .join(', ');
  obj['Text PV Module Product - 1'] = roofTopDesign.panel_array
    .map(item => item.panel_model_data_snapshot.name)
    .join(', ');
  obj['Text Storage Product - 1'] = roofTopDesign.storage.map(item => item.storage_model_data_snapshot.name).join(', ');

  return obj;
}
