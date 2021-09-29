import { TemplateDataBuilder } from '../../typing';

export const getCaConsumerGuideData: TemplateDataBuilder = ({ assignedMember }) => ({
  his_number: assignedMember?.hisNumber ?? '',
});
