import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";

export interface RequireRouteAccessProps {
  canAccess: boolean;
  children: ReactNode;
  message?: string;
}

export function RequireRouteAccess({
  canAccess,
  children,
  message,
}: RequireRouteAccessProps) {
  const location = useLocation();

  if (!canAccess) {
    return (
      <Navigate
        to="/403"
        replace
        state={{
          from: location.pathname,
          message,
        }}
      />
    );
  }

  return children;
}
