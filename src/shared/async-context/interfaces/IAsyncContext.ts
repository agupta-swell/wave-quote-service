type AnyFunction = (...args: any[]) => any;

export type QueueTarget = Promise<any> | AnyFunction;

export type QueueItem = () => QueueTarget

export interface IAsyncContext {
  queue(cb: () => QueueItem): void;
}
