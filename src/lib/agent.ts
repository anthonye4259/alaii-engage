/**
 * Engagement Agent — The brain that orchestrates automated engagement
 *
 * Scans feeds via real platform APIs, generates AI-powered responses,
 * applies safety controls, and executes actions.
 */

import { engage, type Platform } from "./engage";
import { generateContent, type BusinessContext, type GenerateRequest } from "./ai-generator";
import { canPerformAction, type ActionType } from "./rate-limiter";
import { isAccountSafe } from "./account-health";

// Platform API imports
import * as instagramApi from "./platforms/instagram";
import * as tiktokApi from "./platforms/tiktok";
import * as facebookApi from "./platforms/facebook";
import * as xApi from "./platforms/x";
import * as redditApi from "./platforms/reddit";

interface ConnectedAccount {
  id: string;
  platform: Platform;
  accessToken: string;
  platformUserId: string;
  metadata?: Record<string, string>;
}

interface EngagementRule {
  id: string;
  name: string;
  enabled: boolean;
  action: ActionType;
  platforms: Platform[];
  config: {
    hashtags?: string[];
    keywords?: string[];
    replyToAll?: boolean;
    dmNewFollowers?: boolean;
  };
}

interface EngagementOpportunity {
  id: string;
  platform: Platform;
  type: "comment" | "mention" | "hashtag_post" | "new_follower" | "dm_received";
  targetId: string;
  parentId?: string;
  content?: string;
  authorName?: string;
  authorBio?: string;
  timestamp: Date;
}

interface AgentConfig {
  businessContext: BusinessContext;
  accounts: ConnectedAccount[];
  rules: EngagementRule[];
}

/**
 * Run one cycle of the engagement agent
 */
export async function runEngagementCycle(config: AgentConfig): Promise<{
  scanned: number;
  engaged: number;
  skipped: number;
  errors: string[];
  actions: Array<{ platform: string; action: string; target: string; content: string; status: string }>;
}> {
  const results = {
    scanned: 0,
    engaged: 0,
    skipped: 0,
    errors: [] as string[],
    actions: [] as Array<{ platform: string; action: string; target: string; content: string; status: string }>,
  };

  for (const rule of config.rules) {
    if (!rule.enabled) continue;

    for (const platform of rule.platforms) {
      const account = config.accounts.find((a) => a.platform === platform);
      if (!account) continue;

      const healthCheck = isAccountSafe(account.id, platform);
      if (!healthCheck.safe) { results.skipped++; continue; }

      const rateCheck = canPerformAction(account.id, rule.action);
      if (!rateCheck.allowed) { results.skipped++; continue; }

      try {
        const opportunities = await scanForOpportunities(account, rule);
        results.scanned += opportunities.length;

        for (const opp of opportunities) {
          const check = canPerformAction(account.id, rule.action);
          if (!check.allowed) break;

          try {
            const genRequest: GenerateRequest = {
              type: mapActionToGenType(rule.action),
              platform,
              context: {
                originalContent: opp.content,
                authorName: opp.authorName,
                authorBio: opp.authorBio,
              },
              businessContext: config.businessContext,
            };

            const generated = await generateContent(genRequest);
            const content = generated.variations[
              Math.floor(Math.random() * generated.variations.length)
            ];

            const result = await engage({
              accountId: account.id,
              platform,
              action: rule.action,
              targetId: opp.targetId,
              parentId: opp.parentId,
              content,
              accessToken: account.accessToken,
              metadata: account.metadata,
            });

            results.actions.push({
              platform,
              action: rule.action,
              target: opp.targetId,
              content: content.slice(0, 100),
              status: result.status,
            });

            if (result.success) { results.engaged++; }
            else { results.skipped++; }

            // Human-like pause between actions
            await sleep(3000 + Math.random() * 5000);
          } catch (err) {
            results.errors.push(`Error on ${platform}/${opp.targetId}: ${err}`);
          }
        }
      } catch (err) {
        results.errors.push(`Scan error on ${platform}: ${err}`);
      }
    }
  }

  return results;
}

// ---------------------------------------------------------------------------
// REAL FEED SCANNERS
// ---------------------------------------------------------------------------

