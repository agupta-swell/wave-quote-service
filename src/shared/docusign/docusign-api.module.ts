import { Module, Provider } from '@nestjs/common';
import { AwsModule } from '../aws/aws.module';
import { KEYS } from './constants';
import { DocusignApiService } from './docusign-api.service';
import { DocusignContextProvider } from './docusign-context.provider';

const providers: Provider[] = [
  {
    provide: KEYS.CONTEXT,
    useValue: new DocusignContextProvider(),
  },
  DocusignApiService,
];

@Module({
  imports: [AwsModule],
  providers: providers,
  exports: providers,
})
export class DocusignApiModule {}
