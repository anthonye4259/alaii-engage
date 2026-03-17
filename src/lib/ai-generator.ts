/**
 * AI Content Generator — Generates personalized engagement content
 * 
 * Uses the business context from the Chat page + OpenAI to craft
 * human, on-brand responses for comments, replies, and DMs.
 * Inspired by OpenClaw's content generation patterns.
 */

interface BusinessContext {
  businessName: string;
  industry: string;
  description: string;
  tone: string;              // e.g. "casual, friendly, use emojis"
  targetAudience: string;
  alwaysMention: string[];   // e.g. ["mikescuts.com", "Book online"]
  neverSay: string[];        // e.g. ["competitor names", "discounts"]
  additionalContext: string;
}

interface GenerateRequest {
  type: "comment_reply" | "hashtag_comment" | "dm_welcome" | "dm_outreach" | "repost_caption";
  platform: string;
  context: {
    originalContent?: string;   // The post/comment being responded to
    authorName?: string;
    authorBio?: string;
    hashtag?: string;
  };
  businessContext: BusinessContext;
}

interface GenerateResult {
  content: string;
  variations: string[];       // 3 variations for template diversity
  confidence: number;         // 0-1 how confident the AI is this is good
}

// System prompts for each engagement type
const SYSTEM_PROMPTS: Record<GenerateRequest["type"], string> = {
  comment_reply: `You are a social media manager replying to a comment on your client's post. 
Write a natural, authentic reply that:
- Sounds like a real person, NOT a bot
- Matches the brand's tone exactly
- Is relevant to what the commenter said
- Is 1-2 sentences max (keep it short)
- Includes brand mentions if natural
- NEVER uses generic responses like "Thanks for sharing!" or "Great point!"
Write exactly 3 variations, each with a different approach.`,

  hashtag_comment: `You are engaging with a post you found via hashtag search. 
Write a comment that:
- Adds genuine value to the conversation
- Shows you actually read/watched the content
- Subtly positions your client's expertise WITHOUT being salesy
- Is 1-2 sentences max
- Feels like a real person commenting, not a brand
Write exactly 3 variations.`,

  dm_welcome: `You are sending a welcome DM to a new follower.
Write a friendly, brief message that:
- Thanks them for following
- Briefly introduces what you do
- Asks ONE engaging question
- Includes a soft CTA (website, booking link) naturally
- Is 2-3 sentences max
- Feels personal, not automated
Write exactly 3 variations.`,

  dm_outreach: `You are reaching out to someone who might be interested in your client's service.
Write a cold DM that:
- References something specific about them (their content, bio, etc.)
- Explains the value proposition in ONE sentence
- Is conversational and low-pressure
- Includes a clear next step
- Is 2-3 sentences max
- Does NOT sound like spam
Write exactly 3 variations.`,

  repost_caption: `You are resharing someone else's content with your own commentary.
Write a repost caption that:
- Adds your unique perspective
- Credits the original creator
- Ties back to your brand's expertise
- Is 1-2 sentences max
Write exactly 3 variations.`,
};

/**
 * Generate engagement content using AI
 */
export async function generateContent(request: GenerateRequest): Promise<GenerateResult> {
  const { type, platform, context, businessContext } = request;

  const userPrompt = buildUserPrompt(type, platform, context, businessContext);
  const systemPrompt = SYSTEM_PROMPTS[type];

  // Call OpenAI API
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    // Fallback: return template-based content
    return generateFallbackContent(request);
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.8,
        max_tokens: 500,
      }),
    });

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || "";

    // Parse variations from the response
    const variations = parseVariations(text);

    return {
      content: variations[0] || text,
      variations,
      confidence: variations.length >= 3 ? 0.9 : 0.6,
    };
  } catch (error) {
    console.error("AI generation error:", error);
    return generateFallbackContent(request);
  }
}

/**
 * Build the user prompt with all context
 */
