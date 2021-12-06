import { DOCUSIGN_TAB_META, DOCUSIGN_TAB_TYPE } from '../constants';
import { registerTab } from './meta-storage';

export function TabType(TabType: string): PropertyDecorator;
export function TabType(TabType: DOCUSIGN_TAB_TYPE): PropertyDecorator;
export function TabType(tabType: DOCUSIGN_TAB_TYPE | string): PropertyDecorator {
  return (target, prop: string) => registerTab(DOCUSIGN_TAB_META.TAB_TYPE, tabType, prop, target as any);
}

export const PrefillTab = () => TabType(DOCUSIGN_TAB_TYPE.PRE_FILLED_TABS);
export const TextTab = () => TabType(DOCUSIGN_TAB_TYPE.TEXT_TABS);
