import { IGenericObject } from '../../typing';
import {
  DocusignTemplate,
  DefaultTabTransformation,
  DOCUSIGN_TAB_TYPE,
  DefaultTabType,
  TabValue,
} from 'src/shared/docusign';

@DefaultTabType(DOCUSIGN_TAB_TYPE.PRE_FILLED_TABS)
@DefaultTabTransformation('snake_case')
@DocusignTemplate('demo', '60e693c1-1858-4aa2-9105-8dfa1f3d7562')
export class SwellServiceEsaX1Template {
  @TabValue<IGenericObject>(({ quote: { utilityProgram, rebateProgram } }) =>
    [utilityProgram?.utilityProgramName, rebateProgram?.name].filter(p => !!p).join('+'),
  )
  utilityProgramAndRebateProgram: string;
}
