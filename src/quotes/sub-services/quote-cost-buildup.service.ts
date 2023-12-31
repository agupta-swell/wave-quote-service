/* eslint-disable no-return-assign */
import { Injectable } from '@nestjs/common';
import { BigNumber } from 'bignumber.js';
import { IDiscount } from 'src/discounts/interfaces';
import { PRODUCT_TYPE } from 'src/products-v2/constants';
import { IPromotion } from 'src/promotions/interfaces';
import { roundNumber } from 'src/utils/transformNumber';
import {
  IBaseQuoteCost,
  IBaseQuoteMarginData,
  ICalculateCostResult,
  ICreateQuoteCostBuildUpArg,
  ICreateQuoteCostBuildupParams,
  IQuoteCost,
  IQuoteCostBuildup,
  ISalesTaxData,
  SALES_ORIGINATION_SALES_FEE_INPUT_TYPE,
} from '../interfaces';
import {
  IAdditionalFees,
  IBaseCostBuildupFee,
  ISalesOriginationSalesFee,
} from '../interfaces/quote-cost-buildup/ICostBuildupFee';
import { ITotalPromotionsDiscountsAndSwellGridrewards } from '../interfaces/quote-cost-buildup/ITotalPromotionsDiscountsGridrewards';
import { IIncentiveDetailsSchema } from '../quote.schema';
import { QuoteFinanceProductService } from './quote-finance-product.service';

@Injectable()
export class QuoteCostBuildUpService {
  private calculateCost(pricePerUnit: number, quantity: number, markupPercentage: number): ICalculateCostResult {
    const price = new BigNumber(pricePerUnit ?? 0);

    const total = price.multipliedBy(quantity);

    const markup = new BigNumber(markupPercentage ?? 0);

    const markupAmount = total.multipliedBy(markup.dividedBy(100));

    const totalWithMarkup = total.plus(markupAmount);

    return {
      markupAmount: roundNumber(markupAmount.toNumber(), 2),
      total: roundNumber(total.toNumber(), 2),
      totalWithMarkup: roundNumber(totalWithMarkup.toNumber(), 2),
    };
  }

  private mergeProduct<T>(products: T[], cond: (product: T) => string, increment: (acc: T, cur: T) => void): T[] {
    const results: T[] = [];

    products.forEach(product => {
      const existing = results.find(result => cond(result) === cond(product));

      if (existing) {
        increment(existing, product);
      } else {
        results.push(product);
      }
    });

    return results;
  }

  private sumQuoteCosts(...quoteCostsArr: IQuoteCost<unknown>[][]): IQuoteCost<unknown> {
    let totalCost = new BigNumber(0);
    let totalMarkupAmount = new BigNumber(0);

    quoteCostsArr.forEach(quoteCosts =>
      quoteCosts.forEach(quoteCost => {
        totalCost = totalCost.plus(quoteCost.cost);
        totalMarkupAmount = totalMarkupAmount.plus(quoteCost.markupAmount);
      }),
    );

    const markupPercentage = totalCost.eq(0)
      ? new BigNumber(0)
      : totalMarkupAmount.multipliedBy(100).dividedBy(totalCost);

    const netCost = totalCost.plus(totalMarkupAmount);

    return {
      cost: totalCost.toNumber(),
      netCost: netCost.toNumber(),
      markupAmount: totalMarkupAmount.toNumber(),
      markupPercentage: markupPercentage.toNumber(),
    };
  }

