import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { IEmailSchema } from 'src/users/user.schema';

export interface ILoggedInUser {
  userId: string;
  userName: string;
  userRoles: string[];
  userEmails: IEmailSchema[];
}

export const CurrentUser = createParamDecorator((data: string, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  const { user } = request;

  return data ? user && user[data] : user;
});
