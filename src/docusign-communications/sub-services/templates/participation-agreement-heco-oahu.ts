import { IGenericObject, IGenericObjectForGSP } from 'src/docusign-communications/typing';
import {
  DefaultTabTransformation,
  DefaultTabType,
  DocusignTemplate,
  DOCUSIGN_TAB_TYPE,
  TabValue,
} from 'src/shared/docusign';

@DocusignTemplate('demo', '9e704b16-7b03-4987-881c-44f3c8b3dc19')
@DocusignTemplate('live', 'd02ba7b0-56d7-4283-9460-233c8da78a76')
@DefaultTabTransformation('snake_case')
@DefaultTabType(DOCUSIGN_TAB_TYPE.PRE_FILLED_TABS)
export class ParticipationAgreementHECOOahuTemplate {
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
