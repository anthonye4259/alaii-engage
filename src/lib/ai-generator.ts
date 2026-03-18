/**
 * AI Content Generator — Human-like, platform-aware engagement content
 *
 * Uses OpenAI to craft responses that:
 * - Match platform culture (casual TikTok vs. professional LinkedIn)
 * - Vary length, tone, emoji usage to avoid detection
 * - Reference specific content (not generic responses)
 * - Sound like a real person, never a bot
 */

interface BusinessContext {
  businessName: string;
  industry: string;
  description: string;
  tone: string;
  targetAudience: string;
  alwaysMention: string[];
  neverSay: string[];
  additionalContext: string;
}

interface GenerateRequest {
  type: "comment_reply" | "hashtag_comment" | "dm_welcome" | "dm_outreach" | "repost_caption";
  platform: string;
  context: {
    originalContent?: string;
    authorName?: string;
    authorBio?: string;
    hashtag?: string;
    contentType?: "photo" | "video" | "carousel" | "text" | "reel" | "story";
    sentimentGuidance?: string;
    conversationMemory?: string;
  };
  businessContext: BusinessContext;
}

interface GenerateResult {
  content: string;
  variations: string[];
  confidence: number;
}

// ---------------------------------------------------------------------------
// Platform personality layers — injected into every prompt
// ---------------------------------------------------------------------------
const PLATFORM_PERSONALITY: Record<string, string> = {
  instagram: `PLATFORM STYLE — Instagram:
- Write like you're texting a friend — casual but not sloppy
- Use 0-2 emojis max (vary it — sometimes none, sometimes one)
- Keep it SHORT: 1-2 sentences
- Reference visuals if applicable ("love this shot", "the lighting though 🔥")
- Never use hashtags in comments
- Common phrasing: "ngl", "this is everything", "obsessed with this"`,

  tiktok: `PLATFORM STYLE — TikTok:
- Ultra-casual, trend-aware, Gen-Z friendly
- Use slang naturally: "this hits different", "no cap", "lowkey obsessed"
- Emojis: 💀😭🔥 — use sparingly, not every comment
- Keep VERY short: 5-15 words ideal
- Reference the video content specifically
- Never start with "Great video!" — that screams bot`,

  x: `PLATFORM STYLE — X (Twitter):
- Witty, concise, conversational
- Match the energy of the tweet you're replying to
- Use lowercase intentionally sometimes ("honestly this is it")
- Hot takes welcome — don't be bland
- Keep under 200 characters unless adding real value
- Thread-aware: acknowledge ongoing conversations`,

  linkedin: `PLATFORM STYLE — LinkedIn:
- Professional but warm — think smart colleague, not corporate PR
- Add genuine insight or a unique perspective
- Use industry terminology naturally (don't explain jargon)
- 1-3 sentences, structured clearly
- No emojis (or one max if culturally appropriate)
- Reference data, trends, or specific experience
- Never say "great post" or "thanks for sharing"`,

  reddit: `PLATFORM STYLE — Reddit:
- ZERO self-promotion — Reddit users detect and downvote this instantly
- Add genuine value: share experience, data, or a unique angle
- Match the subreddit culture (formal in r/science, casual in r/entrepreneurs)
- Be specific and helpful — Reddit rewards substance
- Use "I" statements and personal experience
- Never mention your brand unless directly asked
- Can be longer — substance matters more than brevity here`,

  facebook: `PLATFORM STYLE — Facebook:
- Conversational, like talking to a neighbor
- Friendly and warm, with a community feel
- 1-2 sentences, keeping it simple
- Emojis are fine but don't overdo it
- Reference community, shared experiences`,
};

// ---------------------------------------------------------------------------
// Core system prompts with anti-detection patterns
// ---------------------------------------------------------------------------
const ANTI_DETECTION_RULES = `
CRITICAL ANTI-DETECTION RULES — Your output MUST follow these:
1. NEVER start two replies the same way — vary your opening words
2. Vary response length: sometimes 5 words, sometimes 25 words
3. Mix punctuation styles: "this is fire" vs "This is fire!" vs "this is fire."
4. Use imperfect grammar occasionally — real people aren't perfect
5. Reference a SPECIFIC DETAIL from the post — this is how humans engage
6. Ask a follow-up question approximately 30% of the time
7. Never use these bot-tells: "Thanks for sharing!", "Great point!", "Well said!", "Absolutely!", "Couldn't agree more!"
8. Sometimes be contrarian or ask for clarification — real people don't just agree with everything
9. Occasionally misspell a word or use informal shortcuts ("ur", "tbh", "ngl")
10. Never include hashtags in replies unless it's Instagram`;

