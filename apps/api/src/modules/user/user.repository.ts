import { User } from "@generated/prisma";
import { Injectable } from "@nestjs/common";

import { DatabaseService } from "@/database/database.service";

import {
  CreateUserInput,
  FindUserByEmailInput,
  FindUserByIdInput,
} from "./user.types";

@Injectable()
export class UserRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async create(input: CreateUserInput): Promise<User> {
    const client = this.databaseService.resolveClient(
      input.ctx,
      this.databaseService.client
    );
    return client.user.create({
      data: {
        email: input.email,
        firstName: input.firstName,
        lastName: input.lastName,
        passwordHash: input.password,
      },
    });
  }
  async findByEmail(input: FindUserByEmailInput): Promise<User | null> {
    const client = this.databaseService.resolveClient(
      input.ctx,
      this.databaseService.client
    );
    return client.user.findUnique({
      where: { email: input.email },
    });
  }
  async findById(input: FindUserByIdInput): Promise<User | null> {
    const client = this.databaseService.resolveClient(
      input.ctx,
      this.databaseService.client
    );
    return client.user.findUnique({
      where: { id: input.id },
    });
  }
}
