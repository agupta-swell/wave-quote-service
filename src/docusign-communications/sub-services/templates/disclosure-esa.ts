import { TemplateDataBuilder } from '../../typing';

export const getDisclosureEsaData: TemplateDataBuilder = ({ assignedMember }) => {
  if (!assignedMember) {
    return {};
  }
  const { hisNumber, profile: { firstName, lastName } } = assignedMember
  const obj = {};
  obj['SALESPERSON_FIRST_LAST'] = `${firstName} ${lastName}`;
  obj['H.I.S. SALES #'] = hisNumber;
  return obj;
};
