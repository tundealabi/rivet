import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import type { Request } from "express";
import { ClsService } from "nestjs-cls";
import { PinoLogger } from "nestjs-pino";
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";

import type { TenantContextStore } from "@/common/constants";
import { Helpers } from "@/common/helpers";

@Injectable()
export class PinoTenantBindingsInterceptor implements NestInterceptor {
  constructor(
    private readonly cls: ClsService<TenantContextStore>,
    private readonly logger: PinoLogger
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== "http") {
      return next.handle();
    }

    this.bindTenantFields(context);

    return next.handle().pipe(
      tap({
        error: () => this.bindTenantFields(context),
        next: () => this.bindTenantFields(context),
      })
    );
  }

  private bindTenantFields(context: ExecutionContext): void {
    const fields = Helpers.tenantFieldsFromCls(this.cls);

    if (fields.orgId === undefined && fields.userId === undefined) {
      return;
    }

    const request = context.switchToHttp().getRequest<Request>();
    request.logFields = { ...request.logFields, ...fields };

    try {
      this.logger.assign(fields);
    } catch {
      // assign() requires nestjs-pino request storage
    }
  }
}
