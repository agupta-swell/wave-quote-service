import { TemplateDataBuilder } from '../../typing';

export const getSwellServiceEsaX1Data: TemplateDataBuilder = (genericObject) => {
  const utilityProgram = genericObject?.quote?.utility_program;

  const obj = {} as any;
  if (utilityProgram) {
    obj.UTIL_PROGRAM = utilityProgram.utility_program_name;
  }
  return obj;
};
