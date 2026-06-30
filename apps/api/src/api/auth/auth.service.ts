import { OrganizationRole } from "@generated/prisma";
import { Injectable } from "@nestjs/common";

import { DatabaseService } from "@/database/database.service";
import { AuthTokenService } from "@/modules/auth/services";
import { OrgService } from "@/modules/org/org.service";
import { OrgMemberService } from "@/modules/org-member/org-member.service";
import { UserService } from "@/modules/user/user.service";

import { RegisterAuthInput } from "./auth.types";

@Injectable()
export class AuthService {
  constructor(
    private readonly authTokenService: AuthTokenService,
    private readonly databaseService: DatabaseService,
    private readonly orgService: OrgService,
    private readonly orgMemberService: OrgMemberService,
    private readonly userService: UserService
  ) {}

  //   async login(input: LoginAuthInput): Promise<void> {
  //     await this.userService.login(input);
  //   }

  async register(input: RegisterAuthInput) {
    const { user, org } = await this.databaseService.client.$transaction(
      async (tx) => {
        const user = await this.userService.create({
          email: input.email,
          firstName: input.firstName,
          lastName: input.lastName,
          password: input.password,
          ctx: { tx },
        });
        const org = await this.orgService.create({
          name: input.orgName,
          ctx: { tx },
        });
        await this.orgMemberService.create({
          userId: user.id,
          orgId: org.id,
          role: OrganizationRole.OWNER,
          ctx: { tx },
        });
        return {
          user,
          org,
        };
      }
    );
    const accessToken = await this.authTokenService.generateAccessToken({
      userId: user.id,
    });
    const refreshToken = await this.authTokenService.generateRefreshToken({
      userId: user.id,
    });
    return {
      authTokens: {
        accessToken,
        refreshToken,
      },
      org,
      user,
    };
  }
}
