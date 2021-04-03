import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IDefaultContractor, IGenericObject, ITabData } from '../typing';
import { templateBuilderMap } from './templates';

@Injectable()
export class DocusignTemplateService {
  buildTemplateData(
    docusignTemplateId: string,
    genericObject: IGenericObject,
    defaultContractor: IDefaultContractor,
  ): ITabData {
    const templateDataBuilder = templateBuilderMap[docusignTemplateId];

    if (!templateDataBuilder) {
      throw new Error(`No mapping for DocuSign template id: ${docusignTemplateId}`);
    }
    const tabs = templateBuilderMap[docusignTemplateId](genericObject, defaultContractor);
    return { textTabs: [tabs] };
  }
}
