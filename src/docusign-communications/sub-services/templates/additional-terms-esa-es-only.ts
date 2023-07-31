import { IEsaProductAttributes } from 'src/quotes/quote.schema';
import {
  DefaultTabTransformation,
  DefaultTabType,
  DocusignTemplate,
  DOCUSIGN_TAB_TYPE,
  TabValue,
} from 'src/shared/docusign';
import { IGenericObject } from '../../typing';

@DocusignTemplate('demo', '94df351f-f51f-4ac7-b85e-1469911f2537')
@DocusignTemplate('live', 'f9476f90-b455-4b4d-961a-1cc9471d17e1')
@DefaultTabTransformation('snake_case')
@DefaultTabType(DOCUSIGN_TAB_TYPE.PRE_FILLED_TABS)
export class AdditionalTermsEsDataTemplate {
  @TabValue<IGenericObject>(
    ({ quote }) => (<IEsaProductAttributes>quote.quoteFinanceProduct.financeProduct.productAttribute).rateEscalator,
  )
  esaEscalator: number;
}
