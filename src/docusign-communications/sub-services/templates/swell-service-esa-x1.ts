import { TemplateDataBuilder } from '../../typing';

// TODO: fix typing
// @ts-ignore
export const getSwellServiceEsaX1Data: TemplateDataBuilder = ({ utilityProgram }) => ({
  'UTIL_PROGRAM': utilityProgram.utility_program_name
});
