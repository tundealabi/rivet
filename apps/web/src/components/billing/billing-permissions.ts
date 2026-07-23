import { OrganizationRole } from "@rivet/shared";

/** Only owners can view and manage billing. */
export function canViewBilling(role: OrganizationRole): boolean {
  return role === OrganizationRole.OWNER;
}

/** Only owners can change plans, cancel, or open the Stripe portal. */
export function canManageBilling(role: OrganizationRole): boolean {
  return role === OrganizationRole.OWNER;
}
