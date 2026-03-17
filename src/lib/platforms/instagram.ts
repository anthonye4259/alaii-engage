/**
 * Instagram Engagement API — Uses Meta Graph API
 * 
 * Requires: instagram_basic, instagram_manage_comments
 * Account type: Instagram Business/Creator via Facebook Page
 */

const GRAPH_API = "https://graph.facebook.com/v21.0";

interface IGOptions {
  accessToken: string;
  igUserId: string;  // Instagram Business Account ID
}

/**
 * Get recent media (posts) from the connected IG account
 */
export async function getRecentMedia(options: IGOptions, limit = 25) {
  const res = await fetch(
    `${GRAPH_API}/${options.igUserId}/media?fields=id,caption,timestamp,like_count,comments_count,media_type,permalink&limit=${limit}&access_token=${options.accessToken}`
  );
  return res.json();
}

/**
 * Get comments on a specific media post
 */
export async function getComments(mediaId: string, options: IGOptions) {
  const res = await fetch(
    `${GRAPH_API}/${mediaId}/comments?fields=id,text,username,timestamp&access_token=${options.accessToken}`
  );
  return res.json();
}

/**
 * Reply to a comment on your post
 */
export async function replyToComment(commentId: string, message: string, options: IGOptions) {
  const res = await fetch(`${GRAPH_API}/${commentId}/replies`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      access_token: options.accessToken,
    }),
  });
  return { success: res.ok, status: res.status, data: res.ok ? await res.json() : null };
}

/**
 * Get mentions of the account (tagged posts)
 */
export async function getMentions(options: IGOptions) {
  const res = await fetch(
    `${GRAPH_API}/${options.igUserId}/tags?fields=id,caption,username,timestamp,permalink&access_token=${options.accessToken}`
  );
  return res.json();
}

/**
 * Comment on a media post (your own or one you're tagged in)
 */
export async function commentOnMedia(mediaId: string, message: string, options: IGOptions) {
  const res = await fetch(`${GRAPH_API}/${mediaId}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      access_token: options.accessToken,
    }),
  });
  return { success: res.ok, status: res.status, data: res.ok ? await res.json() : null };
}

/**
 * Get hashtag search results (requires ig_hashtag_search permission)
 */
export async function searchHashtag(hashtag: string, options: IGOptions) {
  // First get hashtag ID
  const idRes = await fetch(
    `${GRAPH_API}/ig_hashtag_search?q=${encodeURIComponent(hashtag)}&user_id=${options.igUserId}&access_token=${options.accessToken}`
  );
  const idData = await idRes.json();
  const hashtagId = idData.data?.[0]?.id;
  if (!hashtagId) return { data: [] };

  // Then get recent media for that hashtag
  const mediaRes = await fetch(
    `${GRAPH_API}/${hashtagId}/recent_media?user_id=${options.igUserId}&fields=id,caption,permalink,timestamp&access_token=${options.accessToken}`
  );
  return mediaRes.json();
}

/**
 * Send a message via Instagram DM (Messenger API)
 */
export async function sendDM(recipientId: string, message: string, options: IGOptions) {
  const res = await fetch(`${GRAPH_API}/${options.igUserId}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      recipient: { id: recipientId },
      message: { text: message },
      access_token: options.accessToken,
    }),
  });
  return { success: res.ok, status: res.status };
}
