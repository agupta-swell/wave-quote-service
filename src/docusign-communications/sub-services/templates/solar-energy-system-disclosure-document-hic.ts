import { IGenericObject } from 'src/docusign-communications/typing';
import {
  DOCUSIGN_TAB_TYPE,
  DefaultTabTransformation,
  DefaultTabType,
  DocusignTemplate,
  TabValue,
} from 'src/shared/docusign';

@DocusignTemplate('demo', '52fd1f92-db3a-485b-adcb-c9f452b0bdf4')
@DocusignTemplate('live', '8d9a80d2-2c8a-40c5-8e3d-495bf4493366')
@DefaultTabType(DOCUSIGN_TAB_TYPE.PRE_FILLED_TABS)
@DefaultTabTransformation('snake_case')
export class SolarEnergySystemDisclosureDocumentHicTemplate {
  @TabValue<IGenericObject>(({ quote }) => quote.quoteFinanceProduct.netAmount.toFixed(2))
  totalCost: number;
}
