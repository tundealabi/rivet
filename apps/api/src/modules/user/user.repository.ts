import { User } from "@generated/prisma";
import { Injectable } from "@nestjs/common";

import { DatabaseService } from "@/database/database.service";
import { DbOptions } from "@/database/database.types";

import { CreateUserInput } from "./user.types";

@Injectable()
export class UserRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async create(input: CreateUserInput, options?: DbOptions): Promise<User> {
    const client = this.databaseService.resolveClient(options);
    return client.user.create({
      data: {
        email: input.email,
        firstName: input.firstName,
        lastName: input.lastName,
        passwordHash: input.hashedPassword,
      },
    });
  }
  async findByEmail(email: string, options?: DbOptions): Promise<User | null> {
    const client = this.databaseService.resolveClient(options);
    return client.user.findUnique({
      where: { email },
    });
  }
  async findById(id: string, options?: DbOptions): Promise<User | null> {
    const client = this.databaseService.resolveClient(options);
    return client.user.findUnique({
      where: { id },
    });
  }
}
