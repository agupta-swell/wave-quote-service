/* eslint-disable no-return-assign */
import { Injectable } from '@nestjs/common';
import { BigNumber } from 'bignumber.js';
import { LeanDocument } from 'mongoose';
import { PRODUCT_TYPE } from 'src/products-v2/constants';
import { QuotePartnerConfig } from 'src/quote-partner-configs/quote-partner-config.schema';
import {
  ICalculateCostResult,
  IQuoteCost,
  IQuoteCostBuildup,
  ICreateQuoteCostBuildUpArg,
  IProjectSubtotal4,
} from '../interfaces';

@Injectable()
export class QuoteCostBuildUpService {
  private calculateCost(pricePerUnit: number, quantiy: number, markupPercentage: number): ICalculateCostResult {
    const price = new BigNumber(pricePerUnit ?? 0);

    const total = price.multipliedBy(quantiy);

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

  public calculateProjectSubtotal4(
    projectSubtotal3: IQuoteCost<unknown>,
    totalReductionPercentage = 0,
    totalReductionAmount = 0,
  ): IProjectSubtotal4 {
    const netMargin = new BigNumber(projectSubtotal3.markupAmount)
      .minus(totalReductionAmount)
      .minus(new BigNumber(totalReductionPercentage).multipliedBy(projectSubtotal3.cost).dividedBy(100));

    const marginPercentage =
      projectSubtotal3.cost === 0 ? new BigNumber(0) : netMargin.dividedBy(projectSubtotal3.cost).multipliedBy(100);

    const netCost = netMargin.plus(projectSubtotal3.cost);

    return {
      cost: projectSubtotal3.cost,
      marginPercentage: marginPercentage.toNumber(),
      netCost: netCost.toNumber(),
      netMargin: netMargin.toNumber(),
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
      const cost = this.calculateCost(balanceOfSystem.balanceOfSystemModelDataSnapshot.cost, 1, markupPercentage);

      return {
        quantity: 1,
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

  public create(
    rooftopData: ICreateQuoteCostBuildUpArg,
    partnerMarkup: LeanDocument<QuotePartnerConfig>,
  ): IQuoteCostBuildup {
    const adderQuoteDetails = this.calculateAddersQuoteCost(rooftopData.adders, partnerMarkup.adderMarkup);

    const ancillaryEquipmentDetails = this.calculateAncillaryEquipmentsQuoteCost(
      rooftopData.ancillaryEquipments,
      partnerMarkup.ancillaryEquipmentMarkup,
    );

    const balanceOfSystemDetails = this.calculateBalanceOfSystemsQuoteCost(
      rooftopData.balanceOfSystems,
      partnerMarkup.bosMarkup,
    );

    const inverterQuoteDetails = this.calculateInvertersQuoteCost(rooftopData.inverters, partnerMarkup.inverterMarkup);

    const panelQuoteDetails = this.calculatePanelsQuoteCost(rooftopData.panelArray, partnerMarkup.softCostMarkup);

    const storageQuoteDetails = this.calculateStoragesQuoteCost(rooftopData.storage, partnerMarkup.storageMarkup);

    const softCostQuoteDetails = this.calculateSoftCosts(rooftopData.softCosts, partnerMarkup.softCostMarkup);

    const laborCostQuoteDetails = this.calculateLaborsCost(rooftopData.laborCosts, partnerMarkup.laborMarkup);

    const swellStandardMarkup = partnerMarkup.swellStandardMarkup;

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

    const grossPrice = new BigNumber(swellStandardMarkup).plus(1).times(totalProductCost);

    const equipmentSubtotal = this.sumQuoteCosts(
      ancillaryEquipmentDetails,
      balanceOfSystemDetails,
      inverterQuoteDetails,
      panelQuoteDetails,
      storageQuoteDetails,
    );

    const equipmentAndLaborSubtotal = this.sumQuoteCosts([equipmentSubtotal], laborCostQuoteDetails);

    const equipmentAndLaborAndAddersSubtotal = this.sumQuoteCosts([equipmentAndLaborSubtotal], adderQuoteDetails);

    const projectSubtotal3 = this.sumQuoteCosts([
      equipmentAndLaborAndAddersSubtotal,
      {
        cost: 0,
        markupPercentage: 0,
        netCost: 0,
        markupAmount: new BigNumber(swellStandardMarkup ?? 0)
          .times(equipmentAndLaborAndAddersSubtotal.netCost)
          .toNumber(),
      },
    ]);

    const projectSubtotal4 = this.calculateProjectSubtotal4(projectSubtotal3);

    return {
      adderQuoteDetails,
      ancillaryEquipmentDetails,
      balanceOfSystemDetails,
      inverterQuoteDetails,
      laborCostQuoteDetails,
      panelQuoteDetails,
      softCostQuoteDetails,
      storageQuoteDetails,
      swellStandardMarkup,
      grossPrice: grossPrice.toNumber(),
      equipmentSubtotal,
      equipmentAndLaborSubtotal,
      equipmentAndLaborAndAddersSubtotal,
      projectSubtotal3,
      projectSubtotal4,
    };
  }
}
