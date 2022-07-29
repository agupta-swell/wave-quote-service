import { Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, LeanDocument, Model, ObjectId } from 'mongoose';
import { OperationResult } from 'src/app/common';
import { strictPlainToClass } from 'src/shared/transform/strict-plain-to-class';
import { EXISTING_SYSTEM_COLL } from './constants';
import { ExistingSystemDocument, UpdateExistingSystem } from './interfaces';
import { ICreateExistingSystem } from './interfaces/create-existing-system.interface';
import { ExistingSystemResDto } from './res/existing-system.res.dto';

export class ExistingSystemService implements OnModuleInit {
  private readonly logger = new Logger(ExistingSystemService.name);

  constructor(
    @InjectModel(EXISTING_SYSTEM_COLL)
    private readonly existingSystemModel: Model<ExistingSystemDocument>,
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

  async createValidatedBody(body: ICreateExistingSystem): Promise<OperationResult<ExistingSystemResDto>> {
    const model = new this.existingSystemModel(body);

    await model.save();

    return OperationResult.ok(strictPlainToClass(ExistingSystemResDto, model.toJSON()));
  }

  async updateValidatedBody(id: ObjectId, body: UpdateExistingSystem) {
    const found = await this.findOrFail(id);

    this.patchExistingSystem(found, body);

    await found.save();

    return OperationResult.ok(strictPlainToClass(ExistingSystemResDto, found.toJSON()));
  }

  async deleteOne(id: ObjectId): Promise<void> {
    const found = await this.findOrFail(id);

    await found.remove();
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
}
