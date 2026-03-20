import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, authenticateApiKey } from "@/lib/auth";
import { getConnectedAccounts } from "@/lib/connected-accounts";
import * as instagramApi from "@/lib/platforms/instagram";

async function authenticateRequest(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ae_")) {
    return authenticateApiKey(authHeader.replace("Bearer ", ""));
  }
  return getCurrentUser();
}

/**
 * POST /api/v1/publish — Publish content to Instagram
 *
 * Body: {
 *   platform: "instagram",
 *   type: "photo" | "carousel" | "reel",
 *   caption: "Your caption here",
 *   imageUrl?: "https://...",           // for photo
 *   items?: [{ imageUrl: "..." }],      // for carousel
 *   videoUrl?: "https://...",           // for reel
 *   coverUrl?: "https://...",           // optional reel cover
 * }
 */
export async function POST(req: NextRequest) {
  const user = await authenticateRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { platform, type, caption, imageUrl, items, videoUrl, coverUrl } = body;

  if (platform !== "instagram") {
    return NextResponse.json({ error: "Only Instagram publishing is supported" }, { status: 400 });
  }

  if (!caption) {
    return NextResponse.json({ error: "Caption is required" }, { status: 400 });
  }

  // Get the user's Instagram account
  const accounts = await getConnectedAccounts(user.email);
  const igAccount = accounts.find((a) => a.platform === "instagram");

  if (!igAccount || !igAccount.platformUserId) {
    return NextResponse.json({
      error: "Instagram account not connected. Go to /accounts to connect.",
    }, { status: 400 });
  }

  const options = {
    accessToken: igAccount.pageToken || igAccount.accessToken,
    igUserId: igAccount.platformUserId,
  };

  try {
    let result: { success: boolean; id?: string; error?: string };

    switch (type) {
      case "photo": {
        if (!imageUrl) {
          return NextResponse.json({ error: "imageUrl is required for photo" }, { status: 400 });
        }
        result = await instagramApi.publishPhoto(imageUrl, caption, options);
        break;
      }
      case "carousel": {
        if (!items || items.length < 2) {
          return NextResponse.json({ error: "At least 2 items required for carousel" }, { status: 400 });
        }
        result = await instagramApi.publishCarousel(items, caption, options);
        break;
      }
      case "reel": {
        if (!videoUrl) {
          return NextResponse.json({ error: "videoUrl is required for reel" }, { status: 400 });
        }
        result = await instagramApi.publishReel(videoUrl, caption, options, coverUrl);
        break;
      }
      default:
        return NextResponse.json({ error: "type must be 'photo', 'carousel', or 'reel'" }, { status: 400 });
    }

    if (result.success) {
      return NextResponse.json({
        success: true,
        mediaId: result.id,
        message: `${type} published to Instagram successfully`,
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error || "Publishing failed",
      }, { status: 500 });
    }
  } catch (err) {
    console.error("[publish] Error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
