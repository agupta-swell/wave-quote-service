import { UtilityProgramDto } from './res/utility-program.dto';
import { OperationResult, Pagination } from './../app/common';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UtilityProgram, UTILITY_PROGRAM } from './utility-program.schema';

@Injectable()
export class UtilityProgramService {
  constructor(@InjectModel(UTILITY_PROGRAM) private utilityProgram: Model<UtilityProgram>) {}

  async getList(): Promise<OperationResult<Pagination<UtilityProgramDto>>> {
    const [utilityPrograms, total] = await Promise.all([
      this.utilityProgram.find(),
      this.utilityProgram.estimatedDocumentCount(),
    ]);
    return OperationResult.ok({ data: utilityPrograms.map(item => new UtilityProgramDto(item)), total });
  }

  async createDataFeed() {
    const data = ['ACES', 'ACES+SGIP', 'none', 'PRP2', 'PRP2+SGIP', 'SGIP'];
    await Promise.all(data.map(item => new this.utilityProgram({ name: item }).save()));
  }

  // ->>>>>>>>> INTERNAL <<<<<<<<<<-

  async getDetail(id: string) {
    const product = await this.utilityProgram.findById(id);
    return product;
  }

  async getFirst() {
    const [product] = await this.utilityProgram.find();
    return product;
  }
}
