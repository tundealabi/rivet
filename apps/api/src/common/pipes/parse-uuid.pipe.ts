import { ArgumentMetadata, Injectable, PipeTransform } from "@nestjs/common";
import { z } from "zod";

import { ValidationError } from "@/common/errors";

const UuidSchema = z.string().uuid();

@Injectable()
export class ParseUuidPipe implements PipeTransform<string, string> {
  transform(value: string, metadata: ArgumentMetadata): string {
    const field = metadata.data ?? "id";
    const parsed = UuidSchema.safeParse(value);

    if (!parsed.success) {
      throw new ValidationError({
        [field]: [{ message: "Must be a valid UUID" }],
      });
    }

    return parsed.data;
  }
}
