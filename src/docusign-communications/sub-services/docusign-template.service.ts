import { BadRequestException, Injectable } from '@nestjs/common';
import { DocusignException } from '../filters/docusign.exception';
import { IDefaultContractor, IGenericObject, ITabData } from '../typing';
import { templateBuilderMap } from './templates';

@Injectable()
export class DocusignTemplateService {
  buildTemplateData(
    docusignTemplateId: string,
    genericObject: IGenericObject,
    defaultContractor: IDefaultContractor,
  ): ITabData | DocusignException {
    try {
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
    } catch (error) {
      const exception = new DocusignException(error);
      if (process.env.DOCUSIGN_ENV === 'live') {
        throw exception;
      }

      return exception;
    }
  }
}
