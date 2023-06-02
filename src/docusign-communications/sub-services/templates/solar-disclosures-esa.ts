import {
  DefaultTabType,
  DocusignTemplate,
  DOCUSIGN_TAB_TYPE,
  TabValue,
  DefaultTabTransformation,
  TabLabel,
} from 'src/shared/docusign';
import { IEsaProductAttributes } from 'src/quotes/quote.schema';
import { roundNumber } from 'src/utils/transformNumber';
import { IGenericObject } from '../../typing';

@DocusignTemplate('demo', '4a8924ea-3580-46a4-a251-3f03e6b4c218')
@DefaultTabTransformation('snake_case')
@DefaultTabType(DOCUSIGN_TAB_TYPE.PRE_FILLED_TABS)
export class SolarDisclosuresESATemplate {
  @TabLabel('$_per_kwh')
  @TabValue<IGenericObject>(({ quote }) =>
    roundNumber(
      ((<IEsaProductAttributes>quote.quoteFinanceProduct.financeProduct.productAttribute).grossFinancePayment * 12) /
        quote.systemProduction.generationKWh,
    ),
  )
  $PerKwh: number;

  @TabValue<IGenericObject>(
    ({ quote }) => (<IEsaProductAttributes>quote.quoteFinanceProduct.financeProduct.productAttribute).rateEscalator,
  )
  esaEsclator: number;
}
