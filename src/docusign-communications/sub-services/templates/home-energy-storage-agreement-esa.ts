/* eslint-disable no-plusplus */
import { IGenericObject } from 'src/docusign-communications/typing';
import {
  DefaultTabTransformation,
  DefaultTabType,
  DocusignTemplate,
  DOCUSIGN_TAB_TYPE,
  TabValue,
  TabLabel,
} from 'src/shared/docusign';
import {
  ISystemDesignProducts,
  generateEPVAndGPVTableForESA,
  parseSystemDesignProducts,
} from 'src/docusign-communications/utils';
import { sumBy } from 'lodash';
import { roundNumber } from 'src/utils/transformNumber';
import { IEsaProductAttributes } from 'src/quotes/quote.schema';

@DocusignTemplate('demo', '37646910-5d0f-47f4-85cb-b1bbf504e5c6')
@DocusignTemplate('live', 'bad67031-c68a-423e-8b24-c3ffe1886006')
@DefaultTabTransformation('snake_case')
@DefaultTabType(DOCUSIGN_TAB_TYPE.PRE_FILLED_TABS)
export class HomeEnergyStorageAgreementEsaTemplate {
  @TabValue<IGenericObject>(({ opportunity }) => opportunity._id)
  opportunityId: string;

  @TabLabel('battery_X')
  @TabValue<IGenericObject>(({ systemDesign }) => (systemDesign.roofTopDesignData.storage.length ? 'X' : ' '))
  batteryX: string;

  @TabLabel('solar_X')
  @TabValue<IGenericObject>(({ systemDesign }) => (systemDesign.roofTopDesignData.panelArray.length ? 'X' : ' '))
  solarX: string;

  @TabValue<IGenericObject>(({ signerDetails }) => signerDetails.find(e => e.role === 'Primary Owner')?.fullName)
  primaryOwnerFullName: string;

  @TabValue<IGenericObject>(({ signerDetails }) => signerDetails.find(e => e.role === 'Co Owner')?.fullName)
  coOwnerFullName: string;

  @TabValue<IGenericObject>(
    ({ property }) =>
      `${property.address1 || ''}${property.address2 ? `\n${property.address2}\n` : '\n'}${property.city || ''}, ${
        property.state || ''
      } ${property.zip || ''}`,
  )
  homeAddress: string;

  @TabValue<IGenericObject>(({ systemDesign }) =>
    roundNumber(
      sumBy(
        parseSystemDesignProducts(systemDesign).systemDesignBatteries,
        item => item.storageModelDataSnapshot.ratings.kilowattHours,
      ),
      3,
    ),
  )
  esKwh: number;

  @TabValue<IGenericObject>(({ systemDesign }) =>
    roundNumber(
      sumBy(
        parseSystemDesignProducts(systemDesign).systemDesignBatteries,
        item => item.storageModelDataSnapshot.ratings.kilowatts,
      ),
      3,
    ),
  )
  esKw: number;

  @TabValue<IGenericObject>(({ systemDesign }) => {
    if (!systemDesign.roofTopDesignData.storage.length) return ' ';

    return parseSystemDesignProducts(systemDesign)
      .systemDesignBatteries.reduce<ISystemDesignProducts['systemDesignBatteries']>((acc, cur) => {
        const batt = acc.find(e => e.storageModelId === cur.storageModelId);

        if (batt) {
          batt.quantity += cur.quantity;
          return acc;
        }

        acc.push(cur);
        return acc;
      }, [])
      .map(
        item =>
          `${item.quantity} x ${item.storageModelDataSnapshot.$meta.manufacturer.name} ${item.storageModelDataSnapshot.name}`,
      )
      .join(', ');
  })
  batterySummary: string;

  @TabValue<IGenericObject>(({ systemDesign }) => roundNumber(systemDesign?.systemProductionData?.capacityKW || 0, 3))
  pvKw: string;

  @TabValue<IGenericObject>(({ systemDesign }) => {
    if (!systemDesign.roofTopDesignData.panelArray.length) return ' ';

    return parseSystemDesignProducts(systemDesign)
      .systemDesignModules.reduce<ISystemDesignProducts['systemDesignModules']>((acc, cur) => {
        const module = acc.find(e => e.panelModelId === cur.panelModelId);

        if (module) {
          module.numberOfPanels += cur.numberOfPanels;
          return acc;
        }

        acc.push(cur);
        return acc;
      }, [])
      .map(
        item =>
          `${item.numberOfPanels} x ${item.panelModelDataSnapshot.$meta.manufacturer.name} ${item.panelModelDataSnapshot.name}`,
      )
      .join(', ');
  })
  moduleSummary: string;

