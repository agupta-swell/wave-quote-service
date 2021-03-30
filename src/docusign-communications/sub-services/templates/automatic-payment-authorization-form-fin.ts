import { IDefaultContractor, IGenericObject, TemplateDataBuilder } from '../../typing';

// TODO: fix typing
// @ts-ignore
export const getAutoMaticPaymentAuthorizationFormFin: TemplateDataBuilder = (
  genericObject: IGenericObject,
  defaultContractor: IDefaultContractor,
) => ({
  WAVE_ID: genericObject.opportunity._id,
  // CUSTOMER_NAME: `${genericObject.contact.firstName} ${genericObject.contact.lastName} `,
});
