import * as dayjs from 'dayjs';
import { IGenericObject } from 'src/docusign-communications/typing';
import { numberWithCommas, toWord } from 'src/utils/transformNumber';
import {
  DocusignTemplate,
  DefaultTabTransformation,
  DefaultTabType,
  DOCUSIGN_TAB_TYPE,
  TabValue,
} from 'src/shared/docusign';

@DefaultTabType(DOCUSIGN_TAB_TYPE.PRE_FILLED_TABS)
@DefaultTabTransformation('snake_case')
@DocusignTemplate('demo', 'fecadd5d-2ffe-4266-8e4a-775586a09220')
export class ParticipationPRP2ACESCashTemplate {
  @TabValue<IGenericObject>(({ utilityProgramMaster }) => utilityProgramMaster?.gsaDisplayName)
  utilityProgramName: string;

  @TabValue<IGenericObject>(({ gsProgram }) => numberWithCommas(gsProgram?.upfrontIncentives ?? 0, 2))
  upfrontIncentiveAmount: string;

  @TabValue<IGenericObject>(({ gsProgram }) => numberWithCommas(gsProgram?.annualIncentives ?? 0, 2))
  annualIncentiveAmount: string;

  @TabValue<IGenericObject>(({ gsProgram }) => `${gsProgram?.termYears ?? 0} ${toWord(+(gsProgram?.termYears ?? 0))}`)
  initialTermYears: string;

  @TabValue<IGenericObject>(({ utilityProgramMaster }) => dayjs(utilityProgramMaster?.endDate).format('MM/DD/YYYY'))
  programEndDate: string;
}
