import { DynamicModule, Module, Provider } from '@nestjs/common';
import { AwsModule } from '../aws/aws.module';
import { KEYS } from './constants';
import { DocusignApiService } from './docusign-api.service';
import { DocusignContextProvider } from './docusign-context.provider';
import { IPageNumberFormatter } from './interfaces/IPageNumberFormatter';

const ContextProvider: Provider = {
  provide: KEYS.CONTEXT,
  useValue: new DocusignContextProvider(),
};

const providers: Provider[] = [ContextProvider, DocusignApiService];

@Module({})
export class DocusignApiModule {
  static forRoot(pageNumberFormatter: IPageNumberFormatter): DynamicModule {
    return {
      module: DocusignApiModule,
      imports: [AwsModule],
      providers: [
        ...providers,
        {
          provide: KEYS.PAGE_NUMBER_FORMATTER,
          useValue: pageNumberFormatter,
        },
      ],
      exports: [...providers],
    };
  }

  static forContext(): DynamicModule {
    return {
      module: DocusignApiModule,
      providers: [ContextProvider],
      exports: [ContextProvider],
    };
  }
}
