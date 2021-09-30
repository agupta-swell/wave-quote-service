import { TemplateDataBuilder } from 'src/docusign-communications/typing';

export const getGridServicesAgt: TemplateDataBuilder = genericObj => {
  const { contact, signerDetails } = genericObj;
  const coOwner = signerDetails.find(e => e.role === 'Co Owner');

  const result: Record<string, string> = {};

  result.contact_1_full_name = `${contact.firstName} ${contact.lastName}`;
  result.contact_2_full_name = coOwner ? coOwner.fullName : '';
  result.site_address_line_1 = contact.address1;
  result.site_address_last_line = `${contact.city}, ${contact.state}, ${contact.zip}`;
  result.contact_1_email = contact.email;
  
  return result;
};
