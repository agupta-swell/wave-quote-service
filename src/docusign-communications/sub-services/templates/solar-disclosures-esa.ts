import {
  DefaultTabType,
  DocusignTemplate,
  DOCUSIGN_TAB_TYPE,
  TabValue,
  DefaultTabTransformation,
  TabLabel,
} from 'src/shared/docusign';
import { IEsaProductAttributes } from 'src/quotes/quote.schema';
import { Number2DecimalsFormatter } from 'src/utils/numberFormatter';
import BigNumber from 'bignumber.js';
import { IGenericObject } from '../../typing';

@DocusignTemplate('demo', '4a8924ea-3580-46a4-a251-3f03e6b4c218')
@DocusignTemplate('live', 'd6bb6c01-0485-4ae5-8c97-62df73e0035c')
@DefaultTabTransformation('snake_case')
@DefaultTabType(DOCUSIGN_TAB_TYPE.PRE_FILLED_TABS)
export class SolarDisclosuresESATemplate {
  @TabLabel('$_per_kwh')
  @TabValue<IGenericObject>(({ quote }) =>
    Number2DecimalsFormatter.format(
      new BigNumber(
        quote.systemProduction.generationKWh
          ? ((<IEsaProductAttributes>quote.quoteFinanceProduct.financeProduct.productAttribute).grossFinancePayment *
              12) /
            quote.systemProduction.generationKWh
          : 0,
      )
        .decimalPlaces(2)
        .toNumber(),
    ),
  )
  $PerKwh: number;

  @TabLabel('esa_esclator')
  @TabValue<IGenericObject>(
    ({ quote }) => (<IEsaProductAttributes>quote.quoteFinanceProduct.financeProduct.productAttribute).rateEscalator,
  )
  esaEsclator: number;
}
