import { Box, Button, Flex, Heading, HStack, Text } from "@chakra-ui/react";
import { useMemo, useState } from "react";
import { PiSignOut } from "react-icons/pi";
import { useNavigate } from "react-router-dom";

import { getStoredUser } from "../auth-api";
import { AppSidebar } from "../components/app/AppSidebar";
import { useLogout } from "../components/app/use-logout";
import { SitewidePaymentWarning } from "../components/billing/SitewidePaymentWarning";
import { useActiveOrg } from "../components/billing/use-active-org";
import { useBillingSummary } from "../components/billing/use-billing-queries";
import { sortMyIssues } from "../components/dashboard/dashboard-content";
import { formatDashboardDate } from "../components/dashboard/dashboard-greeting";
import { usesPersonalPulse } from "../components/dashboard/dashboard-permissions";
import {
  DashboardMainGrid,
  DashboardMainGridSkeleton,
} from "../components/dashboard/DashboardMainGrid";
import {
  DashboardErrorState,
  DashboardHeaderSkeleton,
  type DashboardStatCardKey,
  DashboardStatRow,
  DashboardStatRowSkeleton,
  DashboardWelcomeEmptyState,
} from "../components/dashboard/DashboardPageStates";
import { issuesPathForPreset } from "../components/dashboard/issue-list-presets";
import {
  STAT_CARD_KEYS,
  useDashboardActivity,
  useDashboardSnapshot,
  useDashboardStatCards,
  useRetryDashboardStatCard,
} from "../components/dashboard/use-dashboard-queries";
import { MOCK_CURRENT_USER } from "../components/issues/mock-issues-data";
import { useProjectsList } from "../components/projects/use-projects-queries";

