import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Type } from 'class-transformer';
import { IsString, IsNotEmpty, IsNumber, Min, IsMongoId, ValidateNested, IsInt, Max } from 'class-validator';
import { IChargerType, IElectricVehicle, IElectricVehicleSnapshot } from '../interfaces';

export class ChargerTypeReqDto implements IChargerType {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  @ApiProperty()
  rating: number;
}

export class ElectricVehicleSnapshotReqDto implements IElectricVehicleSnapshot {
  @ApiProperty()
  @IsMongoId()
  electricVehicleId: string;

  @ApiProperty()
  @IsNumber()
  milesDrivenPerDay: number;

  @ApiProperty()
  @IsInt()
  @Min(0)
  @Max(23)
  startChargingHour: number;

  @ApiProperty({ type: ChargerTypeReqDto })
  @Type(() => ChargerTypeReqDto)
  @ValidateNested()
  chargerType: ChargerTypeReqDto;

  @Exclude()
  electricVehicleSnapshotDate: Date;

  @Exclude()
  electricVehicleSnapshot: IElectricVehicle;
}