  public calculateTotalPromotionsDiscountsAndSwellGridrewards(
    grossPrice: number,
    discounts: IDiscount[] = [],
    promotions: IPromotion[] = [],
    incentives: IIncentiveDetailsSchema[] = [],
  ): ITotalPromotionsDiscountsAndSwellGridrewards {
    let cogs = new BigNumber(0);
    let margin = new BigNumber(0);

    discounts.forEach(discount => {
      QuoteFinanceProductService.attachImpact(discount, grossPrice);
      cogs = cogs.plus(discount.cogsAmount);
      margin = margin.plus(discount.marginAmount);
    });

    promotions.forEach(promotion => {
      QuoteFinanceProductService.attachImpact(promotion, grossPrice);
      cogs = cogs.plus(promotion.cogsAmount);
      margin = margin.plus(promotion.marginAmount);
    });

    incentives.forEach(incentive => {
      // incentives are 0% cogs and 100% margin
      QuoteFinanceProductService.attachImpact(incentive, grossPrice);
      margin = margin.plus(incentive.marginAmount);
    });

    const cogsAmount = cogs.toNumber();
    const marginAmount = margin.toNumber();
    const total = cogs.plus(margin).toNumber();

    return {
      cogsAmount,
      marginAmount,
      total,
    };
  }

  public calculateProjectSubtotalWithDiscountsPromotionsAndSwellGridrewards(
    projectGrossTotal: IQuoteCost<unknown>,
    totalPromotionsDiscountsAndSwellGridrewards: ITotalPromotionsDiscountsAndSwellGridrewards,
  ): IBaseQuoteMarginData {
    const cost = new BigNumber(projectGrossTotal.cost).minus(totalPromotionsDiscountsAndSwellGridrewards.cogsAmount);

    const netCost = new BigNumber(projectGrossTotal.netCost).minus(totalPromotionsDiscountsAndSwellGridrewards.total);

    const netMargin = netCost.minus(cost);

    const marginPercentage = netMargin.dividedBy(netCost).multipliedBy(100);

    return {
      cost: cost.toNumber(),
      marginPercentage: marginPercentage.toNumber(),
      netCost: netCost.toNumber(),
      netMargin: netMargin.toNumber(),
    };
  }

  public calculateSubtotalWithSalesOriginationManagerFee(
    projectGrossTotal: IQuoteCost<unknown>,
    projectSubtotalWithDiscountsPromotionsAndSwellGridrewards: IBaseQuoteMarginData,
    salesOriginationManagerFee: IBaseCostBuildupFee,
  ): IBaseQuoteMarginData {
    const cost = new BigNumber(projectSubtotalWithDiscountsPromotionsAndSwellGridrewards.cost).plus(
      salesOriginationManagerFee.cogsAmount,
    );

    const netCost = new BigNumber(projectSubtotalWithDiscountsPromotionsAndSwellGridrewards.netCost).plus(
      salesOriginationManagerFee.total,
    );

    const netMargin = new BigNumber(netCost).minus(cost);

    const marginPercentage = netCost.eq(0) ? new BigNumber(0) : netMargin.dividedBy(netCost).multipliedBy(100);

    return {
      cost: cost.toNumber(),
      marginPercentage: marginPercentage.toNumber(),
      netCost: netCost.toNumber(),
      netMargin: netMargin.toNumber(),
    };
  }

  public calculateCostBuildupFee(previousSubTotal: number, unitPercentage = 0): IBaseCostBuildupFee {
    const total = new BigNumber(previousSubTotal).multipliedBy(unitPercentage).dividedBy(100);

    const amount = roundNumber(total.toNumber(), 2);

    return {
      unitPercentage,
      total: amount,
      cogsAllocation: 0,
      marginAllocation: 100,
      cogsAmount: 0,
      marginAmount: amount,
    };
  }

  public calculatePanelsQuoteCost(
    panels: ICreateQuoteCostBuildUpArg['panelArray'],
    markupPercentage: number,
  ): IQuoteCost<PRODUCT_TYPE.MODULE>[] {
    return this.mergeProduct(
      panels,
      panel => panel.panelModelId,
      (acc, cur) => (acc.numberOfPanels += cur.numberOfPanels),
    ).map<IQuoteCost<PRODUCT_TYPE.MODULE>>(panel => {
      const cost = this.calculateCost(panel.panelModelDataSnapshot.cost, panel.numberOfPanels, markupPercentage);

      return {
        quantity: panel.numberOfPanels,
        markupPercentage,
        panelModelDataSnapshot: panel.panelModelDataSnapshot,
        panelModelSnapshotDate: panel.panelModelSnapshotDate,
        cost: cost.total,
        netCost: cost.totalWithMarkup,
        markupAmount: cost.markupAmount,
        id: panel.panelModelId,
      };
    });
  }

