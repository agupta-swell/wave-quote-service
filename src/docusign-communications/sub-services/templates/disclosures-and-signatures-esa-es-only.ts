import { IGenericObject } from 'src/docusign-communications/typing';
import {
  DOCUSIGN_TAB_TYPE,
  DefaultTabTransformation,
  DefaultTabType,
  DocusignTemplate,
  TabValue,
} from 'src/shared/docusign';

@DocusignTemplate('demo', '94df351f-f51f-420f-b6b7-8243911f75fc')
@DocusignTemplate('live', 'a5bf62e5-4cec-40f0-95a0-7556a1209223')
@DefaultTabType(DOCUSIGN_TAB_TYPE.PRE_FILLED_TABS)
@DefaultTabTransformation('snake_case')
export class DisclosuresAndSignaturesEsaESOnlyTemplate {
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

  @TabValue<IGenericObject>(ctx => ctx.financialProduct?.countersignerName)
  financierFullName: string;

  @TabValue<IGenericObject>(ctx => ctx.financialProduct?.countersignerTitle)
  financierTitle: string;

  @TabValue<IGenericObject>(({ signerDetails }) => signerDetails.find(e => e.role === 'Primary Owner')?.fullName)
  homeownerFullName: string;

  @TabValue<IGenericObject>(({ signerDetails }) => signerDetails.find(e => e.role === 'Co Owner')?.fullName)
  coOwnerFullName: string;
}
