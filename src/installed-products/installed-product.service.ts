import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, LeanDocument, Model, ObjectId } from 'mongoose';
import { Contract } from 'src/contracts/contract.schema';
import { ContractResDto } from 'src/contracts/res/sub-dto';
import { QuoteService } from 'src/quotes/quote.service';
import { SystemDesign } from 'src/system-designs/system-design.schema';
import { SystemDesignService } from 'src/system-designs/system-design.service';
import { V2_INSTALLED_PRODUCT_COLL } from './constants';
import { IInstalledProduct, IInstalledProductDocument, IUpdateLatestProductDataPayload } from './interfaces';

@Injectable()
export class InstalledProductService {
  constructor(
    @InjectModel(V2_INSTALLED_PRODUCT_COLL)
    private readonly installedProductModel: Model<IInstalledProductDocument>,
    private readonly quoteService: QuoteService,
    private readonly systemDesignService: SystemDesignService,
  ) {}

  public async findOne(id: string | ObjectId): Promise<IInstalledProductDocument | null> {
    const res = await this.installedProductModel.findById(id);

    return res;
  }

  public async findByQuery(query: FilterQuery<IInstalledProductDocument>): Promise<IInstalledProductDocument[]> {
    const res = await this.installedProductModel.find(query);

    return res;
  }

  public async findOneLean(id: string | ObjectId): Promise<LeanDocument<IInstalledProductDocument> | null> {
    const res = await this.installedProductModel.findById(id).lean();

    return res;
  }

  public async findByQueryLean(
    query: FilterQuery<IInstalledProductDocument>,
  ): Promise<LeanDocument<IInstalledProductDocument>[]> {
    const res = await this.installedProductModel.find(query).lean();

    return res;
  }

  public async findOneOrFail(id: string | ObjectId): Promise<IInstalledProductDocument> {
    const found = await this.findOne(id);

    if (!found) {
      throw new NotFoundException(`No installed products found with id ${id.toString()}`);
    }

    return found;
  }

  public async removeManyByOppId(oppId: string): Promise<void> {
    await this.installedProductModel.deleteMany({ opportunityId: oppId });
  }

  public async updateLatestProductData(
    oppId: string,
    userId: string,
    payload: IUpdateLatestProductDataPayload,
  ): Promise<void> {
    const installedProducts: Partial<IInstalledProduct>[] = [];

    const { ancillaryEquipments, inverters, panelArray, storage } = payload;

    // TODO WAV-333: conflict part_number / part_numbers type

    ancillaryEquipments.forEach(e => {
      installedProducts.push({
        opportunityId: oppId,
        productId: e.ancillaryId,
        quantity: e.quantity,
        createdBy: userId,
        updatedBy: userId,
      });
    });

    inverters.forEach(e => {
      installedProducts.push({
        opportunityId: oppId,
        productId: e.inverterModelId,
        quantity: e.quantity,
        createdBy: userId,
        updatedBy: userId,
      });
    });

    storage.forEach(e => {
      [...Array(e.quantity)].forEach(_ => {
        installedProducts.push({
          opportunityId: oppId,
          productId: e.storageModelId,
          quantity: 1,
          createdBy: userId,
          updatedBy: userId,
        });
      });
    });

    panelArray.forEach((e, idx) => {
      installedProducts.push({
        opportunityId: oppId,
        productId: e.panelModelId,
        quantity: e.numberOfPanels,
        arrayIndex: idx,
        createdBy: userId,
        updatedBy: userId,
      });
    });

    await this.removeManyByOppId(oppId);
    await this.installedProductModel.insertMany(installedProducts as any);
  }

  public async getSystemDesign(
    contract: ContractResDto | LeanDocument<Contract>,
  ): Promise<LeanDocument<SystemDesign> | null> {
    if (contract.systemDesignId) {
      const systemDesign = await this.systemDesignService.getOneById(contract.systemDesignId);

      if (!systemDesign) {
        console.info(
          `Something went wrong, can not find system design ${contract.systemDesignId} in contract ${contract.id}`,
        );

        return null;
      }

      return systemDesign;
    }

    const { id, associatedQuoteId } = contract;

    const quote = await this.quoteService.getOneFullQuoteDataById(associatedQuoteId);

    if (!quote) {
      console.info(`Something went wrong, can not find quote ${associatedQuoteId} in contract ${id}`);
      return null;
    }

    const systemDesign = await this.systemDesignService.getOneById(quote.systemDesignId);

    if (!systemDesign) {
      console.info(
        `Something went wrong, can not find system design ${quote.systemDesignId} in quote ${associatedQuoteId} - contract ${id}`,
      );

      return null;
    }

    return systemDesign;
  }
}
