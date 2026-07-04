import { Module } from "@nestjs/common";

import { DatabaseModule } from "@/database/database.module";

import { EmailVerificationRepository } from "./email-verification.repository";
import { EmailVerificationService } from "./email-verification.service";

@Module({
  imports: [DatabaseModule],
  providers: [EmailVerificationRepository, EmailVerificationService],
  exports: [EmailVerificationService],
})
export class EmailVerificationModule {}
