import { Navigate, Route, Routes, useLocation } from "react-router-dom";

import { CommandPaletteStub } from "./components/app/CommandPaletteStub";
import { OrgSwitchProgressBar } from "./components/app/OrgSwitchProgressBar";
import { useOpenOrgSwitcherShortcut } from "./components/app/use-org-switcher-keyboard";
import { useUserOrganizations } from "./components/app/use-user-organizations";
import { AUTH_PUBLIC_PATHS } from "./components/auth/auth-public-paths";
import { AuthGuard } from "./components/auth/AuthGuard";
import { SessionExpiredListener } from "./components/auth/SessionExpiredListener";
import { useActiveOrg } from "./components/billing/use-active-org";
import { isMaintenanceModeEnabled } from "./components/errors/maintenance-mode";
import { IssueDetailDrawerHost } from "./components/issues/IssueDetailDrawerHost";
import AccessDeniedPage from "./pages/AccessDeniedPage";
import BillingPage from "./pages/BillingPage";
import CreateOrgPage from "./pages/CreateOrgPage";
import DashboardPage from "./pages/DashboardPage";
import InvitationsPage from "./pages/InvitationsPage";
import IssueDetailPage from "./pages/IssueDetailPage";
import IssuesPage from "./pages/IssuesPage";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import MaintenancePage from "./pages/MaintenancePage";
import MembersPage from "./pages/MembersPage";
import NotFoundPage from "./pages/NotFoundPage";
import OnboardingPage from "./pages/OnboardingPage";
import ProjectDetailPage from "./pages/ProjectDetailPage";
import ProjectsPage from "./pages/ProjectsPage";
import RegisterPage from "./pages/RegisterPage";
import ServerErrorPage from "./pages/ServerErrorPage";
import SettingsPage from "./pages/SettingsPage";

const PUBLIC_PATHS = AUTH_PUBLIC_PATHS;

function OrgOnboardingGuard({ children }: { children: React.ReactNode }) {
  const orgsQuery = useUserOrganizations();
  const { pathname } = useLocation();

  const orgsLoaded = !orgsQuery.isPending && !orgsQuery.isError;
  const hasOrganizations = (orgsQuery.data?.organizations.length ?? 0) > 0;

  if (orgsLoaded && !hasOrganizations && !PUBLIC_PATHS.has(pathname)) {
    return <Navigate to="/onboarding" replace />;
  }

  return children;
}

function MaintenanceGate({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();

  if (isMaintenanceModeEnabled() && pathname !== "/maintenance") {
    return <Navigate to="/maintenance" replace />;
  }

  return children;
}

function AppRoutes() {
  const { orgId, isSwitching } = useActiveOrg();

  if (isSwitching) {
    return null;
  }

  return (
    <MaintenanceGate>
      <AuthGuard>
        <OrgOnboardingGuard>
          <Routes key={orgId}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/onboarding" element={<OnboardingPage />} />
            <Route path="/onboarding/create-org" element={<CreateOrgPage />} />
            <Route path="/invitations" element={<InvitationsPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/projects/:projectId" element={<ProjectDetailPage />}>
              <Route
                path="issues/:issueId"
                element={<IssueDetailDrawerHost />}
              />
            </Route>
            <Route
              path="/projects/:projectId/issues/:issueId/full"
              element={<IssueDetailPage />}
            />
            <Route path="/issues" element={<IssuesPage />} />
            <Route path="/members" element={<MembersPage />} />
            <Route path="/billing" element={<BillingPage />} />
            <Route path="/settings/*" element={<SettingsPage />} />
            <Route path="/403" element={<AccessDeniedPage />} />
            <Route path="/500" element={<ServerErrorPage />} />
            <Route path="/maintenance" element={<MaintenancePage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </OrgOnboardingGuard>
      </AuthGuard>
    </MaintenanceGate>
  );
}

function App() {
  const { isSwitching } = useActiveOrg();
  useOpenOrgSwitcherShortcut();

  return (
    <>
      <SessionExpiredListener />
      <OrgSwitchProgressBar active={isSwitching} />
      <AppRoutes />
      <CommandPaletteStub />
    </>
  );
}

export default App;
