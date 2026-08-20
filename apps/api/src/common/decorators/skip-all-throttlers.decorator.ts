import { SkipThrottle } from "@nestjs/throttler";

import {
  THROTTLER_LONG,
  THROTTLER_MEDIUM,
  THROTTLER_SHORT,
} from "@/common/constants";

/** Skip every named ThrottlerGuard window. */
export const SkipAllThrottlers = () =>
  SkipThrottle({
    [THROTTLER_LONG]: true,
    [THROTTLER_MEDIUM]: true,
    [THROTTLER_SHORT]: true,
  });