const SYSTEM_PROMPTS: Record<GenerateRequest["type"], string> = {
  comment_reply: `You are responding to a comment on your client's post. You are the actual brand replying to a real person.

${ANTI_DETECTION_RULES}

Your reply must:
- Directly reference what the commenter ACTUALLY said — never be generic
- Sound like the brand's voice, not a social media manager
- Feel spontaneous, like a human thought of it on the spot
- Be 1-2 sentences max

Write exactly 3 DIFFERENT variations. Each must start with a different word and take a different angle (e.g. one adds info, one asks a question, one relates to their comment).`,

  hashtag_comment: `You found this post organically and want to leave a genuine comment. You are NOT representing a brand openly — you're commenting as a knowledgeable person in the space.

${ANTI_DETECTION_RULES}

Your comment must:
- Show you actually READ or WATCHED the content (quote a specific part)
- Add genuine value: a tip, related experience, or thoughtful reaction
- Subtly position your expertise WITHOUT mentioning your brand name
- Never start with "Love this!" or "This is amazing!"
- Feel like you naturally stumbled on this content

Write exactly 3 DIFFERENT variations.`,

  dm_welcome: `You're sending a welcome DM to someone who just followed you. First impressions matter — this needs to feel warm, personal, and NOT automated.

${ANTI_DETECTION_RULES}

Requirements:
- Open with something specific if possible (mention their bio, recent post, mutual interest)
- Briefly explain your value in ONE sentence (what's in it for THEM)
- End with ONE genuine question — not "how can I help?" but something specific to their profile
- 2-3 sentences MAX
- Must feel like you personally noticed and welcomed them
- Never say "I noticed you followed us" (sounds automated)

Write exactly 3 DIFFERENT variations.`,

  dm_outreach: `You're reaching out cold to someone who might benefit from your client's service. This is the hardest message to get right — most cold DMs get ignored.

${ANTI_DETECTION_RULES}

Requirements:
- Lead with THEIR content or profile — never with your pitch
- Connect their specific interest/challenge to your solution in ONE sentence
- Be low-pressure: offer value, don't sell
- End with a soft CTA ("would that be useful?" not "book a call!")
- 2-3 sentences MAX
- Must pass the "would I reply to this?" test

Write exactly 3 DIFFERENT variations.`,

  repost_caption: `You're sharing someone else's content and adding your perspective. This should make YOUR audience want to engage.

${ANTI_DETECTION_RULES}

Requirements:
- Add a unique take, not just "check this out"
- Credit the creator naturally
- Tie it to your brand's expertise or audience's interests
- 1-2 sentences
- Make it discussion-worthy — end with a question or hot take

Write exactly 3 DIFFERENT variations.`,
};

/**
 * Generate engagement content using AI
 */
export async function generateContent(request: GenerateRequest): Promise<GenerateResult> {
  const { type, platform, context, businessContext } = request;

  const userPrompt = buildUserPrompt(type, platform, context, businessContext);
  const platformGuide = PLATFORM_PERSONALITY[platform] || PLATFORM_PERSONALITY.instagram;
  const systemPrompt = `${platformGuide}\n\n${SYSTEM_PROMPTS[type]}`;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
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
        temperature: 0.9,   // Higher = more creative + varied
        max_tokens: 600,
        presence_penalty: 0.6,  // Discourage repetitive phrasing
        frequency_penalty: 0.4, // Vary word choice
      }),
    });

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || "";

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
 * Build the user prompt with full context
 */
