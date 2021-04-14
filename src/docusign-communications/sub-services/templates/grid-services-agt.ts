import { TemplateDataBuilder } from 'src/docusign-communications/typing';

export const getGridServicesAgt: TemplateDataBuilder = genericObj => {
  const { contact, contract } = genericObj;
  const coOwner = contract.signer_details.find(e => e.role === 'Co Owner');

  const result: Record<string, string> = {};

  result.contact_1_full_name = `${contact.firstName} ${contact.lastName}`;
  result.contact_2_full_name = coOwner ? `${coOwner.first_name} ${coOwner.last_name}` : '';
  result.site_address_line_1 = contact.address1;
  result.site_address_last_line = `${contact.city}, ${contact.state}, ${contact.zip}`;
  result.contact_1_email = contact.email;
  
  return result;
};
