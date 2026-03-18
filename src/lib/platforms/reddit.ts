/**
 * Reddit Engagement API
 *
 * READING: Uses public .json endpoints — no API keys needed!
 *   Just append .json to any Reddit URL and you get structured data back.
 *
 * WRITING: Uses Reddit OAuth API (needs access token)
 *   Posting comments, voting, submitting posts, sending PMs.
 */

const REDDIT_API = "https://oauth.reddit.com";
const REDDIT_PUBLIC = "https://www.reddit.com";
const USER_AGENT = "AlaiEngage/1.0";

interface RedditOptions {
  accessToken: string;
  username: string;
}

function authHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    "User-Agent": USER_AGENT,
    "Content-Type": "application/x-www-form-urlencoded",
  };
}

function publicHeaders() {
  return { "User-Agent": USER_AGENT };
}

// ---------------------------------------------------------------------------
// PUBLIC .JSON ENDPOINTS — No API keys needed
// ---------------------------------------------------------------------------

/**
 * Get posts from a subreddit (public — no auth)
 */
export async function getSubredditPosts(subreddit: string, _options?: RedditOptions, sort = "hot", limit = 25) {
  const res = await fetch(
    `${REDDIT_PUBLIC}/r/${subreddit}/${sort}.json?limit=${limit}&raw_json=1`, {
      headers: publicHeaders(),
    }
  );
  return res.json();
}

/**
 * Get comments on a post (public — no auth)
 */
export async function getPostComments(postId: string, subreddit: string, _options?: RedditOptions) {
  const res = await fetch(
    `${REDDIT_PUBLIC}/r/${subreddit}/comments/${postId}.json?sort=new&raw_json=1`, {
      headers: publicHeaders(),
    }
  );
  return res.json();
}

/**
 * Search Reddit for posts (public — no auth)
 */
export async function search(query: string, _options?: RedditOptions, subreddit?: string, limit = 25) {
  const base = subreddit
    ? `${REDDIT_PUBLIC}/r/${subreddit}/search.json`
    : `${REDDIT_PUBLIC}/search.json`;
  const res = await fetch(
    `${base}?q=${encodeURIComponent(query)}&limit=${limit}&sort=new&restrict_sr=${subreddit ? "on" : "off"}&raw_json=1`, {
      headers: publicHeaders(),
    }
  );
  return res.json();
}

/**
 * Get info about a specific comment — score, replies (public — no auth)
 */
export async function getCommentInfo(commentId: string, _options?: RedditOptions) {
  try {
    // Reddit public info endpoint
    const cleanId = commentId.startsWith("t1_") ? commentId.slice(3) : commentId;
    const res = await fetch(
      `${REDDIT_PUBLIC}/api/info.json?id=t1_${cleanId}&raw_json=1`, {
        headers: publicHeaders(),
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

/**
 * Get a user's recent posts/comments (public — no auth)
 */
export async function getUserPosts(username: string, limit = 25) {
  const res = await fetch(
    `${REDDIT_PUBLIC}/user/${username}/submitted.json?limit=${limit}&sort=new&raw_json=1`, {
      headers: publicHeaders(),
    }
  );
  return res.json();
}

/**
 * Get a user's recent comments (public — no auth)
 */
export async function getUserComments(username: string, limit = 25) {
  const res = await fetch(
    `${REDDIT_PUBLIC}/user/${username}/comments.json?limit=${limit}&sort=new&raw_json=1`, {
      headers: publicHeaders(),
    }
  );
  return res.json();
}

// ---------------------------------------------------------------------------
// OAUTH ENDPOINTS — Need access token (for writing)
// ---------------------------------------------------------------------------

/**
 * Reply to a post or comment (needs auth)
 */
export async function reply(thingId: string, text: string, options: RedditOptions) {
  const res = await fetch(`${REDDIT_API}/api/comment`, {
    method: "POST",
    headers: authHeaders(options.accessToken),
    body: new URLSearchParams({
      thing_id: thingId,
      text,
      api_type: "json",
    }),
  });
  const data = await res.json();
  const commentId = data?.json?.data?.things?.[0]?.data?.name;
  return { success: res.ok, status: res.status, data, commentId };
}

/**
 * Upvote a post or comment (needs auth)
 */
export async function upvote(thingId: string, options: RedditOptions) {
  const res = await fetch(`${REDDIT_API}/api/vote`, {
    method: "POST",
    headers: authHeaders(options.accessToken),
    body: new URLSearchParams({
      id: thingId,
      dir: "1",
    }),
  });
  return { success: res.ok, status: res.status };
}

/**
 * Submit a new post to a subreddit (needs auth)
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
    headers: authHeaders(options.accessToken),
    body: new URLSearchParams(params),
  });
  const data = await res.json();
  return { success: res.ok, status: res.status, data };
}

/**
 * Send a private message (needs auth)
 */
export async function sendPM(to: string, subject: string, text: string, options: RedditOptions) {
  const res = await fetch(`${REDDIT_API}/api/compose`, {
    method: "POST",
    headers: authHeaders(options.accessToken),
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
 * Get inbox — replies and mentions (needs auth)
 */
export async function getInbox(options: RedditOptions, limit = 25) {
  const res = await fetch(
    `${REDDIT_API}/message/inbox?limit=${limit}`, {
      headers: authHeaders(options.accessToken),
    }
  );
  return res.json();
}
