import { IGenericObject, IGenericObjectForGSP } from 'src/docusign-communications/typing';
import {
  DefaultTabTransformation,
  DefaultTabType,
  DocusignTemplate,
  DOCUSIGN_TAB_TYPE,
  TabValue,
} from 'src/shared/docusign';

@DocusignTemplate('demo', 'c5c1c3f3-93b3-4f0b-a46b-6cb5d82d9e80')
@DocusignTemplate('live', 'd06793b5-fe44-4c25-9765-28f04c1e21a2')
@DefaultTabTransformation('snake_case')
@DefaultTabType(DOCUSIGN_TAB_TYPE.PRE_FILLED_TABS)
export class ParticipationAgreementHECOBigIslandTemplate {
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
