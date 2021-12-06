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

@DocusignTemplate('demo', '06f41497-6dda-46a9-9171-e9718ff392a0')
@DefaultTabType(DOCUSIGN_TAB_TYPE.PRE_FILLED_TABS)
@DefaultTabTransformation('snake_case')
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
