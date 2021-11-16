export interface IMultipartBuilder {
  /**
   * Return content type with generated boundary
   */
  getType(): string;

  pipe(writable: NodeJS.WritableStream): void;
}