export default function DashboardPage() {
  const logout = useLogout();
  const navigate = useNavigate();
  const { orgId, orgName, role, orgsStatus } = useActiveOrg();
  const billingQuery = useBillingSummary(orgId);
  const paymentPastDue = billingQuery.data?.subscription.pastDue === true;

  const snapshot = useDashboardSnapshot(orgId);
  const projectsQuery = useProjectsList(orgId);
  const projects = projectsQuery.data ?? [];
  const personalFourthCard = usesPersonalPulse(role);

  const projectsLoading =
    orgsStatus === "loading" ||
    (Boolean(orgId) && projectsQuery.isPending && !projectsQuery.data);
  const projectsError =
    Boolean(orgId) && projectsQuery.isError && !projectsQuery.data;

  const isBrandNewOrg =
    !projectsLoading && !projectsError && projects.length === 0;
  const hasProjects = projects.length > 0;
  const showDashboard = !projectsLoading && !projectsError && !isBrandNewOrg;

  const statCards = useDashboardStatCards(
    orgId,
    MOCK_CURRENT_USER,
    role,
    showDashboard
  );
  const activityQuery = useDashboardActivity(orgId, showDashboard);
  const retryStatCard = useRetryDashboardStatCard(orgId);

  const [retryingCards, setRetryingCards] = useState<
    Partial<Record<DashboardStatCardKey, boolean>>
  >({});

  const firstName = getStoredUser()?.firstName.trim() || "there";
  const dateLabel = formatDashboardDate();

  const failedCards = useMemo(() => {
    const failed: Partial<Record<DashboardStatCardKey, boolean>> = {};
    for (const key of ["open", "in_progress", "done_week", "fourth"] as const) {
      const query = statCards.byKey[key];
      if (query?.isError && !query.data) {
        failed[key] = true;
      }
    }
    return failed;
  }, [statCards.byKey]);

  const displayStats = useMemo(() => {
    const fallback = { value: 0, trend: null };
    const open = statCards.byKey.open?.data ?? fallback;
    const inProgress = statCards.byKey.in_progress?.data ?? fallback;
    const doneThisWeek = statCards.byKey.done_week?.data ?? fallback;
    const fourth = statCards.byKey.fourth?.data ?? fallback;

    const anyCardResolved = STAT_CARD_KEYS.some(
      (key) => statCards.byKey[key]?.data || statCards.byKey[key]?.isError
    );

    if (!anyCardResolved && !hasProjects) {
      return null;
    }

    return {
      open,
      inProgress,
      doneThisWeek,
      fourth,
      fourthLabel: statCards.fourthLabel,
    };
  }, [statCards.byKey, statCards.fourthLabel, hasProjects]);

  const activityIssues = activityQuery.data?.issues ?? snapshot.issues;
  const supplementalActivity =
    activityQuery.data?.supplementalActivity ?? snapshot.supplementalActivity;

  const myIssues = useMemo(
    () => sortMyIssues(activityIssues, MOCK_CURRENT_USER),
    [activityIssues]
  );

  const suggestBrowseProjects =
    activityIssues.length > 0 && myIssues.length === 0;

  const navigateToPreset = (
    preset: Parameters<typeof issuesPathForPreset>[0]
  ) => {
    void navigate(issuesPathForPreset(preset));
  };

  const handleRetryStatCard = async (key: DashboardStatCardKey) => {
    setRetryingCards((prev) => ({ ...prev, [key]: true }));
    try {
      await retryStatCard(key, MOCK_CURRENT_USER, personalFourthCard);
    } finally {
      setRetryingCards((prev) => ({ ...prev, [key]: false }));
    }
  };

  const statsLoading = statCards.isInitialLoading;
  const activityLoading = activityQuery.isLoading && !activityQuery.data;
  const headerLoading = projectsLoading || (statsLoading && showDashboard);
  const showFullPageError = projectsError || statCards.allFailed;

  return (
    <Flex minH="100svh" bg="bg.canvas">
      <AppSidebar onLogout={logout} />

      <Box flex="1" minW="0" display="flex" flexDirection="column">
        {paymentPastDue && <SitewidePaymentWarning />}

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
        >
          {headerLoading ? (
            <DashboardHeaderSkeleton />
          ) : (
            <Box>
              <Heading
                size="2xl"
                color="fg.primary"
                fontWeight="600"
                letterSpacing="-0.02em"
              >
                {isBrandNewOrg
                  ? `Welcome to Rivet, ${firstName}!`
                  : `Hello ${firstName} 👋`}
              </Heading>
              <Text fontSize="sm" color="fg.secondary" mt="1">
                {isBrandNewOrg ? (
                  "Let's get your workspace set up."
                ) : (
                  <>
                    Here's what's happening at{" "}
                    <Text
                      as="span"
                      color="accent.default"
                      fontWeight="semibold"
                    >
                      {orgName}
                    </Text>
                    .
                  </>
                )}
              </Text>
            </Box>
          )}

          <HStack gap="3" alignSelf={{ base: "stretch", lg: "center" }}>
            <Text
              fontSize="sm"
              color="fg.secondary"
              display={{ base: "none", sm: "block" }}
            >
              {dateLabel}
            </Text>
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
          </HStack>
        </Flex>

        <Box px={{ base: "5", md: "10" }} py="8">
          {showFullPageError && (
            <DashboardErrorState
              onRetry={() => {
                void projectsQuery.refetch();
                void statCards.byKey.open?.refetch();
                void statCards.byKey.in_progress?.refetch();
                void statCards.byKey.done_week?.refetch();
                void statCards.byKey.fourth?.refetch();
              }}
            />
          )}

          {!showFullPageError && projectsLoading && (
            <>
              <DashboardStatRowSkeleton />
              <DashboardMainGridSkeleton />
            </>
          )}

          {!showFullPageError && !projectsLoading && isBrandNewOrg && (
            <DashboardWelcomeEmptyState
              firstName={firstName}
              onCreateProject={() => void navigate("/projects")}
            />
          )}

          {!showFullPageError && showDashboard && (
            <>
              {statsLoading ? (
                <DashboardStatRowSkeleton />
              ) : (
                displayStats && (
                  <DashboardStatRow
                    stats={displayStats}
                    onNavigate={navigateToPreset}
                    failedCards={failedCards}
                    retryingCards={retryingCards}
                    onRetryCard={(key) => void handleRetryStatCard(key)}
                  />
                )
              )}

              {hasProjects &&
                (statsLoading && activityLoading ? (
                  <DashboardMainGridSkeleton />
                ) : (
                  <DashboardMainGrid
                    projects={projects}
                    issues={activityIssues}
                    supplementalActivity={supplementalActivity}
                    mentions={snapshot.mentions}
                    pendingInvites={snapshot.pendingInvites}
                    currentUserName={MOCK_CURRENT_USER}
                    role={role}
                    billing={billingQuery.data ?? null}
                    activityLoading={activityLoading}
                    activityError={activityQuery.isError}
                    onRetryActivity={() => void activityQuery.refetch()}
                    suggestBrowseProjects={suggestBrowseProjects}
                  />
                ))}
            </>
          )}
        </Box>
      </Box>
    </Flex>
  );
}
