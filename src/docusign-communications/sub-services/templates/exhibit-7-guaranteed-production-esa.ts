import { IGenericObject } from 'src/docusign-communications/typing';
import { generateEPVAndGPVTableForESA } from 'src/docusign-communications/utils';
import { IEsaProductAttributes } from 'src/quotes/quote.schema';
import { DefaultTabType, DocusignTemplate, DOCUSIGN_TAB_TYPE, TabDynamic } from 'src/shared/docusign';
import { roundNumber } from 'src/utils/transformNumber';

@DocusignTemplate('demo', '544d97c9-a72c-494b-b4d1-1b32b9c745eb')
@DefaultTabType(DOCUSIGN_TAB_TYPE.PRE_FILLED_TABS)
export class Exhibit7GuaranteedProductionESATemplate {
  @TabDynamic<IGenericObject>(genericObj => {
    const { quote } = genericObj;
    const result: Record<string, string> = {};

    result.price_per_kwh = quote.systemProduction.generationKWh
      ? roundNumber(
          ((<IEsaProductAttributes>quote.quoteFinanceProduct.financeProduct.productAttribute).grossFinancePayment *
            12) /
            quote.systemProduction.generationKWh,
        ).toString()
      : '0';

    result.esa_escalator = (<IEsaProductAttributes>(
      quote.quoteFinanceProduct.financeProduct.productAttribute
    )).rateEscalator.toString();

    const { EPV_YLD, EPV_YLD_CUM, GPV_YLD, GUARANTEED_PV_PRICE_PER_KWH } = generateEPVAndGPVTableForESA({
      systemProduction: quote.systemProduction,
      quote,
    });

    EPV_YLD.forEach((e, i) => {
      result[`pv_production_yr${i + 1}`] = roundNumber(e).toString();
    });
    EPV_YLD_CUM.forEach((e, i) => {
      result[`pv_cumulative_yr${i + 1}`] = roundNumber(e).toString();
    });
    GPV_YLD.forEach((e, i) => {
      result[`guaranteed_production_yr${i + 1}`] = roundNumber(e).toString();
    });
    GUARANTEED_PV_PRICE_PER_KWH.forEach((e, i) => {
      result[`price_per_kwh_yr${i + 1}`] = roundNumber(e).toString();
    });

    result.pv_cumulative_production = roundNumber(EPV_YLD_CUM[EPV_YLD_CUM.length - 1]).toString();

    return result;
  })
  dynamicTabs: unknown;
}
