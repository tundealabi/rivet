import {
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  Link,
  Text,
  Tooltip,
} from "@chakra-ui/react";
import { OrganizationRole } from "@rivet/shared";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { PiPlusBold, PiSignOut } from "react-icons/pi";
import { Link as RouterLink, useSearchParams } from "react-router-dom";

import { AppSidebar } from "../components/app/AppSidebar";
import { useLogout } from "../components/app/use-logout";
import { EASE_OUT, transition } from "../components/issues/issues-motion";
import { InviteMemberDialog } from "../components/members/InviteMemberDialog";
import {
  canInviteMembers,
  canViewPendingInvites,
} from "../components/members/member-permissions";
import {
  countSeatsUsed,
  type OrgMember,
  type PendingInvite,
  PLAN_SEAT_LIMITS,
  seatUsageRatio,
} from "../components/members/member-types";
import {
  RemoveMemberDialog,
  RevokeInviteDialog,
  TransferOwnershipDialog,
} from "../components/members/MemberActionDialogs";
import { MemberProfileDrawer } from "../components/members/MemberProfileDrawer";
import {
  MembersEmptyState,
  MembersErrorState,
  MembersTableSkeleton,
} from "../components/members/MembersPageStates";
import { MembersSeatUsageStrip } from "../components/members/MembersSeatUsageStrip";
import { MembersTableView } from "../components/members/MembersTableView";
import {
  type MembersTab,
  MembersTabs,
} from "../components/members/MembersTabs";
import {
  MOCK_CURRENT_USER_ID,
  MOCK_ORG_ID,
  MOCK_ORG_NAME,
  MOCK_PLAN_TIER,
  MOCK_ROLE,
} from "../components/members/mock-members-data";
import { PendingInvitesTableView } from "../components/members/PendingInvitesTableView";
import {
  MemberNotFoundError,
  useMembersRoster,
  useRemoveMemberMutation,
  useResendInviteMutation,
  useRevokeInviteMutation,
  useSendInvitesMutation,
  useTransferOwnershipMutation,
  useUpdateMemberRoleMutation,
} from "../components/members/use-members-queries";

const SEAT_MUTED = "#52525B";
const SEAT_WARNING = "#D97706";
const SEAT_LIMIT = "#DC2626";

interface SeatUsageSubtitleProps {
  used: number;
  limit: number;
  canUpgrade: boolean;
  onBillingClick: () => void;
}

function SeatUsageSubtitle({
  used,
  limit,
  canUpgrade,
  onBillingClick,
}: SeatUsageSubtitleProps) {
  const ratio = seatUsageRatio(used, limit);
  const atLimit = used >= limit;
  const nearLimit = !atLimit && ratio >= 0.8;
  const color = atLimit ? SEAT_LIMIT : nearLimit ? SEAT_WARNING : SEAT_MUTED;

  return (
    <Text fontSize="sm" mt="1" transition={transition.base}>
      <Text as="span" color={color}>
        {used} of {limit} seats used
      </Text>
      {canUpgrade && atLimit && (
        <>
          {" · "}
          <Box
            as="button"
            display="inline"
            color="accent.default"
            fontWeight="medium"
            cursor="pointer"
            bg="transparent"
            border="none"
            p="0"
            fontSize="inherit"
            onClick={onBillingClick}
          >
            Upgrade
          </Box>
        </>
      )}
    </Text>
  );
}

function goToBilling() {
  toast("Billing upgrades coming soon", { icon: "🚀" });
}

