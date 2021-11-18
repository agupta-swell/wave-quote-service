import * as dayjs from 'dayjs';
import { IGenericObject } from 'src/docusign-communications/typing';
import { toWord } from 'src/utils/transformNumber';
import {
  DocusignTemplate,
  DefaultTabTransformation,
  DefaultTabType,
  DOCUSIGN_TAB_TYPE,
  TabValue,
} from 'src/shared/docusign';

@DocusignTemplate('demo', 'c69d696b-5a47-4528-a921-6f84416fcf94')
@DefaultTabType(DOCUSIGN_TAB_TYPE.PRE_FILLED_TABS)
@DefaultTabTransformation('snake_case')
export class ParticipationPRP2ACESEsaTemplate {
  @TabValue<IGenericObject>(({ quote }) => quote.utilityProgram.utilityProgramName)
  utilityProgramName: string;

  @TabValue<IGenericObject>(({ gsProgram }) => toWord(+(gsProgram?.termYears ?? 0)))
  residualLeaseTermWord: string;

  @TabValue<IGenericObject>(({ gsProgram }) => +(gsProgram?.termYears ?? 0) * 12)
  residualLeaseTermNumber: number;

  @TabValue<IGenericObject>(({ leaseSolverConfig }) => leaseSolverConfig?.gridServicesDiscount)
  monthlyIncentiveAmount: number;

  @TabValue<IGenericObject>(({ utilityProgramMaster }) => dayjs(utilityProgramMaster?.endDate).format('MM/DD/YYYY'))
  programEndDate: string;
}
