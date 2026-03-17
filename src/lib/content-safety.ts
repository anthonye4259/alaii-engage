/**
 * Content Safety — Pre-screen outbound content before posting
 * 
 * Catches spam, harassment, and policy-violating content before
 * it reaches the platform. Protects accounts from bans.
 */

interface SafetyResult {
  safe: boolean;
  score: number;        // 0-100, higher = riskier
  flags: string[];
  suggestion?: string;  // Suggested rewrite if flagged
}

// Words/phrases that trigger spam detection
const SPAM_PATTERNS = [
  // Sales pressure
  /\b(buy now|limited time|act fast|don'?t miss|hurry|exclusive offer)\b/i,
  // Crypto/MLM
  /\b(crypto|bitcoin|ethereum|nft|web3|passive income|financial freedom|forex)\b/i,
  // Engagement bait
  /\b(follow for follow|f4f|follow back|like for like|l4l|sub4sub)\b/i,
  // Unsolicited links
  /(https?:\/\/(?!your-domain\.com))\S+/i,
  // Excessive caps
  /[A-Z]{10,}/,
  // Excessive emojis (more than 5 in a row)
  /(?:[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]\s*){6,}/u,
];

// Harassment / harmful content patterns
const HARASSMENT_PATTERNS = [
  /\b(stupid|idiot|dumb|ugly|fat|loser|trash)\b/i,
  /\b(kill|die|hate)\s+(your|you|them|him|her)\b/i,
  /\b(stfu|gtfo|kys)\b/i,
];

// Competitor mention detection (customizable per account)
const DEFAULT_BLOCKED_PHRASES = [
  "competitor",
  "discount code",
  "promo code",
  "coupon",
  "free trial",
];

/**
 * Screen content for safety before posting
 */
export function screenContent(
  content: string,
  blockedPhrases: string[] = DEFAULT_BLOCKED_PHRASES
): SafetyResult {
  const flags: string[] = [];
  let score = 0;

  // Check for empty or too-short content
  if (content.trim().length < 3) {
    return { safe: false, score: 100, flags: ["Content too short"] };
  }

  // Check for too-long content (platform limits vary)
  if (content.length > 2000) {
    flags.push("Content may exceed platform character limits");
    score += 10;
  }

  // Check spam patterns
  for (const pattern of SPAM_PATTERNS) {
    if (pattern.test(content)) {
      flags.push(`Spam detected: matches pattern "${pattern.source.slice(0, 30)}..."`);
      score += 25;
    }
  }

  // Check harassment patterns
  for (const pattern of HARASSMENT_PATTERNS) {
    if (pattern.test(content)) {
      flags.push(`Potentially harmful language detected`);
      score += 40;
    }
  }

  // Check blocked phrases (per account)
  for (const phrase of blockedPhrases) {
    if (content.toLowerCase().includes(phrase.toLowerCase())) {
      flags.push(`Blocked phrase found: "${phrase}"`);
      score += 15;
    }
  }

  // Check for duplicate/repetitive content
  const words = content.toLowerCase().split(/\s+/);
  const uniqueWords = new Set(words);
  if (words.length > 5 && uniqueWords.size / words.length < 0.3) {
    flags.push("Repetitive content detected");
    score += 20;
  }

  // Cap score at 100
  score = Math.min(score, 100);

  return {
    safe: score < 30,  // Under 30 = safe, 30-60 = review, 60+ = block
    score,
    flags,
    suggestion: score >= 30 ? "Consider rephrasing to sound more natural and personal." : undefined,
  };
}

/**
 * Classify content risk level
 */
export function getContentRiskLevel(score: number): "safe" | "review" | "blocked" {
  if (score < 30) return "safe";
  if (score < 60) return "review";
  return "blocked";
}

/**
 * Validate that content variations are sufficiently different
 * (prevents template spam detection by platforms)
 */
export function validateVariation(templates: string[]): {
  valid: boolean;
  uniqueness: number;  // 0-1 ratio
  suggestion?: string;
} {
  if (templates.length < 2) {
    return { valid: true, uniqueness: 1 };
  }

  // Simple word-level similarity check
  let totalSimilarity = 0;
  let comparisons = 0;

  for (let i = 0; i < templates.length; i++) {
    for (let j = i + 1; j < templates.length; j++) {
      const wordsA = new Set(templates[i].toLowerCase().split(/\s+/));
      const wordsB = new Set(templates[j].toLowerCase().split(/\s+/));
      const intersection = new Set([...wordsA].filter((w) => wordsB.has(w)));
      const union = new Set([...wordsA, ...wordsB]);
      totalSimilarity += intersection.size / union.size;
      comparisons++;
    }
  }

  const avgSimilarity = totalSimilarity / comparisons;
  const uniqueness = 1 - avgSimilarity;

  return {
    valid: uniqueness > 0.4,  // At least 40% different
    uniqueness,
    suggestion:
      uniqueness <= 0.4
        ? "Your message templates are too similar. Platforms may flag this as spam. Add more variety."
        : undefined,
  };
}
