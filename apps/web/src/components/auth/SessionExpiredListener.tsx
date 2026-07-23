import { useEffect } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

import { SESSION_EXPIRED_EVENT } from "../../auth-api";

/** Redirects to login when authFetch invalidates the session after a 401. */
export function SessionExpiredListener() {
  const navigate = useNavigate();

  useEffect(() => {
    const handler = () => {
      toast.error("Session expired. Please sign in again.");
      void navigate("/login", { replace: true });
    };

    window.addEventListener(SESSION_EXPIRED_EVENT, handler);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, handler);
  }, [navigate]);

  return null;
}
