import { Injectable } from "@nestjs/common";

import { DatabaseService } from "@/database/database.service";
import { DbOptions } from "@/database/database.types";
import {
  UserCreateArgs,
  UserFindUniqueArgs,
  UserUpdateArgs,
} from "@/generated/prisma/models";

@Injectable()
export class UserRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async create<T extends UserCreateArgs>(args: T, dbOptions?: DbOptions) {
    const client = this.databaseService.resolveClient(dbOptions);
    return client.user.create(args);
  }

  async findUnique<T extends UserFindUniqueArgs>(
    args: T,
    dbOptions?: DbOptions
  ) {
    const client = this.databaseService.resolveClient(dbOptions);
    return client.user.findUnique(args);
  }

  async update<T extends UserUpdateArgs>(args: T, dbOptions?: DbOptions) {
    const client = this.databaseService.resolveClient(dbOptions);
    return client.user.update(args);
  }
}
