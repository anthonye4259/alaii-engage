/**
 * Engagement Engine — Orchestrates safe engagement actions
 * 
 * Ties together rate limiting, content safety, and account health
 * to execute engagement actions safely.
 */

import { canPerformAction, recordAction, getHumanDelay, type ActionType } from "./rate-limiter";
import { screenContent, getContentRiskLevel } from "./content-safety";
import { isAccountSafe, reportIncident } from "./account-health";

export type Platform = "instagram" | "tiktok" | "linkedin" | "facebook" | "x" | "reddit";

interface EngageRequest {
  accountId: string;
  platform: Platform;
  action: ActionType;
  targetId: string;       // Post/comment/user ID on the platform
  content?: string;       // Text content (for comments, replies, DMs)
  metadata?: Record<string, string>;
}

interface EngageResult {
  success: boolean;
  status: "executed" | "queued" | "blocked" | "rate_limited" | "unsafe_content" | "account_paused";
  message: string;
  scheduledAt?: Date;     // When the action will actually execute
  approvalRequired?: boolean;
}

/**
 * Execute an engagement action with full safety checks
 */
export async function engage(request: EngageRequest): Promise<EngageResult> {
  const { accountId, platform, action, content } = request;

  // 1. Check account health
  const healthCheck = isAccountSafe(accountId, platform);
  if (!healthCheck.safe) {
    return {
      success: false,
      status: "account_paused",
      message: healthCheck.reason || "Account is paused for safety",
    };
  }

  // 2. Check rate limits
  const rateCheck = canPerformAction(accountId, action);
  if (!rateCheck.allowed) {
    return {
      success: false,
      status: "rate_limited",
      message: rateCheck.reason || "Rate limit reached",
    };
  }

  // 3. Screen content (if applicable)
  if (content) {
    const safetyCheck = screenContent(content);
    const riskLevel = getContentRiskLevel(safetyCheck.score);

    if (riskLevel === "blocked") {
      return {
        success: false,
        status: "unsafe_content",
        message: `Content blocked: ${safetyCheck.flags.join(", ")}`,
      };
    }

    if (riskLevel === "review") {
      // Queue for human review
      return {
        success: false,
        status: "queued",
        message: `Content needs review: ${safetyCheck.flags.join(", ")}`,
        approvalRequired: true,
      };
    }
  }

  // 4. Check if action requires approval
  const { RATE_LIMITS } = await import("./rate-limiter");
  if (RATE_LIMITS[action].requiresApproval) {
    return {
      success: false,
      status: "queued",
      message: `${RATE_LIMITS[action].description} requires approval before sending`,
      approvalRequired: true,
    };
  }

  // 5. Calculate human-like delay
  const delay = getHumanDelay(action);
  const scheduledAt = new Date(Date.now() + delay);

  // 6. Record the action
  recordAction(accountId, action);

  // 7. Execute (in production, this schedules the actual API call)
  // For now, return success with the scheduled time
  return {
    success: true,
    status: "executed",
    message: `Action scheduled with ${Math.round(delay / 1000)}s human-like delay`,
    scheduledAt,
  };
}

/**
 * Process API response and report any issues
 */
export function handlePlatformResponse(
  accountId: string,
  platform: Platform,
  statusCode: number,
  responseBody?: unknown
): void {
  if (statusCode === 429) {
    reportIncident(accountId, platform, "rate_limit_hit", "Platform rate limit hit");
  } else if (statusCode === 403) {
    reportIncident(accountId, platform, "action_blocked", "Action blocked by platform");
  } else if (statusCode === 401) {
    reportIncident(accountId, platform, "api_error", "Authentication failed — token may be expired");
  } else if (statusCode >= 500) {
    reportIncident(accountId, platform, "api_error", `Platform server error: ${statusCode}`);
  }
}
