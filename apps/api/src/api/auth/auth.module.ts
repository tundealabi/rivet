import { Module } from "@nestjs/common";

import { CommonModule } from "@/common/common.module";
import { DatabaseModule } from "@/database/database.module";
import { AuthModule } from "@/modules/auth/auth.module";
import { EmailVerificationModule } from "@/modules/email-verification/email-verification.module";
import { OrgModule } from "@/modules/org/org.module";
import { OrgMemberModule } from "@/modules/org-member/org-member.module";
import { UserModule } from "@/modules/user/user.module";

import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";

@Module({
  imports: [
    AuthModule,
    CommonModule,
    DatabaseModule,
    EmailVerificationModule,
    UserModule,
    OrgModule,
    OrgMemberModule,
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class ApiAuthModule {}
