import { TemplateDataBuilder } from 'src/docusign-communications/typing';

export const getGridServicesAgreement: TemplateDataBuilder = genericObj => {
  const { contact, signerDetails } = genericObj;
  const coOwner = signerDetails.find(e => e.role === 'Co Owner');
  const primOwner = signerDetails.find(e => e.role === 'Primary Owner');

  const result: Record<string, string> = {};

  result.primary_owner_full_name = primOwner?.fullName ?? '';
  result.primary_owner_email = primOwner?.email ?? '';
  result.co_owner_full_name = coOwner?.fullName ?? '';
  result.equipment_address = `${contact.address1}${contact.address2 ? ', ' + contact.address2 : ''}, ${contact.city}, ${
    contact.state
  } ${contact.zip}`;

  return result;
};
