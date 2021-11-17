export enum DOCUSIGN_TAB_TYPE {
  TEXT_TABS = 1,
  PRE_FILLED_TABS,
}

export enum DOCUSIGN_TAB_META {
  TAB_TYPE = 1,
  TAB_LABEL,
  TAB_VALUE,
  TAB_DYNAMIC,
}

export const KEYS = {
  TAB_TYPE: Symbol.for('kDocusign/template/tabType'),
  TAB_LABEL: Symbol.for('kDocusign/template/tabLabel'),
  TAB_VALUE: Symbol.for('kDocusign/template/tabValue'),
  TAB_DYNAMIC: Symbol.for('kDocusign/template/tabDynamic'),
  TEMPLATE_ENV: Symbol.for('kDocusign/template/id'),
  PROP: Symbol.for('kDocusign/template/prop'),
  META: Symbol.for('KDocusign/template/meta'),
  CONTEXT: Symbol.for('kDocusign/di-context'),
  DEFAULT_TAB_TYPE: Symbol.for('kDocusign/template/defaultTabType'),
  DEFAULT_TAB_STRATEGY: Symbol.for('kDocusign/template/tabStrategy'),
};