  public calculateInvertersQuoteCost(
    inverters: ICreateQuoteCostBuildUpArg['inverters'],
    markupPercentage: number,
  ): IQuoteCost<PRODUCT_TYPE.INVERTER>[] {
    return this.mergeProduct(
      inverters,
      inverter => inverter.inverterModelId,
      (acc, cur) => (acc.quantity += cur.quantity),
    ).map<IQuoteCost<PRODUCT_TYPE.INVERTER>>(inverter => {
      const cost = this.calculateCost(inverter.inverterModelDataSnapshot.cost, inverter.quantity, markupPercentage);

      return {
        cost: cost.total,
        inverterModelDataSnapshot: inverter.inverterModelDataSnapshot,
        inverterModelSnapshotDate: inverter.inverterModelSnapshotDate,
        markupAmount: cost.markupAmount,
        markupPercentage,
        netCost: cost.totalWithMarkup,
        quantity: inverter.quantity,
      };
    });
  }

  public calculateStoragesQuoteCost(
    storages: ICreateQuoteCostBuildUpArg['storage'],
    markupPercentage: number,
  ): IQuoteCost<PRODUCT_TYPE.BATTERY>[] {
    return this.mergeProduct(
      storages,
      storage => storage.storageModelId,
      (acc, cur) => (acc.quantity += cur.quantity),
    ).map<IQuoteCost<PRODUCT_TYPE.BATTERY>>(storage => {
      const cost = this.calculateCost(storage.storageModelDataSnapshot.cost, storage.quantity, markupPercentage);

      return {
        quantity: storage.quantity,
        markupPercentage,
        storageModelDataSnapshot: storage.storageModelDataSnapshot,
        storageModelSnapshotDate: storage.storageModelSnapshotDate,
        cost: cost.total,
        netCost: cost.totalWithMarkup,
        markupAmount: cost.markupAmount,
      };
    });
  }

  public calculateAddersQuoteCost(
    adders: ICreateQuoteCostBuildUpArg['adders'],
    markupPercentage: number,
  ): IQuoteCost<PRODUCT_TYPE.ADDER>[] {
    return this.mergeProduct(
      adders,
      adder => adder.adderId,
      (acc, cur) => (acc.quantity += cur.quantity),
    ).map<IQuoteCost<PRODUCT_TYPE.ADDER>>(adder => {
      const cost = this.calculateCost(adder.adderModelDataSnapshot.cost, adder.quantity, markupPercentage);

      return {
        quantity: adder.quantity,
        markupPercentage,
        adderModelDataSnapshot: adder.adderModelDataSnapshot,
        adderModelSnapshotDate: adder.adderModelSnapshotDate,
        cost: cost.total,
        netCost: cost.totalWithMarkup,
        markupAmount: cost.markupAmount,
      };
    });
  }

  public calculateBalanceOfSystemsQuoteCost(
    balancesOfSystem: ICreateQuoteCostBuildUpArg['balanceOfSystems'],
    markupPercentage: number,
  ): IQuoteCost<PRODUCT_TYPE.BALANCE_OF_SYSTEM>[] {
    return balancesOfSystem.map<IQuoteCost<PRODUCT_TYPE.BALANCE_OF_SYSTEM>>(balanceOfSystem => {
      const quantity = balanceOfSystem.quantity ?? 1;

      const cost = this.calculateCost(
        balanceOfSystem.balanceOfSystemModelDataSnapshot.cost,
        quantity,
        markupPercentage,
      );

      return {
        quantity,
        markupPercentage,
        balanceOfSystemModelDataSnapshot: balanceOfSystem.balanceOfSystemModelDataSnapshot,
        balanceOfSystemModelSnapshotDate: balanceOfSystem.balanceOfSystemSnapshotDate,
        cost: cost.total,
        netCost: cost.totalWithMarkup,
        markupAmount: cost.markupAmount,
      };
    });
  }

