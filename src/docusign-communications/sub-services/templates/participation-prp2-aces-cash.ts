import * as dayjs from 'dayjs';
import { TemplateDataBuilder } from 'src/docusign-communications/typing';
import { numberWithCommas, toWord } from 'src/utils/transformNumber';

export const getParticipationPRP2ACESCash: TemplateDataBuilder = genericObj => {
  const { gsProgram, utilityProgramMaster } = genericObj;
  const result: Record<string, string> = {};

  result.utility_program_name = utilityProgramMaster?.gsaDisplayName ?? '';

  result.upfront_incentive_amount = `${numberWithCommas(gsProgram?.upfrontIncentives ?? 0, 2)}`;

  result.annual_incentive_amount = `${numberWithCommas(gsProgram?.annualIncentives ?? 0, 2)}`;

  result.initial_term_years = `${gsProgram?.termYears ?? 0} ${toWord(+(gsProgram?.termYears ?? 0))}`;

  result.program_end_date = dayjs(utilityProgramMaster?.endDate).format('MM/DD/YYYY');

  return result;
};
