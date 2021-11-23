import * as docusign from 'docusign-esign';
import { IContext } from './interfaces/IContext';
import { DOCUSIGN_TAB_TYPE, KEYS } from './constants';
import { IClass } from './interfaces/IClass';
import { ICompiledTemplate } from './interfaces/ICompiledTemplate';
import { IDefaultContractor } from './interfaces/IDefaultContractor';
import { IMetaTemplate } from './interfaces/IMetaTemplate';
import { IPageNumberFormatter } from './interfaces/IPageNumberFormatter';
import { IRawTab } from './interfaces/IRawTab';
import { toPascalCase, toSnakeCase, toUpperSnakeCase } from './utils';

export class TemplateCompiler<T, Context> implements ICompiledTemplate<T, Context> {
  private readonly _ctor: IClass<T>;

  private _id: string;

  private _refId: string;

  private _rawTabs: IRawTab<Context>[];

  private _hasPrefillTab: boolean;

  private _defaultTabType?: DOCUSIGN_TAB_TYPE;

  private _defaultTransform?: (prop: string) => string;

  private _noPageNumber: boolean;

  private _totalPage: number;

  constructor(ctor: IClass<T>) {
    this._noPageNumber = false;

    this._totalPage = 0;

    this._ctor = ctor;

    this.extractId();

    this.extractDefaultOptions();

    this.parseRawTabs();
  }

  public refresh() {
    this.extractId();
  }

  private extractDefaultOptions() {
    const tabType = Reflect.getMetadata(KEYS.DEFAULT_TAB_TYPE, this._ctor);

    if (tabType) {
      this._defaultTabType = tabType;
    }

    const tabNamingStrategy = Reflect.getMetadata(KEYS.DEFAULT_TAB_STRATEGY, this._ctor);

    if (!tabNamingStrategy) return;

    if (typeof tabNamingStrategy === 'string') {
      switch (tabNamingStrategy) {
        case 'snake_case':
          this._defaultTransform = toSnakeCase;
          break;
        case 'upper_snake_case':
          this._defaultTransform = toUpperSnakeCase;
          break;
        case 'pascal_case':
          this._defaultTransform = toPascalCase;
          break;
        default:
          this._defaultTransform = undefined;
      }
      return;
    }

    this._defaultTransform = tabNamingStrategy;
  }

  private extractId(): void {
    const refId = Reflect.getMetadata('docusign:template:classRefId', this._ctor);
    this._refId = refId;

    const meta: IMetaTemplate[] = Reflect.getMetadata(KEYS.META, this._ctor);

    const envMeta = meta.find(e => e.env === process.env.DOCUSIGN_ENV);

    if (!envMeta) {
      this._id = 'none';
      return;
    }

    this._id = envMeta.id;
  }

  private parseRawTabs(): void {
    const props: string[] = Reflect.getMetadata(KEYS.PROP, this._ctor);

    this._rawTabs = props
      .map(e => ({ prop: e, symbols: Reflect.getMetadataKeys(this._ctor, e) }))
      .map(({ prop, symbols }) => {
        const o: IRawTab<Context> = {
          prop,
          tabLabel: this._defaultTransform ? this._defaultTransform(prop) : prop,
          tabValue: '',
          tabType: this._defaultTabType,
        };

        symbols.forEach(s => {
          const value = Reflect.getMetadata(s, this._ctor, prop);

          if (!value) return;

          switch (s) {
            case KEYS.TAB_LABEL:
              o.tabLabel = value;
              break;
            case KEYS.TAB_TYPE:
              o.tabType = value;
              break;
            case KEYS.TAB_VALUE:
              o.tabValue = value;
              break;
            case KEYS.TAB_DYNAMIC:
              o.tabDynamicValue = value;
              break;
            default:
          }
        });

        return o;
      });
  }

  get id(): string {
    return this._id;
  }

  get refId(): string {
    return this._refId;
  }

  toTextTabs(ctx: Context, defaultContractor: IDefaultContractor): ICompiledTemplate.TextTab[] {
    const tabs: { tabLabel: string; value: string }[] = [];
    this._rawTabs
      .filter(e => e.tabType === DOCUSIGN_TAB_TYPE.TEXT_TABS && !e.tabDynamicValue)
      .forEach(e => {
        const value =
          typeof e.tabValue === 'function'
            ? e.tabValue(ctx, defaultContractor)?.toString() ?? ''
            : e.tabValue.toString();

        tabs.push({
          value,
          tabLabel: `\\*${e.tabLabel}`,
        });
      });

    this._rawTabs
      .filter(e => e.tabType === DOCUSIGN_TAB_TYPE.TEXT_TABS && e.tabDynamicValue)
      .forEach(e => {
        const rawDynamicResult = e.tabDynamicValue!(ctx, defaultContractor);

        const dynamicTabs = Array.isArray(rawDynamicResult)
          ? rawDynamicResult
          : Object.entries(rawDynamicResult).map(([key, value]) => ({ prop: key, tabValue: value, tabLabel: '' }));

        dynamicTabs.forEach(tabResult => {
          const tabLabel =
            tabResult.tabLabel ?? (this._defaultTransform ? this._defaultTransform(tabResult.prop) : tabResult.prop);

          const value = (tabResult.tabValue as any)?.toString() ?? '';

          tabs.push({
            tabLabel: `\\*${tabLabel}`,
            value,
          });
        });
      });

    return tabs;
  }

