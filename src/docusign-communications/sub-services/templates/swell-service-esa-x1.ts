import { TemplateDataBuilder } from '../../typing';

export const getSwellServiceEsaX1Data: TemplateDataBuilder = genericObject => {
  const { utilityProgram, rebateProgram } = genericObject?.quote;

  const utility_program_and_rebate_program = [utilityProgram?.utilityProgramName, rebateProgram?.name]
    .filter(p => !!p)
    .join('+');

  return { utility_program_and_rebate_program };
};
