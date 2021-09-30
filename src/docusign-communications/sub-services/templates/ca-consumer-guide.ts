import { TemplateDataBuilder } from '../../typing';

export const getCaConsumerGuideData: TemplateDataBuilder = ({ assignedMember, signerDetails }) => ({
  his_number: assignedMember?.hisNumber ?? '',
  primary_owner_full_name: signerDetails.find(e => e.role === 'Primary Owner')?.fullName ?? '',
  co_owner_full_name: signerDetails.find(e => e.role === 'Co Owner')?.fullName ?? '',
});
