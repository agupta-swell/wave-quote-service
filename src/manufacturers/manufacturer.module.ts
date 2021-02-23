import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtConfigService } from 'src/authentication/jwt-config.service';
import { ManufacturerController } from './manufacturer.controller';
import { MANUFACTURER, ManufacturerSchema } from './manufacturer.schema';
import { ManufacturerService } from './manufacturer.service';

@Module({
	imports: [
		JwtModule.registerAsync({
			useClass: JwtConfigService,
		}),
		MongooseModule.forFeature([
			{
				name: MANUFACTURER,
				schema: ManufacturerSchema,
				collection: 'v2_manufacturers',
			},
		]),
	],
	controllers: [ManufacturerController],
	providers: [ManufacturerService],
	exports: [ManufacturerService],
})
export class ManufacturerModule { }
