import { IDefaultContractor, IDisclosureEsaMapping, IGenericObject, TemplateDataBuilder } from '../../typing';

// TODO implement this
export const getDisclosureEsaData: TemplateDataBuilder = (
  genericObject: IGenericObject,
  defaultContractor: IDefaultContractor,
  disclosureEsa: IDisclosureEsaMapping,
) => ({
  SALESPERSON_FIRST_LAST: disclosureEsa.salesPersonFirstLast,
  'H.I.S. SALES': disclosureEsa.hisSale,
});
