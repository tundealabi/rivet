import { Injectable } from "@nestjs/common";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/client";

import { DB_PRISMA_ERROR_CODES } from "@/database/database.contants";
import { DatabaseService } from "@/database/database.service";
import { DbOptions } from "@/database/database.types";
import {
  RefreshTokenCreateArgs,
  RefreshTokenFindUniqueArgs,
  RefreshTokenUpdateArgs,
  SessionCreateArgs,
  SessionFindUniqueArgs,
  SessionUpdateArgs,
} from "@/generated/prisma/models";

@Injectable()
export class AuthRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  // ------------------------------
  // Session
  // ------------------------------

  async createSession<T extends SessionCreateArgs>(
    args: T,
    dbOptions?: DbOptions
  ) {
    const client = this.databaseService.resolveClient(dbOptions);
    return client.session.create(args);
  }

  async findUniqueSession<T extends SessionFindUniqueArgs>(
    args: T,
    dbOptions?: DbOptions
  ) {
    const client = this.databaseService.resolveClient(dbOptions);
    return client.session.findUnique(args);
  }

  async updateSession<T extends SessionUpdateArgs>(
    args: T,
    dbOptions?: DbOptions
  ) {
    try {
      const client = this.databaseService.resolveClient(dbOptions);
      return await client.session.update(args);
    } catch (err) {
      if (err instanceof PrismaClientKnownRequestError) {
        if (err.code === DB_PRISMA_ERROR_CODES.NOT_FOUND) {
          return null;
        }
      }
      throw err;
    }
  }

  // ------------------------------
  // Refresh Token
  // ------------------------------

  async createRefreshToken<T extends RefreshTokenCreateArgs>(
    args: T,
    dbOptions?: DbOptions
  ) {
    const client = this.databaseService.resolveClient(dbOptions);
    return client.refreshToken.create(args);
  }

  async findUniqueRefreshToken<T extends RefreshTokenFindUniqueArgs>(
    args: T,
    dbOptions?: DbOptions
  ) {
    const client = this.databaseService.resolveClient(dbOptions);
    return client.refreshToken.findUnique(args);
  }

  async updateRefreshToken<T extends RefreshTokenUpdateArgs>(
    args: T,
    dbOptions?: DbOptions
  ) {
    try {
      const client = this.databaseService.resolveClient(dbOptions);
      return await client.refreshToken.update(args);
    } catch (err) {
      if (err instanceof PrismaClientKnownRequestError) {
        if (err.code === DB_PRISMA_ERROR_CODES.NOT_FOUND) {
          return null;
        }
      }
      throw err;
    }
  }
}
