import { Injectable, PipeTransform } from '@nestjs/common';
import { LeanDocument } from 'mongoose';
import { ElectricVehicleService } from '../electric-vehicle.service';
import { ElectricVehicleDocument, WithAdditionalElectricVehicleProps, WithElectricVehicles } from '../interfaces';

@Injectable()
export class ValidateAndSnapshotElectricVehiclesPipe<T extends WithElectricVehicles<unknown>>
  implements PipeTransform<T, Promise<WithElectricVehicles<T>>> {
  constructor(private readonly electricVehicleService: ElectricVehicleService) {}

  async transform(value: T): Promise<WithElectricVehicles<T>> {
    const { electricVehicles } = value;

    const snapshot: WithAdditionalElectricVehicleProps<LeanDocument<ElectricVehicleDocument>>[] = await Promise.all(
      electricVehicles.map(async e => {
        const found = await this.electricVehicleService.getOne(e.electricVehicleId);

        return {
          ...found,
          ...e,
        };
      }),
    );

    return ElectricVehicleService.Snapshot(value, snapshot);
  }
}
