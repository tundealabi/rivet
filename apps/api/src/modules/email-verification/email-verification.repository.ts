import { Injectable } from "@nestjs/common";

import { DatabaseService } from "@/database/database.service";
import { DbOptions } from "@/database/database.types";
import {
  EmailVerificationCreateArgs,
  EmailVerificationDeleteArgs,
  EmailVerificationFindUniqueArgs,
  EmailVerificationUpdateArgs,
} from "@/generated/prisma/models";

@Injectable()
export class EmailVerificationRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async create<T extends EmailVerificationCreateArgs>(
    args: T,
    dbOptions?: DbOptions
  ) {
    const client = this.databaseService.resolveClient(dbOptions);
    return client.emailVerification.create(args);
  }

  async delete<T extends EmailVerificationDeleteArgs>(
    args: T,
    dbOptions?: DbOptions
  ) {
    const client = this.databaseService.resolveClient(dbOptions);
    return client.emailVerification.delete(args);
  }

  async findUnique<T extends EmailVerificationFindUniqueArgs>(
    args: T,
    dbOptions?: DbOptions
  ) {
    const client = this.databaseService.resolveClient(dbOptions);
    return client.emailVerification.findUnique(args);
  }

  async update<T extends EmailVerificationUpdateArgs>(
    args: T,
    dbOptions?: DbOptions
  ) {
    const client = this.databaseService.resolveClient(dbOptions);
    return client.emailVerification.update(args);
  }
}
