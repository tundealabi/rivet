import { User } from "@generated/prisma";
import { Injectable } from "@nestjs/common";
import { ErrorCode, ErrorMessage } from "@rivet/shared/enums";

import { DomainError } from "@/common/errors";
import { DatabaseService } from "@/database/database.service";
import { DbOptions } from "@/database/database.types";

import { UserRepository } from "./user.repository";
import { CreateUserInput } from "./user.types";

@Injectable()
export class UserService {
  constructor(
    private readonly databaseService: DatabaseService,

    private readonly userRepository: UserRepository
  ) {}

  async create(input: CreateUserInput, options?: DbOptions): Promise<User> {
    try {
      return await this.userRepository.create(input, options);
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

  async findByEmail(email: string, options?: DbOptions) {
    return this.userRepository.findByEmail(email, options);
  }

  async findById(id: string, options?: DbOptions) {
    return this.userRepository.findById(id, options);
  }
}
