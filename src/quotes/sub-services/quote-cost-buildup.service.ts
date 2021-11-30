/* eslint-disable no-return-assign */
import { Injectable } from '@nestjs/common';
import { BigNumber } from 'bignumber.js';
import { LeanDocument } from 'mongoose';
import { PRODUCT_TYPE } from 'src/products-v2/constants';
import { QuotePartnerConfig } from 'src/quote-partner-configs/quote-partner-config.schema';
import { ICalculateCostResult, IQuoteCost, IQuoteCostBuildup, ICreateQuoteCostBuildUpArg } from '../interfaces';

@Injectable()
export class QuoteCostBuildUpService {
  private calculateCost(pricePerUnit: number, quantiy: number, markupPercentage: number): ICalculateCostResult {
    const price = new BigNumber(pricePerUnit);

    const total = price.multipliedBy(quantiy);

    const markup = new BigNumber(markupPercentage);

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
        softCostModelDataSnapshot: softCost.softCostDataSnapshot,
        softCostModelSnapshotDate: softCost.softCostSnapshotDate,
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
        laborCostModelDataSnapshot: labor.laborCostDataSnapshot,
        laborCostModelSnapshotDate: labor.laborCostSnapshotDate,
      };
    });
  }

  public create(
    rooftopData: ICreateQuoteCostBuildUpArg,
    partnerMarkup: LeanDocument<QuotePartnerConfig>,
  ): IQuoteCostBuildup {
    const adderQuoteDetails = this.calculateAddersQuoteCost(rooftopData.adders, partnerMarkup.adderMarkup);

    const ancillaryEquipmentDetails = this.calculateAncillaryEquipmentsQuoteCost(rooftopData.ancillaryEquipments, 0);

    const balanceOfSystemDetails = this.calculateBalanceOfSystemsQuoteCost(rooftopData.balanceOfSystems, 0);

    const inverterQuoteDetails = this.calculateInvertersQuoteCost(rooftopData.inverters, 0);

    const panelQuoteDetails = this.calculatePanelsQuoteCost(rooftopData.panelArray, 0);

    const storageQuoteDetails = this.calculateStoragesQuoteCost(rooftopData.storage, 0);

    const softCostQuoteDetails = this.calculateSoftCosts(rooftopData.softCosts, partnerMarkup.softCostMarkup);

    const laborCostQuoteDetails = this.calculateLaborsCost([], 0);

    const swellStandardMarkup = partnerMarkup.swellStandardMarkup;

    const totalProductCost = new BigNumber(0);

    adderQuoteDetails.forEach(adder => totalProductCost.plus(adder.cost));

    ancillaryEquipmentDetails.forEach(ancillaryEquipment => totalProductCost.plus(ancillaryEquipment.cost));

    balanceOfSystemDetails.forEach(balanceOfSystem => totalProductCost.plus(balanceOfSystem.cost));

    inverterQuoteDetails.forEach(inverter => totalProductCost.plus(inverter.cost));

    panelQuoteDetails.forEach(panel => totalProductCost.plus(panel.cost));

    storageQuoteDetails.forEach(storage => totalProductCost.plus(storage.cost));

    laborCostQuoteDetails.forEach(labor => totalProductCost.plus(labor.cost));

    softCostQuoteDetails.forEach(softCost => totalProductCost.plus(softCost.cost));

    const grossPrice = new BigNumber(swellStandardMarkup).plus(1).times(totalProductCost);

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
      totalProductCost: totalProductCost.toNumber(),
    };
  }
}
