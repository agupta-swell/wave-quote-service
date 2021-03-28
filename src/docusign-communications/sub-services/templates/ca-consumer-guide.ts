import { TemplateDataBuilder } from '../../typing';

export const getCaConsumerGuideData: TemplateDataBuilder = ({ contact, opportunity }) => ({
  'Text Owner Name 1 - 2': contact.firstName,
  'Text Owner Name 2 - 2': contact.lastName,
  'Text Contractor\'s Company Name 1 - 2': opportunity.contractorCompanyName,
  'Text Name Signer 1 - 3': opportunity.contractorSigner,
  'Text Contractor\'s Title': 'CEO'
});
