import { TemplateDataBuilder } from '../../typing';

export const getAutoMaticPaymentAuthorizationFormFin: TemplateDataBuilder = genericObject => {
  const { opportunity, signerDetails } = genericObject;

  return {
    WAVE_ID: opportunity._id,
    primary_owner_full_name: signerDetails.find(e => e.role === 'Primary Owner')?.fullName ?? '',
    co_owner_full_name: signerDetails.find(e => e.role === 'Co Owner')?.fullName ?? '',
  };
};
