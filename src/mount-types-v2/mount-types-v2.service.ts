import { InjectModel } from '@nestjs/mongoose';
import { LeanDocument, Model } from 'mongoose';
import { OperationResult } from 'src/app/common';
import { strictPlainToClass } from 'src/shared/transform/strict-plain-to-class';
import { MountTypesDocument, MOUNT_TYPE } from './mount-types-v2.schema';
import { MountTypesDto } from './res/mount-types-v2.dto';

export class MountTypesService {
  constructor(@InjectModel(MOUNT_TYPE) private mountTypesModel: Model<MountTypesDocument>) {}

  async getAllMountTypes(): Promise<OperationResult<MountTypesDto[]>> {
    const res = await this.findAllMountTypes();
    return OperationResult.ok(strictPlainToClass(MountTypesDto, res));
  }

  async findAllMountTypes(): Promise<LeanDocument<MountTypesDocument>[]> {
    const res = await this.mountTypesModel.find().lean();
    return res;
  }

  async getDetails(id: string): Promise<LeanDocument<MountTypesDocument> | null> {
    const res = await this.mountTypesModel.findById(id);
    return res;
  }
}
