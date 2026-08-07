import {
  CallHandler,
  ExecutionContext,
  Inject,
  Injectable,
  NestInterceptor,
  StreamableFile,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ZodSerializationException } from "nestjs-zod";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";

import { isPaginatedResult } from "@/common/types";

/** Metadata key set by nestjs-zod's `ZodSerializerDto`. */
const ZOD_SERIALIZER_DTO_OPTIONS = "ZOD_SERIALIZER_DTO_OPTIONS";

type ZodSchemaLike = {
  array?: () => { parse: (data: unknown) => unknown };
  parse: (data: unknown) => unknown;
};

type ZodDtoLike = {
  schema: ZodSchemaLike;
};

function isZodDtoLike(value: unknown): value is ZodDtoLike {
  return (
    (typeof value === "object" || typeof value === "function") &&
    value !== null &&
    "isZodDto" in value &&
    (value as { isZodDto?: boolean }).isZodDto === true &&
    "schema" in value &&
    typeof (value as ZodDtoLike).schema?.parse === "function"
  );
}

function resolveSchema(schemaOrDto: unknown): ZodSchemaLike {
  if (isZodDtoLike(schemaOrDto)) {
    return schemaOrDto.schema;
  }

  return schemaOrDto as ZodSchemaLike;
}

function parseOrThrow(parse: () => unknown): unknown {
  try {
    return parse();
  } catch (error) {
    throw new ZodSerializationException(error);
  }
}

/**
 * Like nestjs-zod's ZodSerializerInterceptor, but also serializes
 * `PaginatedResult` payloads produced by cursor/offset list endpoints.
 */
@Injectable()
export class ApiZodSerializerInterceptor implements NestInterceptor {
  constructor(@Inject(Reflector) private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const responseSchema = this.reflector.getAllAndOverride<unknown>(
      ZOD_SERIALIZER_DTO_OPTIONS,
      [context.getHandler(), context.getClass()]
    );

    return next.handle().pipe(
      map((res: unknown) => {
        if (!responseSchema || res instanceof StreamableFile) {
          return res;
        }

        if (Array.isArray(responseSchema)) {
          const schema = resolveSchema(responseSchema[0]);
          if (typeof schema.array !== "function") {
            throw new Error(
              "ZodSerializerDto was used with array syntax but the DTO schema does not have an array method"
            );
          }

          const arrSchema = schema.array();

          if (isPaginatedResult(res)) {
            return {
              items: parseOrThrow(() => arrSchema.parse(res.items)),
              pagination: res.pagination,
            };
          }

          return parseOrThrow(() => arrSchema.parse(res));
        }

        const schema = resolveSchema(responseSchema);
        return parseOrThrow(() => schema.parse(res));
      })
    );
  }
}
