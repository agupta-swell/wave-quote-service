import { IGenericObject } from "src/docusign-communications/typing";
import { DefaultTabTransformation, DefaultTabType, DocusignTemplate, DOCUSIGN_TAB_TYPE, TabValue } from "src/shared/docusign";

@DocusignTemplate('demo', '397060af-81a9-4da9-85c7-8355518015a2')
@DefaultTabType(DOCUSIGN_TAB_TYPE.PRE_FILLED_TABS)
@DefaultTabTransformation('snake_case')
export class PariticipationSGIPHICTemplate {
    @TabValue<IGenericObject>(({ utilityUsageDetails }) => utilityUsageDetails?.utilityData.loadServingEntityData.lseName || '')
    utilityName: string
}