  public calculateAncillaryEquipmentsQuoteCost(
    ancillaryEquipments: ICreateQuoteCostBuildUpArg['ancillaryEquipments'],
    markupPercentage: number,
  ): IQuoteCost<PRODUCT_TYPE.ANCILLARY_EQUIPMENT>[] {
    return this.mergeProduct(
      ancillaryEquipments,
      ancillaryEquipment => ancillaryEquipment.ancillaryId,
      (acc, cur) => (acc.quantity += cur.quantity),
    ).map<IQuoteCost<PRODUCT_TYPE.ANCILLARY_EQUIPMENT>>(ancillaryEquipment => {
      const cost = this.calculateCost(
        ancillaryEquipment.ancillaryEquipmentModelDataSnapshot.cost,
        ancillaryEquipment.quantity,
        markupPercentage,
      );

      return {
        quantity: ancillaryEquipment.quantity,
        markupPercentage,
        ancillaryEquipmentModelDataSnapshot: ancillaryEquipment.ancillaryEquipmentModelDataSnapshot,
        cost: cost.total,
        netCost: cost.totalWithMarkup,
        markupAmount: cost.markupAmount,
        ancillaryEquipmentModelSnapshotDate: ancillaryEquipment.ancillaryEquipmentModelDataSnapshotDate,
      };
    });
  }

  public calculateSoftCosts(
    softCosts: ICreateQuoteCostBuildUpArg['softCosts'],
    markupPercentage: number,
  ): IQuoteCost<PRODUCT_TYPE.SOFT_COST>[] {
    return softCosts.map<IQuoteCost<PRODUCT_TYPE.SOFT_COST>>(softCost => {
      const cost = this.calculateCost(softCost.softCostDataSnapshot.cost, softCost.quantity, markupPercentage);

      return {
        quantity: softCost.quantity,
        markupPercentage,
        softCostDataSnapshot: softCost.softCostDataSnapshot,
        softCostSnapshotDate: softCost.softCostSnapshotDate,
        cost: cost.total,
        netCost: cost.totalWithMarkup,
        markupAmount: cost.markupAmount,
      };
    });
  }

  public calculateLaborsCost(
    labors: ICreateQuoteCostBuildUpArg['laborCosts'],
    markupPercentage: number,
  ): IQuoteCost<PRODUCT_TYPE.LABOR>[] {
    return labors.map<IQuoteCost<PRODUCT_TYPE.LABOR>>(labor => {
      const cost = this.calculateCost(labor.laborCostDataSnapshot.cost, labor.quantity, markupPercentage);

      return {
        quantity: labor.quantity,
        markupPercentage,
        cost: cost.total,
        netCost: cost.totalWithMarkup,
        markupAmount: cost.markupAmount,
        laborCostDataSnapshot: labor.laborCostDataSnapshot,
        laborCostSnapshotDate: labor.laborCostSnapshotDate,
      };
    });
  }

  public calculateThirdPartyFinancingDealerFee(
    subtotalWithSalesOriginationManagerFee: number,
    salesOriginationSalesFee: IBaseCostBuildupFee,
    dealerFeePercentage: number,
  ): IBaseCostBuildupFee {
    const dealerFee = new BigNumber(dealerFeePercentage).dividedBy(100);

    // https://swellenergy.atlassian.net/browse/WAV-1152
    const total = new BigNumber(subtotalWithSalesOriginationManagerFee)
      .plus(salesOriginationSalesFee.total)
      .multipliedBy(dealerFee)
      .dividedBy(1 - dealerFee.toNumber());

    const amount = roundNumber(total.toNumber(), 2);

    return {
      unitPercentage: dealerFeePercentage,
      total: amount,
      cogsAllocation: 100,
      marginAllocation: 0,
      cogsAmount: amount,
      marginAmount: 0,
    };
  }

