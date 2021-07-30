import { TemplateDataBuilder } from '../../typing';

export const getSwellServiceEsaX1Data: TemplateDataBuilder = (genericObject) => {
  const utilityProgram = genericObject?.quote?.utilityProgram;

  const obj = {} as any;
  if (utilityProgram) {
    obj.UTIL_PROGRAM = utilityProgram.utilityProgramName;
  }
  return obj;
};
