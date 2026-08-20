import { Organization } from "@generated/prisma";
import { Injectable } from "@nestjs/common";

import { DbOptions } from "@/database/database.types";

import { OrgRepository } from "./org.repository";
import {
  CreateOrgInput,
  FindOrgByStripeCustomerIdInput,
  UpdateOrgBillingFromSubscriptionInput,
  UpdateOrgStripeCustomerInput,
} from "./org.types";

@Injectable()
export class OrgService {
  constructor(private readonly orgRepository: OrgRepository) {}

  async create(
    input: CreateOrgInput,
    options?: DbOptions
  ): Promise<Organization> {
    return this.orgRepository.create({ data: { name: input.name } }, options);
  }

  async findById(
    id: string,
    options?: DbOptions
  ): Promise<Organization | null> {
    return this.orgRepository.findUnique({ where: { id } }, options);
  }

  async findByStripeCustomerId(
    input: FindOrgByStripeCustomerIdInput,
    options?: DbOptions
  ): Promise<Organization | null> {
    return this.orgRepository.findUnique(
      { where: { stripeCustomerId: input.stripeCustomerId } },
      options
    );
  }

  async updateStripeCustomerId(
    input: UpdateOrgStripeCustomerInput,
    options?: DbOptions
  ): Promise<Organization> {
    return this.orgRepository.update(
      {
        data: { stripeCustomerId: input.stripeCustomerId },
        where: { id: input.orgId },
      },
      options
    );
  }

  async updateBillingFromSubscription(
    input: UpdateOrgBillingFromSubscriptionInput,
    options?: DbOptions
  ): Promise<Organization> {
    return this.orgRepository.update(
      {
        data: {
          planTier: input.planTier,
          stripeSubscriptionId: input.stripeSubscriptionId,
        },
        where: { id: input.orgId },
      },
      options
    );
  }
}
