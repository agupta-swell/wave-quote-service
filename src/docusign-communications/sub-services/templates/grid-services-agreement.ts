import { IGenericObject } from 'src/docusign-communications/typing';
import {
  DefaultTabTransformation,
  DefaultTabType,
  DocusignTemplate,
  DOCUSIGN_TAB_TYPE,
  TabValue,
} from 'src/shared/docusign';

@DocusignTemplate('demo', '5cb8e3ad-9c80-4b7a-80d6-a8b920741a1a')
@DefaultTabTransformation('snake_case')
@DefaultTabType(DOCUSIGN_TAB_TYPE.PRE_FILLED_TABS)
export class GridServiceAgreementTemplate {
  @TabValue<IGenericObject>(({ signerDetails }) => signerDetails.find(e => e.role === 'Primary Owner')?.fullName)
  primaryOwnerFullName: string;

  @TabValue<IGenericObject>(({ signerDetails }) => signerDetails.find(e => e.role === 'Primary Owner')?.email)
  primaryOwnerEmail: string;

  @TabValue<IGenericObject>(({ signerDetails }) => signerDetails.find(e => e.role === 'Co Owner')?.fullName)
  coOwnerFullName: string;

  @TabValue<IGenericObject>(
    ({ contact }) =>
      `${contact.address1}${contact.address2 ? ', ' + contact.address2 : ''}, ${contact.city}, ${contact.state} ${
        contact.zip
      }`,
  )
  equipmentAddress: string;
}