  toPrefillTabs(
    ctx: Context,
    defaultContractor: IDefaultContractor,
    docTabs: ICompiledTemplate.DocTabs,
  ): ICompiledTemplate.PrefillTabs | undefined {
    const { prefillTabs } = docTabs;

    if (!prefillTabs || !Object.keys(prefillTabs).length || !prefillTabs.textTabs.length) return;

    const tabs = prefillTabs.textTabs
      .map(tab => {
        const { tabId, tabLabel } = tab;

        const rawTab = this._rawTabs.find(
          rawTab =>
            rawTab.tabType === DOCUSIGN_TAB_TYPE.PRE_FILLED_TABS &&
            rawTab.tabLabel === tabLabel &&
            !rawTab.tabDynamicValue,
        );

        if (!rawTab) return;

        const value = {
          tabId,
          value:
            (typeof rawTab.tabValue === 'function'
              ? rawTab.tabValue(ctx, defaultContractor)
              : rawTab.tabValue
            )?.toString() ?? '',
        } as docusign.Text;

        // eslint-disable-next-line consistent-return
        return value;
      })
      .filter(e => e) as docusign.Text[];

    // handle dynamic tab value

    this._rawTabs
      .filter(e => e.tabDynamicValue && e.tabType === DOCUSIGN_TAB_TYPE.PRE_FILLED_TABS)
      .forEach(({ tabDynamicValue }) => {
        const res = tabDynamicValue!(ctx, defaultContractor);

        const dynamicTabs = Array.isArray(res)
          ? res
          : Object.entries(res).map(([key, value]) => ({ prop: key, tabValue: value, tabLabel: '' }));

        dynamicTabs.forEach(dynTab => {
          const { prop, tabLabel, tabValue } = dynTab;

          const label = tabLabel ?? (this._defaultTransform ? this._defaultTransform(prop) : prop);

          const foundTab = prefillTabs.textTabs.find(e => e.tabLabel === label);

          if (!foundTab) return;

          tabs.push({
            tabId: foundTab.tabId,
            value: tabValue?.toString() ?? '',
          });
        });
      });

    // eslint-disable-next-line consistent-return
    return {
      prefillTabs: {
        textTabs: tabs,
      },
    };
  }

  toPageNumberTabs(
    ctx: IContext<Context>,
    documentId: string,
    tabFormatter: IPageNumberFormatter,
  ): ICompiledTemplate.PrefillTabs | undefined {
    const { value, ...p } = tabFormatter;

    if (!this._totalPage) return;

    const textTabs: docusign.Text[] = [];

    // eslint-disable-next-line no-plusplus
    for (let i = 0; i < this._totalPage; i++) {
      // eslint-disable-next-line no-plusplus
      ctx.currentPage++;

      textTabs.push({
        ...p,
        documentId,
        value: value(ctx.currentPage, ctx.totalPage),
        pageNumber: `${i + 1}`,
      });
    }

    // eslint-disable-next-line consistent-return
    return {
      prefillTabs: {
        textTabs,
      },
    };
  }

  get hasPrefillTab(): boolean {
    if (this._hasPrefillTab === undefined) {
      if (this._defaultTabType === DOCUSIGN_TAB_TYPE.PRE_FILLED_TABS) {
        this._hasPrefillTab = true;
        return true;
      }

      const hasPrefillTab = this._rawTabs.find(e => e.tabType === DOCUSIGN_TAB_TYPE.PRE_FILLED_TABS);

      this._hasPrefillTab = !!hasPrefillTab;

      return this._hasPrefillTab;
    }

    return this._hasPrefillTab;
  }

  fromTabs(_tabs: any): ICompiledTemplate.ExtractedTabValue<T> {
    throw new Error('Not implemented');
  }

  get totalPage(): number {
    return this._totalPage;
  }

  set totalPage(count: number) {
    if (this._noPageNumber) {
      this._totalPage = 0;
      return;
    }

    this._totalPage = count ?? 0;
  }

  get requirePageNumber(): boolean {
    if (this._noPageNumber) return false;

    return this._totalPage === 0;
  }
}