  @TabValue<IGenericObject>(({ systemDesign }) => {
    if (!systemDesign.roofTopDesignData.inverters.length) return ' ';

    return parseSystemDesignProducts(systemDesign)
      .systemDesignInverters.reduce<ISystemDesignProducts['systemDesignInverters']>((acc, cur) => {
        const inverter = acc.find(e => e.inverterModelId === cur.inverterModelId);

        if (inverter) {
          inverter.quantity += cur.quantity;
          return acc;
        }

        acc.push(cur);
        return acc;
      }, [])
      .map(
        item =>
          `${item.quantity} x ${item.inverterModelDataSnapshot.$meta.manufacturer.name} ${item.inverterModelDataSnapshot.name}`,
      )
      .join(', ');
  })
  inverterSummary: string;

  @TabValue<IGenericObject>(
    ({ quote }) => (<IEsaProductAttributes>quote.quoteFinanceProduct.financeProduct.productAttribute).esaTerm,
  )
  esaTermYears: number;

  @TabValue<IGenericObject>(
    ({ quote }) => (<IEsaProductAttributes>quote.quoteFinanceProduct.financeProduct.productAttribute).esaTerm * 12,
  )
  esaTermMonths: number;

  @TabValue<IGenericObject>(
    ({ quote }) =>
      (<IEsaProductAttributes>quote.quoteFinanceProduct.financeProduct.productAttribute).grossFinancePayment,
  )
  esaMonthlyPmt: number;

  @TabValue<IGenericObject>(
    ({ quote }) => (<IEsaProductAttributes>quote.quoteFinanceProduct.financeProduct.productAttribute).rateEscalator,
  )
  esaEsc: number;

  @TabValue<IGenericObject>(({ quote }) =>
    quote.systemProduction.generationKWh
      ? roundNumber(
        ((<IEsaProductAttributes>quote.quoteFinanceProduct.financeProduct.productAttribute).grossFinancePayment *
          12) /
        quote.systemProduction.generationKWh,
      )
      : 0,
  )
  pricePerKwh: number;

  @TabLabel('pv_prod_yr1')
  @TabValue<IGenericObject>(({ quote }) => roundNumber(quote.systemProduction.generationKWh))
  pvProdYr1: number;

  @TabValue<IGenericObject>(({ quote }) => {
    const { EPV_YLD_CUM } = generateEPVAndGPVTableForESA({
      systemProduction: quote.systemProduction,
      quote,
    });

    return roundNumber(EPV_YLD_CUM[EPV_YLD_CUM.length - 1]);
  })
  estProduction: number;

  @TabLabel('production_yr1')
  @TabValue<IGenericObject>(({ quote }) => {
    const { GPV_YLD } = generateEPVAndGPVTableForESA({
      systemProduction: quote.systemProduction,
      quote,
    });

    return roundNumber(GPV_YLD[0]);
  })
  productionYr1: number;

  @TabLabel('production_yr2')
  @TabValue<IGenericObject>(({ quote }) => {
    const { GPV_YLD } = generateEPVAndGPVTableForESA({
      systemProduction: quote.systemProduction,
      quote,
    });

    return roundNumber(GPV_YLD[1]);
  })
  productionYr2: number;

  @TabValue<IGenericObject>(({ quote }) => {
    const { GPV_YLD } = generateEPVAndGPVTableForESA({
      systemProduction: quote.systemProduction,
      quote,
    });

    return roundNumber(sumBy(GPV_YLD, e => e));
  })
  guaranteedProduction: number;

  @TabValue<IGenericObject>(({ quote }) => {
    let projectTotal = 0;
    const { grossFinancePayment, esaTerm, rateEscalator } = <IEsaProductAttributes>(
      quote.quoteFinanceProduct.financeProduct.productAttribute
    );
    const firstYearPayments = grossFinancePayment * 12;
    for (let i = 0; i < esaTerm; i++) {
      projectTotal += firstYearPayments * (1 + rateEscalator / 100) ** i;
    }

    return roundNumber(projectTotal);
  })
  projectTotal: number;
}
