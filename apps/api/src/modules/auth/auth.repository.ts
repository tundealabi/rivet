import { Injectable } from "@nestjs/common";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/client";

import { DatabaseService } from "@/database/database.service";
import { DbOptions } from "@/database/database.types";
import { RefreshToken, Session } from "@/generated/prisma/client";
import {
  RefreshTokenUncheckedCreateInput,
  RefreshTokenUncheckedUpdateInput,
  RefreshTokenWhereUniqueInput,
  SessionUncheckedCreateInput,
  SessionUncheckedUpdateInput,
  SessionWhereUniqueInput,
} from "@/generated/prisma/models";

import {} from "./auth.types";

@Injectable()
export class AuthRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  // ------------------------------
  // Session
  // ------------------------------

  async createSession(
    input: SessionUncheckedCreateInput,
    options?: DbOptions
  ): Promise<Session> {
    const client = this.databaseService.resolveClient(options);
    return client.session.create({ data: input });
  }

  async findSession(
    where: SessionWhereUniqueInput,
    options?: DbOptions
  ): Promise<Session | null> {
    const client = this.databaseService.resolveClient(options);
    return client.session.findUnique({ where });
  }

  async updateSession(
    where: SessionWhereUniqueInput,
    input: SessionUncheckedUpdateInput,
    options?: DbOptions
  ): Promise<Session | null> {
    try {
      const client = this.databaseService.resolveClient(options);
      return client.session.update({ where, data: input });
    } catch (err) {
      if (err instanceof PrismaClientKnownRequestError) {
        if (err.code === "P2025") {
          return null;
        }
      }
      throw err;
    }
  }

  // ------------------------------
  // Refresh Token
  // ------------------------------

  async createRefreshToken(
    input: RefreshTokenUncheckedCreateInput,
    options?: DbOptions
  ): Promise<RefreshToken> {
    const client = this.databaseService.resolveClient(options);
    return client.refreshToken.create({ data: input });
  }

  async findRefreshToken(
    where: RefreshTokenWhereUniqueInput,
    options?: DbOptions
  ): Promise<RefreshToken | null> {
    const client = this.databaseService.resolveClient(options);
    return client.refreshToken.findUnique({ where });
  }

  async updateRefreshToken(
    where: RefreshTokenWhereUniqueInput,
    input: RefreshTokenUncheckedUpdateInput,
    options?: DbOptions
  ): Promise<RefreshToken | null> {
    try {
      const client = this.databaseService.resolveClient(options);
      return client.refreshToken.update({ where, data: input });
    } catch (err) {
      if (err instanceof PrismaClientKnownRequestError) {
        if (err.code === "P2025") {
          return null;
        }
      }
      throw err;
    }
  }
}
