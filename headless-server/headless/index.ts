// Headless Connector — Unified interface for all headless platform connectors
// Routes actions to the correct headless connector when official API isn't available
// Opt-in only, premium feature, with risk disclosure

import { InstagramHeadless } from "./instagram-headless";
import { TikTokHeadless } from "./tiktok-headless";
import { XHeadless } from "./x-headless";
import { RedditHeadless } from "./reddit-headless";

type Platform = "instagram" | "tiktok" | "x" | "reddit";
type HeadlessAction = "like" | "comment" | "follow" | "retweet" | "upvote" | "engage_feed";

interface HeadlessCredentials {
  username: string;
  password: string;
}

interface HeadlessConfig {
  platform: Platform;
  accountId: string;
  credentials: HeadlessCredentials;
  proxy?: { server: string; username?: string; password?: string };
  maxActionsPerSession: number; // Safety cap
}

interface HeadlessResult {
  success: boolean;
  action: HeadlessAction;
  platform: Platform;
  target?: string;
  error?: string;
  metrics: { actionsThisSession: number; errorsThisSession: number; captchasHit: number };
}

// Active sessions — one per platform/account combo
const sessions: Map<string, InstagramHeadless | TikTokHeadless | XHeadless | RedditHeadless> = new Map();

function sessionKey(platform: string, accountId: string): string {
  return `${platform}:${accountId}`;
}

// Get or create a headless session
async function getSession(config: HeadlessConfig) {
  const key = sessionKey(config.platform, config.accountId);
  let session = sessions.get(key);

  if (!session) {
    switch (config.platform) {
      case "instagram":
        session = new InstagramHeadless(config.accountId, config.proxy);
        break;
      case "tiktok":
        session = new TikTokHeadless(config.accountId, config.proxy);
        break;
      case "x":
        session = new XHeadless(config.accountId, config.proxy);
        break;
      case "reddit":
        session = new RedditHeadless(config.accountId, config.proxy);
        break;
    }

    // Login
    const loginMethod = session as { login: (c: HeadlessCredentials) => Promise<boolean> };
    const loggedIn = await loginMethod.login(config.credentials);
    if (!loggedIn) {
      await (session as { close: () => Promise<void> }).close();
      throw new Error(`Failed to login to ${config.platform}`);
    }

    sessions.set(key, session);
  }

  return session;
}

// Execute a headless action
export async function executeHeadless(
  config: HeadlessConfig,
  action: HeadlessAction,
  target: string,
  content?: string
): Promise<HeadlessResult> {
  try {
    const session = await getSession(config);
    let success = false;

    switch (config.platform) {
      case "instagram": {
        const ig = session as InstagramHeadless;
        switch (action) {
          case "like": success = await ig.likePost(target); break;
          case "comment": success = await ig.commentOnPost(target, content || ""); break;
          case "follow": success = await ig.followUser(target); break;
          case "engage_feed": {
            const count = await ig.engageHashtag(target, config.maxActionsPerSession);
            success = count > 0;
            break;
          }
        }
        break;
      }
      case "tiktok": {
        const tt = session as TikTokHeadless;
        switch (action) {
          case "like": success = await tt.likeVideo(target); break;
          case "comment": success = await tt.commentOnVideo(target, content || ""); break;
          case "follow": success = await tt.followUser(target); break;
          case "engage_feed": {
            const count = await tt.engageFeed(config.maxActionsPerSession);
            success = count > 0;
            break;
          }
        }
        break;
      }
      case "x": {
        const xSession = session as XHeadless;
        switch (action) {
          case "like": success = await xSession.likeTweet(target); break;
          case "comment": success = await xSession.replyToTweet(target, content || ""); break;
          case "follow": success = await xSession.followUser(target); break;
          case "retweet": success = await xSession.retweet(target); break;
          case "engage_feed": {
            const count = await xSession.engageSearch(target, config.maxActionsPerSession);
            success = count > 0;
            break;
          }
        }
        break;
      }
      case "reddit": {
        const rd = session as RedditHeadless;
        switch (action) {
          case "upvote": success = await rd.upvotePost(target); break;
          case "comment": success = await rd.commentOnPost(target, content || ""); break;
          case "engage_feed": {
            const count = await rd.engageSubreddit(target, config.maxActionsPerSession);
            success = count > 0;
            break;
          }
        }
        break;
      }
    }

    const metrics = (session as { getMetrics: () => { actionsThisSession: number; errorsThisSession: number; captchasHit: number } }).getMetrics();

    return { success, action, platform: config.platform, target, metrics };
  } catch (err) {
    return {
      success: false,
      action,
      platform: config.platform,
      target,
      error: String(err),
      metrics: { actionsThisSession: 0, errorsThisSession: 1, captchasHit: 0 },
    };
  }
}

// Close a specific session
export async function closeSession(platform: Platform, accountId: string): Promise<void> {
  const key = sessionKey(platform, accountId);
  const session = sessions.get(key);
  if (session) {
    await (session as { close: () => Promise<void> }).close();
    sessions.delete(key);
  }
}

// Close all sessions
export async function closeAllSessions(): Promise<void> {
  for (const [key, session] of sessions.entries()) {
    await (session as { close: () => Promise<void> }).close();
    sessions.delete(key);
  }
}

export type { HeadlessConfig, HeadlessResult, HeadlessAction, Platform as HeadlessPlatform };
