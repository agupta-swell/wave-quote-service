import { DOCUSIGN_TAB_META } from '../constants';
import { registerTab } from './meta-storage';

export const TabLabel = (tabLabel: string): PropertyDecorator => (target, prop: string) =>
  registerTab(DOCUSIGN_TAB_META.TAB_LABEL, tabLabel, prop, target);
