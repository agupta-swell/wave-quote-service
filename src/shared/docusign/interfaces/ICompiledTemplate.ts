/* eslint-disable @typescript-eslint/no-namespace */
import * as docusign from 'docusign-esign';
import { IContext } from '.';
import { IDefaultContractor } from './IDefaultContractor';
import { IPageNumberFormatter } from './IPageNumberFormatter';

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
      // eslint-disable-next-line @typescript-eslint/ban-types
      [P in keyof T]: T[P] extends Function ? never : P;
    }[keyof T]]: T[K];
  };
}

export interface ICompiledTemplate<T, Context> {
  readonly id: string;
  readonly hasPrefillTab: boolean;
  readonly refId: string;
  readonly requirePageNumber: boolean;

  totalPage: number;

  toTextTabs(ctx: Context, defaultContractor: IDefaultContractor): ICompiledTemplate.TextTab[];
  toPrefillTabs(
    ctx: Context,
    defaultContractor: IDefaultContractor,
    docTabs: ICompiledTemplate.DocTabs,
  ): ICompiledTemplate.PrefillTabs | undefined;
  fromTabs(tabs: any): ICompiledTemplate.ExtractedTabValue<T>;
  refresh(): void;
  toPageNumberTabs(
    ctx: IContext<Context>,
    documentId: string,
    tabFormatter: IPageNumberFormatter,
  ): ICompiledTemplate.PrefillTabs | undefined;
}
