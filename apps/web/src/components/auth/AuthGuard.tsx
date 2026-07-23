import { Navigate, useLocation } from "react-router-dom";

import { isAuthenticated } from "../../auth-api";
import { AUTH_PUBLIC_PATHS } from "./auth-public-paths";

/** Sends unauthenticated users on protected routes to login. */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();

  if (!AUTH_PUBLIC_PATHS.has(pathname) && !isAuthenticated()) {
    return <Navigate to="/login" replace state={{ from: pathname }} />;
  }

  return children;
}
