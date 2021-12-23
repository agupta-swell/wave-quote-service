import BigNumber from 'bignumber.js';
import { sumBy } from 'lodash';
import { IGenericObject } from 'src/docusign-communications/typing';
import { ISystemDesignProducts, parseSystemDesignProducts } from 'src/docusign-communications/utils';
import { QuoteFinanceProductService } from 'src/quotes/sub-services';
import {
  DefaultTabTransformation,
  DefaultTabType,
  DocusignTemplate,
  DOCUSIGN_TAB_TYPE,
  TabValue,
} from 'src/shared/docusign';

@DocusignTemplate('demo', '9616836b-3b23-4fd7-8550-6bcf89584476')
@DefaultTabType(DOCUSIGN_TAB_TYPE.PRE_FILLED_TABS)
@DefaultTabTransformation('snake_case')
export class EnergyHomeImprovementAgreementChangeOrderHicTemplate {
  @TabValue<IGenericObject>(({ contract }) => contract?.name.substring(contract.name.lastIndexOf(' ') + 1))
  changeOrderNumber: number;

  @TabValue<IGenericObject>(({ opportunity }) => opportunity._id)
  opportunityId: string;

  @TabValue<IGenericObject>(({ signerDetails }) => signerDetails.find(e => e.role === 'Primary Owner')?.fullName)
  primaryOwnerFullName: string;

  @TabValue<IGenericObject>(({ signerDetails }) => signerDetails.find(e => e.role === 'Co Owner')?.fullName)
  coOwnerFullName: string;

  @TabValue<IGenericObject>(
    ({ contact }) =>
      `${contact.address1}${contact.address2 ? `, ${contact.address2}` : ''}, ${contact.city}, ${contact.state} ${
        contact.zip
      }`,
  )
  homeAddress: string;

  @TabValue<IGenericObject>(({ primaryContract }) =>
    primaryContract?.signerDetails.find(e => e.role === 'Financier')?.signedOn.toLocaleDateString(),
  )
  primaryContractFinancierSignDate: Date;

  @TabValue<IGenericObject>(({ systemDesign }) =>
    sumBy(
      parseSystemDesignProducts(systemDesign).systemDesignBatteries,
      item => item.storageModelDataSnapshot.ratings.kilowattHours,
    ),
  )
  esKwh: string;

  @TabValue<IGenericObject>(({ systemDesign }) =>
    sumBy(
      parseSystemDesignProducts(systemDesign).systemDesignBatteries,
      item => item.storageModelDataSnapshot.ratings.kilowatts,
    ),
  )
  esKw: string;

  @TabValue<IGenericObject>(({ systemDesign }) =>
    parseSystemDesignProducts(systemDesign)
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
      .join(', '),
  )
  batterySummary: string;

  @TabValue<IGenericObject>(({ systemDesign }) => systemDesign.systemProductionData.capacityKW)
  pvKw: string;

  @TabValue<IGenericObject>(({ systemDesign }) =>
    parseSystemDesignProducts(systemDesign)
      .systemDesignModules.map(
        item =>
          `${item.numberOfPanels} x ${item.panelModelDataSnapshot.$meta.manufacturer.name} ${item.panelModelDataSnapshot.name}`,
      )
      .join(', '),
  )
  moduleSummary: string;

  @TabValue<IGenericObject>(({ systemDesign }) =>
    parseSystemDesignProducts(systemDesign)
      .systemDesignInverters.map(
        item =>
          `${item.quantity} x ${item.inverterModelDataSnapshot.$meta.manufacturer.name} ${item.inverterModelDataSnapshot.name}`,
      )
      .join(', '),
  )
  inverterSummary: string;

  @TabValue<IGenericObject>(({ contract }) => contract?.changeOrderDescription)
  changeOrderDescription: string;

  @TabValue<IGenericObject>(({ quote: { quoteCostBuildup } }) =>
    quoteCostBuildup.adderQuoteDetails
      .map(item => `${item.quantity} x ${item.adderModelDataSnapshot.name}`)
      .join(quoteCostBuildup.adderQuoteDetails.length > 5 ? '\n' : '; '),
  )
  adderSummary: string;

  @TabValue<IGenericObject>(({ quote: { quoteCostBuildup } }) => quoteCostBuildup.projectGrandTotal.cost)
  newContractAmount: string;

  @TabValue<IGenericObject>(({ quote: { quoteCostBuildup }, primaryContractQuote }) =>
    new BigNumber(quoteCostBuildup.projectGrandTotal.cost)
      .minus(primaryContractQuote?.quoteCostBuildup.projectGrandTotal.cost ?? 0)
      .toNumber(),
  )
  changeInContractAmount: string;

  @TabValue<IGenericObject>(({ quote: { quoteFinanceProduct, quoteCostBuildup } }) => {
    const { projectDiscountDetails, promotionDetails } = quoteFinanceProduct;

    const { adderQuoteDetails } = quoteCostBuildup;

    const headings: string[] = [];

    if (adderQuoteDetails.length) headings.push('Project Adders');

    if (promotionDetails.length) headings.push('Promotions');

    if (projectDiscountDetails.length) headings.push('Discounts');

    if (headings.length > 2) {
      const last = headings.pop();

      return `${headings.join(', ')}, and ${last}`;
    }

    return headings.join(' and ');
  })
  addersPromotionsDiscountsHeading: string;

  @TabValue<IGenericObject>(({ quote: { quoteFinanceProduct, quoteCostBuildup } }) => {
    const { projectDiscountDetails, promotionDetails } = quoteFinanceProduct;

    const { adderQuoteDetails } = quoteCostBuildup;

    return adderQuoteDetails
      .map(item => `Adder: ${item.adderModelDataSnapshot.name}`)
      .concat(
        promotionDetails.map(
          item =>
            `Promotion: ${item.name} ($${QuoteFinanceProductService.calculateReduction(
              item,
              quoteCostBuildup.projectGrossTotal.netCost,
            )})`,
        ),
      )
      .concat(
        projectDiscountDetails.map(
          item =>
            `Discount: ${item.name} ($${QuoteFinanceProductService.calculateReduction(
              item,
              quoteCostBuildup.projectGrossTotal.netCost,
            )})`,
        ),
      )
      .join('\n');
  })
  addersPromotionsDiscountsSummary: string;

  @TabValue('123.45')
  downPayment: string;

  @TabValue('123.45')
  payment1: string;

  @TabValue('123.45')
  payment2: string;

  @TabValue<IGenericObject>(({ contract }) => contract?.projectCompletionDate.toLocaleDateString())
  projectCompletionDate: Date;

  @TabValue<IGenericObject>(ctx => ctx.financialProduct?.countersignerName)
  financierFullName: string;

  @TabValue<IGenericObject>(ctx => ctx.financialProduct?.countersignerTitle)
  financierTitle: string;
}
