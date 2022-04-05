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

@DocusignTemplate('demo', '92120f0d-1839-471e-b3b6-f37afb8c721b')
@DefaultTabType(DOCUSIGN_TAB_TYPE.PRE_FILLED_TABS)
@DefaultTabTransformation('snake_case')
export class ParticipationPRP2ACESEsaTemplate {
  @TabValue<IGenericObject>(({ quote }) => quote.utilityProgram?.utilityProgramName ?? 'none')
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
