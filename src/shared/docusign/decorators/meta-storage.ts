import * as crypto from 'crypto';
import { DOCUSIGN_TAB_META, KEYS } from '../constants';
import { ICompiledTemplate } from '../interfaces/ICompiledTemplate';
import { IMetaTemplate } from '../interfaces/IMetaTemplate';
import { TemplateCompiler } from '../TemplateCompiler';

export const docusignMetaStorage: Array<ICompiledTemplate<unknown, unknown>> = [];

export const registerTemplate = (target: Function, env: string, id: string) => {
  const meta: IMetaTemplate[] | undefined = Reflect.getMetadata(KEYS.META, target);

  if (!meta) {
    const refId = crypto.randomBytes(4).toString('hex');

    Reflect.defineMetadata('docusign:template:classRefId', refId, target);

    Reflect.defineMetadata(KEYS.META, [{ env, id }], target);

    docusignMetaStorage.push(new TemplateCompiler(target as any));

    return;
  }

  meta.push({
    env,
    id,
  });

  const refId = Reflect.getMetadata('docusign:template:classRefId', target);

  const existTemplate = docusignMetaStorage.find(e => e.refId === refId);

  if (existTemplate) {
    existTemplate.refresh();
  }
};

export const registerTab = (type: DOCUSIGN_TAB_META, value: any, prop: string, target: Object) => {
  let metaKey: Symbol;

  switch (type) {
    case DOCUSIGN_TAB_META.TAB_DYNAMIC:
      metaKey = KEYS.TAB_DYNAMIC;
      break;
    case DOCUSIGN_TAB_META.TAB_LABEL:
      metaKey = KEYS.TAB_LABEL;
      break;
    case DOCUSIGN_TAB_META.TAB_TYPE:
      metaKey = KEYS.TAB_TYPE;
      break;
    case DOCUSIGN_TAB_META.TAB_VALUE:
      metaKey = KEYS.TAB_VALUE;
      break;
    default:
      throw new Error('Invalid docusign tab type');
  }
  Reflect.defineMetadata(metaKey, value, target.constructor, prop);

  const props: string[] = Reflect.getMetadata(KEYS.PROP, target.constructor);

  if (!props) {
    Reflect.defineMetadata(KEYS.PROP, [prop], target.constructor);
    return;
  }

  if (props.includes(prop)) {
    return;
  }

  props.push(prop);
};
