/**
 * X (Twitter) Engagement API — Uses X API v2
 */

const X_API = "https://api.twitter.com/2";

interface XOptions {
  accessToken: string;
  userId: string;
}

/**
 * Get the user's recent tweets
 */
export async function getUserTweets(options: XOptions, maxResults = 20) {
  const res = await fetch(
    `${X_API}/users/${options.userId}/tweets?max_results=${maxResults}&tweet.fields=created_at,public_metrics,conversation_id`, {
      headers: { Authorization: `Bearer ${options.accessToken}` },
    }
  );
  return res.json();
}

/**
 * Get mentions of the user
 */
export async function getMentions(options: XOptions, maxResults = 20) {
  const res = await fetch(
    `${X_API}/users/${options.userId}/mentions?max_results=${maxResults}&tweet.fields=created_at,author_id,conversation_id,in_reply_to_user_id`, {
      headers: { Authorization: `Bearer ${options.accessToken}` },
    }
  );
  return res.json();
}

/**
 * Reply to a tweet
 */
export async function replyToTweet(tweetId: string, text: string, options: XOptions) {
  const res = await fetch(`${X_API}/tweets`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${options.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text,
      reply: { in_reply_to_tweet_id: tweetId },
    }),
  });
  return { success: res.ok, status: res.status, data: res.ok ? await res.json() : null };
}

/**
 * Like a tweet
 */
export async function likeTweet(tweetId: string, options: XOptions) {
  const res = await fetch(`${X_API}/users/${options.userId}/likes`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${options.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ tweet_id: tweetId }),
  });
  return { success: res.ok, status: res.status };
}

/**
 * Retweet a tweet
 */
export async function retweet(tweetId: string, options: XOptions) {
  const res = await fetch(`${X_API}/users/${options.userId}/retweets`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${options.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ tweet_id: tweetId }),
  });
  return { success: res.ok, status: res.status };
}

/**
 * Quote tweet (retweet with comment)
 */
export async function quoteTweet(tweetId: string, comment: string, options: XOptions) {
  const res = await fetch(`${X_API}/tweets`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${options.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text: comment,
      quote_tweet_id: tweetId,
    }),
  });
  return { success: res.ok, status: res.status, data: res.ok ? await res.json() : null };
}

/**
 * Search tweets by keyword
 */
export async function searchTweets(query: string, options: XOptions, maxResults = 20) {
  const res = await fetch(
    `${X_API}/tweets/search/recent?query=${encodeURIComponent(query)}&max_results=${maxResults}&tweet.fields=created_at,author_id,public_metrics`, {
      headers: { Authorization: `Bearer ${options.accessToken}` },
    }
  );
  return res.json();
}

/**
 * Send a DM
 */
export async function sendDM(recipientId: string, text: string, options: XOptions) {
  const res = await fetch(`${X_API}/dm_conversations/with/${recipientId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${options.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text,
    }),
  });
  return { success: res.ok, status: res.status };
}

/**
 * Get a single tweet by ID with metrics
 */
export async function getTweetById(tweetId: string, options: XOptions) {
  try {
    const res = await fetch(
      `${X_API}/tweets/${tweetId}?tweet.fields=public_metrics,created_at`, {
        headers: { Authorization: `Bearer ${options.accessToken}` },
      }
    );
    return res.json();
  } catch {
    return null;
  }
}

