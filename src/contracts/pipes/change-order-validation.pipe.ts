import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException, NotFoundException } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { SystemDesignService } from 'src/system-designs/system-design.service';
import { CONTRACT_TYPE, PROCESS_STATUS, REQUEST_MODE } from '../constants';
import { SaveChangeOrderReqDto } from '../req';
import { Contract, CONTRACT } from '../contract.schema';

@Injectable()
export class ChangeOrderValidationPipe implements PipeTransform<SaveChangeOrderReqDto, Promise<SaveChangeOrderReqDto>> {
  constructor(
    @InjectModel(CONTRACT) private readonly contractModel: Model<Contract>,
    private readonly systemDesignService: SystemDesignService,
  ) {}

  async transform(value: SaveChangeOrderReqDto, metadata: ArgumentMetadata): Promise<SaveChangeOrderReqDto> {
    return this.validateReq(value);
  }

  protected validateUpdateMode(req: SaveChangeOrderReqDto): boolean {
    return !!req.contractDetail.id;
  }

  protected validateCreateMode(req: SaveChangeOrderReqDto): boolean {
    return !req.contractDetail.id;
  }

  protected async validateCreateChangeOrder(req: SaveChangeOrderReqDto): Promise<any> {
    const [primaryContract, previousChangeOrderContracts] = await Promise.all([
      this.contractModel
        .findOne(
          {
            opportunityId: req.contractDetail.opportunityId,
            contractType: CONTRACT_TYPE.PRIMARY_CONTRACT,
          },
          {},
          { sort: { createdAt: -1 } },
        )
        .lean(),
      this.contractModel
        .find({
          opportunityId: req.contractDetail.opportunityId,
          contractType: CONTRACT_TYPE.CHANGE_ORDER,
        })
        .lean(),
    ]);

    if (
      primaryContract?.contractStatus !== PROCESS_STATUS.COMPLETED ||
      previousChangeOrderContracts.some(
        contract =>
          contract.contractStatus !== PROCESS_STATUS.COMPLETED && contract.contractStatus !== PROCESS_STATUS.VOIDED,
      )
    ) {
      throw new BadRequestException('Not qualified to create Change Order contract');
    }

    return { contract: primaryContract };
  }

  protected async validateUpdateChangeOrder(req: SaveChangeOrderReqDto): Promise<any> {
    const contract = await this.contractModel.findById(req.contractDetail.id).lean();

    if (!contract) {
      throw new NotFoundException(`No matching record to update for id ${req.contractDetail.id}`);
    }

    if (contract.contractStatus !== PROCESS_STATUS.INITIATED) {
      throw new BadRequestException(`Contract is already in progress or completed`);
    }

    return { contract };
  }

  protected async validateCreateNoCostChangeOrder(req: SaveChangeOrderReqDto): Promise<any> {
    const primaryContract = await this.contractModel.findById(req.contractDetail.primaryContractId).lean();

    if (!primaryContract) throw new NotFoundException('No related contract found');

    if (primaryContract.contractStatus !== PROCESS_STATUS.COMPLETED) {
      throw new BadRequestException('Not qualified to create No Cost Change Order Contract');
    }

    const systemDesign = await this.systemDesignService.getOneById(req.contractDetail.systemDesignId);

    if (!systemDesign)
      throw new NotFoundException(`No system design found with id ${req.contractDetail.systemDesignId}`);

    if (systemDesign.opportunityId !== req.contractDetail.opportunityId)
      throw new BadRequestException(`This system design can not be used`);

    return { systemDesign, contract: primaryContract };
  }

  private async validateReq(req: SaveChangeOrderReqDto): Promise<SaveChangeOrderReqDto> {
    if (req.mode === REQUEST_MODE.ADD) {
      if (!this.validateCreateMode(req)) {
        throw new BadRequestException('Add request cannot have an id value');
      }

      let data: any;

      switch (req.contractDetail.contractType) {
        case CONTRACT_TYPE.CHANGE_ORDER:
          data = await this.validateCreateChangeOrder(req);
          break;
        case CONTRACT_TYPE.NO_COST_CHANGE_ORDER:
          data = await this.validateCreateNoCostChangeOrder(req);
          break;
        default:
          throw new BadRequestException('Invalid contract type');
      }

      return { ...req, ...data };
    }

    if (req.mode === REQUEST_MODE.UPDATE) {
      if (!this.validateUpdateMode(req)) {
        throw new BadRequestException('Update request should have an id value');
      }

      let data: any;

      switch (req.contractDetail.contractType) {
        case CONTRACT_TYPE.CHANGE_ORDER:
        case CONTRACT_TYPE.NO_COST_CHANGE_ORDER:
          data = await this.validateUpdateChangeOrder(req);
          break;
        default:
          throw new BadRequestException('Invalid contract type');
      }

      return { ...req, ...data };
    }

    throw new BadRequestException('Invalid request mode');
  }
}
