import { COMPONENT_TYPE } from '../constants';

export interface IComponent {
  insertionRule?: string;
  relatedComponent: COMPONENT_TYPE;
}
