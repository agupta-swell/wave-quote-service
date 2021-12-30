import * as _ from 'lodash';

export const toSnakeCase = (prop: string) => _.snakeCase(prop);

export const toUpperSnakeCase = (prop: string) => toSnakeCase(prop).toUpperCase();

export const toPascalCase = (prop: string) => _.upperFirst(_.camelCase(prop));