  private calculateAddidionalFees(
    salesOriginationSalesFee: IBaseCostBuildupFee,
    thirdPartyFinancingDealerFee: IBaseCostBuildupFee,
  ): IAdditionalFees {
    return {
      total: new BigNumber(salesOriginationSalesFee.total).plus(thirdPartyFinancingDealerFee.total).toNumber(),
      cogsAmount: new BigNumber(salesOriginationSalesFee.cogsAmount)
        .plus(thirdPartyFinancingDealerFee.cogsAmount)
        .toNumber(),
      marginAmount: new BigNumber(salesOriginationSalesFee.cogsAmount)
        .plus(thirdPartyFinancingDealerFee.cogsAmount)
        .toNumber(),
    };
  }

  private calculateProjectGrandTotal(
    subtotalWithSalesOriginationManagerFee: IBaseQuoteMarginData,
    additionalFees: IAdditionalFees,
  ): IBaseQuoteMarginData {
    const grandTotalNetCost = new BigNumber(additionalFees.total).plus(subtotalWithSalesOriginationManagerFee.netCost);

    const grandTotalCost = new BigNumber(subtotalWithSalesOriginationManagerFee.cost).plus(additionalFees.cogsAmount);

    const grandTotalNetMargin = new BigNumber(grandTotalNetCost).minus(grandTotalCost);

    const grandTotalMarginPercentage = grandTotalNetMargin.dividedBy(grandTotalNetCost).multipliedBy(100);

    return {
      cost: grandTotalCost.toNumber(),
      marginPercentage: grandTotalMarginPercentage.toNumber(),
      netMargin: grandTotalNetMargin.toNumber(),
      netCost: grandTotalNetCost.toNumber(),
    };
  }

  private calculateTaxableEquipmentSubtotal(
    moduleCosts: IQuoteCost<PRODUCT_TYPE.MODULE>[],
    storageCosts: IQuoteCost<PRODUCT_TYPE.BATTERY>[],
    inverterCosts: IQuoteCost<PRODUCT_TYPE.INVERTER>[],
    ancillaryCosts: IQuoteCost<PRODUCT_TYPE.ANCILLARY_EQUIPMENT>[],
  ): IBaseQuoteCost {
    let netCost = new BigNumber(0);
    let markupAmount = new BigNumber(0);

    moduleCosts.forEach(moduleCost => {
      netCost = netCost.plus(moduleCost.netCost);
      markupAmount = markupAmount.plus(moduleCost.markupAmount);
    });

    storageCosts.forEach(storageCost => {
      netCost = netCost.plus(storageCost.netCost);
      markupAmount = markupAmount.plus(storageCost.markupAmount);
    });

    inverterCosts.forEach(inverterCost => {
      netCost = netCost.plus(inverterCost.netCost);
      markupAmount = markupAmount.plus(inverterCost.markupAmount);
    });

    ancillaryCosts.forEach(ancillaryCost => {
      netCost = netCost.plus(ancillaryCost.netCost);
      markupAmount = markupAmount.plus(ancillaryCost.markupAmount);
    });

    const cost = netCost.minus(markupAmount);

    const markupPercentage = markupAmount.dividedBy(cost).multipliedBy(100);

    return {
      cost: cost.toNumber(),
      markupAmount: markupAmount.toNumber(),
      markupPercentage: markupPercentage.toNumber(),
      netCost: netCost.toNumber(),
    };
  }

  private calculateSalesTax(taxableEquipmentSubtotal: IBaseQuoteCost, taxRate = 9): ISalesTaxData {
    const salesTax = new BigNumber(taxableEquipmentSubtotal.netCost).times(taxRate).div(100);

    return {
      taxAmount: roundNumber(salesTax.toNumber(), 2),
      taxRate,
    };
  }

