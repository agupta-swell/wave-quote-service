import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { JwtConfigService } from 'src/authentication/jwt-config.service';
import { ProjectService } from './project.service';
import { MongooseModule } from '@nestjs/mongoose';
import { PROJECT, ProjectSchema } from './project.schema';

@Global()
@Module({
  imports: [
    JwtModule.registerAsync({
      useClass: JwtConfigService,
    }),
    MongooseModule.forFeature([
      {
        name: PROJECT,
        schema: ProjectSchema,
        collection: 'projects',
      },
    ]),
  ],
  providers: [ProjectService],
  exports: [ProjectService],
})
export class ProjectModule {}
