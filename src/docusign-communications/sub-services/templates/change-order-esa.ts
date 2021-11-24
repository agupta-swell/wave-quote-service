import { DefaultTabType, DocusignTemplate, DOCUSIGN_TAB_TYPE } from 'src/shared/docusign';
import { HomeEnergySubAgtESATemplate } from './home-energy-sub-agt-esa';

@DocusignTemplate('demo', 'd6802ccb-9c8d-4bec-8689-e71bd1879d51')
@DefaultTabType(DOCUSIGN_TAB_TYPE.PRE_FILLED_TABS)
export class ChangeOrderEsaTemplate extends HomeEnergySubAgtESATemplate {}
