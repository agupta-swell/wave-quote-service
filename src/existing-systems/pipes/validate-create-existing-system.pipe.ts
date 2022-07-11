import { PipeTransform, Injectable, NotFoundException } from '@nestjs/common';
import { ManufacturerService } from 'src/manufacturers/manufacturer.service';
import { OpportunityService } from 'src/opportunities/opportunity.service';
import { BigNumberUtils } from 'src/utils';
import { CreateExistingSystemStorages, ICreateExistingSystem } from '../interfaces/create-existing-system.interface';
import { CreateExistingSystemDto } from '../req/create-existing-system.req.dto';
import { ModifyExistingSystemStorageReqDto } from '../req/modify-existing-system-storage.dto';

@Injectable()
export class ValidateCreateExistingSystemPipe implements PipeTransform {
  constructor(
    private readonly opportunityService: OpportunityService,

    private readonly manufacturerService: ManufacturerService,
  ) {}

  async transform(value: CreateExistingSystemDto) {
    const { array, storages, inverterManufacturerId, ...p } = value;
    const res: Partial<ICreateExistingSystem> = p;

    const validators: Promise<unknown>[] = [this.validateOpportunityId(value.opportunityId)];

    if (inverterManufacturerId) {
      validators.push(
        this.validateInverterManufacturerId(inverterManufacturerId).then(v => {
          res.inverterManufacturerName = v.name;
          res.inverterManufacturerId = v._id;
        }),
      );
    } else {
      delete res.inverterManufacturerName;
    }

    if (storages) {
      validators.push(
        Promise.all(storages.map(s => this.validateStorage(s))).then(v => {
          res.storages = v;
        }),
      );
    }

    res.existingPVSize = array ? BigNumberUtils.sumBy(array, 'existingPVSize').toNumber() : 0;

    res.array = array;

    await Promise.all(validators);

    return res;
  }

  protected async validateOpportunityId(value: string) {
    const found = await this.opportunityService.getDetailById(value);

    if (!found) {
      throw new NotFoundException(`No opportunity found with id: ${value}`);
    }
  }

  protected async validateInverterManufacturerId(id: string) {
    const found = await this.manufacturerService.getOneById(id);

    return found;
  }

  protected async validateStorage(storage: ModifyExistingSystemStorageReqDto): Promise<CreateExistingSystemStorages> {
    if (!storage.manufacturerId)
      return {
        ...storage,
        manufacturerId: undefined,
      };

    const manufacturer = await this.manufacturerService.getOneById(storage.manufacturerId);

    return {
      ...storage,
      manufacturerName: manufacturer.name,
      manufacturerId: manufacturer._id,
    };
  }
}