  private calculateEquipmentSubTotalWithSalesTax(
    taxableEquipmentSubtotal: IBaseQuoteCost,
    salesTaxData: ISalesTaxData,
  ): IBaseQuoteCost {
    const netCost = new BigNumber(taxableEquipmentSubtotal.netCost).plus(salesTaxData.taxAmount);
    const cost = new BigNumber(taxableEquipmentSubtotal.cost).plus(salesTaxData.taxAmount);

    const markupPercentage = new BigNumber(taxableEquipmentSubtotal.markupAmount).dividedBy(cost).multipliedBy(100);

    return {
      cost: cost.toNumber(),
      markupAmount: taxableEquipmentSubtotal.markupAmount,
      markupPercentage: markupPercentage.toNumber(),
      netCost: netCost.toNumber(),
    };
  }

  public create({
    roofTopDesignData,
    partnerMarkup,
    userInputs,
    dealerFeePercentage = 0,
    discountsPromotionsAndIncentives = {},
  }: ICreateQuoteCostBuildupParams): IQuoteCostBuildup {
    const { discounts, promotions, incentives } = discountsPromotionsAndIncentives;

    const adderQuoteDetails = this.calculateAddersQuoteCost(roofTopDesignData.adders, partnerMarkup.adderMarkup);

    const ancillaryEquipmentDetails = this.calculateAncillaryEquipmentsQuoteCost(
      roofTopDesignData.ancillaryEquipments,
      partnerMarkup.ancillaryEquipmentMarkup,
    );

    const balanceOfSystemDetails = this.calculateBalanceOfSystemsQuoteCost(
      roofTopDesignData.balanceOfSystems,
      partnerMarkup.bosMarkup,
    );

    const inverterQuoteDetails = this.calculateInvertersQuoteCost(
      roofTopDesignData.inverters,
      partnerMarkup.inverterMarkup,
    );

    const panelQuoteDetails = this.calculatePanelsQuoteCost(roofTopDesignData.panelArray, partnerMarkup.solarMarkup);

    const storageQuoteDetails = this.calculateStoragesQuoteCost(roofTopDesignData.storage, partnerMarkup.storageMarkup);

    const softCostQuoteDetails = this.calculateSoftCosts(roofTopDesignData.softCosts, partnerMarkup.softCostMarkup);

    const laborCostQuoteDetails = this.calculateLaborsCost(roofTopDesignData.laborCosts, partnerMarkup.laborMarkup);

    const generalMarkup = partnerMarkup.generalMarkup;

    const taxableEquipmentSubtotal = this.calculateTaxableEquipmentSubtotal(
      panelQuoteDetails,
      storageQuoteDetails,
      inverterQuoteDetails,
      ancillaryEquipmentDetails,
    );

    const salesTax = this.calculateSalesTax(taxableEquipmentSubtotal);

    const equipmentSubtotalWithSalesTax = this.calculateEquipmentSubTotalWithSalesTax(
      taxableEquipmentSubtotal,
      salesTax,
    );

    const equipmentSubtotal = this.sumQuoteCosts(
      [equipmentSubtotalWithSalesTax],
      balanceOfSystemDetails,
      softCostQuoteDetails,
    );

    const equipmentAndLaborSubtotal = this.sumQuoteCosts([equipmentSubtotal], laborCostQuoteDetails);

    const equipmentLaborAndAddersSubtotal = this.sumQuoteCosts([equipmentAndLaborSubtotal], adderQuoteDetails);

    const projectGrossTotal = this.sumQuoteCosts([
      equipmentLaborAndAddersSubtotal,
      {
        cost: 0,
        markupPercentage: 0,
        netCost: 0,
        markupAmount: roundNumber(
          new BigNumber(generalMarkup ?? 0).dividedBy(100).times(equipmentLaborAndAddersSubtotal.netCost).toNumber(),
          2,
        ),
      },
    ]);

    const totalPromotionsDiscountsAndSwellGridrewards = this.calculateTotalPromotionsDiscountsAndSwellGridrewards(
      projectGrossTotal.netCost,
      discounts,
      promotions,
      incentives,
    );

    const projectSubtotalWithDiscountsPromotionsAndSwellGridrewards = this.calculateProjectSubtotalWithDiscountsPromotionsAndSwellGridrewards(
      projectGrossTotal,
      totalPromotionsDiscountsAndSwellGridrewards,
    );

    const salesOriginationManagerFee = this.calculateCostBuildupFee(
      projectSubtotalWithDiscountsPromotionsAndSwellGridrewards.netCost,
      partnerMarkup.salesOriginationManagerFee,
    );

    const subtotalWithSalesOriginationManagerFee = this.calculateSubtotalWithSalesOriginationManagerFee(
      projectGrossTotal,
      projectSubtotalWithDiscountsPromotionsAndSwellGridrewards,
      salesOriginationManagerFee,
    );

    const salesOriginationSalesFeeInputType = userInputs?.salesOriginationSalesFee?.inputType;
    // const total = ;
    // const amount = roundNumber(total.toNumber(), 2);

    const salesOriginationSalesFee: ISalesOriginationSalesFee = partnerMarkup.useFixedSalesOriginationSalesFee
      ? this.calculateCostBuildupFee(
          subtotalWithSalesOriginationManagerFee.netCost,
          partnerMarkup.salesOriginationSalesFee,
        )
      : {
          total:
            salesOriginationSalesFeeInputType === SALES_ORIGINATION_SALES_FEE_INPUT_TYPE.TOTAL
              ? roundNumber(userInputs?.salesOriginationSalesFee?.total || 0, 2)
              : roundNumber(
                  new BigNumber(subtotalWithSalesOriginationManagerFee.netCost)
                    .multipliedBy(userInputs?.salesOriginationSalesFee?.unitPercentage || 0)
                    .dividedBy(100)
                    .toNumber(),
                  2,
                ),
          unitPercentage:
            !salesOriginationSalesFeeInputType ||
            salesOriginationSalesFeeInputType === SALES_ORIGINATION_SALES_FEE_INPUT_TYPE.PERCENTAGE
              ? roundNumber(userInputs?.salesOriginationSalesFee?.unitPercentage || 0, 2)
              : roundNumber(
                  new BigNumber(userInputs?.salesOriginationSalesFee?.total || 0)
                    .dividedBy(subtotalWithSalesOriginationManagerFee.netCost)
                    .multipliedBy(100)
                    .toNumber(),
                  2,
                ),
          cogsAllocation: 0,
          marginAllocation: 100,
          cogsAmount: 0,
          marginAmount: roundNumber(userInputs?.salesOriginationSalesFee?.total || 0, 2),
          inputType: salesOriginationSalesFeeInputType,
        };

    const thirdPartyFinancingDealerFee = this.calculateThirdPartyFinancingDealerFee(
      subtotalWithSalesOriginationManagerFee.netCost,
      salesOriginationSalesFee,
      dealerFeePercentage,
    );

    const additionalFees = this.calculateAddidionalFees(salesOriginationSalesFee, thirdPartyFinancingDealerFee);

    const projectGrandTotal = this.calculateProjectGrandTotal(subtotalWithSalesOriginationManagerFee, additionalFees);

    return {
      adderQuoteDetails,
      ancillaryEquipmentDetails,
      balanceOfSystemDetails,
      inverterQuoteDetails,
      laborCostQuoteDetails,
      panelQuoteDetails,
      softCostQuoteDetails,
      storageQuoteDetails,
      generalMarkup,
      equipmentSubtotal,
      equipmentAndLaborSubtotal,
      equipmentLaborAndAddersSubtotal,
      projectGrossTotal,
      totalPromotionsDiscountsAndSwellGridrewards,
      projectSubtotalWithDiscountsPromotionsAndSwellGridrewards,
      salesOriginationManagerFee,
      subtotalWithSalesOriginationManagerFee,
      salesOriginationSalesFee,
      thirdPartyFinancingDealerFee,
      cashDiscount: null,
      additionalFees,
      projectGrandTotal,
      taxableEquipmentSubtotal,
      equipmentSubtotalWithSalesTax,
      salesTax,
    };
  }
}
