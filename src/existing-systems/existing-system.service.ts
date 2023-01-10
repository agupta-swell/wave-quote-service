import { forwardRef, Inject, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, LeanDocument, Model, ObjectId } from 'mongoose';
import { OperationResult } from 'src/app/common';
import { ContactService } from 'src/contacts/contact.service';
import { OpportunityService } from 'src/opportunities/opportunity.service';
import { strictPlainToClass } from 'src/shared/transform/strict-plain-to-class';
import { SystemProductService } from 'src/system-designs/sub-services';
import { UtilityService } from 'src/utilities/utility.service';
import { EXISTING_SYSTEM_COLL } from './constants';
import { ExistingSystemDocument, IExistingSystem, UpdateExistingSystem } from './interfaces';
import { ICreateExistingSystem } from './interfaces/create-existing-system.interface';
import { ExistingSystemResDto } from './res/existing-system.res.dto';

export class ExistingSystemService implements OnModuleInit {
  private readonly logger = new Logger(ExistingSystemService.name);

  constructor(
    @InjectModel(EXISTING_SYSTEM_COLL)
    private readonly existingSystemModel: Model<ExistingSystemDocument>,
    @Inject(forwardRef(() => OpportunityService))
    private readonly opportunityService: OpportunityService,
    @Inject(forwardRef(() => ContactService))
    private readonly contactService: ContactService,
    private readonly systemProductService: SystemProductService,
    @Inject(forwardRef(() => UtilityService))
    private readonly utilityService: UtilityService,
  ) {}

  async onModuleInit() {
    try {
      this.logger.log('Ensure pv_watt index');
      await this.ensureOpportunityIndex();
      this.logger.log('Done ensure pv_watt index');
    } catch (err) {
      this.logger.error(err);
    }
  }

  async getAll(
    query: FilterQuery<ExistingSystemDocument>,
    skip?: number,
    limit?: number,
  ): Promise<LeanDocument<ExistingSystemDocument>[]> {
    const builder = this.existingSystemModel.find(query);

    if (typeof skip === 'number') builder.skip(skip);

    if (typeof limit === 'number') builder.limit(limit);

    const res = await builder.lean();

    return res;
  }

  async getAllAndCount(
    query: FilterQuery<ExistingSystemDocument>,
    skip?: number,
    limit?: number,
  ): Promise<[LeanDocument<ExistingSystemDocument>[], number]> {
    const [res, count] = await Promise.all([
      this.getAll(query, skip, limit),
      this.existingSystemModel.countDocuments(query),
    ]);

    return [res, count];
  }

  async findOrFail(id: ObjectId | string): Promise<ExistingSystemDocument>;

  async findOrFail(id: ObjectId | string, lean: true): Promise<LeanDocument<ExistingSystemDocument>>;

  async findOrFail(id: ObjectId | string, lean?: boolean): Promise<unknown> {
    const builder = this.existingSystemModel.findById(id);

    if (lean) builder.lean();

    const found = await builder.exec();

    if (!found) {
      throw new NotFoundException(`No existing system found with id: ${id.toString()}`);
    }

    return found;
  }

  async getOne(id: ObjectId): Promise<OperationResult<ExistingSystemResDto>> {
    const found = await this.findOrFail(id, true);

    return OperationResult.ok(strictPlainToClass(ExistingSystemResDto, found));
  }

