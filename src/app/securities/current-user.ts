import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export type CurrentUserType = {
  userId: string;
  userName: string;
  role: string;
};

export const CurrentUser = createParamDecorator((data: string, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  const { user } = request;

  return data ? user && user[data] : user;
});
