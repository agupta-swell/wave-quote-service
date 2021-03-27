import { LeanDocument } from 'mongoose';
import { Contact } from 'src/contacts/contact.schema';
import { Opportunity } from 'src/opportunities/opportunity.schema';

export function getTemplate1Data(contact: Contact, opportunity: LeanDocument<Opportunity>) {
  const obj = {};
  obj['Text Owner Name 1 - 2'] = contact.firstName;
  obj['Text Owner Name 2 - 2'] = contact.lastName;
  obj["Text Contractor's Company Name 1 - 2"] = opportunity.contractorCompanyName;
  obj['Text Name Signer 1 - 3'] = opportunity.contractorSigner;
  obj["Text Contractor's Title"] = 'CEO';

  return obj;
}
