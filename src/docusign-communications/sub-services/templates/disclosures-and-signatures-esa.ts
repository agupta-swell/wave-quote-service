import { IGenericObject } from 'src/docusign-communications/typing';
import {
  DOCUSIGN_TAB_TYPE,
  DefaultTabTransformation,
  DefaultTabType,
  DocusignTemplate,
  TabValue,
} from 'src/shared/docusign';

@DocusignTemplate('demo', '75e11c9d-aaff-440b-a7a7-c789659c8985')
@DocusignTemplate('live', 'c17bef79-e15e-49f9-be1c-5f69dcc7d60f')
@DefaultTabType(DOCUSIGN_TAB_TYPE.PRE_FILLED_TABS)
@DefaultTabTransformation('snake_case')
export class DisclosuresAndSignaturesEsaTemplate {
  @TabValue<IGenericObject>(({ assignedMember }) => assignedMember?.hisNumber)
  hisNumber: number;

  @TabValue<IGenericObject>(({ assignedMember }) => {
    if (!assignedMember) return '';

    const {
      profile: { firstName, lastName },
    } = assignedMember;

    return `${firstName || ''} ${lastName || ''}`.trim();
  })
  salesAgentFullName: string;
}