function buildUserPrompt(
  type: GenerateRequest["type"],
  platform: string,
  context: GenerateRequest["context"],
  biz: BusinessContext
): string {
  let prompt = `BUSINESS: ${biz.businessName} — ${biz.description}\n`;
  prompt += `INDUSTRY: ${biz.industry}\n`;
  prompt += `TONE: ${biz.tone}\n`;
  prompt += `TARGET AUDIENCE: ${biz.targetAudience}\n`;
  prompt += `PLATFORM: ${platform}\n`;

  if (biz.alwaysMention.length > 0) {
    prompt += `ALWAYS TRY TO MENTION: ${biz.alwaysMention.join(", ")}\n`;
  }
  if (biz.neverSay.length > 0) {
    prompt += `NEVER SAY: ${biz.neverSay.join(", ")}\n`;
  }
  if (biz.additionalContext) {
    prompt += `ADDITIONAL CONTEXT: ${biz.additionalContext}\n`;
  }

  prompt += "\n---\n\n";

  switch (type) {
    case "comment_reply":
      prompt += `Someone commented on your post:\n"${context.originalContent}"\n`;
      if (context.authorName) prompt += `Commenter: ${context.authorName}\n`;
      prompt += "\nWrite your reply:";
      break;
    case "hashtag_comment":
      prompt += `You found this post via #${context.hashtag}:\n"${context.originalContent}"\n`;
      if (context.authorName) prompt += `Author: ${context.authorName}\n`;
      prompt += "\nWrite your comment:";
      break;
    case "dm_welcome":
      if (context.authorName) prompt += `New follower: ${context.authorName}\n`;
      if (context.authorBio) prompt += `Their bio: ${context.authorBio}\n`;
      prompt += "\nWrite your welcome DM:";
      break;
    case "dm_outreach":
      if (context.authorName) prompt += `Target: ${context.authorName}\n`;
      if (context.authorBio) prompt += `Their bio: ${context.authorBio}\n`;
      if (context.originalContent) prompt += `Their recent post: "${context.originalContent}"\n`;
      prompt += "\nWrite your outreach DM:";
      break;
    case "repost_caption":
      prompt += `Content to repost: "${context.originalContent}"\n`;
      if (context.authorName) prompt += `Original author: ${context.authorName}\n`;
      prompt += "\nWrite your repost caption:";
      break;
  }

  return prompt;
}

/**
 * Parse numbered variations from AI response
 */
function parseVariations(text: string): string[] {
  // Try to parse "1. ...\n2. ...\n3. ..."
  const numbered = text.match(/\d+\.\s*(.+?)(?=\n\d+\.|$)/gs);
  if (numbered && numbered.length >= 2) {
    return numbered.map((v) => v.replace(/^\d+\.\s*/, "").replace(/^["']|["']$/g, "").trim());
  }

  // Try to split by double newlines
  const blocks = text.split(/\n{2,}/).filter((b) => b.trim().length > 10);
  if (blocks.length >= 2) return blocks.map((b) => b.trim());

  // Just return the whole thing as one variation
  return [text.trim()];
}

/**
 * Fallback content generation when OpenAI is unavailable
 */
function generateFallbackContent(request: GenerateRequest): GenerateResult {
  const { type, context, businessContext } = request;
  const name = businessContext.businessName;

  const templates: Record<string, string[]> = {
    comment_reply: [
      `Thanks for this! We love hearing from our community 🙌`,
      `Really appreciate you taking the time to share this!`,
      `This means a lot — thanks for being part of the ${name} community!`,
    ],
    hashtag_comment: [
      `This is great content! We're all about this at ${name} 🔥`,
      `Love seeing this kind of content — exactly what our audience needs!`,
      `Great perspective! This resonates with what we do at ${name}`,
    ],
    dm_welcome: [
      `Hey! Thanks for following ${name}! We help ${businessContext.targetAudience || "businesses"} with ${businessContext.description || "growth"}. What brings you here?`,
      `Welcome! 👋 Glad to have you in the ${name} community. Feel free to reach out anytime!`,
      `Hey there! Thanks for the follow. We'd love to help you out — check out ${businessContext.alwaysMention[0] || "our site"} to learn more!`,
    ],
    dm_outreach: [
      `Hey ${context.authorName || "there"}! Loved your recent content. We do similar work at ${name} — would love to connect!`,
      `Hi ${context.authorName || ""}! Your content caught our eye. We think there might be some synergy between what you do and ${name}. Open to chatting?`,
      `Hey! Just came across your profile and love what you're doing. We help ${businessContext.targetAudience || "people"} at ${name}. Would love to chat sometime!`,
    ],
    repost_caption: [
      `Great insight from ${context.authorName || "a creator we follow"}! This is exactly why we built ${name} 👇`,
      `Had to share this — ${context.authorName || "this creator"} nails it. Thoughts? 💭`,
      `📌 Worth a repost. ${context.authorName || "This"} captures what ${name} is all about.`,
    ],
  };

  const options = templates[type] || templates.comment_reply;

  return {
    content: options[0],
    variations: options,
    confidence: 0.5,
  };
}

/**
 * Default empty business context
 */
export const DEFAULT_BUSINESS_CONTEXT: BusinessContext = {
  businessName: "",
  industry: "",
  description: "",
  tone: "professional but friendly",
  targetAudience: "",
  alwaysMention: [],
  neverSay: [],
  additionalContext: "",
};

export type { BusinessContext, GenerateRequest, GenerateResult };
