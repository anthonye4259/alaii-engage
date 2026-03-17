/**
 * Facebook Engagement API — Uses Meta Graph API for Pages
 * 
 * Operates as the Page, not the user. Requires page access token.
 */

const GRAPH_API = "https://graph.facebook.com/v21.0";

interface FBOptions {
  pageAccessToken: string;
  pageId: string;
}

/**
 * Get recent posts from the Page
 */
export async function getPagePosts(options: FBOptions, limit = 25) {
  const res = await fetch(
    `${GRAPH_API}/${options.pageId}/posts?fields=id,message,created_time,likes.summary(true),comments.summary(true)&limit=${limit}&access_token=${options.pageAccessToken}`
  );
  return res.json();
}

/**
 * Get comments on a post
 */
export async function getComments(postId: string, options: FBOptions) {
  const res = await fetch(
    `${GRAPH_API}/${postId}/comments?fields=id,message,from,created_time&access_token=${options.pageAccessToken}`
  );
  return res.json();
}

/**
 * Reply to a comment as the Page
 */
export async function replyToComment(commentId: string, message: string, options: FBOptions) {
  const res = await fetch(`${GRAPH_API}/${commentId}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      access_token: options.pageAccessToken,
    }),
  });
  return { success: res.ok, status: res.status, data: res.ok ? await res.json() : null };
}

/**
 * Like a comment as the Page
 */
export async function likeComment(commentId: string, options: FBOptions) {
  const res = await fetch(`${GRAPH_API}/${commentId}/likes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ access_token: options.pageAccessToken }),
  });
  return { success: res.ok, status: res.status };
}

/**
 * Create a post on the Page
 */
export async function createPost(message: string, options: FBOptions, link?: string) {
  const body: Record<string, string> = {
    message,
    access_token: options.pageAccessToken,
  };
  if (link) body.link = link;

  const res = await fetch(`${GRAPH_API}/${options.pageId}/feed`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return { success: res.ok, status: res.status, data: res.ok ? await res.json() : null };
}

/**
 * Send a message via Messenger (requires pages_messaging permission)
 */
export async function sendMessage(recipientId: string, text: string, options: FBOptions) {
  const res = await fetch(`${GRAPH_API}/${options.pageId}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      recipient: { id: recipientId },
      message: { text },
      messaging_type: "RESPONSE",
      access_token: options.pageAccessToken,
    }),
  });
  return { success: res.ok, status: res.status };
}

/**
 * Search for posts mentioning the Page
 */
export async function getPageMentions(options: FBOptions) {
  const res = await fetch(
    `${GRAPH_API}/${options.pageId}/tagged?fields=id,message,from,created_time&access_token=${options.pageAccessToken}`
  );
  return res.json();
}
