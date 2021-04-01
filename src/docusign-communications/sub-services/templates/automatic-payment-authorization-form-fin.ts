import { TemplateDataBuilder } from '../../typing';

export const getAutoMaticPaymentAuthorizationFormFin: TemplateDataBuilder = (genericObject) => ({
  WAVE_ID: genericObject.opportunity._id,
  // CUSTOMER_NAME: `${genericObject.contact.firstName} ${genericObject.contact.lastName} `,
});
