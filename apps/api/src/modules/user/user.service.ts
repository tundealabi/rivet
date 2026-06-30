import { Prisma, User } from "@generated/prisma";
import { Injectable } from "@nestjs/common";
import { ErrorCode, ErrorMessage } from "@rivet/shared/enums";

import { DomainError } from "@/common/errors";
import { HashService } from "@/common/services";
import { DatabaseService } from "@/database/database.service";

import { UserRepository } from "./user.repository";
import { CreateUserInput } from "./user.types";

@Injectable()
export class UserService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly hashService: HashService,
    private readonly userRepository: UserRepository
  ) {}

  async create(input: CreateUserInput): Promise<User> {
    const runCreate = async (tx: Prisma.TransactionClient) => {
      const existing = await this.userRepository.findByEmail({
        email: input.email,
        ctx: { tx },
      });
      if (existing) {
        throw new DomainError(
          "CONFLICT",
          ErrorCode.AUTH_EMAIL_ALREADY_EXISTS,
          ErrorMessage.AUTH_EMAIL_ALREADY_EXISTS
        );
      }
      const passwordHash = await this.hashService.hash(input.password);
      return this.userRepository.create({
        ...input,
        password: passwordHash,
        ctx: { tx },
      });
    };
    try {
      if (input.ctx?.tx) {
        return await runCreate(input.ctx.tx);
      }
      return await this.databaseService.client.$transaction(runCreate);
    } catch (err) {
      if (this.databaseService.isUniqueConstraintViolationError(err, "email")) {
        throw new DomainError(
          "CONFLICT",
          ErrorCode.AUTH_EMAIL_ALREADY_EXISTS,
          ErrorMessage.AUTH_EMAIL_ALREADY_EXISTS
        );
      }
      throw err;
    }
  }
}
