import { TemplateDataBuilder } from 'src/docusign-communications/typing';

export const getCAConsumerProtection: TemplateDataBuilder = genericObj => {
  const { assignedMember, contact, signerDetails } = genericObj;

  const result: Record<string, string> = {};

  const coOwner = signerDetails.find(e => e.role === 'Co Owner');

  // project.agentAccount === opportunity.accountId
  result.installation_org_user_employee_id = assignedMember?.hisNumber || '';

  result.contact_1_full_name = `${contact.firstName} ${contact.lastName}`;
  result.contact_2_full_name = coOwner ? `${coOwner.firstName} ${coOwner.lastName}` : '';

  return result;
};
