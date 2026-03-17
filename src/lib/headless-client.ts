/**
 * Headless Service Client — Calls the standalone headless browser service
 *
 * The headless service runs on a separate VPS with Chrome installed.
 * This client calls it from the Vercel serverless functions as a fallback
 * when official APIs don't support an action (e.g., IG likes).
 */

interface HeadlessRequest {
  platform: "instagram" | "tiktok" | "x" | "reddit";
  accountId: string;
  credentials: { username: string; password: string };
  action: "like" | "comment" | "follow" | "retweet" | "upvote" | "engage_feed";
  target: string;
  content?: string;
  proxy?: { server: string; username?: string; password?: string };
  maxActions?: number;
}

interface HeadlessResponse {
  success: boolean;
  action: string;
  platform: string;
  target?: string;
  error?: string;
  metrics: {
    actionsThisSession: number;
    errorsThisSession: number;
    captchasHit: number;
  };
}

/**
 * Execute an action via the headless browser service
 */
export async function callHeadlessService(request: HeadlessRequest): Promise<HeadlessResponse> {
  const serviceUrl = process.env.HEADLESS_SERVICE_URL;
  const apiKey = process.env.HEADLESS_API_KEY;

  if (!serviceUrl) {
    return {
      success: false,
      action: request.action,
      platform: request.platform,
      error: "HEADLESS_SERVICE_URL not configured",
      metrics: { actionsThisSession: 0, errorsThisSession: 0, captchasHit: 0 },
    };
  }

  try {
    const res = await fetch(`${serviceUrl}/execute`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": apiKey || "",
      },
      body: JSON.stringify(request),
    });

    if (!res.ok) {
      const errBody = await res.text();
      return {
        success: false,
        action: request.action,
        platform: request.platform,
        error: `Headless service error ${res.status}: ${errBody}`,
        metrics: { actionsThisSession: 0, errorsThisSession: 1, captchasHit: 0 },
      };
    }

    return await res.json();
  } catch (err) {
    return {
      success: false,
      action: request.action,
      platform: request.platform,
      error: `Headless service unreachable: ${err}`,
      metrics: { actionsThisSession: 0, errorsThisSession: 1, captchasHit: 0 },
    };
  }
}

/**
 * Check if the headless service is available
 */
export async function isHeadlessAvailable(): Promise<boolean> {
  const serviceUrl = process.env.HEADLESS_SERVICE_URL;
  if (!serviceUrl) return false;

  try {
    const res = await fetch(`${serviceUrl}/health`, {
      headers: { "X-API-Key": process.env.HEADLESS_API_KEY || "" },
    });
    return res.ok;
  } catch {
    return false;
  }
}

export type { HeadlessRequest, HeadlessResponse };
