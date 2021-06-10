import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { LeanDocument, Model } from 'mongoose';
// import { ApplicationException } from 'src/app/app.exception';
import { OperationResult, Pagination } from '../app/common';
import { RebateProgramDto } from './res/reabate-program.dto';
import { RebateProgram, REBATE_PROGRAM } from './rebate-programs.schema';

@Injectable()
export class RebateProgramService {
  constructor(@InjectModel(REBATE_PROGRAM) private rebateProgram: Model<RebateProgram>) {}

  async getList(): Promise<OperationResult<Pagination<RebateProgramDto>>> {
    const [rebatePrograms, total] = await Promise.all([
      this.rebateProgram.find(),
      this.rebateProgram.estimatedDocumentCount(),
    ]);

    return OperationResult.ok(
      new Pagination({ data: rebatePrograms.map(item => new RebateProgramDto(item)), total }),
    );
  }


}