async function scanForOpportunities(
  account: ConnectedAccount,
  rule: EngagementRule
): Promise<EngagementOpportunity[]> {
  const opportunities: EngagementOpportunity[] = [];

  switch (rule.action) {
    case "reply_own_comment":
      opportunities.push(...await getUnrepliedComments(account));
      break;
    case "like_mention":
      opportunities.push(...await getMentions(account));
      break;
    case "comment_hashtag":
      if (rule.config.hashtags) {
        for (const hashtag of rule.config.hashtags) {
          opportunities.push(...await searchHashtag(account, hashtag));
        }
      }
      break;
    case "dm_new_follower":
      opportunities.push(...await getNewFollowers(account));
      break;
  }

  return opportunities.slice(0, 5);
}

function makeIGOptions(account: ConnectedAccount) {
  return { accessToken: account.accessToken, igUserId: account.platformUserId };
}
function makeTTOptions(account: ConnectedAccount) {
  return { accessToken: account.accessToken, openId: account.platformUserId };
}
function makeFBOptions(account: ConnectedAccount) {
  return { pageAccessToken: account.metadata?.pageToken || account.accessToken, pageId: account.metadata?.pageId || "" };
}
function makeXOptions(account: ConnectedAccount) {
  return { accessToken: account.accessToken, userId: account.platformUserId };
}
function makeRedditOptions(account: ConnectedAccount) {
  return { accessToken: account.accessToken, username: account.platformUserId };
}

/**
 * Get unreplied comments on own posts
 */
async function getUnrepliedComments(account: ConnectedAccount): Promise<EngagementOpportunity[]> {
  const opps: EngagementOpportunity[] = [];

  try {
    switch (account.platform) {
      case "instagram": {
        const opts = makeIGOptions(account);
        const media = await instagramApi.getRecentMedia(opts, 5);
        for (const post of media.data || []) {
          const comments = await instagramApi.getComments(post.id, opts);
          for (const comment of (comments.data || [])) {
            opps.push({
              id: comment.id, platform: "instagram", type: "comment",
              targetId: comment.id, parentId: post.id,
              content: comment.text, authorName: comment.username,
              timestamp: new Date(comment.timestamp),
            });
          }
        }
        break;
      }
      case "tiktok": {
        const opts = makeTTOptions(account);
        const videos = await tiktokApi.getVideos(opts, 5);
        for (const video of videos.data?.videos || []) {
          const comments = await tiktokApi.getComments(video.id, opts, 10);
          for (const comment of (comments.data?.comments || [])) {
            opps.push({
              id: comment.id, platform: "tiktok", type: "comment",
              targetId: comment.id, parentId: video.id,
              content: comment.text, authorName: comment.user?.display_name,
              timestamp: new Date(comment.create_time * 1000),
            });
          }
        }
        break;
      }
      case "facebook": {
        const opts = makeFBOptions(account);
        if (!opts.pageId) break;
        const posts = await facebookApi.getPagePosts(opts, 5);
        for (const post of posts.data || []) {
          const comments = await facebookApi.getComments(post.id, opts);
          for (const comment of (comments.data || [])) {
            opps.push({
              id: comment.id, platform: "facebook", type: "comment",
              targetId: comment.id, parentId: post.id,
              content: comment.message, authorName: comment.from?.name,
              timestamp: new Date(comment.created_time),
            });
          }
        }
        break;
      }
      case "x": {
        // Get mentions/replies to the user's tweets
        const opts = makeXOptions(account);
        const mentions = await xApi.getMentions(opts, 10);
        for (const tweet of mentions.data || []) {
          opps.push({
            id: tweet.id, platform: "x", type: "comment",
            targetId: tweet.id, content: tweet.text,
            authorName: tweet.author_id,
            timestamp: new Date(tweet.created_at),
          });
        }
        break;
      }
      case "reddit": {
        const opts = makeRedditOptions(account);
        const inbox = await redditApi.getInbox(opts, 10);
        for (const item of inbox.data?.children || []) {
          if (item.data.type === "comment_reply") {
            opps.push({
              id: item.data.name, platform: "reddit", type: "comment",
              targetId: item.data.name, parentId: item.data.parent_id,
              content: item.data.body, authorName: item.data.author,
              timestamp: new Date(item.data.created_utc * 1000),
            });
          }
        }
        break;
      }
    }
  } catch (err) {
    console.error(`[agent] Error scanning ${account.platform} comments:`, err);
  }

  return opps;
}

/**
 * Get recent mentions
 */
