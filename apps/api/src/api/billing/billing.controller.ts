import { Controller, Get, HttpStatus, Post, UseGuards } from "@nestjs/common";
import { OrganizationRole } from "@rivet/shared/enums";

import {
  ApiEnvelopeResponse,
  ApiOrgIdHeader,
  RequireOrgRole,
} from "@/common/decorators";
import { OrgMemberGuard, OrgRoleGuard } from "@/common/guards";
import { AuthUserJwtGuard } from "@/modules/auth/auth.guard";

import { BillingService } from "./billing.service";
import { BillingCheckoutResponseDto, BillingSummaryResponseDto } from "./dto";

@Controller("billing")
@UseGuards(AuthUserJwtGuard, OrgMemberGuard, OrgRoleGuard)
@RequireOrgRole(OrganizationRole.OWNER)
@ApiOrgIdHeader()
export class BillingController {
  constructor(private readonly service: BillingService) {}

  @Get()
  @ApiEnvelopeResponse(BillingSummaryResponseDto, {
    auth: "required",
    description: "Get the current organization plan.",
    errorResponses: [
      {
        description: "Not the owner of the organization",
        status: HttpStatus.FORBIDDEN,
      },
    ],
    httpStatus: HttpStatus.OK,
    summary: "Get billing summary",
  })
  getBilling(): Promise<BillingSummaryResponseDto> {
    return this.service.getBilling();
  }

  @Post("checkout")
  @ApiEnvelopeResponse(BillingCheckoutResponseDto, {
    auth: "required",
    description:
      "Create a Stripe Checkout session for PRO monthly. Returns a URL; planTier is set only by the Stripe webhook.",
    errorResponses: [
      {
        description: "Not the owner of the organization",
        status: HttpStatus.FORBIDDEN,
      },
      {
        description: "Organization is already subscribed",
        status: HttpStatus.CONFLICT,
      },
    ],
    httpStatus: HttpStatus.OK,
    summary: "Start Stripe Checkout",
  })
  createCheckout(): Promise<BillingCheckoutResponseDto> {
    return this.service.createCheckout();
  }
}
