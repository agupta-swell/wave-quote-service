import { DOCUSIGN_TAB_TYPE } from '../constants';
import { IDefaultContractor } from './IDefaultContractor';

export interface IRawTab<Context> {
  prop: string;
  tabLabel: string;
  tabValue: string | Function;
  tabType?: DOCUSIGN_TAB_TYPE;
  tabDynamicValue?: (ctx: Context, defaultContractor: IDefaultContractor) => IDynamicRawTab[] | Record<string, unknown>;
}

export interface IDynamicRawTab {
  prop: string;
  tabLabel?: string;
  tabValue: string | number | boolean | undefined | null;
}
