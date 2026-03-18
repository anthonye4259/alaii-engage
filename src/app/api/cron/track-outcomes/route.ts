import { NextRequest, NextResponse } from "next/server";
import { getConnectedAccounts } from "@/lib/connected-accounts";
import * as store from "@/lib/store";
import * as redditApi from "@/lib/platforms/reddit";
import * as xApi from "@/lib/platforms/x";
import * as instagramApi from "@/lib/platforms/instagram";
import { recordOutcomes, type CommentOutcomes } from "@/lib/performance-learning";

/**
 * POST /api/cron/track-outcomes — Check back on posted comments
 *
 * Runs on a schedule (every 4-6 hours). For each tracked comment,
 * checks the platform API to see if it got replies, likes, etc.
 * Records outcomes for the performance learning engine.
 */
export async function POST(request: NextRequest) {
  // Verify cron secret
  const auth = request.headers.get("Authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get all users with tracked comments
  const userKeys = await store.getSet("perf:active_users");
  const results = { checked: 0, updated: 0, errors: 0 };

  for (const email of userKeys) {
    try {
      const trackedIds = await store.getJSON<string[]>(`perf:tracked:${email}`) || [];
      const accounts = await getConnectedAccounts(email);

      for (const trackedId of trackedIds.slice(-50)) { // Check last 50
        const tracked = await store.getJSON<{
          id: string; platform: string; targetId: string; commentId?: string;
          postedAt: number; checkedAt?: number;
        }>(`perf:comment:${email}:${trackedId}`);

        if (!tracked) continue;

        // Skip if already checked or too fresh (< 4 hours)
        if (tracked.checkedAt) continue;
        if (Date.now() - tracked.postedAt < 4 * 3600 * 1000) continue;

        results.checked++;

        const account = accounts.find(a => a.platform === tracked.platform);
        if (!account) continue;

        // Check outcomes based on platform
        let outcomes: CommentOutcomes | null = null;

        try {
          switch (tracked.platform) {
            case "reddit": {
              if (!tracked.commentId) break;
              const opts = { accessToken: account.accessToken, username: account.platformUserId || "" };
              // Get comment info — Reddit returns score and reply count
              const info = await redditApi.getCommentInfo(tracked.commentId, opts);
              if (info) {
                outcomes = {
                  replies: info.replies || 0,
                  likes: 0,
                  upvotes: info.score || 0,
                  engagementRate: (info.score || 0) + (info.replies || 0) * 3,
                  isTopPerformer: false,
                };
              }
              break;
            }
            case "x": {
              if (!tracked.commentId) break;
              const opts = { accessToken: account.accessToken, userId: account.platformUserId || "" };
              const tweet = await xApi.getTweetById(tracked.commentId, opts);
              if (tweet?.data?.public_metrics) {
                const m = tweet.data.public_metrics;
                outcomes = {
                  replies: m.reply_count || 0,
                  likes: m.like_count || 0,
                  shares: m.retweet_count || 0,
                  engagementRate: (m.like_count || 0) + (m.reply_count || 0) * 3 + (m.retweet_count || 0) * 2,
                  isTopPerformer: false,
                };
              }
              break;
            }
            case "instagram": {
              if (!tracked.commentId) break;
              const opts = { accessToken: account.accessToken, igUserId: account.platformUserId || "" };
              const comment = await instagramApi.getCommentById(tracked.commentId, opts);
              if (comment) {
                outcomes = {
                  replies: comment.replies?.data?.length || 0,
                  likes: comment.like_count || 0,
                  engagementRate: (comment.like_count || 0) + (comment.replies?.data?.length || 0) * 3,
                  isTopPerformer: false,
                };
              }
              break;
            }
            default: {
              // Facebook, LinkedIn, TikTok — use a baseline score
              outcomes = {
                replies: 0, likes: 0,
                engagementRate: 1, // Baseline — we know it was posted
                isTopPerformer: false,
              };
            }
          }
        } catch (err) {
          console.error(`[track-outcomes] Error checking ${tracked.platform}/${tracked.targetId}:`, err);
          results.errors++;
        }

        if (outcomes) {
          await recordOutcomes(email, trackedId, outcomes);
          results.updated++;
        }

        // Rate limit — don't hit APIs too fast
        await new Promise(r => setTimeout(r, 500 + Math.random() * 1000));
      }
    } catch (err) {
      console.error(`[track-outcomes] Error for ${email}:`, err);
      results.errors++;
    }
  }

  return NextResponse.json({
    success: true,
    ...results,
    message: `Checked ${results.checked} comments, updated ${results.updated} outcomes`,
  });
}
