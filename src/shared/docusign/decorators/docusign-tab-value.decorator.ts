import { DOCUSIGN_TAB_META } from '../constants';
import { IDefaultContractor } from '../interfaces/IDefaultContractor';
import { registerTab } from './meta-storage';

export function TabValue<T>(
  tabValue: (ctx: T, defaultContractor: IDefaultContractor) => string | number | boolean | undefined,
): PropertyDecorator;
export function TabValue(tabValue: unknown): PropertyDecorator;
export function TabValue(tabValue: any): PropertyDecorator {
  return (target, prop: string) => registerTab(DOCUSIGN_TAB_META.TAB_VALUE, tabValue, prop, target as any);
}
