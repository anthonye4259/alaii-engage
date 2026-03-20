/**
 * Alaii Engage SDK
 *
 * AI-powered social media engagement — generate human-like
 * replies, comments, and DMs across 6 platforms.
 *
 * @example
 * ```ts
 * import { AlaiEngage } from "alaii-engage";
 *
 * const alaii = new AlaiEngage({ apiKey: "ae_your_key" });
 * const reply = await alaii.generate({
 *   platform: "instagram",
 *   type: "comment_reply",
 *   context: { originalContent: "love your work!" },
 * });
 * console.log(reply.content);
 * ```
 */

export type Platform = "instagram" | "tiktok" | "x" | "linkedin" | "reddit" | "facebook";
export type ContentType = "comment_reply" | "hashtag_comment" | "dm_welcome" | "dm_outreach" | "repost_caption";

export interface GenerateOptions {
  platform: Platform;
  type: ContentType;
  context?: {
    originalContent?: string;
    authorName?: string;
    authorBio?: string;
    hashtag?: string;
  };
  business?: {
    businessName?: string;
    industry?: string;
    description?: string;
    tone?: string;
    targetAudience?: string;
  };
}

export interface GenerateResult {
  content: string;
  variations: string[];
  confidence: number;
  usage: { callsThisPeriod: number; estimatedCost: number };
  meta: { model: string; platform: string; type: string };
}

export interface PublishOptions {
  type: "photo" | "carousel" | "reel";
  imageUrl?: string;
  imageUrls?: string[];
  videoUrl?: string;
  caption: string;
}

export interface UsageResult {
  callsThisPeriod: number;
  estimatedCost: number;
  periodStart: string;
  periodEnd: string;
  ratePerCall: number;
}

export interface AlaiEngageConfig {
  apiKey: string;
  baseUrl?: string;
}

export class AlaiEngage {
  private apiKey: string;
  private baseUrl: string;

  constructor(config: AlaiEngageConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = (config.baseUrl || "https://alaii-engage.vercel.app").replace(/\/$/, "");
  }

  /**
   * Generate AI-powered engagement content
   * @param options Platform, content type, and context
   * @returns AI-generated content with 3 variations
   */
  async generate(options: GenerateOptions): Promise<GenerateResult> {
    return this.request<GenerateResult>("POST", "/api/v1/generate", options);
  }

  /**
   * Publish content to Instagram
   * @param options Content type, media URLs, and caption
   */
  async publish(options: PublishOptions): Promise<{ success: boolean; id?: string }> {
    return this.request("POST", "/api/v1/publish", options);
  }

  /**
   * Check API usage for the current billing period
   */
  async usage(): Promise<UsageResult> {
    return this.request<UsageResult>("GET", "/api/v1/usage");
  }

  /**
   * Create a new account and get an API key
   */
  static async signup(
    email: string,
    password: string,
    baseUrl = "https://alaii-engage.vercel.app"
  ): Promise<{ apiKey: string; email: string }> {
    const res = await fetch(`${baseUrl}/api/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Signup failed");
    return { apiKey: data.user.apiKey, email: data.user.email };
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `API error ${res.status}`);
    return data as T;
  }
}

export default AlaiEngage;
