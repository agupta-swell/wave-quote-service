import { Text } from 'docusign-esign';

type DynamicTabValue = (page: number, totalPage: number) => string;

export interface IPageNumberFormatter extends Omit<Text, 'value'> {
  value: DynamicTabValue;
}
