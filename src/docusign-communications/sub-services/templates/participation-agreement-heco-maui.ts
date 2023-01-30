import { IGenericObject, IGenericObjectForGSP } from 'src/docusign-communications/typing';
import {
  DefaultTabTransformation,
  DefaultTabType,
  DocusignTemplate,
  DOCUSIGN_TAB_TYPE,
  TabValue,
} from 'src/shared/docusign';

@DocusignTemplate('demo', '7955a72a-4c67-4c12-9106-fcf09c70b755')
@DocusignTemplate('live', '3a6cc492-dc36-4d64-bf84-249e7c0663d6')
@DefaultTabTransformation('snake_case')
@DefaultTabType(DOCUSIGN_TAB_TYPE.PRE_FILLED_TABS)
export class ParticipationAgreementHECOMauiTemplate {
  @TabValue<IGenericObject>(({ signerDetails }) => signerDetails.find(e => e.role === 'Primary Owner')?.fullName)
  primaryOwnerFullName: string;

  @TabValue<IGenericObject>(({ signerDetails }) => signerDetails.find(e => e.role === 'Co Owner')?.fullName)
  coOwnerFullName: string;

  @TabValue<IGenericObject | IGenericObjectForGSP>(ctx => {
    if ('financialProduct' in ctx) return ctx.financialProduct?.countersignerName;
    const financier = ctx.signerDetails.find(e => e.role === 'Financier');
    if (financier) return financier.fullName;
    return 'financier full name';
  })
  financierFullName: string;

  @TabValue<IGenericObject | IGenericObjectForGSP>(ctx => {
    if ('financialProduct' in ctx) return ctx.financialProduct?.countersignerTitle;
    if (ctx.utilityProgramMaster?.utilityProgramName)
      return `${ctx.utilityProgramMaster?.utilityProgramName} Program Manager`;
    return 'financier title';
  })
  financierTitle: string;
}
