/**
 * Reddit Engagement API — Uses Reddit OAuth API
 */

const REDDIT_API = "https://oauth.reddit.com";
const USER_AGENT = "AlaiEngage/1.0";

interface RedditOptions {
  accessToken: string;
  username: string;
}

function headers(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    "User-Agent": USER_AGENT,
    "Content-Type": "application/x-www-form-urlencoded",
  };
}

/**
 * Get posts from a subreddit
 */
export async function getSubredditPosts(subreddit: string, options: RedditOptions, sort = "hot", limit = 25) {
  const res = await fetch(
    `${REDDIT_API}/r/${subreddit}/${sort}?limit=${limit}`, {
      headers: headers(options.accessToken),
    }
  );
  return res.json();
}

/**
 * Get comments on a post
 */
export async function getPostComments(postId: string, subreddit: string, options: RedditOptions) {
  const res = await fetch(
    `${REDDIT_API}/r/${subreddit}/comments/${postId}?sort=new`, {
      headers: headers(options.accessToken),
    }
  );
  return res.json();
}

/**
 * Reply to a post or comment
 */
export async function reply(thingId: string, text: string, options: RedditOptions) {
  const res = await fetch(`${REDDIT_API}/api/comment`, {
    method: "POST",
    headers: headers(options.accessToken),
    body: new URLSearchParams({
      thing_id: thingId,
      text,
      api_type: "json",
    }),
  });
  const data = await res.json();
  return { success: res.ok, status: res.status, data };
}

/**
 * Upvote a post or comment
 */
export async function upvote(thingId: string, options: RedditOptions) {
  const res = await fetch(`${REDDIT_API}/api/vote`, {
    method: "POST",
    headers: headers(options.accessToken),
    body: new URLSearchParams({
      id: thingId,
      dir: "1",  // 1 = upvote, -1 = downvote, 0 = unvote
    }),
  });
  return { success: res.ok, status: res.status };
}

/**
 * Submit a new post to a subreddit
 */
export async function submitPost(
  subreddit: string,
  title: string,
  options: RedditOptions,
  body?: { text?: string; url?: string }
) {
  const params: Record<string, string> = {
    sr: subreddit,
    title,
    kind: body?.url ? "link" : "self",
    api_type: "json",
  };
  if (body?.text) params.text = body.text;
  if (body?.url) params.url = body.url;

  const res = await fetch(`${REDDIT_API}/api/submit`, {
    method: "POST",
    headers: headers(options.accessToken),
    body: new URLSearchParams(params),
  });
  const data = await res.json();
  return { success: res.ok, status: res.status, data };
}

/**
 * Send a private message
 */
export async function sendPM(to: string, subject: string, text: string, options: RedditOptions) {
  const res = await fetch(`${REDDIT_API}/api/compose`, {
    method: "POST",
    headers: headers(options.accessToken),
    body: new URLSearchParams({
      to,
      subject,
      text,
      api_type: "json",
    }),
  });
  return { success: res.ok, status: res.status };
}

/**
 * Search Reddit for posts
 */
export async function search(query: string, options: RedditOptions, subreddit?: string, limit = 25) {
  const base = subreddit ? `/r/${subreddit}/search` : "/search";
  const res = await fetch(
    `${REDDIT_API}${base}?q=${encodeURIComponent(query)}&limit=${limit}&sort=new&restrict_sr=${subreddit ? "on" : "off"}`, {
      headers: headers(options.accessToken),
    }
  );
  return res.json();
}

/**
 * Get inbox (replies and mentions)
 */
export async function getInbox(options: RedditOptions, limit = 25) {
  const res = await fetch(
    `${REDDIT_API}/message/inbox?limit=${limit}`, {
      headers: headers(options.accessToken),
    }
  );
  return res.json();
}

/**
 * Get info about a specific comment (score, replies)
 */
export async function getCommentInfo(commentId: string, options: RedditOptions) {
  try {
    const res = await fetch(
      `${REDDIT_API}/api/info?id=${commentId}`, {
        headers: headers(options.accessToken),
      }
    );
    const data = await res.json();
    const comment = data?.data?.children?.[0]?.data;
    if (!comment) return null;
    return {
      score: comment.score || 0,
      replies: typeof comment.replies === "object" ? (comment.replies?.data?.children?.length || 0) : 0,
      ups: comment.ups || 0,
      downs: comment.downs || 0,
    };
  } catch {
    return null;
  }
}

