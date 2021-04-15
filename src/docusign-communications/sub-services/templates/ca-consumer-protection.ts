import { TemplateDataBuilder } from 'src/docusign-communications/typing';

export const getCAConsumerProtection: TemplateDataBuilder = genericObj => {
  const { contact, contract, opportunity } = genericObj;
  const result: Record<string, string> = {};

  const coOwner = contract.signer_details.find(e => e.role === 'Co Owner');

  // project.agentAccount === opportunity.accountId
  result.installation_org_user_employee_id = opportunity.accountId;

  result.contact_1_full_name = `${contact.firstName} ${contact.lastName}`;
  result.contact_2_full_name = coOwner ? `${coOwner.first_name} ${coOwner.last_name}` : '';

  return result;
};
