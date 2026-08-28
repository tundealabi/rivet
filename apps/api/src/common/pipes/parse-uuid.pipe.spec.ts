import type { ArgumentMetadata } from "@nestjs/common";

import { ValidationError } from "@/common/errors";

import { ParseUuidPipe } from "./parse-uuid.pipe";

describe("ParseUuidPipe", () => {
  const pipe = new ParseUuidPipe();
  const paramMetadata = (data: string): ArgumentMetadata => ({
    data,
    metatype: String,
    type: "param",
  });

  it("returns a valid UUID unchanged", () => {
    const id = "3210a585-ec37-479c-bbe2-5c358646a2f3";

    expect(pipe.transform(id, paramMetadata("id"))).toBe(id);
  });

  it("throws ValidationError with the route param name as the field key", () => {
    expect(() => pipe.transform("p1", paramMetadata("id"))).toThrow(
      ValidationError
    );

    try {
      pipe.transform("p1", paramMetadata("id"));
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationError);
      expect((error as ValidationError).fields.id).toEqual([
        { message: "Must be a valid UUID" },
      ]);
    }
  });

  it("uses the declared param name for nested route params", () => {
    try {
      pipe.transform("bad", paramMetadata("commentId"));
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationError);
      expect((error as ValidationError).fields.commentId).toEqual([
        { message: "Must be a valid UUID" },
      ]);
    }
  });
});
