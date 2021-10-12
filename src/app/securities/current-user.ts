import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface ILoggedInUser {
  userId: string;
  userName: string;
  userRoles: string[];
}

export const CurrentUser = createParamDecorator((data: string, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  const { user } = request;

  return data ? user && user[data] : user;
});
