import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ApplicationException } from 'src/app/app.exception';
import { OperationResult, Pagination } from 'src/app/common';
import { UtilityProgramMasterService } from 'src/utility-programs-master/utility-program-master.service';
import { GsPrograms, GS_PROGRAMS } from './gs-programs.schema';
import { GsProgramsDto } from './res/gs-programs.dto';

@Injectable()
export class GsProgramsService {
  constructor(
    @InjectModel(GS_PROGRAMS) private gsProgramsModel: Model<GsPrograms>,
    private readonly utilityProgramMasterService: UtilityProgramMasterService,
  ) {}

  async getList(
    limit: number,
    skip: number,
    utilityProgramMasterId: string,
  ): Promise<OperationResult<Pagination<GsProgramsDto>>> {
    const [gsPrograms, total] = await Promise.all([
      this.gsProgramsModel.find({ utilityProgramId: utilityProgramMasterId }).limit(limit).skip(skip).lean(),
      this.gsProgramsModel.countDocuments({ utilityProgramId: utilityProgramMasterId }).lean(),
    ]);

    const utilityProgram = await this.utilityProgramMasterService.getDetailById(utilityProgramMasterId);
    if (!utilityProgram) {
      throw ApplicationException.EntityNotFound(`UtilityProgramId: ${utilityProgramMasterId}`);
    }

    return OperationResult.ok(
      new Pagination({
        data: gsPrograms.map(gsProgram => new GsProgramsDto(gsProgram, utilityProgram)),
        total,
      }),
    );
  }
}
