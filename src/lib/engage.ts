/**
 * Engagement Engine — Executes real platform actions with safety checks
 *
 * After passing rate limits, content safety, and account health checks,
 * calls actual platform APIs to perform engagement.
 */

import { canPerformAction, recordAction, getHumanDelay, type ActionType } from "./rate-limiter";
import { screenContent, getContentRiskLevel } from "./content-safety";
import { isAccountSafe, reportIncident } from "./account-health";
import { callHeadlessService, type HeadlessResponse } from "./headless-client";

// Platform API imports
import * as instagramApi from "./platforms/instagram";
import * as tiktokApi from "./platforms/tiktok";
import * as facebookApi from "./platforms/facebook";
import * as xApi from "./platforms/x";
import * as redditApi from "./platforms/reddit";

export type Platform = "instagram" | "tiktok" | "linkedin" | "facebook" | "x" | "reddit";

interface EngageRequest {
  accountId: string;
  platform: Platform;
  action: ActionType;
  targetId: string;
  parentId?: string;
  content?: string;
  accessToken: string;
  metadata?: Record<string, string>;
}

interface EngageResult {
  success: boolean;
  status: "executed" | "queued" | "blocked" | "rate_limited" | "unsafe_content" | "account_paused" | "api_error";
  message: string;
  platformResponse?: unknown;
  approvalRequired?: boolean;
}

/**
 * Execute an engagement action with full safety checks, then call real API
 */
export async function engage(request: EngageRequest): Promise<EngageResult> {
  const { accountId, platform, action, content } = request;

  // 1. Check account health
  const healthCheck = isAccountSafe(accountId, platform);
  if (!healthCheck.safe) {
    return { success: false, status: "account_paused", message: healthCheck.reason || "Account paused" };
  }

  // 2. Check rate limits
  const rateCheck = canPerformAction(accountId, action);
  if (!rateCheck.allowed) {
    return { success: false, status: "rate_limited", message: rateCheck.reason || "Rate limit reached" };
  }

  // 3. Screen content
  if (content) {
    const safetyCheck = screenContent(content);
    const riskLevel = getContentRiskLevel(safetyCheck.score);
    if (riskLevel === "blocked") {
      return { success: false, status: "unsafe_content", message: `Content blocked: ${safetyCheck.flags.join(", ")}` };
    }
    if (riskLevel === "review") {
      return { success: false, status: "queued", message: `Needs review: ${safetyCheck.flags.join(", ")}`, approvalRequired: true };
    }
  }

  // 4. Check if action requires approval
  const { RATE_LIMITS } = await import("./rate-limiter");
  if (RATE_LIMITS[action].requiresApproval) {
    return { success: false, status: "queued", message: `${action} requires approval`, approvalRequired: true };
  }

  // 5. Human-like delay
  const delay = getHumanDelay(action);
  await sleep(delay);

  // 6. Execute the actual platform API call
  try {
    const apiResult = await executePlatformAction(request);

    // Check if the official API skipped this action (e.g., IG likes)
    const skipped = apiResult && typeof apiResult === "object" && "skipped" in apiResult && (apiResult as { skipped: boolean }).skipped;

    if (skipped) {
      // Try headless fallback if configured
      const headlessResult = await tryHeadlessFallback(request);
      if (headlessResult) {
        recordAction(accountId, action);
        return { success: true, status: "executed", message: `${action} executed via headless on ${platform}`, platformResponse: headlessResult };
      }
      // No headless available — report as skipped
      return { success: false, status: "blocked", message: `${action} not available via API and headless service not configured` };
    }

    recordAction(accountId, action);
    return { success: true, status: "executed", message: `${action} executed on ${platform}`, platformResponse: apiResult };
  } catch (err) {
    const statusCode = (err as { status?: number }).status || 500;
    handlePlatformResponse(accountId, platform, statusCode);
    return { success: false, status: "api_error", message: `API error: ${err}` };
  }
}

/**
 * Route to the correct platform API
 */