export default function MembersPage() {
  const [searchParams] = useSearchParams();
  const orgId = MOCK_ORG_ID;
  const actorRole = MOCK_ROLE;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<MembersTab>(() =>
    searchParams.get("tab") === "pending" ? "pending" : "members"
  );
  const [profileMember, setProfileMember] = useState<OrgMember | null>(null);
  const [removeTarget, setRemoveTarget] = useState<OrgMember | null>(null);
  const [transferTarget, setTransferTarget] = useState<OrgMember | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<PendingInvite | null>(null);
  const logout = useLogout();

  const rosterQuery = useMembersRoster(orgId);
  const sendInvitesMutation = useSendInvitesMutation(orgId);
  const updateRoleMutation = useUpdateMemberRoleMutation(orgId);
  const removeMemberMutation = useRemoveMemberMutation(orgId);
  const revokeInviteMutation = useRevokeInviteMutation(orgId);
  const resendInviteMutation = useResendInviteMutation(orgId);
  const transferOwnershipMutation = useTransferOwnershipMutation(
    orgId,
    MOCK_CURRENT_USER_ID
  );

  const members = useMemo(
    () => rosterQuery.data?.members ?? [],
    [rosterQuery.data]
  );
  const invites = useMemo(
    () => rosterQuery.data?.invites ?? [],
    [rosterQuery.data]
  );

  const seatLimit = PLAN_SEAT_LIMITS[MOCK_PLAN_TIER];
  const seatsUsed = useMemo(
    () => countSeatsUsed(members, invites),
    [members, invites]
  );
  const atSeatLimit = seatsUsed >= seatLimit;
  const canManage = canInviteMembers(actorRole);
  const showPendingTab = canViewPendingInvites(actorRole);

  const activeMembers = useMemo(
    () => members.filter((member) => member.status === "active"),
    [members]
  );

  const existingInviteEmails = useMemo(() => {
    const emails = new Set<string>();
    for (const member of members) emails.add(member.email.toLowerCase());
    for (const invite of invites) emails.add(invite.email.toLowerCase());
    return emails;
  }, [members, invites]);

  const handleRoleChange = async (memberId: string, role: OrganizationRole) => {
    try {
      await updateRoleMutation.mutateAsync({ memberId, role });
      toast.success("Role updated");
    } catch (error) {
      if (error instanceof MemberNotFoundError) {
        toast("This member no longer exists.");
        return;
      }
      toast.error("Couldn't update role — try again");
    }
  };

  const handleRemoveConfirm = () => {
    if (!removeTarget) return;
    const name = `${removeTarget.firstName} ${removeTarget.lastName}`.trim();
    removeMemberMutation.mutate(removeTarget.id, {
      onSuccess: () => {
        toast.success(`${name} removed from the organization`);
        setRemoveTarget(null);
      },
    });
  };

  const handleTransferConfirm = () => {
    if (!transferTarget) return;
    transferOwnershipMutation.mutate(transferTarget.id, {
      onSuccess: () => {
        toast.success(
          `Ownership transferred to ${transferTarget.firstName} ${transferTarget.lastName}`
        );
        setTransferTarget(null);
      },
    });
  };

  const handleInvite = async (newInvites: PendingInvite[]) => {
    await sendInvitesMutation.mutateAsync(newInvites);
    setActiveTab("pending");
    toast.success(
      `${newInvites.length} invite${newInvites.length === 1 ? "" : "s"} sent`
    );
  };

  const handleRevokeConfirm = () => {
    if (!revokeTarget) return;
    const email = revokeTarget.email;
    revokeInviteMutation.mutate(revokeTarget.id, {
      onSuccess: () => {
        toast.success(`Invite to ${email} revoked`);
        setRevokeTarget(null);
      },
    });
  };

  const inviteButton = canManage ? (
    atSeatLimit ? (
      <Box textAlign={{ base: "left", lg: "right" }}>
        <Tooltip.Root openDelay={200}>
          <Tooltip.Trigger asChild>
            <Box as="span" display="inline-block">
              <Button
                borderRadius="full"
                bg="accent.default"
                color="white"
                fontWeight="semibold"
                disabled
                opacity="0.65"
                cursor="not-allowed"
              >
                <PiPlusBold />
                Invite member
              </Button>
            </Box>
          </Tooltip.Trigger>
          <Tooltip.Positioner>
            <Tooltip.Content
              bg="fg.primary"
              color="white"
              px="3"
              py="2"
              borderRadius="control"
              fontSize="sm"
              maxW="xs"
            >
              Seat limit reached — upgrade to invite more
            </Tooltip.Content>
          </Tooltip.Positioner>
        </Tooltip.Root>
        <Text fontSize="xs" color="fg.muted" mt="1.5">
          <Link
            asChild
            color="accent.default"
            fontWeight="medium"
            fontSize="xs"
          >
            <RouterLink
              to="/billing"
              onClick={(e) => {
                e.preventDefault();
                goToBilling();
              }}
            >
              Upgrade
            </RouterLink>
          </Link>
        </Text>
      </Box>
    ) : (
      <Button
        borderRadius="full"
        bg="accent.default"
        color="white"
        fontWeight="semibold"
        _hover={{ bg: "accent.hover" }}
        onClick={() => setDialogOpen(true)}
      >
        <PiPlusBold />
        Invite member
      </Button>
    )
  ) : null;

  const loadState = rosterQuery.isLoading
    ? "loading"
    : rosterQuery.isError
      ? "error"
      : "success";

  const renderContent = () => {
    if (loadState === "loading") {
      return <MembersTableSkeleton rows={activeTab === "members" ? 8 : 4} />;
    }

    if (loadState === "error") {
      return <MembersErrorState onRetry={() => void rosterQuery.refetch()} />;
    }

    if (activeTab === "pending") {
      return (
        <PendingInvitesTableView
          invites={invites}
          actorRole={actorRole}
          onRequestRevoke={setRevokeTarget}
          onResend={(inviteId) => resendInviteMutation.mutate(inviteId)}
        />
      );
    }

    if (activeMembers.length === 0) {
      return (
        <MembersEmptyState
          onInvite={() => setDialogOpen(true)}
          canInvite={canManage && !atSeatLimit}
        />
      );
    }

    return (
      <MembersTableView
        members={activeMembers}
        actorRole={actorRole}
        currentUserId={MOCK_CURRENT_USER_ID}
        onRoleChange={handleRoleChange}
        onRemove={(memberId) => {
          const target = members.find((m) => m.id === memberId) ?? null;
          setRemoveTarget(target);
        }}
        onTransferOwnership={(memberId) => {
          const target = members.find((m) => m.id === memberId) ?? null;
          setTransferTarget(target);
        }}
        onViewProfile={setProfileMember}
        onInvite={() => setDialogOpen(true)}
        canInvite={canManage && !atSeatLimit}
      />
    );
  };

  return (
    <Flex minH="100svh" bg="bg.canvas">
      <AppSidebar onLogout={logout} />

      <Box
        flex="1"
        minW="0"
        display="flex"
        flexDirection="column"
        overflow="hidden"
      >
        <Flex
          as="header"
          align={{ base: "flex-start", lg: "center" }}
          justify="space-between"
          direction={{ base: "column", lg: "row" }}
          px={{ base: "5", md: "10" }}
          py="5"
          borderBottomWidth="1px"
          borderColor="border.default"
          bg="bg.surface"
          gap="4"
          flexShrink="0"
          boxShadow="0 1px 0 rgba(0,0,0,0.03)"
          animation={`rivet-fade-in 0.4s ${EASE_OUT} both`}
        >
          <Box>
            <Heading
              size="xl"
              color="fg.primary"
              letterSpacing="-0.03em"
              fontWeight="semibold"
            >
              Members
            </Heading>
            {loadState === "success" && (
              <SeatUsageSubtitle
                used={seatsUsed}
                limit={seatLimit}
                canUpgrade={canManage}
                onBillingClick={goToBilling}
              />
            )}
            {loadState === "loading" && (
              <Text fontSize="sm" color={SEAT_MUTED} mt="1">
                Loading seat usage…
              </Text>
            )}
          </Box>

          <HStack gap="3" flexWrap="wrap">
            <Button
              variant="outline"
              size="sm"
              borderRadius="control"
              borderColor="status.error"
              color="status.error"
              fontWeight="medium"
              display={{ base: "inline-flex", md: "none" }}
              _hover={{
                bg: "danger.ghostHover",
                color: "status.error",
                borderColor: "status.error",
              }}
              onClick={logout}
            >
              <PiSignOut size={16} />
              Log out
            </Button>
            {inviteButton}
          </HStack>
        </Flex>

        {loadState === "success" && canManage && (
          <MembersSeatUsageStrip
            planTier={MOCK_PLAN_TIER}
            seatsUsed={seatsUsed}
            seatLimit={seatLimit}
            onUpgrade={goToBilling}
          />
        )}

        {loadState === "success" && (
          <MembersTabs
            value={activeTab}
            onChange={setActiveTab}
            pendingCount={invites.length}
            showPendingTab={showPendingTab}
          />
        )}

        <Box px={{ base: "5", md: "10" }} py="8" flex="1" overflow="auto">
          {renderContent()}
        </Box>
      </Box>

      <InviteMemberDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onInvite={handleInvite}
        orgName={MOCK_ORG_NAME}
        seatsUsed={seatsUsed}
        seatLimit={seatLimit}
        existingEmails={existingInviteEmails}
        onUpgrade={goToBilling}
      />

      <MemberProfileDrawer
        member={profileMember}
        open={profileMember !== null}
        onClose={() => setProfileMember(null)}
      />

      <RemoveMemberDialog
        member={removeTarget}
        orgName={MOCK_ORG_NAME}
        open={removeTarget !== null}
        onOpenChange={(open) => {
          if (!open) setRemoveTarget(null);
        }}
        onConfirm={handleRemoveConfirm}
      />

      <TransferOwnershipDialog
        member={transferTarget}
        orgName={MOCK_ORG_NAME}
        open={transferTarget !== null}
        onOpenChange={(open) => {
          if (!open) setTransferTarget(null);
        }}
        onConfirm={handleTransferConfirm}
      />

      <RevokeInviteDialog
        email={revokeTarget?.email ?? null}
        open={revokeTarget !== null}
        onOpenChange={(open) => {
          if (!open) setRevokeTarget(null);
        }}
        onConfirm={handleRevokeConfirm}
      />
    </Flex>
  );
}
