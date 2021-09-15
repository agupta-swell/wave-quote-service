import { Injectable } from '@nestjs/common';
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

    // https://developers.docusign.com/docs/esign-rest-api/reference/envelopes/enveloperecipienttabs/#tab-types
    const textTabs = Object.keys(tabs).map(key => ({
      tabLabel: `\\*${key}`,
      value: tabs[key],
    }));

    return { textTabs };
  }
}
