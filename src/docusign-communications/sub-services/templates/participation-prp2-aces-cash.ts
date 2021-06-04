import * as dayjs from 'dayjs';
import { TemplateDataBuilder } from 'src/docusign-communications/typing';
import { toWord } from 'src/utils/transformNumber';

export const getParticipationPRP2ACESCash: TemplateDataBuilder = genericObj => {
  const { quote, gsProgram, utilityProgramMaster } = genericObj;
  const result: Record<string, string> = {};

  result.utility_program_name = quote.utilityProgram.utilityProgramName;

  result.upfront_incentive_amount = `${gsProgram?.upfrontIncentives ?? 0}`;
  result.annual_incentive_amount = `${gsProgram?.annualIncentives ?? 0}`;

  result.initial_term_text = toWord(+(gsProgram?.termYears ?? 0));

  result.initial_term_number = gsProgram?.termYears ?? '0';

  result.program_end_date = dayjs(utilityProgramMaster?.endDate).format('MM/DD/YYYY');

  return result;
};
