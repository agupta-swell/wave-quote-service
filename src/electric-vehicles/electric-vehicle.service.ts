import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, LeanDocument, ObjectId } from 'mongoose';
import { OperationResult } from 'src/app/common';
import { strictPlainToClass } from 'src/shared/transform/strict-plain-to-class';
import { ELECTRIC_VEHICLE_COLL } from './constants';
import {
  ElectricVehicleDocument,
  WithElectricVehicles,
  WithAdditionalElectricVehicleProps,
  IElectricVehicle,
} from './interfaces';
import { ElectricVehicleResDto, UniqueManufacturerNamesRes } from './res';

@Injectable()
export class ElectricVehicleService {
  constructor(
    @InjectModel(ELECTRIC_VEHICLE_COLL)
    private readonly electricVehicleModel: Model<ElectricVehicleDocument>,
  ) {}

  async getAllElectricVehicles(): Promise<LeanDocument<ElectricVehicleDocument>[]> {
    const res = await this.electricVehicleModel.find().lean();

    return res;
  }

  async getAll(): Promise<OperationResult<ElectricVehicleResDto[]>> {
    const res = await this.electricVehicleModel.find().lean();

    return OperationResult.ok(strictPlainToClass(ElectricVehicleResDto, res));
  }

  async getOne(id: ObjectId | string): Promise<LeanDocument<ElectricVehicleDocument>> {
    const res = await this.electricVehicleModel.findById(id).lean();

    if (!res) {
      throw new NotFoundException(`No electric vehicle found with id ${id.toString()}`);
    }

    return res;
  }

  async getUniqueManufacturerNames(): Promise<OperationResult<UniqueManufacturerNamesRes>> {
    const res: { manufacturerNames: string[] }[] = await this.electricVehicleModel.aggregate([
      {
        $group: {
          _id: null,
          manufacturerNames: {
            $addToSet: '$manufacturer',
          },
        },
      },
    ]);

    return OperationResult.ok(strictPlainToClass(UniqueManufacturerNamesRes, res[0] || { manufacturerNames: [] }));
  }

  static Snapshot<T>(
    doc: T,
    electricVehicle:
      | WithAdditionalElectricVehicleProps<ElectricVehicleDocument>[]
      | WithAdditionalElectricVehicleProps<LeanDocument<ElectricVehicleDocument>>[],
  ): WithElectricVehicles<T> {
    const snapshot: WithElectricVehicles<T> = {
      ...doc,
      electricVehicles: electricVehicle.map(({ chargerType, milesDrivenPerDay, startChargingHour, ...e }) => ({
        electricVehicleId: e._id.toString(),
        electricVehicleSnapshotDate: new Date(),
        chargerType,
        electricVehicleSnapshot: e as IElectricVehicle,
        milesDrivenPerDay,
        startChargingHour,
      })),
    };

    return snapshot;
  }
}
