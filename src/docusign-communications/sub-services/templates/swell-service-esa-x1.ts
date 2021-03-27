import { IUtilityProgramSchema } from 'src/quotes/quote.schema';

// TODO: consider this parameter type. As now, I assume below type

export function getSwellServiceEsaX1Data(utilityProgram: IUtilityProgramSchema) {
  const obj = {} as any;
  obj.UTIL_PROGRAM = utilityProgram.utility_program_name;

  return obj;
}
