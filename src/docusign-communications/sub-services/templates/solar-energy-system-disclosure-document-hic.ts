import { IGenericObject } from 'src/docusign-communications/typing';
import {
  DefaultTabTransformation,
  DefaultTabType,
  DocusignTemplate,
  DOCUSIGN_TAB_TYPE,
  TabValue,
} from 'src/shared/docusign';

@DocusignTemplate('demo', '52fd1f92-db3a-485b-adcb-c9f452b0bdf4')
@DefaultTabType(DOCUSIGN_TAB_TYPE.PRE_FILLED_TABS)
@DefaultTabTransformation('snake_case')
export class SolarEnergySystemDisclosureDocumentHicTemplate {
  @TabValue<IGenericObject>(({ quote }) => quote.quoteCostBuildup.projectGrandTotal.netCost.toFixed(2))
  totalCost: number;
}