  async updateUtilitiesOnExistingSystemsChange(opportunityId: string) {
    const utilities = await this.utilityService.getUtilityByOpportunityId(opportunityId);

    if (!utilities) {
      return;
    }

    const existingSystemProduction = await this.utilityService.getExistingSystemProductionByOpportunityId(
      opportunityId,
      true,
    );

    const { utilityData, costData } = utilities;
    const { typicalBaselineUsage } = utilityData;

    const computedUsage = {
      ...utilityData.computedUsage,
      monthlyUsage: typicalBaselineUsage.typicalMonthlyUsage.map(({ i, v }, idx) => ({
        i,
        v: v - (existingSystemProduction?.monthlyProduction[idx]?.v || 0),
      })),
      annualConsumption: typicalBaselineUsage.annualConsumption - (existingSystemProduction?.annualProduction || 0),
    };

    const { monthlyUsage, annualConsumption } = computedUsage;

    const newUtilityData = {
      ...utilityData,
      computedUsage: { monthlyUsage, annualConsumption },
    };

    const posData = {
      utilityData: newUtilityData,
      zipCode: typicalBaselineUsage.zipCode,
      masterTariffId: costData.masterTariffId,
      usageProfileId: utilities.usageProfileId,
    };

    const actualUsageCost = await this.utilityService.calculateActualUsageCostUtil(posData);

    const newCostData = {
      ...costData,
      computedCost: actualUsageCost.computedCost,
    };

    newUtilityData.computedUsage = computedUsage;

    const updateData = {
      ...utilities,
      costData: newCostData,
      utilityData: newUtilityData,
    };

    await this.utilityService.updateUtilityUsageDetailUtil(utilities._id, updateData);
  }

  async createValidatedBody(body: ICreateExistingSystem): Promise<OperationResult<ExistingSystemResDto>> {
    const model = new this.existingSystemModel(body);

    await model.save();

    return OperationResult.ok(strictPlainToClass(ExistingSystemResDto, model.toJSON()));
  }

  async updateValidatedBody(id: ObjectId, body: UpdateExistingSystem) {
    const found = await this.findOrFail(id);

    this.patchExistingSystem(found, body);

    await found.save();

    // call after updated Existing System is saved, so utilityService.getExistingSystemProductionByOpportunityId called in this function will get exactly existingSystemProduction
    await this.updateUtilitiesOnExistingSystemsChange(found.opportunityId);

    return OperationResult.ok(strictPlainToClass(ExistingSystemResDto, found.toJSON()));
  }

  async deleteOne(id: ObjectId): Promise<void> {
    const found = await this.findOrFail(id);

    await found.remove();

    // call after Existing System is removed, so utilityService.getExistingSystemProductionByOpportunityId called in this function will get exactly existingSystemProduction
    await this.updateUtilitiesOnExistingSystemsChange(found.opportunityId);
  }

  private ensureOpportunityIndex() {
    return this.existingSystemModel.collection.createIndex({ opportunity_id: 1 });
  }

  private patchExistingSystem(existingSystem: ExistingSystemDocument, body: UpdateExistingSystem) {
    const { array, storages, ...p } = body;

    existingSystem.array = <any>array;

    existingSystem.storages = <any>storages;

    Object.entries(p).forEach(([key, value]) => {
      existingSystem[key] = value;
    });
  }

  private async calculatePVWattProductions(existingSystem: IExistingSystem) {
    const { array: arrays, opportunityId } = existingSystem;

    if (!arrays?.length) {
      return;
    }

    const foundOpportunity = await this.opportunityService.getDetailById(opportunityId);

    if (!foundOpportunity) {
      throw new NotFoundException(`No opportunity found with id: ${opportunityId}`);
    }

    const foundContact = await this.contactService.getContactById(foundOpportunity.contactId);

    if (!foundContact) {
      throw new NotFoundException(`No contact found with id: ${foundOpportunity.contactId}`);
    }

    const { lat, lng } = foundContact;

    // Because we cache PVWatt data by lat, lng, and PV Size
    const uniqueExistingArraysByPVSize = [...new Map(arrays.map(array => [array.existingPVSize, array])).values()];

    await Promise.all(
      uniqueExistingArraysByPVSize.map(({ existingPVSize, existingPVAzimuth, existingPVPitch }) =>
        this.systemProductService.calculatePVProduction({
          latitude: lat,
          longitude: lng,
          systemCapacityInkWh: existingPVSize,
          azimuth: existingPVAzimuth ?? 180,
          pitch: existingPVPitch ?? lat,
          losses: 14,
        }),
      ),
    );
  }
}
