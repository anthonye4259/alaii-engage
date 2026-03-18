/**
 * Sentiment Analyzer — Detect the emotional tone of incoming content
 *
 * Used by the agent to adapt response style:
 * - Negative → empathetic, de-escalating
 * - Question → helpful, informative
 * - Positive → warm, appreciative
 * - Neutral → engaging, value-adding
 *
 * No external API needed — uses keyword patterns + heuristics.
 * Fast enough to run on every incoming comment.
 */

export type Sentiment = "positive" | "negative" | "question" | "neutral" | "complaint" | "excited";

interface SentimentResult {
  sentiment: Sentiment;
  confidence: number;   // 0-1
  signals: string[];    // What triggered this classification
  responseGuidance: string;  // Injected into the AI prompt
}

// ---------- Pattern dictionaries ----------

const POSITIVE_PATTERNS = [
  /\b(love|amazing|awesome|fantastic|incredible|beautiful|perfect|great job|well done|❤️|🔥|😍|👏|💯)\b/i,
  /\b(you'?re the best|obsessed|goat|legendary|fire|chef'?s kiss)\b/i,
  /\b(thank|thanks|thx|appreciate|grateful)\b/i,
  /\b(finally someone|exactly what i needed|this is it)\b/i,
];

const NEGATIVE_PATTERNS = [
  /\b(hate|terrible|worst|awful|horrible|disgusting|disappointed|waste|scam|rip ?off)\b/i,
  /\b(don'?t like|not worth|overpriced|misleading|unfollow|unsubscribe)\b/i,
  /\b(broken|doesn'?t work|won'?t load|buggy|glitch|error)\b/i,
  /\b(😡|😤|👎|🤮|💩)\b/,
];

const COMPLAINT_PATTERNS = [
  /\b(where is|still waiting|no response|ignored|not delivered|refund)\b/i,
  /\b(customer service|support ticket|been \d+ days|how long)\b/i,
  /\b(false advertising|bait and switch|not as described|lie|lied|lying)\b/i,
];

const QUESTION_PATTERNS = [
  /\?$/,
  /\?[\s😊🤔💭)]*$/,
  /\b(how|what|when|where|why|which|who|can you|do you|is there|does it|will it|are you)\b.*\?/i,
  /\b(anyone know|wondering|curious|thoughts on|opinions? on)\b/i,
  /\b(how much|what's the price|cost|pricing|plan)\b/i,
];

const EXCITED_PATTERNS = [
  /!{2,}/,
  /\b(omg|oh my god|no way|can'?t believe|insane|mind blown|game changer)\b/i,
  /\b(🤯|😱|🎉|🥳|🙌|💥)\b/,
  /\b(just discovered|life changing|holy|woah|whoa)\b/i,
];

/**
 * Analyze sentiment of incoming content
 */
export function analyzeSentiment(content: string): SentimentResult {
  if (!content || content.trim().length < 2) {
    return { sentiment: "neutral", confidence: 0.5, signals: ["empty content"], responseGuidance: "" };
  }

  const text = content.trim();
  const signals: string[] = [];
  let scores: Record<Sentiment, number> = {
    positive: 0, negative: 0, question: 0,
    neutral: 0, complaint: 0, excited: 0,
  };

  // Score each pattern category
  for (const p of POSITIVE_PATTERNS) { if (p.test(text)) { scores.positive += 3; signals.push("positive_keyword"); } }
  for (const p of NEGATIVE_PATTERNS) { if (p.test(text)) { scores.negative += 4; signals.push("negative_keyword"); } }
  for (const p of COMPLAINT_PATTERNS) { if (p.test(text)) { scores.complaint += 5; signals.push("complaint_keyword"); } }
  for (const p of QUESTION_PATTERNS) { if (p.test(text)) { scores.question += 3; signals.push("question_signal"); } }
  for (const p of EXCITED_PATTERNS) { if (p.test(text)) { scores.excited += 3; signals.push("excitement_signal"); } }

  // Heuristics
  const capsRatio = (text.match(/[A-Z]/g) || []).length / text.length;
  if (capsRatio > 0.5 && text.length > 5) {
    scores.excited += 2;
    if (scores.negative > 0) scores.negative += 2; // ALL CAPS + negative = angry
    signals.push("high_caps_ratio");
  }

  // Short content with no clear signal = neutral
  if (Object.values(scores).every(s => s === 0)) {
    scores.neutral = 3;
  }

  // Find winner
  const entries = Object.entries(scores) as [Sentiment, number][];
  entries.sort((a, b) => b[1] - a[1]);
  const [topSentiment, topScore] = entries[0];
  const totalScore = entries.reduce((sum, [, s]) => sum + s, 0);
  const confidence = totalScore > 0 ? Math.min(topScore / totalScore + 0.3, 0.98) : 0.5;

  return {
    sentiment: topSentiment,
    confidence,
    signals: [...new Set(signals)],
    responseGuidance: getResponseGuidance(topSentiment),
  };
}

/**
 * Generate prompt guidance based on detected sentiment
 */
function getResponseGuidance(sentiment: Sentiment): string {
  switch (sentiment) {
    case "negative":
      return `DETECTED SENTIMENT: Negative.
RESPONSE STRATEGY: Be empathetic and understanding. Acknowledge their frustration WITHOUT being defensive.
- Start with validation: "totally hear you on that" / "that's fair feedback"
- Don't argue or correct — even if they're wrong
- Offer to help or fix the issue if applicable
- Keep it SHORT — long replies to negative comments look corporate
- NEVER use "sorry for the inconvenience" — sounds robotic`;

    case "complaint":
      return `DETECTED SENTIMENT: Complaint / Support request.
RESPONSE STRATEGY: Be helpful and move to DM fast.
- Acknowledge the issue directly — don't minimize it
- Provide a specific next step ("DM us your order number" / "checking on this now")
- Show urgency — "on it" / "looking into this right now"
- Keep public response brief — resolve in DMs
- NEVER say "we apologize for any inconvenience caused"`;

    case "question":
      return `DETECTED SENTIMENT: Question.
RESPONSE STRATEGY: Answer directly and add value.
- Lead with the answer — don't start with pleasantries
- Be specific and actionable
- If you don't know, say so honestly
- Add one extra piece of useful info they didn't ask for
- Questions are GOLD for engagement — always respond`;

    case "positive":
      return `DETECTED SENTIMENT: Positive.
RESPONSE STRATEGY: Match their energy and deepen the connection.
- Mirror their enthusiasm level (but don't exceed it)
- Reference something specific they said — not just "thanks!"
- Ask a follow-up to keep the conversation going (~40% of the time)
- Use this as an opportunity to subtly share value`;

    case "excited":
      return `DETECTED SENTIMENT: High excitement.
RESPONSE STRATEGY: Match the energy and amplify.
- Be equally enthusiastic — don't be the "cool down" person
- Use exclamation marks and emojis to match their vibe
- Share in their excitement with a specific comment
- This person is a potential advocate — nurture the relationship`;

    case "neutral":
      return `DETECTED SENTIMENT: Neutral / Unclear.
RESPONSE STRATEGY: Add value to spark engagement.
- Ask a thoughtful follow-up question
- Share a relevant insight or tip
- Be warm but not over-the-top
- Goal: turn a casual observer into an engaged follower`;
  }
}

export type { SentimentResult };
