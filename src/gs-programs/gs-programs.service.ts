import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, LeanDocument } from 'mongoose';
import { ApplicationException } from 'src/app/app.exception';
import { OperationResult, Pagination } from 'src/app/common';
import { ProductService } from 'src/products/product.service';
import { strictPlainToClass } from 'src/shared/transform/strict-plain-to-class';
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

  async getById(id: string): Promise<LeanDocument<GsPrograms> | null> {
    const gsProgram = await this.gsProgramsModel.findOne({ _id: id }).lean();

    return gsProgram;
  }

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
        data: strictPlainToClass(
          GsProgramsDto,
          gsPrograms.map(gsProgram => ({
            ...gsProgram,
            utilityProgram,
            battery,
          })),
        ),
        total,
      }),
    );
  }
}
