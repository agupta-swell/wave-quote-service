import { ICompiledTemplate } from './ICompiledTemplate';

export interface IIndexable {
  [key: string]: any;
}

export interface IContext<T extends IIndexable> {
  genericObject: T;

  templateIds: string[];

  docWithPrefillTabIds: number[];

  buildTime: number;

  compiledTemplates: Record<
    string,
    {
      textTabs?: ICompiledTemplate.TextTab[];
      prefillTabs?: ICompiledTemplate.PrefillTabs['prefillTabs'];
    }
  >;
}
