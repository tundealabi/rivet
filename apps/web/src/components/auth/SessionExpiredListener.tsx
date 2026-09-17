import { useEffect } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

import { SESSION_EXPIRED_EVENT } from "../../auth-api";
import { AUTH_PUBLIC_PATHS } from "./auth-public-paths";

/** Redirects to login when authFetch invalidates a real session after a 401. */
export function SessionExpiredListener() {
  const navigate = useNavigate();

  useEffect(() => {
    const handler = () => {
      if (AUTH_PUBLIC_PATHS.has(window.location.pathname)) {
        return;
      }

      toast.error("Session expired. Please sign in again.");
      void navigate("/login", { replace: true });
    };

    window.addEventListener(SESSION_EXPIRED_EVENT, handler);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, handler);
  }, [navigate]);

  return null;
}
