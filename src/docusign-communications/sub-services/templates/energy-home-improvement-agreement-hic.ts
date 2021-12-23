import BigNumber from 'bignumber.js';
import { sumBy } from 'lodash';
import { IGenericObject } from 'src/docusign-communications/typing';
import { ISystemDesignProducts, parseSystemDesignProducts } from 'src/docusign-communications/utils';
import {
  DefaultTabTransformation,
  DefaultTabType,
  DocusignTemplate,
  DOCUSIGN_TAB_TYPE,
  TabRequire,
  TabValue,
} from 'src/shared/docusign';
import { QuoteFinanceProductService } from 'src/quotes/sub-services';
import { CurrencyFormatter } from 'src/utils/numberFormatter';

@DocusignTemplate('demo', 'b0eb7c6c-7c1a-4060-a4bd-375274be977d')
@DefaultTabType(DOCUSIGN_TAB_TYPE.PRE_FILLED_TABS)
@DefaultTabTransformation('snake_case')
export class EnergyHomeImprovementAgreementHicTemplate {
  @TabValue<IGenericObject>(({ opportunity }) => opportunity._id)
  opportunityId: string;

  @TabValue<IGenericObject>(({ signerDetails }) => signerDetails.find(e => e.role === 'Primary Owner')?.fullName)
  primaryOwnerFullName: string;

  @TabValue<IGenericObject>(({ signerDetails }) => signerDetails.find(e => e.role === 'Co Owner')?.fullName)
  coOwnerFullName: string;

  @TabValue<IGenericObject>(({ signerDetails }) => signerDetails.find(e => e.role === 'Primary Owner')?.email)
  primaryOwnerEmail: string;

  @TabValue<IGenericObject>(({ contact }) =>
    contact.primaryPhone === 'CellPhone' ? contact.cellPhone : contact.businessPhone,
  )
  primaryOwnerPhone: string;

  @TabValue<IGenericObject>(
    ({ contact }) =>
      `${contact.address1}${contact.address2 ? `\n${contact.address2}\n` : '\n'}${contact.city}, ${contact.state} ${
        contact.zip
      }`,
  )
  homeAddress: string;

  @TabValue<IGenericObject>(
    ({ assignedMember }) => `${assignedMember?.profile.firstName} ${assignedMember?.profile.lastName}`,
  )
  salesAgentFullName: string;

  @TabValue<IGenericObject>(({ assignedMember }) => assignedMember?.hisNumber)
  @TabRequire('SalesAgent HIS number')
  hisNumber: string;

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

  @TabValue<IGenericObject>(({ systemDesign }) => systemDesign.systemProductionData.capacityKW.toFixed(3))
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

  @TabValue<IGenericObject>(({ quote: { quoteFinanceProduct, quoteCostBuildup } }) => {
    const { projectDiscountDetails, promotionDetails } = quoteFinanceProduct;

    const { adderQuoteDetails } = quoteCostBuildup;

    const headings: string[] = [];

    if (adderQuoteDetails.length) headings.push('Project Adders');

    if (promotionDetails.length) headings.push('Promotions');

    if (projectDiscountDetails.length) headings.push('Discounts');

    if (headings.length > 2) {
      const last = headings.pop();

      return `${headings.join(', ')} and ${last}`;
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

  @TabValue<IGenericObject>(({ quote: { quoteFinanceProduct } }) => {
    const labels: string[] = ['Contract Price'];

    const { projectDiscountDetails, promotionDetails, rebateDetails, incentiveDetails } = quoteFinanceProduct;

    if (promotionDetails.length) labels.push('Promotions Total');

    if (projectDiscountDetails.length) labels.push('Discounts Total');

    if (incentiveDetails.length) labels.push('Swell GridRewards Upfront Payment Discount');

    labels.push(
      `Net Agreement Price (Amount Due from ${
        quoteFinanceProduct.financeProduct.productType === 'cash' ? 'Owner' : 'Financier'
      })`,
    );

    if (rebateDetails.length) labels.push('Estimated Rebate(s)');

    labels.push('Funding Source');

    return labels.join('\n');
  })
  agreementPriceLabels: string;

  @TabValue<IGenericObject>(({ quote: { quoteFinanceProduct, quoteCostBuildup } }) => {
    const values: string[] = [];

    const { projectGrandTotal, projectGrossTotal, totalPromotionsDiscountsAndSwellGridrewards } = quoteCostBuildup;

    const { promotionDetails, rebateDetails, projectDiscountDetails, incentiveDetails } = quoteFinanceProduct;

    values.push(
      CurrencyFormatter.format(
        new BigNumber(projectGrandTotal.netCost).plus(totalPromotionsDiscountsAndSwellGridrewards.total).toNumber(),
      ),
    );

    if (promotionDetails.length)
      values.push(
        `(${CurrencyFormatter.format(
          QuoteFinanceProductService.calculateReductions(promotionDetails, projectGrossTotal.netCost),
        )})`,
      );

    if (projectDiscountDetails.length)
      values.push(
        `(${CurrencyFormatter.format(
          QuoteFinanceProductService.calculateReductions(projectDiscountDetails, projectGrossTotal.netCost),
        )})`,
      );

    if (incentiveDetails.length)
      values.push(
        `(${CurrencyFormatter.format(
          QuoteFinanceProductService.calculateReductions(incentiveDetails, projectGrossTotal.netCost),
        )})`,
      );

    values.push(CurrencyFormatter.format(projectGrandTotal.netCost));

    if (rebateDetails.length) {
      values.push(
        CurrencyFormatter.format(
          QuoteFinanceProductService.calculateReductions(rebateDetails, projectGrossTotal.netCost),
        ),
      );
    }

    values.push(quoteFinanceProduct.financeProduct.productType === 'cash' ? 'Cash' : 'Finance');

    return values.join('\n');
  })
  agreementPriceValues: string;

  @TabValue('123.45')
  downPayment: string;

  @TabValue('123.45')
  payment1: string;

  @TabValue('123.45')
  payment2: string;

  @TabValue<IGenericObject>(
    ({ quote: { utilityProgram, rebateProgram } }) =>
      [utilityProgram?.utilityProgramName, rebateProgram?.name].filter(p => !!p).join('+') || 'none',
  )
  utilityProgramAndRebateProgram: string;

  @TabValue<IGenericObject>(ctx => ctx.financialProduct?.countersignerName)
  financierFullName: string;

  @TabValue<IGenericObject>(ctx => ctx.financialProduct?.countersignerTitle)
  financierTitle: string;
}
