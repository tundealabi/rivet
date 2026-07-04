import { EmailVerification } from "@generated/prisma";
import { Injectable } from "@nestjs/common";

import { DatabaseService } from "@/database/database.service";
import { DbOptions } from "@/database/database.types";
import {
  EmailVerificationUncheckedCreateInput,
  EmailVerificationUncheckedUpdateInput,
} from "@/generated/prisma/models";

import { FindEmailVerificationInput } from "./email-verification.types";

@Injectable()
export class EmailVerificationRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async create(
    input: EmailVerificationUncheckedCreateInput,
    options?: DbOptions
  ): Promise<EmailVerification> {
    const client = this.databaseService.resolveClient(options);
    return client.emailVerification.create({ data: input });
  }

  async deleteByUserIdAndContext(
    input: FindEmailVerificationInput,
    options?: DbOptions
  ): Promise<EmailVerification> {
    const client = this.databaseService.resolveClient(options);
    return client.emailVerification.delete({
      where: {
        userId_context: {
          context: input.context,
          userId: input.userId,
        },
      },
    });
  }

  async findByUserIdAndContext(
    input: FindEmailVerificationInput,
    options?: DbOptions
  ): Promise<EmailVerification | null> {
    const client = this.databaseService.resolveClient(options);
    return client.emailVerification.findUnique({
      where: {
        userId_context: {
          context: input.context,
          userId: input.userId,
        },
      },
    });
  }

  async updateByUserIdAndContext(
    input: FindEmailVerificationInput,
    data: EmailVerificationUncheckedUpdateInput,
    options?: DbOptions
  ): Promise<EmailVerification> {
    const client = this.databaseService.resolveClient(options);
    return client.emailVerification.update({
      where: {
        userId_context: {
          context: input.context,
          userId: input.userId,
        },
      },
      data,
    });
  }
}