function buildUserPrompt(
  type: GenerateRequest["type"],
  platform: string,
  context: GenerateRequest["context"],
  biz: BusinessContext
): string {
  let prompt = `YOUR BRAND: ${biz.businessName}\n`;
  prompt += `WHAT YOU DO: ${biz.description}\n`;
  prompt += `INDUSTRY: ${biz.industry}\n`;
  prompt += `YOUR VOICE: ${biz.tone}\n`;
  prompt += `YOUR AUDIENCE: ${biz.targetAudience}\n`;
  prompt += `PLATFORM: ${platform}\n`;

  if (biz.alwaysMention.length > 0) {
    prompt += `WEAVE IN NATURALLY (if it fits — don't force): ${biz.alwaysMention.join(", ")}\n`;
  }
  if (biz.neverSay.length > 0) {
    prompt += `NEVER SAY: ${biz.neverSay.join(", ")}\n`;
  }
  if (biz.additionalContext) {
    prompt += `ADDITIONAL CONTEXT: ${biz.additionalContext}\n`;
  }

  // Content type awareness
  if (context.contentType) {
    const typeLabels: Record<string, string> = {
      photo: "a photo post", video: "a video", carousel: "a carousel/slideshow",
      text: "a text post", reel: "a short-form reel/video", story: "a story",
    };
    prompt += `POST TYPE: This is ${typeLabels[context.contentType] || context.contentType}. Tailor your response accordingly — e.g. reference visuals for photos, reference the video for reels.\n`;
  }

  // Sentiment guidance
  if (context.sentimentGuidance) {
    prompt += `\n${context.sentimentGuidance}\n`;
  }

  // Conversation memory
  if (context.conversationMemory) {
    prompt += `\n${context.conversationMemory}\n`;
  }

  prompt += "\n---\n\n";

  switch (type) {
    case "comment_reply":
      prompt += `Someone left this comment on your post:\n"${context.originalContent || "(no text)"}"\n`;
      if (context.authorName) prompt += `Their name: ${context.authorName}\n`;
      if (context.authorBio) prompt += `Their bio: ${context.authorBio}\n`;
      prompt += "\nWrite your reply — be specific to what they said:";
      break;
    case "hashtag_comment":
      prompt += `You found this post via #${context.hashtag || "trending"}:\n"${context.originalContent || "(no text)"}"\n`;
      if (context.authorName) prompt += `Author: ${context.authorName}\n`;
      if (context.authorBio) prompt += `Their bio: ${context.authorBio}\n`;
      prompt += "\nWrite a genuine comment that adds value — reference something SPECIFIC from the content:";
      break;
    case "dm_welcome":
      if (context.authorName) prompt += `New follower: ${context.authorName}\n`;
      if (context.authorBio) prompt += `Their bio: "${context.authorBio}"\n`;
      if (context.originalContent) prompt += `Their recent post: "${context.originalContent}"\n`;
      prompt += "\nWrite your welcome DM — make it feel personal:";
      break;
    case "dm_outreach":
      if (context.authorName) prompt += `Target: ${context.authorName}\n`;
      if (context.authorBio) prompt += `Their bio: "${context.authorBio}"\n`;
      if (context.originalContent) prompt += `Their recent post: "${context.originalContent}"\n`;
      prompt += "\nWrite a cold DM that THEY would want to reply to:";
      break;
    case "repost_caption":
      prompt += `Content to repost: "${context.originalContent || "(content)"}"\n`;
      if (context.authorName) prompt += `Original creator: ${context.authorName}\n`;
      prompt += "\nWrite your repost commentary — add YOUR unique angle:";
      break;
  }

  return prompt;
}

/**
 * Parse numbered variations from AI response
 */
function parseVariations(text: string): string[] {
  // Try "1. ...\n2. ...\n3. ..."
  const numbered = text.split("\n").filter((l) => /^\d+[\.\)]\s/.test(l.trim()));
  if (numbered.length >= 2) {
    return numbered.map((v) =>
      v.replace(/^\d+[\.\)]\s*/, "")
        .replace(/^["']|["']$/g, "")
        .replace(/^[*_]+|[*_]+$/g, "") // Remove markdown bold/italic
        .trim()
    );
  }

  // Try splitting by double newlines
  const blocks = text.split(/\n{2,}/).filter((b) => b.trim().length > 10);
  if (blocks.length >= 2) return blocks.map((b) => b.replace(/^\d+[\.\)]\s*/, "").trim());

  return [text.trim()];
}