export async function executePlatformAction(request: EngageRequest): Promise<unknown> {
  const { platform, action, targetId, parentId, content, accessToken, metadata } = request;

  switch (platform) {
    // -----------------------------------------------------------------------
    // INSTAGRAM
    // -----------------------------------------------------------------------
    case "instagram": {
      const opts = { accessToken, igUserId: metadata?.igUserId || "" };
      switch (action) {
        case "reply_own_comment":
          return instagramApi.replyToComment(targetId, content || "", opts);
        case "comment_hashtag":
          // For hashtag posts, we comment on the media (targetId = media ID)
          return instagramApi.commentOnMedia(targetId, content || "", opts);
        case "like_mention":
        case "like_comment":
          // IG doesn't support liking via API — needs headless fallback
          console.log("[engage] IG like not available via API");
          return { skipped: true, reason: "like_not_in_api" };
        case "dm_new_follower":
          return instagramApi.sendDM(targetId, content || "", opts);
        default:
          return { skipped: true, reason: "unsupported_action" };
      }
    }

    // -----------------------------------------------------------------------
    // TIKTOK
    // -----------------------------------------------------------------------
    case "tiktok": {
      const opts = { accessToken, openId: metadata?.openId || "" };
      switch (action) {
        case "reply_own_comment":
          // TikTok: replyToComment(videoId, commentId, text, opts)
          return tiktokApi.replyToComment(parentId || "", targetId, content || "", opts);
        case "comment_hashtag":
          // For hashtag videos, we "reply" to the video (no parent comment)
          return tiktokApi.replyToComment(targetId, "", content || "", opts);
        case "like_mention":
          return tiktokApi.likeVideo(targetId, opts);
        default:
          return { skipped: true, reason: "unsupported_action" };
      }
    }

    // -----------------------------------------------------------------------
    // FACEBOOK
    // -----------------------------------------------------------------------
    case "facebook": {
      const opts = {
        pageAccessToken: metadata?.pageToken || accessToken,
        pageId: metadata?.pageId || "",
      };
      switch (action) {
        case "reply_own_comment":
          return facebookApi.replyToComment(targetId, content || "", opts);
        case "like_comment":
        case "like_mention":
          return facebookApi.likeComment(targetId, opts);
        case "comment_hashtag":
          return facebookApi.replyToComment(targetId, content || "", opts);
        case "dm_new_follower":
          return facebookApi.sendMessage(targetId, content || "", opts);
        default:
          return { skipped: true, reason: "unsupported_action" };
      }
    }

    // -----------------------------------------------------------------------
    // X (TWITTER)
    // -----------------------------------------------------------------------
    case "x": {
      const opts = { accessToken, userId: metadata?.userId || "" };
      switch (action) {
        case "reply_own_comment":
        case "comment_hashtag":
          return xApi.replyToTweet(targetId, content || "", opts);
        case "like_mention":
        case "like_comment":
          return xApi.likeTweet(targetId, opts);
        case "repost":
          return xApi.retweet(targetId, opts);
        case "dm_new_follower":
        case "dm_cold_outreach":
          return xApi.sendDM(targetId, content || "", opts);
        default:
          return { skipped: true, reason: "unsupported_action" };
      }
    }

    // -----------------------------------------------------------------------
    // REDDIT
    // -----------------------------------------------------------------------
    case "reddit": {
      const opts = { accessToken, username: metadata?.username || "" };
      switch (action) {
        case "reply_own_comment":
        case "comment_hashtag":
          return redditApi.reply(targetId, content || "", opts);
        case "like_mention":
          return redditApi.upvote(targetId, opts);
        case "dm_new_follower":
        case "dm_cold_outreach":
          return redditApi.sendPM(targetId, "Hey!", content || "", opts);
        default:
          return { skipped: true, reason: "unsupported_action" };
      }
    }

    // -----------------------------------------------------------------------
    // LINKEDIN
    // -----------------------------------------------------------------------
    case "linkedin": {
      const linkedinApi = await import("./linkedin");
      const opts = { accessToken, personUrn: metadata?.personUrn || "" };
      switch (action) {
        case "like_mention":
        case "like_comment":
          return linkedinApi.likePost(targetId, opts);
        case "comment_hashtag":
        case "reply_own_comment":
          return linkedinApi.commentOnPost(targetId, content || "", opts);
        case "repost":
          return linkedinApi.sharePost(targetId, content || "", opts);
        default:
          return { skipped: true, reason: "unsupported_action" };
      }
    }

    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }
}

/**
 * Report platform API errors to account health
 */
export function handlePlatformResponse(accountId: string, platform: Platform, statusCode: number): void {
  if (statusCode === 429) {
    reportIncident(accountId, platform, "rate_limit_hit", "Platform rate limit hit");
  } else if (statusCode === 403) {
    reportIncident(accountId, platform, "action_blocked", "Action blocked by platform");
  } else if (statusCode === 401) {
    reportIncident(accountId, platform, "api_error", "Auth failed — token may be expired");
  } else if (statusCode >= 500) {
    reportIncident(accountId, platform, "api_error", `Server error: ${statusCode}`);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Try the headless browser fallback for actions not supported by official APIs
 * Only works if HEADLESS_SERVICE_URL is configured and credentials are available
 */
async function tryHeadlessFallback(request: EngageRequest): Promise<HeadlessResponse | null> {
  const { platform, action, targetId, content, metadata } = request;

  // Only these platforms have headless connectors
  const headlessPlatforms = ["instagram", "tiktok", "x", "reddit"];
  if (!headlessPlatforms.includes(platform)) return null;

  // Need credentials for headless (stored in metadata)
  const username = metadata?.headlessUsername;
  const password = metadata?.headlessPassword;
  if (!username || !password) {
    console.log(`[engage] No headless credentials for ${platform}, skipping fallback`);
    return null;
  }

  // Map agent action types to headless action types
  const actionMap: Record<string, string> = {
    like_mention: "like",
    like_comment: "like",
    reply_own_comment: "comment",
    comment_hashtag: "comment",
    dm_new_follower: "comment",
    repost: "retweet",
  };

  const headlessAction = actionMap[action];
  if (!headlessAction) return null;

  console.log(`[engage] Trying headless fallback: ${headlessAction} on ${platform}`);

  const result = await callHeadlessService({
    platform: platform as "instagram" | "tiktok" | "x" | "reddit",
    accountId: request.accountId,
    credentials: { username, password },
    action: headlessAction as "like" | "comment" | "follow" | "retweet" | "upvote" | "engage_feed",
    target: targetId,
    content,
    proxy: metadata?.proxyServer ? { server: metadata.proxyServer } : undefined,
    maxActions: 5,
  });

  return result;
}
