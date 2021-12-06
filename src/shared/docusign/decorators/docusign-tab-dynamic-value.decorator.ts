import { DOCUSIGN_TAB_META } from '../constants';
import { IDefaultContractor } from '../interfaces/IDefaultContractor';
import { IDynamicRawTab } from '../interfaces/IRawTab';
import { registerTab } from './meta-storage';

export function TabDynamic<T>(
  tabValue: (ctx: T, defaultContractor: IDefaultContractor) => IDynamicRawTab[] | Record<string, unknown>,
): PropertyDecorator {
  return (target, prop: string) => registerTab(DOCUSIGN_TAB_META.TAB_DYNAMIC, tabValue, prop, target as any);
}
