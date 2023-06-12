import { IGenericObject } from 'src/docusign-communications/typing';
import {
  DefaultTabTransformation,
  DefaultTabType,
  DocusignTemplate,
  DOCUSIGN_TAB_TYPE,
  TabValue,
} from 'src/shared/docusign';

@DocusignTemplate('demo', '067899a2-23ae-4f18-ba87-97aa51ae5d0a')
@DocusignTemplate('live', '2ea1c370-d026-4c0c-ba89-a7200b80d39c')
@DefaultTabType(DOCUSIGN_TAB_TYPE.PRE_FILLED_TABS)
@DefaultTabTransformation('snake_case')
export class ExhibitBChangeOrderFormHICTemplate {
  @TabValue<IGenericObject>(({ opportunity }) => opportunity._id)
  opportunityId: string;

  @TabValue<IGenericObject>(({ signerDetails }) => signerDetails.find(e => e.role === 'Primary Owner')?.fullName)
  primaryOwnerFullName: string;

  @TabValue<IGenericObject>(({ signerDetails }) => signerDetails.find(e => e.role === 'Co Owner')?.fullName)
  coOwnerFullName: string;

  @TabValue<IGenericObject>(
    ({ contact }) =>
      `${contact.address1 || ''}${contact.address2 ? `\n${contact.address2}\n` : '\n'}${contact.city}, ${
        contact.state || ''
      } ${contact.zip || ''}`,
  )
  homeAddress: string;
}
