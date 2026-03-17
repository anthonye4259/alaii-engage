// LinkedIn Engagement API helpers
// Uses LinkedIn Posts API and socialActions API

const LINKEDIN_API_BASE = "https://api.linkedin.com/v2";

interface LinkedInEngageOptions {
  accessToken: string;
  personUrn: string; // "urn:li:person:XXXXX"
}

/**
 * Like a LinkedIn post
 */
export async function likePost(postUrn: string, options: LinkedInEngageOptions) {
  const response = await fetch(
    `${LINKEDIN_API_BASE}/socialActions/${encodeURIComponent(postUrn)}/likes`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${options.accessToken}`,
        "Content-Type": "application/json",
        "LinkedIn-Version": "202601",
        "X-Restli-Protocol-Version": "2.0.0",
      },
      body: JSON.stringify({
        actor: options.personUrn,
        object: postUrn,
      }),
    }
  );

  return { success: response.ok, status: response.status };
}

/**
 * Comment on a LinkedIn post
 */
export async function commentOnPost(
  postUrn: string,
  commentText: string,
  options: LinkedInEngageOptions
) {
  const response = await fetch(
    `${LINKEDIN_API_BASE}/socialActions/${encodeURIComponent(postUrn)}/comments`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${options.accessToken}`,
        "Content-Type": "application/json",
        "LinkedIn-Version": "202601",
        "X-Restli-Protocol-Version": "2.0.0",
      },
      body: JSON.stringify({
        actor: options.personUrn,
        object: postUrn,
        message: {
          text: commentText,
        },
      }),
    }
  );

  const data = response.ok ? await response.json() : null;
  return { success: response.ok, status: response.status, data };
}

/**
 * Share/repost a LinkedIn post
 */
export async function sharePost(
  postUrn: string,
  commentary: string,
  options: LinkedInEngageOptions
) {
  const response = await fetch("https://api.linkedin.com/rest/posts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${options.accessToken}`,
      "Content-Type": "application/json",
      "LinkedIn-Version": "202601",
      "X-Restli-Protocol-Version": "2.0.0",
    },
    body: JSON.stringify({
      author: options.personUrn,
      commentary,
      visibility: "PUBLIC",
      distribution: {
        feedDistribution: "MAIN_FEED",
      },
      content: {
        shareContent: {
          shareCommentary: { text: commentary },
          subject: postUrn,
        },
      },
      lifecycleState: "PUBLISHED",
      isReshareDisabledByAuthor: false,
    }),
  });

  return { success: response.ok, status: response.status };
}

/**
 * Reply to a comment on a LinkedIn post
 */
export async function replyToComment(
  postUrn: string,
  parentCommentUrn: string,
  replyText: string,
  options: LinkedInEngageOptions
) {
  const response = await fetch(
    `${LINKEDIN_API_BASE}/socialActions/${encodeURIComponent(postUrn)}/comments`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${options.accessToken}`,
        "Content-Type": "application/json",
        "LinkedIn-Version": "202601",
        "X-Restli-Protocol-Version": "2.0.0",
      },
      body: JSON.stringify({
        actor: options.personUrn,
        object: postUrn,
        parentComment: parentCommentUrn,
        message: {
          text: replyText,
        },
      }),
    }
  );

  const data = response.ok ? await response.json() : null;
  return { success: response.ok, status: response.status, data };
}
