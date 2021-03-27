import { Injectable } from '@nestjs/common';
import { DOCUSIGN_TEMPLATE } from '../constants';
import { IDefaultContractor, IGenericObject, ITabData } from '../typing';
import { mapTemplateById } from './templates';

@Injectable()
export class DocusignTemplateService {
  buildTemplateData(
    docusignTemplateId: string,
    genericObject: IGenericObject,
    defaultContractor: IDefaultContractor,
  ): ITabData {
    const tabsData: ITabData = { textTabs: [] } as any;
    const { contact, opportunity, recordOwner, customerPayment, roofTopDesign, isCash, utilityName } = genericObject;

    switch (docusignTemplateId) {
      case DOCUSIGN_TEMPLATE.first: {
        const data = mapTemplateById[DOCUSIGN_TEMPLATE.first](contact, opportunity);
        tabsData.textTabs.push(data);
        return tabsData;
      }

      case DOCUSIGN_TEMPLATE.second: {
        const data = mapTemplateById[DOCUSIGN_TEMPLATE.second]({
          opportunity,
          defaultContractor,
          customerPayment,
          contact,
          recordOwner,
          utilityName,
          roofTopDesign,
          isCash,
        });

        tabsData.textTabs.push(data);
        return tabsData;
      }

      default:
        return tabsData;
    }
  }
}
