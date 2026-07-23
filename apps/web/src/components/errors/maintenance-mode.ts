function readEnvString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

export function isMaintenanceModeEnabled() {
  return import.meta.env.VITE_MAINTENANCE_MODE === "true";
}

export function getMaintenanceMessage() {
  const message = readEnvString(import.meta.env.VITE_MAINTENANCE_MESSAGE);
  return message?.trim() || null;
}

export function getMaintenanceEta() {
  const eta = readEnvString(import.meta.env.VITE_MAINTENANCE_ETA);
  return eta?.trim() || null;
}
