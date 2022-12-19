import {
  DefaultTabTransformation,
  DefaultTabType,
  DocusignTemplate,
  DOCUSIGN_TAB_TYPE,
  TabValue,
} from 'src/shared/docusign';
import { IGenericObject, IGenericObjectForGSP } from '../../typing';

@DocusignTemplate('demo', '6ae2b971-373d-4db1-8c20-758dda9c77d9')
@DefaultTabType(DOCUSIGN_TAB_TYPE.PRE_FILLED_TABS)
@DefaultTabTransformation('pascal_case')
export class DummyGsaTemplate {
  @TabValue<IGenericObject | IGenericObjectForGSP>(ctx => {
    if ('financialProduct' in ctx) return ctx.financialProduct?.countersignerName;
    const financier = ctx.signerDetails.find(e => e.role === 'Financier');
    if (financier) return financier.fullName;
    return 'financier full name';
  })
  financierName: string;

  @TabValue<IGenericObject | IGenericObjectForGSP>(ctx => {
    if ('financialProduct' in ctx) return ctx.financialProduct?.countersignerTitle;
    if (ctx.utilityProgramMaster?.utilityProgramName)
      return `${ctx.utilityProgramMaster?.utilityProgramName} Program Manager`;
    return 'financier title';
  })
  financierTitle: string;
}
