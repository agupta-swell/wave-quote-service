export enum DOCUSIGN_TAB_TYPE {
  TEXT_TABS = 1,
  PRE_FILLED_TABS,
}

export enum DOCUSIGN_TAB_META {
  TAB_TYPE = 1,
  TAB_LABEL,
  TAB_VALUE,
  TAB_DYNAMIC,
  ON_TAB_FAILED_REQUIRE,
}

export const KEYS = {
  TAB_TYPE: Symbol.for('kDocusign/tab/type'),
  TAB_LABEL: Symbol.for('kDocusign/tab/label'),
  TAB_VALUE: Symbol.for('kDocusign/tab/value'),
  ON_TAB_FAILED_REQUIRE: Symbol.for('kDocusign/tab/failedRequire'),
  TAB_DYNAMIC: Symbol.for('kDocusign/tab/dynamic'),
  TEMPLATE_ENV: Symbol.for('kDocusign/template/id'),
  PROP: Symbol.for('kDocusign/template/prop'),
  META: Symbol.for('KDocusign/template/meta'),
  CONTEXT: Symbol.for('kDocusign/di-context'),
  DEFAULT_TAB_TYPE: Symbol.for('kDocusign/template/defaultTabType'),
  DEFAULT_TAB_STRATEGY: Symbol.for('kDocusign/template/tabStrategy'),
  PAGE_NUMBER_FORMATTER: Symbol.for('kDocusign/pageNumberFormatter'),
};
