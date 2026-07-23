import { authFetch } from "../../auth-api";

const SWITCH_ORG_URL = "https://rivet-n8w6.onrender.com/api/v1/orgs/active";

const SWITCH_DELAY_MS = 280;

export class OrgSwitchError extends Error {
  constructor(message = "Failed to switch organization") {
    super(message);
    this.name = "OrgSwitchError";
  }
}

/** Persists the user's active org on the server (session-scoped context). */
export async function switchActiveOrgApi(orgId: string): Promise<void> {
  if (!import.meta.env.PROD) {
    await new Promise((resolve) => setTimeout(resolve, SWITCH_DELAY_MS));

    if (orgId === "org_switch_fail") {
      throw new OrgSwitchError();
    }

    return;
  }

  const response = await authFetch(SWITCH_ORG_URL, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ orgId }),
  });

  let payload: { data: unknown; error: { message: string } | null };

  try {
    payload = (await response.json()) as typeof payload;
  } catch {
    throw new OrgSwitchError(
      response.ok
        ? "The server returned an invalid response"
        : "Couldn't switch organization"
    );
  }

  if (!response.ok || payload.error) {
    throw new OrgSwitchError(
      payload.error?.message ?? "Couldn't switch organization"
    );
  }
}
