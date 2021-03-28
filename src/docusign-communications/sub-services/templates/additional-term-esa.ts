import { TemplateDataBuilder } from '../../typing';

// TODO: fix typing
// @ts-ignore
export const getAdditionalTermEsaData: TemplateDataBuilder = ({leaseProduct}) => ({
  'ESA_ESC': leaseProduct.rate_escalator,
});