/**
 * Platform-aware fallback content when OpenAI is unavailable
 */
function generateFallbackContent(request: GenerateRequest): GenerateResult {
  const { type, platform, context, businessContext } = request;
  const biz = businessContext;
  const author = context.authorName || "there";

  // Platform-adapted fallback templates
  const templates: Record<string, Record<string, string[]>> = {
    comment_reply: {
      instagram: [
        `yo ${author} this made our day 🙌`,
        `${author} you get it — this is exactly what ${biz.businessName} is about`,
        `appreciate you ${author}! what got you into this?`,
      ],
      tiktok: [
        `${author} spitting facts 💀`,
        `ngl ${author} you're onto something here`,
        `${author} this 🔥 what made you think of this?`,
      ],
      x: [
        `${author} underrated take honestly`,
        `this is the kind of engagement we live for ${author}`,
        `${author} curious what made you say that?`,
      ],
      linkedin: [
        `${author}, interesting perspective. We've seen similar patterns in ${biz.industry}.`,
        `This resonates, ${author}. our work with ${biz.targetAudience || "clients"} confirms this.`,
        `${author} — solid point. What's been your experience with implementing this?`,
      ],
      reddit: [
        `good point. we've seen this play out in ${biz.industry} a lot`,
        `this tracks with what we've experienced. curious what approach worked for you?`,
        `interesting take. have you tried approaching it from the ${biz.industry} angle?`,
      ],
      default: [
        `${author} appreciate this — what's your take on ${biz.industry}?`,
        `you nailed it ${author}. this is why we do what we do`,
        `${author} real talk — this kind of feedback keeps us going`,
      ],
    },
    hashtag_comment: {
      instagram: [
        `the way you put this together 👏 clean execution`,
        `been seeing more content like this lately and i'm here for it`,
        `solid approach — what tool did you use for this?`,
      ],
      tiktok: [
        `wait this is actually genius`,
        `need more of this content on my fyp tbh`,
        `the way you explained this >> most tutorials`,
      ],
      default: [
        `really well put — this deserves more attention`,
        `been thinking about this exact thing. solid perspective`,
        `this resonates. what's your take on the ${biz.industry} side of it?`,
      ],
    },
    dm_welcome: {
      default: [
        `hey ${author}! saw you just followed and wanted to say what's up. we help ${biz.targetAudience || "people"} with ${biz.description || "their goals"}. what brought you here?`,
        `${author}! welcome 🙌 we're all about ${biz.industry} here. anything specific you're working on?`,
        `hey ${author} — noticed you joined us. we're ${biz.businessName} and we're pretty deep into ${biz.industry}. what's your connection to the space?`,
      ],
    },
    dm_outreach: {
      default: [
        `hey ${author}! been seeing your content — really dig your take on ${biz.industry}. we're working on something similar at ${biz.businessName} and thought you might find it interesting. open to chatting?`,
        `${author} your recent post caught my eye. we work with ${biz.targetAudience || "people in this space"} at ${biz.businessName} — feel like there could be some overlap. worth a quick convo?`,
        `hey ${author}, love what you're building. we do ${biz.description || "similar work"} at ${biz.businessName}. not trying to sell anything — just genuinely curious about your approach. mind if I pick your brain?`,
      ],
    },
    repost_caption: {
      default: [
        `${context.authorName || "this creator"} nailed something we talk about constantly at ${biz.businessName}. thoughts? 👇`,
        `had to share this. ${context.authorName || "they"} put into words what we've been seeing in ${biz.industry}`,
        `📌 save this one. ${context.authorName || "great take"} on something every ${biz.targetAudience || "professional"} should understand`,
      ],
    },
  };

  const typeTemplates = templates[type] || templates.comment_reply;
  const platformTemplates = typeTemplates[platform] || typeTemplates.default || typeTemplates[Object.keys(typeTemplates)[0]];

  return {
    content: platformTemplates[Math.floor(Math.random() * platformTemplates.length)],
    variations: platformTemplates,
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
