import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ApplicationException } from 'src/app/app.exception';
import { OperationResult, Pagination } from 'src/app/common';
import { ProductService } from 'src/products/product.service';
import { UtilityProgramMasterService } from 'src/utility-programs-master/utility-program-master.service';
import { GsPrograms, GS_PROGRAMS } from './gs-programs.schema';
import { GsProgramsDto } from './res/gs-programs.dto';

@Injectable()
export class GsProgramsService {
  constructor(
    @InjectModel(GS_PROGRAMS) private gsProgramsModel: Model<GsPrograms>,
    private readonly utilityProgramMasterService: UtilityProgramMasterService,
    private readonly productService: ProductService,
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

    const batteryIdList = gsPrograms.reduce((a: any, c: any) => {
      if (c.batteryId && !a.some(value => value === c.batteryId)) {
        return [...a, c.batteryId];
      }
      return a;
    }, []);
    const battery = await this.productService.getDetailByIdList(batteryIdList);
    // if (!battery) {
    //   throw ApplicationException.EntityNotFound(`UtilityProgramId: ${utilityProgramMasterId}`);
    // }

    return OperationResult.ok(
      new Pagination({
        data: gsPrograms.map(gsProgram => new GsProgramsDto(gsProgram, utilityProgram, battery)),
        total,
      }),
    );
  }
}
