import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, LeanDocument, ObjectId } from 'mongoose';
import { OperationResult } from 'src/app/common';
import { strictPlainToClass } from 'src/shared/transform/strict-plain-to-class';
import { USAGE_PROFILE_COLL } from './constants';
import { UsageProfileDocument, IUsageProfileSnapshot } from './interfaces';
import { UsageProfileResDto } from './res';

@Injectable()
export class UsageProfileService {
  constructor(
    @InjectModel(USAGE_PROFILE_COLL)
    private readonly usageProfileModel: Model<UsageProfileDocument>,
  ) {}

  async getAllUsageProfiles(): Promise<OperationResult<UsageProfileResDto[]>> {
    const res = await this.getAll();

    return OperationResult.ok(strictPlainToClass(UsageProfileResDto, res));
  }

  async getAll(): Promise<LeanDocument<UsageProfileDocument>[]> {
    const res = await this.usageProfileModel.find().lean();

    return res;
  }

  async getOne(id: ObjectId | string): Promise<LeanDocument<UsageProfileDocument>> {
    const res = await this.usageProfileModel.findById(id).lean();

    if (!res) {
      throw new NotFoundException(`No usage profile found with id ${id}`);
    }

    return res;
  }

  static Snapshot<T>(
    doc: T,
    usageProfile: UsageProfileDocument | LeanDocument<UsageProfileDocument>,
  ): T & IUsageProfileSnapshot {
    const snapshot: T & IUsageProfileSnapshot = {
      ...doc,
      usageProfileId: usageProfile._id.toString(),
      usageProfileSnapshotDate: new Date(),
      usageProfileSnapshot: usageProfile,
    };

    return snapshot;
  }
}
