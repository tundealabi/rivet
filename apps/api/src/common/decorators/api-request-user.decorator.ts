import { createParamDecorator, ExecutionContext } from "@nestjs/common";

export const ApiRequestUser = createParamDecorator(
  (data: string | undefined, context: ExecutionContext): unknown => {
    const request = context
      .switchToHttp()
      .getRequest<{ user: Record<string, unknown> }>();
    return data ? request.user[data] : request.user;
  }
);
