import { IGenericObject } from 'src/docusign-communications/typing';
import { generateEPVAndGPVTable } from 'src/docusign-communications/utils';
import { ILeaseProductAttributes } from 'src/quotes/quote.schema';
import { DefaultTabType, DocusignTemplate, DOCUSIGN_TAB_TYPE, TabDynamic } from 'src/shared/docusign';

@DocusignTemplate('demo', '907c8e4d-8f4c-4494-a443-93c34c533beb')
@DefaultTabType(DOCUSIGN_TAB_TYPE.PRE_FILLED_TABS)
export class Exhibit7SolarEnergySystemEstimatedProductionTemplate {
  @TabDynamic<IGenericObject>(genericObj => {
    const { quote, leaseSolverConfig } = genericObj;
    const result: Record<string, string> = {};

    result.avg_solar_rate_per_kwh_year_1 = `${quote.systemProduction.generationKWh / 12}`;

    result.ESA_ESC = `${
      (quote.quoteFinanceProduct.financeProduct.productAttribute as ILeaseProductAttributes).rateEscalator
    }`;

    result.storage_monthly_payment = `${leaseSolverConfig?.storagePayment}`;

    result.PV_YLD_YR1 = `${quote.systemProduction.generationKWh}`;

    const { EPV_YLD, EPV_YLD_CUM, GPV_YLD, GUARANTEED_PV_PRICE_PER_KWH } = generateEPVAndGPVTable({
      systemProduction: quote.systemProduction,
      quote,
    });

    EPV_YLD.forEach((e, i) => (result[`EPV_YLD_YR${i + 1}`] = e.toFixed(2)));
    EPV_YLD_CUM.forEach((e, i) => (result[`EPV_YLD_CUM_YR${i + 1}`] = e.toFixed(2)));
    GPV_YLD.forEach((e, i) => (result[`GPV_YLD_YR${i + 1}`] = e.toFixed(2)));
    GUARANTEED_PV_PRICE_PER_KWH.forEach((e, i) => (result[`$/kWh_YR${i + 1}`] = e.toFixed(2)));

    result.PV_YLD_CUM = `${EPV_YLD_CUM[EPV_YLD_CUM.length - 1]}`;

    return result;
  })
  dynamicTabs: unknown;
}
