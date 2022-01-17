import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, LeanDocument } from 'mongoose';
import { ApplicationException } from 'src/app/app.exception';
import { OperationResult, Pagination } from 'src/app/common';
import { ProductService } from 'src/products-v2/services';
import { strictPlainToClass } from 'src/shared/transform/strict-plain-to-class';
import { UtilityProgramMasterService } from 'src/utility-programs-master/utility-program-master.service';
import { QuoteService } from 'src/quotes/quote.service';
import { SystemDesignService } from 'src/system-designs/system-design.service';
import { GsPrograms, GS_PROGRAMS } from './gs-programs.schema';
import { GsProgramsDto } from './res/gs-programs.dto';

@Injectable()
export class GsProgramsService {
  constructor(
    @InjectModel(GS_PROGRAMS) private gsProgramsModel: Model<GsPrograms>,
    private readonly utilityProgramMasterService: UtilityProgramMasterService,
    private readonly productService: ProductService,
    @Inject(forwardRef(() => QuoteService))
    private readonly quoteService: QuoteService,
    @Inject(forwardRef(() => SystemDesignService))
    private readonly systemDesignService: SystemDesignService,
  ) {}

  async getById(id: string): Promise<LeanDocument<GsPrograms> | null> {
    const gsProgram = await this.gsProgramsModel.findOne({ _id: id }).lean();

    return gsProgram;
  }

  async getList(
    limit: number,
    skip: number,
    utilityProgramMasterId: string,
    quoteId: string,
  ): Promise<OperationResult<Pagination<GsProgramsDto>>> {
    const quote = await this.quoteService.getOneFullQuoteDataById(quoteId);
    if (!quote) {
      throw ApplicationException.EntityNotFound(`Quote Id: ${quoteId}`);
    }

    const systemDesign = await this.systemDesignService.getRoofTopDesignById(quote.systemDesignId);

    if (!systemDesign) {
      throw ApplicationException.EntityNotFound(`System Design Id: ${quote.systemDesignId}`);
    }

    const { storage } = systemDesign;

    const {
      quoteCostBuildup: { storageQuoteDetails },
    } = quote.detailedQuote;

    if (!storageQuoteDetails?.length || !storage.length) {
      throw ApplicationException.EntityNotFound('There is no battery');
    }

    const { storageModelDataSnapshot } = storageQuoteDetails[0];
    const storageSize = storage.reduce(
      (acc, cur) => acc + cur.quantity * cur.storageModelDataSnapshot.ratings.kilowattHours,
      0,
    );
    const manufacturerId = storageModelDataSnapshot.manufacturerId as any;

    const [gsPrograms, total] = await Promise.all([
      this.gsProgramsModel
        .find({ utilityProgramId: utilityProgramMasterId, kilowattHours: storageSize, manufacturerId })
        .limit(limit)
        .skip(skip)
        .lean(),
      this.gsProgramsModel
        .countDocuments({
          utilityProgramId: utilityProgramMasterId,
          kilowattHours: storageSize,
          manufacturerId,
        })
        .lean(),
    ]);

    const utilityProgram = await this.utilityProgramMasterService.getDetailById(utilityProgramMasterId);

    if (!utilityProgram) {
      throw ApplicationException.EntityNotFound(`UtilityProgramId: ${utilityProgramMasterId}`);
    }

    const batteryIdList = gsPrograms.reduce((a: any, c: any) => {
      if (c.manufacturerId && !a.some(value => value === c.manufacturerId)) {
        return [...a, c.manufacturerId];
      }
      return a;
    }, []);

    const battery = await this.productService.getDetailByIdList(batteryIdList);

    if (!battery) {
      throw ApplicationException.EntityNotFound(`UtilityProgramId: ${utilityProgramMasterId}`);
    }

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
