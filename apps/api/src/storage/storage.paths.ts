export function exportObjectKey(
  organizationId: string,
  exportJobId: string
): string {
  return `${organizationId}/exports/${exportJobId}.csv`;
}
