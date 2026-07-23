import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

import { logoutUser } from "../../auth-api";

export function useLogout() {
  const navigate = useNavigate();

  return () => {
    void logoutUser().then(() => {
      toast.success("Logged out");
      void navigate("/login");
    });
  };
}
