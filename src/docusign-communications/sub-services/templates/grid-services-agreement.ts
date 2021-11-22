import { IGenericObject } from 'src/docusign-communications/typing';
import {
  DefaultTabTransformation,
  DefaultTabType,
  DocusignTemplate,
  DOCUSIGN_TAB_TYPE,
  TabLabel,
  TabValue,
} from 'src/shared/docusign';

@DocusignTemplate('demo', '5cb8e3ad-9c80-4b7a-80d6-a8b920741a1a')
@DefaultTabTransformation('snake_case')
@DefaultTabType(DOCUSIGN_TAB_TYPE.PRE_FILLED_TABS)
export class GridServiceAgreementTemplate {
  @TabValue<IGenericObject>(({ signerDetails }) => signerDetails.find(e => e.role === 'Primary Owner')?.fullName)
  primaryOwnerFullName: string;

  @TabLabel('Email_1')
  @TabValue<IGenericObject>(({ signerDetails }) => signerDetails.find(e => e.role === 'Primary Owner')?.email)
  email: string;

  @TabValue<IGenericObject>(({ signerDetails }) => signerDetails.find(e => e.role === 'Co Owner')?.fullName)
  coOwnerFullName: string;

  @TabValue<IGenericObject>(ctx => ctx.financialProduct?.name)
  financierFullName: string;

  @TabValue<IGenericObject>(ctx => ctx.financialProduct?.countersignerTitle)
  financierTitle: string;

  @TabLabel('Home_Address_1&2_City_State_ZIP')
  @TabValue<IGenericObject>(
    ({ contact }) =>
      `${contact.address1}${contact.address2 ? ', ' + contact.address2 : ''}, ${contact.city}, ${contact.state} ${
        contact.zip
      }`,
  )
  equipmentAddress: string;
}
