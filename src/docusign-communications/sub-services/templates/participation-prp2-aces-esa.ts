import * as dayjs from 'dayjs';
import { TemplateDataBuilder } from 'src/docusign-communications/typing';
import { toWord } from 'src/utils/transformNumber';

export const getParticipationPRP2ACESEsa: TemplateDataBuilder = genericObj => {
  const { quote, gsProgram, utilityProgramMaster, leaseSolverConfig } = genericObj;
  const result: Record<string, string> = {};

  result.utility_program_name = quote.utility_program.utility_program_name;

  result.monthly_incentive_amount = leaseSolverConfig?.grid_services_discount + '';

  result.residual_lease_term_word = toWord(+gsProgram.termYears * 12);

  result.residual_lease_term_number = (+gsProgram.termYears * 12).toString();

  result.program_end_date = dayjs(utilityProgramMaster.end_date).format('MM/DD/YYYY');

  return result;
};
