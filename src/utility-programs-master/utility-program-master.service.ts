import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { OperationResult, Pagination } from '../app/common';
import { UtilityProgramMasterDto } from './res/utility-program-master.dto';
import { UtilityProgramMaster, UTILITY_PROGRAM_MASTER } from './utility-program-master.schema';

@Injectable()
export class UtilityProgramMasterService {
  constructor(@InjectModel(UTILITY_PROGRAM_MASTER) private utilityProgramMaster: Model<UtilityProgramMaster>) {}

  async getList(): Promise<OperationResult<Pagination<UtilityProgramMasterDto>>> {
    const [utilityPrograms, total] = await Promise.all([
      this.utilityProgramMaster.find(),
      this.utilityProgramMaster.estimatedDocumentCount(),
    ]);

    return OperationResult.ok(
      new Pagination({ data: utilityPrograms.map(item => new UtilityProgramMasterDto(item)), total }),
    );
  }

  async createDataFeed() {
    const data = ['ACES', 'ACES+SGIP', 'none', 'PRP2', 'PRP2+SGIP', 'SGIP'];
    await Promise.all(
      data.map(item => new this.utilityProgramMaster({ utility_program_name: item, rebate_amount: 1000 }).save()),
    );
  }

  // ->>>>>>>>> INTERNAL <<<<<<<<<<-

  async getDetailById(id: string): Promise<UtilityProgramMaster | null> {
    const product = await this.utilityProgramMaster.findById(id);
    return product;
  }

  async getDetailByName(name: string): Promise<UtilityProgramMaster | undefined> {
    const product = await this.utilityProgramMaster.findOne({ utility_program_name: name });
    return product?.toObject({ versionKey: false });
  }

  async getAll(): Promise<UtilityProgramMaster[]> {
    const utilityProgramMasters = await this.utilityProgramMaster.find();
    return utilityProgramMasters.length ? utilityProgramMasters.map(item => item.toObject({ versionKey: false })) : [];
  }

  // FIXME: need to delete later
  // async createUtilityProgramsMaster(data: string[]): Promise<boolean> {
  //   const anotherData = compact(uniq(['ACES', 'ACES+SGIP', 'none', 'PRP2', 'PRP2+SGIP', 'SGIP'].concat(data)));
  //   await Promise.all(
  //     anotherData.map(item =>
  //       new this.utilityProgramMaster({ utility_program_name: item, rebate_amount: 1000 }).save(),
  //     ),
  //   );

  //   return true;
  // }
}
