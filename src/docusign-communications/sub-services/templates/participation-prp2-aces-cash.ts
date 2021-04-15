import * as dayjs from 'dayjs';
import { TemplateDataBuilder } from 'src/docusign-communications/typing';
import { toWord } from 'src/utils/transformNumber';

export const getParticipationPRP2ACESCash: TemplateDataBuilder = genericObj => {
  const { quote, gsProgram, utilityProgramMaster } = genericObj;
  const result: Record<string, string> = {};

  result.utility_program_name = quote.utility_program.utility_program_name;

  result.upfront_incentive_amount = `${gsProgram.upfrontIncentives}`;
  result.annual_incentive_amount = `${gsProgram.annualIncentives}`;

  result.initial_term_text = toWord(+gsProgram.termYears);

  result.initial_term_number = gsProgram.termYears;

  result.program_end_date = dayjs(utilityProgramMaster.end_date).format('MM/DD/YYYY');

  return result;
};
