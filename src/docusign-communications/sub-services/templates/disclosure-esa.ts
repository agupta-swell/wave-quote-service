import { TemplateDataBuilder } from '../../typing';

export const getDisclosureEsaData: TemplateDataBuilder = ({ assignedMember, signerDetails, financialProduct }) => {
  if (!assignedMember) {
    return {};
  }

  const { hisNumber, profile: { firstName, lastName } } = assignedMember
  const obj = {};

  obj['sales_agent_full_name'] = `${firstName || ''} ${lastName || ''}`.trim();
  obj['his_number'] = hisNumber;

  signerDetails.forEach(signer => {
    switch (signer.role){
      case 'Primary Owner':
        obj['primary_owner_full_name'] = `${signer.firstName || ''} ${signer.lastName || ''}`.trim();
        break;
      case 'Co Owner':
        obj['co_owner_full_name'] = `${signer.firstName || ''} ${signer.lastName || ''}`.trim();
        break;
      case 'Financier':
        obj['financier_full_name'] = `${signer.firstName || ''} ${signer.lastName || ''}`.trim();
        obj['financier_title'] = financialProduct?.countersignerTitle;
        break;
    }
  })
  
  return obj;
};
