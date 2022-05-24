type AnyFunction = (...args: any[]) => any;

export type QueueTarget = Promise<any> | AnyFunction;

export type QueueItem = () => QueueTarget;

export interface IQueueStore {
  /**
   * All tasks will be called over `Promise.all` before sending response
   * If exeption occurs, it is handled by NestJS as normal exception
   */
  beforeRes: QueueItem[];

  /**
   * All tasks in after res will be called concurrently after sending response
   *
   * If exeption occurs, it is printed out immediately
   *
   */
  afterRes: QueueItem[];

  /**
   * Cache storage at context level
   */
  cache: Map<PropertyKey, unknown>;
}
export interface IAsyncContext {
  /**
   * Queue up task to run after response being ended
   * @param cb
   */
  queue(item: QueueItem): void;

  /**
   * Queue task to run before sending a response
   * @param cb
   */
  queueBeforeRes(cb: () => QueueItem): void;

  /**
   * Flag to indicate if some of the beforeRes tasks are not completed yet
   */
  readonly hasPendingTasks: boolean;
}
