import { DOCUSIGN_TAB_META } from '../constants';
import { registerTab } from './meta-storage';

export const TabRequire = (path?: string): PropertyDecorator => (target, prop: string) =>
  registerTab(DOCUSIGN_TAB_META.ON_TAB_FAILED_REQUIRE, path ?? prop, prop, target as any);
