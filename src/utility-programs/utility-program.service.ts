import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UtilityProgram, UTILITY_PROGRAM } from './utility-program.schema';

@Injectable()
export class UtilityProgramService {
  constructor(@InjectModel(UTILITY_PROGRAM) private utilityProgram: Model<UtilityProgram>) {}

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
