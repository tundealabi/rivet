import { SetMetadata } from "@nestjs/common";

export const SKIP_API_ENVELOPE_KEY = "skipApiEnvelope";

/** Skip the API success envelope (probes, Prometheus text, Terminus JSON). */
export const SkipApiEnvelope = () => SetMetadata(SKIP_API_ENVELOPE_KEY, true);
