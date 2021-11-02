import {
  DefaultTabTransformation,
  DefaultTabType,
  DocusignTemplate,
  DOCUSIGN_TAB_TYPE,
  TabValue,
} from 'src/shared/docusign';
import { IGenericObject } from '../../typing';

@DefaultTabType(DOCUSIGN_TAB_TYPE.PRE_FILLED_TABS)
@DefaultTabTransformation('pascal_case')
@DocusignTemplate('demo', '6ae2b971-373d-4db1-8c20-758dda9c77d9')
export class DummyGsaTemplate {
  @TabValue<IGenericObject>(ctx => ctx.financialProduct?.countersignerName)
  financierName: string;

  @TabValue<IGenericObject>(ctx => ctx.financialProduct?.countersignerTitle)
  financierTitle: string;
}
