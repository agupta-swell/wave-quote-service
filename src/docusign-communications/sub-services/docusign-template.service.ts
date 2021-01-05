import { Injectable } from '@nestjs/common';
import * as dayjs from 'dayjs';
import { IDefaultContractor, IGenericObject, ITabData } from '../typing';

enum DOCUSIGN_TEMPLATE {
  first = '50bf8fd6-cf25-4ee0-b63d-2720e66a4789',
  second = '864dead0-03df-4a5a-b83c-ffb0d0c5f588',
}

@Injectable()
export class DocusignTemplateService {
  buildTemplateData(
    docusignTemplateId: string,
    genericObject: IGenericObject,
    defaultContractor: IDefaultContractor,
  ): ITabData {
    const tabsData: ITabData = {} as any;
    const { contact, contract, opportunity, recordOwner } = genericObject;

    let obj = {};
    switch (docusignTemplateId) {
      case DOCUSIGN_TEMPLATE.first: {
        obj['Text Owner Name 1 - 2'] = contact.firstName;
        obj['Text Owner Name 2 - 2'] = contact.lastName;
        obj[`Text Contractor's Company Name 1 - 2`] = opportunity.contractorCompanyName;
        obj[`Text Name Signer 1 - 3`] = opportunity.contractorSigner;
        obj[`Text Contractor's Title`] = 'CEO';
        tabsData.textTabs.push(obj);
        return tabsData;
      }

      // TODO: need to implement later
      case DOCUSIGN_TEMPLATE.second: {
        obj[`Text Contractor's Address 1 - 1`] = opportunity.isPrimeContractor
          ? defaultContractor.address1
          : opportunity.contractorAddress1;
        obj[`Text Contractor's Address 2 - 1`] = opportunity.isPrimeContractor
          ? defaultContractor.address2
          : opportunity.contractorAddress2;
        obj[`Text Opp Street 2 - 1`] = contact.address2;
        obj[`Text Email - 1`] = contact.email;
        obj[`Text Opp Owner - 1`] = recordOwner
          ? `${recordOwner.profile.firstName} ${recordOwner.profile.lastName}`
          : '';
        obj[`Text Opp Owner Email - 1`] = recordOwner ? recordOwner?.emails[0].address : '';
        obj[`Text Opp Owner Phone - 1`] =
          recordOwner && recordOwner?.profile?.cellPhone ? recordOwner?.profile?.cellPhone : '';
        obj[`Text Phone - 1`] = contact.cellPhone;
        obj[`Text Opp City State Zip - 1`] = `${contact.city}, ${contact.state} ${contact.zip}`;
        obj[`Text Date - 1`] = dayjs().format('MM/DD/YYYY');
        obj[`Text Contractor's Company Name 2 - 1`] = opportunity.isPrimeContractor
          ? defaultContractor.companyName
          : opportunity.contractorCompanyName;
        obj[`Text Contractor's Company Name 1 - 1`] = opportunity.isPrimeContractor
          ? defaultContractor.companyName
          : opportunity.contractorCompanyName;
        obj[`Text CSCB License # - 1`] = `CSLB# ${
          opportunity.isPrimeContractor ? defaultContractor.license : opportunity.contractorLicense
        }`;
        obj['Text Owner Name 1 - 2'] = contact.firstName;
        obj['Text Owner Name 2 - 2'] = contact.lastName;

        break;
      }

      default:
        break;
    }
    return;
  }
}
