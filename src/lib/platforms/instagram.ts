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

/**
 * Get a single comment by ID with replies and like count
 */
export async function getCommentById(commentId: string, options: IGOptions) {
  try {
    const res = await fetch(
      `${GRAPH_API}/${commentId}?fields=id,text,like_count,replies{id,text}&access_token=${options.accessToken}`
    );
    return res.json();
  } catch {
    return null;
  }
}

// ─── Content Publishing API ──────────────────────────────────────────────────

/**
 * Publish a single photo to Instagram
 * Two-step process: create container → publish
 */
export async function publishPhoto(
  imageUrl: string,
  caption: string,
  options: IGOptions
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    // Step 1: Create media container
    const containerRes = await fetch(`${GRAPH_API}/${options.igUserId}/media`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        image_url: imageUrl,
        caption,
        access_token: options.accessToken,
      }),
    });
    const container = await containerRes.json();
    if (!container.id) return { success: false, error: container.error?.message || "Failed to create container" };

    // Step 2: Wait for container to process then publish
    await waitForContainer(container.id, options);

    const publishRes = await fetch(`${GRAPH_API}/${options.igUserId}/media_publish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        creation_id: container.id,
        access_token: options.accessToken,
      }),
    });
    const published = await publishRes.json();
    return { success: !!published.id, id: published.id, error: published.error?.message };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

/**
 * Publish a carousel (multiple images) to Instagram
 */
export async function publishCarousel(
  items: { imageUrl: string }[],
  caption: string,
  options: IGOptions
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    // Step 1: Create individual item containers
    const childIds: string[] = [];
    for (const item of items) {
      const res = await fetch(`${GRAPH_API}/${options.igUserId}/media`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_url: item.imageUrl,
          is_carousel_item: true,
          access_token: options.accessToken,
        }),
      });
      const data = await res.json();
      if (!data.id) return { success: false, error: `Failed to create carousel item: ${data.error?.message}` };
      childIds.push(data.id);
    }

    // Step 2: Create carousel container
    const carouselRes = await fetch(`${GRAPH_API}/${options.igUserId}/media`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        media_type: "CAROUSEL",
        children: childIds,
        caption,
        access_token: options.accessToken,
      }),
    });
    const carousel = await carouselRes.json();
    if (!carousel.id) return { success: false, error: carousel.error?.message || "Failed to create carousel" };

    // Step 3: Wait and publish
    await waitForContainer(carousel.id, options);

    const publishRes = await fetch(`${GRAPH_API}/${options.igUserId}/media_publish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        creation_id: carousel.id,
        access_token: options.accessToken,
      }),
    });
    const published = await publishRes.json();
    return { success: !!published.id, id: published.id, error: published.error?.message };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

/**
 * Publish a reel (video) to Instagram
 */
export async function publishReel(
  videoUrl: string,
  caption: string,
  options: IGOptions,
  coverUrl?: string
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    // Step 1: Create reel container
    const containerBody: Record<string, string> = {
      media_type: "REELS",
      video_url: videoUrl,
      caption,
      access_token: options.accessToken,
    };
    if (coverUrl) containerBody.cover_url = coverUrl;

    const containerRes = await fetch(`${GRAPH_API}/${options.igUserId}/media`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(containerBody),
    });
    const container = await containerRes.json();
    if (!container.id) return { success: false, error: container.error?.message || "Failed to create reel container" };

    // Step 2: Wait for video processing (reels take longer)
    await waitForContainer(container.id, options, 60000); // Up to 60s for video

    // Step 3: Publish
    const publishRes = await fetch(`${GRAPH_API}/${options.igUserId}/media_publish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        creation_id: container.id,
        access_token: options.accessToken,
      }),
    });
    const published = await publishRes.json();
    return { success: !!published.id, id: published.id, error: published.error?.message };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

/**
 * Wait for a media container to finish processing
 */
async function waitForContainer(
  containerId: string,
  options: IGOptions,
  maxWaitMs = 30000
): Promise<void> {
  const startTime = Date.now();
  const interval = 3000;

  while (Date.now() - startTime < maxWaitMs) {
    const statusRes = await fetch(
      `${GRAPH_API}/${containerId}?fields=status_code&access_token=${options.accessToken}`
    );
    const status = await statusRes.json();

    if (status.status_code === "FINISHED") return;
    if (status.status_code === "ERROR") throw new Error("Container processing failed");

    await new Promise((r) => setTimeout(r, interval));
  }
}

