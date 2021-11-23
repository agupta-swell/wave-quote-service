import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtConfigService } from 'src/authentication/jwt-config.service';
import { DocusignApiModule } from 'src/shared/docusign';
import { USER, UserSchema } from 'src/users/user.schema';
import { DocusignCommunicationSchema, DOCUSIGN_COMMUNICATION } from './docusign-communication.schema';
import { DocusignCommunicationService } from './docusign-communication.service';
import './sub-services/templates';

@Global()
@Module({
  imports: [
    JwtModule.registerAsync({
      useClass: JwtConfigService,
    }),
    DocusignApiModule.forRoot({
      value: (page, totalPage) => `Page ${page} of ${totalPage}`,
      xPosition: '277',
      yPosition: '757',
      font: 'timesnewroman',
      fontColor: 'black',
      fontSize: 'size10',
    }),
    MongooseModule.forFeature([
      {
        name: DOCUSIGN_COMMUNICATION,
        schema: DocusignCommunicationSchema,
        collection: 'v2_docusign_communications',
      },
      {
        name: USER,
        schema: UserSchema,
        collection: 'users',
      },
    ]),
  ],
  providers: [DocusignCommunicationService],
  exports: [DocusignCommunicationService],
})
export class DocusignCommunicationModule {}
