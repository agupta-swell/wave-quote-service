import { ILoggedInUser } from './current-user';

export enum DOWNLOADABLE_RESOURCE {
  CONTRACT = 'CONTRACT',
}

export interface IDownloadResourcePayload extends ILoggedInUser {
  userRoles: ['download_resource'];
  type: DOWNLOADABLE_RESOURCE;
  resourceId: string;
  filename: string;
  contentType: string;
}
