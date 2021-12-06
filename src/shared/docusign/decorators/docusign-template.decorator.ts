import { DOCUSIGN_TAB_TYPE } from '..';
import { KEYS } from '../constants';
import { registerTemplate } from './meta-storage';

/**
 * Register class to Docusign Template Compiler storage
 *
 * @param env
 * @param uuid
 * @returns
 */
export const DocusignTemplate = (env: string, uuid: string): ClassDecorator => target =>
  registerTemplate(target as any, env, uuid);

/**
 * Set default tab type for all properties
 *
 * This option will be overridden if tab is register with `@TabType()`
 *
 * Must be attached before decorating target class with `@DocusignTemplate()`
 * @param tabType
 * @returns
 */
export const DefaultTabType = (tabType: DOCUSIGN_TAB_TYPE): ClassDecorator => target =>
  Reflect.defineMetadata(KEYS.DEFAULT_TAB_TYPE, tabType, target);

/**
 * Set default tab label transformation for all properties
 *
 * This option will be overridden if tab is register with `@TabLabel()`
 *
 * Must be attached before decorating target class with `@DocusignTemplate()`
 * @param tabType
 * @returns
 */
export const DefaultTabTransformation = (
  strategy: 'snake_case' | 'upper_snake_case' | 'pascal_case' | ((prop: string) => string),
): ClassDecorator => target => Reflect.defineMetadata(KEYS.DEFAULT_TAB_STRATEGY, strategy, target);
