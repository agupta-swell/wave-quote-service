import {
  DefaultTabTransformation,
  DefaultTabType,
  DocusignTemplate,
  DOCUSIGN_TAB_TYPE,
  TabValue,
} from 'src/shared/docusign';
import { IGenericObject } from '../../typing';

@DefaultTabType(DOCUSIGN_TAB_TYPE.PRE_FILLED_TABS)
@DefaultTabTransformation('snake_case')
@DocusignTemplate('demo', '31bfa343-a279-43a4-aa54-f2d2d31b33ef')
export class AutomaticPaymentAuthorizationFormFinTemplate {
  @TabValue<IGenericObject>(({ opportunity }) => opportunity._id)
  opportunityId: string;

  @TabValue<IGenericObject>(({ signerDetails }) => signerDetails.find(e => e.role === 'Primary Owner')?.fullName)
  primaryOwnerFullName: string;

  @TabValue<IGenericObject>(({ signerDetails }) => signerDetails.find(e => e.role === 'Co Owner')?.fullName)
  coOwnerFullName: string;
}
