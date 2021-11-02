import { IContext } from './IContext';

export interface IDocusignContextStore {
  run(cb: () => void): void;

  get<T>(): IContext<T>;
}
