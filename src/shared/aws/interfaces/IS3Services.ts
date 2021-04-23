export interface IS3GetUrlOptions {
  /**
   * @param extName file extention, eg: pdf, html, js, etc,...
   */
  extName?: string;

  /**
   * @param rootDir
   * `true` use fileName as a parent directory
   *
   * `string` use defined rootDir as a parent directory
   *
   * `false` dont use directory
   */
  rootDir?: boolean | string;

  expires?: number;

  /**
   * @param downloadable
   * `true` set content-disposition header
   */
  downloadable?: boolean;

  /**
   * @param responseContentType set content-type header
   * `true` use mime type from the exact file's ext name
   *
   * `string` use provide value as a content-type
   *
   * `false` do nothing
   */
  responseContentType?: boolean | string;
}
