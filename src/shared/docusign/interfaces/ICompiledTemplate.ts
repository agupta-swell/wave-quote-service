import * as docusign from 'docusign-esign';
import { IDefaultContractor } from './IDefaultContractor';

export namespace ICompiledTemplate {
  export interface PrefillTabs {
    prefillTabs: { textTabs: docusign.Text[] };
  }

  export interface TextTab {
    tabLabel: string;
    value: string;
  }

  export type DocTabs = docusign.Tabs & Partial<PrefillTabs>;

  export type ExtractedTabValue<T> = {
    [K in {
      [P in keyof T]: T[P] extends Function ? never : P;
    }[keyof T]]: T[K];
  };
}

export interface ICompiledTemplate<T, Context> {
  readonly id: string;
  readonly hasPrefillTab: boolean;
  readonly refId: string;

  toTextTabs(ctx: Context, defaultContractor: IDefaultContractor): ICompiledTemplate.TextTab[];
  toPrefillTabs(
    ctx: Context,
    defaultContractor: IDefaultContractor,
    docTabs: ICompiledTemplate.DocTabs,
  ): ICompiledTemplate.PrefillTabs | undefined;
  fromTabs(tabs: any): ICompiledTemplate.ExtractedTabValue<T>;
  refresh(): void;
}
