import { sumBy } from 'lodash';
import { IGenericObject } from 'src/docusign-communications/typing';
import { ISystemDesignProducts, parseSystemDesignProducts } from 'src/docusign-communications/utils';
import { IEsaProductAttributes } from 'src/quotes/quote.schema';
import {
  DOCUSIGN_TAB_TYPE,
  DefaultTabTransformation,
  DefaultTabType,
  DocusignTemplate,
  TabValue,
} from 'src/shared/docusign';
import { roundNumber } from 'src/utils/transformNumber';

@DocusignTemplate('demo', '94df351f-f51f-4b4f-8688-3fc4911fb84d')
@DocusignTemplate('live', '9af69c56-b214-40e2-a5c1-ab709d6a9049')
@DefaultTabTransformation('snake_case')
@DefaultTabType(DOCUSIGN_TAB_TYPE.PRE_FILLED_TABS)
export class HomeEnergyStorageAgreementEsaESOnlyTemplate {
  @TabValue<IGenericObject>(({ opportunity }) => opportunity._id)
  opportunityId: string;

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

  @TabValue<IGenericObject>(({ quote }) => {
    let projectTotal = 0;
    const { grossFinancePayment, esaTerm, rateEscalator } = <IEsaProductAttributes>(
      quote.quoteFinanceProduct.financeProduct.productAttribute
    );
    const firstYearPayments = grossFinancePayment * 12;
    // eslint-disable-next-line no-plusplus
    for (let i = 0; i < esaTerm; i++) {
      projectTotal += firstYearPayments * (1 + rateEscalator / 100) ** i;
    }

    return roundNumber(projectTotal);
  })
  projectTotal: number;
}
