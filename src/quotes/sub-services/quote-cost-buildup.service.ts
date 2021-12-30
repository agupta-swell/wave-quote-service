/* eslint-disable no-return-assign */
import { Injectable } from '@nestjs/common';
import { BigNumber } from 'bignumber.js';
import { LeanDocument } from 'mongoose';
import { FinancialProduct } from 'src/financial-products/financial-product.schema';
import { PRODUCT_TYPE } from 'src/products-v2/constants';
import { FINANCE_PRODUCT_TYPE } from '../constants';
import {
  ICalculateCostResult,
  IQuoteCost,
  IQuoteCostBuildup,
  ICreateQuoteCostBuildUpArg,
  IProjectSubtotalWithDiscountsPromotionsAndSwellGridrewards,
  ICreateQuoteCostBuildupParams,
} from '../interfaces';
import { IBaseCostBuildupFee, ICashDiscount } from '../interfaces/quote-cost-buildup/ICostBuildupFee';
import { ITotalPromotionsDiscountsAndSwellGridrewards } from '../interfaces/quote-cost-buildup/ITotalPromotionsDiscountsGridrewards';

@Injectable()
export class QuoteCostBuildUpService {
  private calculateCost(pricePerUnit: number, quantity: number, markupPercentage: number): ICalculateCostResult {
    const price = new BigNumber(pricePerUnit ?? 0);

    const total = price.multipliedBy(quantity);

    const markup = new BigNumber(markupPercentage ?? 0);

    const markupAmount = total.multipliedBy(markup.dividedBy(100));

    const totalWithMarkup = total.plus(markupAmount);

    return {
      markupAmount: markupAmount.toNumber(),
      total: total.toNumber(),
      totalWithMarkup: totalWithMarkup.toNumber(),
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
    projectGrossTotal: IQuoteCost<unknown>,
    totalAmountReduction = 0,
    totalPercentageReduction = 0,
  ): ITotalPromotionsDiscountsAndSwellGridrewards {
    const total = new BigNumber(totalAmountReduction).plus(
      new BigNumber(totalPercentageReduction).multipliedBy(projectGrossTotal.netCost).dividedBy(100),
    );
    return {
      total: total.toNumber(),
    };
  }

  public calculateProjectSubtotalWithDiscountsPromotionsAndSwellGridrewards(
    projectGrossTotal: IQuoteCost<unknown>,
    totalPromotionsDiscountsAndSwellGridrewards: ITotalPromotionsDiscountsAndSwellGridrewards,
  ): IProjectSubtotalWithDiscountsPromotionsAndSwellGridrewards {
    const netMargin = new BigNumber(projectGrossTotal.markupAmount).minus(
      totalPromotionsDiscountsAndSwellGridrewards.total,
    );

    const marginPercentage =
      projectGrossTotal.cost === 0 ? new BigNumber(0) : netMargin.dividedBy(projectGrossTotal.cost).multipliedBy(100);

    const netCost = netMargin.plus(projectGrossTotal.cost);

    return {
      cost: projectGrossTotal.cost,
      marginPercentage: marginPercentage.toNumber(),
      netCost: netCost.toNumber(),
      netMargin: netMargin.toNumber(),
    };
  }

  public calculateCostBuildupFee(previousSubTotal: number, unitPercentage = 0): IBaseCostBuildupFee {
    const total = new BigNumber(previousSubTotal).multipliedBy(unitPercentage).dividedBy(100);

    return {
      unitPercentage,
      total: total.toNumber(),
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

    return {
      unitPercentage: dealerFeePercentage,
      total: total.toNumber(),
    };
  }

  public calculateCashDiscount(
    thirdPartyFinancingDealerFee: IBaseCostBuildupFee,
    subtotalWithSalesOriginationManagerFee: number,
    salesOriginationSalesFee: IBaseCostBuildupFee,
    financialProduct: LeanDocument<FinancialProduct>,
    fundingSourceType: FINANCE_PRODUCT_TYPE,
  ): ICashDiscount {
    if (fundingSourceType !== FINANCE_PRODUCT_TYPE.CASH) {
      return {
        name: '',
        unitPercentage: 0,
        total: 0,
      };
    }

    const processingFee = new BigNumber(financialProduct.processingFee || 0).dividedBy(100);

    // https://swellenergy.atlassian.net/browse/WAV-1152
    const total = new BigNumber(thirdPartyFinancingDealerFee.total).minus(
      new BigNumber(subtotalWithSalesOriginationManagerFee)
        .plus(salesOriginationSalesFee.total)
        .multipliedBy(processingFee),
    );

    return {
      name: `${financialProduct.name} Discount (${financialProduct.processingFee || 0}% effective fee)`,
      unitPercentage: financialProduct.processingFee || 0,
      total: total.toNumber(),
    };
  }

  public create({
    roofTopDesignData,
    partnerMarkup,
    userInputs,
    dealerFeePercentage = 0,
    financialProduct,
    fundingSourceType,
  }: ICreateQuoteCostBuildupParams): IQuoteCostBuildup {
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

    let totalProductCost = new BigNumber(0);

    adderQuoteDetails.forEach(adder => {
      totalProductCost = totalProductCost.plus(adder.cost);
    });

    ancillaryEquipmentDetails.forEach(ancillaryEquipment => {
      totalProductCost = totalProductCost.plus(ancillaryEquipment.cost);
    });

    balanceOfSystemDetails.forEach(balanceOfSystem => {
      totalProductCost = totalProductCost.plus(balanceOfSystem.cost);
    });

    inverterQuoteDetails.forEach(inverter => {
      totalProductCost = totalProductCost.plus(inverter.cost);
    });

    panelQuoteDetails.forEach(panel => {
      totalProductCost = totalProductCost.plus(panel.cost);
    });

    storageQuoteDetails.forEach(storage => {
      totalProductCost = totalProductCost.plus(storage.cost);
    });

    laborCostQuoteDetails.forEach(labor => {
      totalProductCost = totalProductCost.plus(labor.cost);
    });

    softCostQuoteDetails.forEach(softCost => {
      totalProductCost = totalProductCost.plus(softCost.cost);
    });

    const equipmentSubtotal = this.sumQuoteCosts(
      panelQuoteDetails,
      storageQuoteDetails,
      inverterQuoteDetails,
      ancillaryEquipmentDetails,
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
        markupAmount: new BigNumber(generalMarkup ?? 0)
          .dividedBy(100)
          .times(equipmentLaborAndAddersSubtotal.netCost)
          .toNumber(),
      },
    ]);

    const totalPromotionsDiscountsAndSwellGridrewards = this.calculateTotalPromotionsDiscountsAndSwellGridrewards(
      projectGrossTotal,
      userInputs?.totalAmountReduction,
      userInputs?.totalPercentageReduction,
    );

    const projectSubtotalWithDiscountsPromotionsAndSwellGridrewards = this.calculateProjectSubtotalWithDiscountsPromotionsAndSwellGridrewards(
      projectGrossTotal,
      totalPromotionsDiscountsAndSwellGridrewards,
    );

    const salesOriginationManagerFee = this.calculateCostBuildupFee(
      projectSubtotalWithDiscountsPromotionsAndSwellGridrewards.netCost,
      partnerMarkup.salesOriginationManagerFee,
    );

    const subtotalWithSalesOriginationManagerFee = new BigNumber(
      projectSubtotalWithDiscountsPromotionsAndSwellGridrewards.netCost,
    )
      .plus(salesOriginationManagerFee.total)
      .toNumber();

    const salesOriginationSalesFee = partnerMarkup.useFixedSalesOriginationSalesFee
      ? this.calculateCostBuildupFee(subtotalWithSalesOriginationManagerFee, partnerMarkup.salesOriginationSalesFee)
      : {
          total: userInputs?.salesOriginationSalesFee?.total || 0,
          unitPercentage: userInputs?.salesOriginationSalesFee?.unitPercentage || 0,
        };

    const thirdPartyFinancingDealerFee = this.calculateThirdPartyFinancingDealerFee(
      subtotalWithSalesOriginationManagerFee,
      salesOriginationSalesFee,
      dealerFeePercentage,
    );

    const cashDiscount = this.calculateCashDiscount(
      thirdPartyFinancingDealerFee,
      subtotalWithSalesOriginationManagerFee,
      salesOriginationSalesFee,
      financialProduct,
      fundingSourceType,
    );

    const additionalFees = {
      total: salesOriginationSalesFee.total + thirdPartyFinancingDealerFee.total - cashDiscount.total,
    };

    // TODO: waiting for COGS
    const grandTotalNetCost = new BigNumber(additionalFees.total)
      .plus(subtotalWithSalesOriginationManagerFee)
      .toNumber();

    const grandTotalNetMargin = new BigNumber(grandTotalNetCost)
      .minus(projectSubtotalWithDiscountsPromotionsAndSwellGridrewards.cost)
      .toNumber();

    const grandTotalMarginPercentage = new BigNumber(grandTotalNetMargin)
      .dividedBy(projectSubtotalWithDiscountsPromotionsAndSwellGridrewards.cost)
      .multipliedBy(100)
      .toNumber();

    const projectGrandTotal = {
      cost: projectSubtotalWithDiscountsPromotionsAndSwellGridrewards.cost,
      marginPercentage: grandTotalMarginPercentage,
      netMargin: grandTotalNetMargin,
      netCost: grandTotalNetCost,
    };

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
      cashDiscount,
      additionalFees,
      projectGrandTotal,
    };
  }
}
