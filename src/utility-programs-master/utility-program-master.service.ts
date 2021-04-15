import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { LeanDocument, Model } from 'mongoose';
import { ApplicationException } from 'src/app/app.exception';
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

  async createDataFeed(): Promise<void> {
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

  async getLeanById(id: string): Promise<LeanDocument<UtilityProgramMaster>> {
    const program = await this.utilityProgramMaster.findById(id).lean();

    if (!program) throw ApplicationException.EntityNotFound(`UtilityProgramMasterId: ${id}`);

    return program;
  }

  async getDetailByName(name: string): Promise<LeanDocument<UtilityProgramMaster> | null> {
    const product = await this.utilityProgramMaster.findOne({ utility_program_name: name }).lean();
    return product;
  }

  async getAll(): Promise<LeanDocument<UtilityProgramMaster>[]> {
    const utilityProgramMasters = await this.utilityProgramMaster.find().lean();
    return utilityProgramMasters;
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
