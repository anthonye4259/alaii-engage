/**
 * TikTok Engagement API — Uses TikTok Content Posting API + Research API
 */

const TIKTOK_API = "https://open.tiktokapis.com/v2";

interface TikTokOptions {
  accessToken: string;
  openId: string;
}

/**
 * Get list of videos from the connected account
 */
export async function getVideos(options: TikTokOptions, maxCount = 20) {
  const res = await fetch(`${TIKTOK_API}/video/list/`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${options.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ max_count: maxCount }),
  });
  return res.json();
}

/**
 * Get comments on a specific video
 */
export async function getComments(videoId: string, options: TikTokOptions, maxCount = 50) {
  const res = await fetch(`${TIKTOK_API}/comment/list/`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${options.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ video_id: videoId, max_count: maxCount }),
  });
  return res.json();
}

/**
 * Reply to a comment on your video
 */
export async function replyToComment(
  videoId: string,
  commentId: string,
  text: string,
  options: TikTokOptions
) {
  const res = await fetch(`${TIKTOK_API}/comment/reply/`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${options.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      video_id: videoId,
      comment_id: commentId,
      text,
    }),
  });
  return { success: res.ok, status: res.status, data: res.ok ? await res.json() : null };
}

/**
 * Search for videos by keyword/hashtag (Research API — requires approval)
 */
export async function searchVideos(query: string, options: TikTokOptions, maxCount = 20) {
  const res = await fetch(`${TIKTOK_API}/research/video/query/`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${options.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: { and: [{ operation: "EQ", field_name: "keyword", field_values: [query] }] },
      max_count: maxCount,
      start_date: new Date(Date.now() - 7 * 86_400_000).toISOString().split("T")[0],
      end_date: new Date().toISOString().split("T")[0],
    }),
  });
  return res.json();
}

/**
 * Like a video (requires user.like scope — limited availability)
 */
export async function likeVideo(videoId: string, options: TikTokOptions) {
  // Note: TikTok's API has limited like endpoints for third-party apps
  // This may require special partnership access
  const res = await fetch(`${TIKTOK_API}/video/like/`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${options.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ video_id: videoId }),
  });
  return { success: res.ok, status: res.status };
}