async function getMentions(account: ConnectedAccount): Promise<EngagementOpportunity[]> {
  const opps: EngagementOpportunity[] = [];

  try {
    switch (account.platform) {
      case "instagram": {
        const mentions = await instagramApi.getMentions(makeIGOptions(account));
        for (const m of mentions.data || []) {
          opps.push({
            id: m.id, platform: "instagram", type: "mention",
            targetId: m.id, content: m.caption, authorName: m.username,
            timestamp: new Date(m.timestamp),
          });
        }
        break;
      }
      case "x": {
        const mentions = await xApi.getMentions(makeXOptions(account), 10);
        for (const t of mentions.data || []) {
          opps.push({
            id: t.id, platform: "x", type: "mention",
            targetId: t.id, content: t.text, authorName: t.author_id,
            timestamp: new Date(t.created_at),
          });
        }
        break;
      }
      case "facebook": {
        const opts = makeFBOptions(account);
        if (!opts.pageId) break;
        const mentions = await facebookApi.getPageMentions(opts);
        for (const m of mentions.data || []) {
          opps.push({
            id: m.id, platform: "facebook", type: "mention",
            targetId: m.id, content: m.message, authorName: m.from?.name,
            timestamp: new Date(m.created_time),
          });
        }
        break;
      }
      case "reddit": {
        const inbox = await redditApi.getInbox(makeRedditOptions(account), 10);
        for (const item of inbox.data?.children || []) {
          if (item.data.subject === "username mention") {
            opps.push({
              id: item.data.name, platform: "reddit", type: "mention",
              targetId: item.data.name, content: item.data.body,
              authorName: item.data.author,
              timestamp: new Date(item.data.created_utc * 1000),
            });
          }
        }
        break;
      }
    }
  } catch (err) {
    console.error(`[agent] Error scanning ${account.platform} mentions:`, err);
  }

  return opps;
}

/**
 * Search hashtags for engagement
 */
async function searchHashtag(account: ConnectedAccount, hashtag: string): Promise<EngagementOpportunity[]> {
  const opps: EngagementOpportunity[] = [];

  try {
    switch (account.platform) {
      case "instagram": {
        const results = await instagramApi.searchHashtag(hashtag, makeIGOptions(account));
        for (const p of results.data || []) {
          opps.push({
            id: p.id, platform: "instagram", type: "hashtag_post",
            targetId: p.id, content: p.caption, authorName: p.username,
            timestamp: new Date(p.timestamp),
          });
        }
        break;
      }
      case "tiktok": {
        const results = await tiktokApi.searchVideos(hashtag, makeTTOptions(account), 5);
        for (const v of results.data?.videos || []) {
          opps.push({
            id: v.id, platform: "tiktok", type: "hashtag_post",
            targetId: v.id, content: v.title,
            timestamp: new Date(v.create_time * 1000),
          });
        }
        break;
      }
      case "x": {
        const results = await xApi.searchTweets(`#${hashtag}`, makeXOptions(account), 10);
        for (const t of results.data || []) {
          opps.push({
            id: t.id, platform: "x", type: "hashtag_post",
            targetId: t.id, content: t.text, authorName: t.author_id,
            timestamp: new Date(t.created_at),
          });
        }
        break;
      }
      case "reddit": {
        const results = await redditApi.search(hashtag, makeRedditOptions(account), "all", 5);
        for (const p of results.data?.children || []) {
          opps.push({
            id: p.data.name, platform: "reddit", type: "hashtag_post",
            targetId: p.data.name, content: p.data.title,
            authorName: p.data.author,
            timestamp: new Date(p.data.created_utc * 1000),
          });
        }
        break;
      }
    }
  } catch (err) {
    console.error(`[agent] Error searching ${account.platform} #${hashtag}:`, err);
  }

  return opps;
}

/**
 * Get new followers for DM welcome (limited availability)
 */
async function getNewFollowers(_account: ConnectedAccount): Promise<EngagementOpportunity[]> {
  // Most platforms don't have a "new followers since X" API endpoint
  // This requires either webhooks or diffing follower lists between cycles
  // For now, this is a known limitation — would need a database to track
  console.log(`[agent] New follower detection requires webhook setup or follower list diffing`);
  return [];
}

function mapActionToGenType(action: ActionType): GenerateRequest["type"] {
  switch (action) {
    case "reply_own_comment":
    case "like_comment":
      return "comment_reply";
    case "comment_hashtag":
    case "comment_campaign":
      return "hashtag_comment";
    case "dm_new_follower":
      return "dm_welcome";
    case "dm_cold_outreach":
      return "dm_outreach";
    case "repost":
      return "repost_caption";
    default:
      return "comment_reply";
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export type { ConnectedAccount, EngagementRule, EngagementOpportunity, AgentConfig };
