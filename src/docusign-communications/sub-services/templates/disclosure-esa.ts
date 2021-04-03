import { IDefaultContractor, IGenericObject, TemplateDataBuilder } from '../../typing';

// TODO implement this
export const getDisclosureEsaData: TemplateDataBuilder = (
  genericObject: IGenericObject,
  defaultContractor: IDefaultContractor,
) => {
  const obj = {};
  obj['SALESPERSON_FIRST_LAST'] = genericObject.assignedMember.salesPersonFirstLast;
  obj['H.I.S. SALES #'] = genericObject.assignedMember.hisSale;
  return obj;
};
