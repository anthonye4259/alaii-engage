/**
 * Conversation Memory — Track what the agent said to each person
 *
 * Prevents:
 * - Repeating the same response to the same person
 * - Using the same opening twice in a row
 * - Sending the same DM template to multiple people
 *
 * Uses Redis with 30-day TTL per conversation thread.
 * Each person×platform pair gets its own memory slot.
 */

import * as store from "./store";

const MEMORY_TTL = 30 * 24 * 3600; // 30 days
const MAX_HISTORY = 10; // Keep last 10 interactions per person

interface MemoryEntry {
  timestamp: number;
  action: string;       // "comment_reply" | "dm_welcome" | etc.
  contentSent: string;  // What we said
  contentReceived?: string; // What they said (if applicable)
  platform: string;
  sentiment?: string;    // Detected sentiment of their message
}

interface ConversationContext {
  history: MemoryEntry[];
  totalInteractions: number;
  firstInteraction?: number;  // Unix timestamp
  lastInteraction?: number;
  relationshipStage: "stranger" | "acquaintance" | "engaged" | "advocate";
}

/**
 * Build the memory key for a person×platform pair
 */
function memoryKey(platform: string, accountId: string, personId: string): string {
  return `memory:${platform}:${accountId}:${personId}`;
}

/**
 * Get conversation history with a specific person
 */
export async function getConversation(
  platform: string,
  accountId: string,
  personId: string
): Promise<ConversationContext> {
  const key = memoryKey(platform, accountId, personId);
  const raw = await store.get(key);

  if (!raw) {
    return { history: [], totalInteractions: 0, relationshipStage: "stranger" };
  }

  try {
    const data = JSON.parse(raw) as { entries: MemoryEntry[]; total: number };
    const history = data.entries || [];
    const total = data.total || history.length;

    return {
      history,
      totalInteractions: total,
      firstInteraction: history.length > 0 ? history[0].timestamp : undefined,
      lastInteraction: history.length > 0 ? history[history.length - 1].timestamp : undefined,
      relationshipStage: classifyRelationship(total),
    };
  } catch {
    return { history: [], totalInteractions: 0, relationshipStage: "stranger" };
  }
}

/**
 * Record an interaction in memory
 */
export async function recordInteraction(
  platform: string,
  accountId: string,
  personId: string,
  entry: Omit<MemoryEntry, "timestamp">
): Promise<void> {
  const key = memoryKey(platform, accountId, personId);
  const existing = await getConversation(platform, accountId, personId);

  const newEntry: MemoryEntry = { ...entry, timestamp: Date.now() };
  const entries = [...existing.history, newEntry].slice(-MAX_HISTORY); // Keep last N
  const total = existing.totalInteractions + 1;

  await store.set(key, JSON.stringify({ entries, total }), MEMORY_TTL);
}

/**
 * Classify relationship stage based on interaction count
 */
function classifyRelationship(interactions: number): ConversationContext["relationshipStage"] {
  if (interactions === 0) return "stranger";
  if (interactions <= 2) return "acquaintance";
  if (interactions <= 8) return "engaged";
  return "advocate";
}

/**
 * Generate context string for AI prompt from conversation history
 */
export function buildMemoryPrompt(context: ConversationContext): string {
  if (context.history.length === 0) {
    return "CONVERSATION HISTORY: First interaction with this person. No prior context.";
  }

  let prompt = `CONVERSATION HISTORY with this person (${context.totalInteractions} total interactions, relationship: ${context.relationshipStage}):\n`;

  // Show last 3 interactions for context
  const recent = context.history.slice(-3);
  for (const entry of recent) {
    const ago = Math.round((Date.now() - entry.timestamp) / 3_600_000);
    const timeLabel = ago < 1 ? "just now" : ago < 24 ? `${ago}h ago` : `${Math.round(ago / 24)}d ago`;
    if (entry.contentReceived) {
      prompt += `  THEM (${timeLabel}): "${entry.contentReceived}"\n`;
    }
    prompt += `  YOU (${timeLabel}): "${entry.contentSent}"\n`;
  }

  prompt += `\nIMPORTANT MEMORY RULES:
- Do NOT repeat anything you've already said — check the history above
- Do NOT start your reply the same way as any previous reply
- Reference prior conversations naturally if appropriate ("glad you're still loving it")
- Match the relationship stage:`;

  switch (context.relationshipStage) {
    case "stranger":
      prompt += " First contact — be welcoming, not overly familiar";
      break;
    case "acquaintance":
      prompt += " We've talked before — slightly warmer, can reference past interaction";
      break;
    case "engaged":
      prompt += " Regular commenter — be personal, use their name, reference shared history";
      break;
    case "advocate":
      prompt += " Loyal advocate — be friendly like an old friend, exclusive insider tone";
      break;
  }

  return prompt;
}

/**
 * Check if a proposed response is too similar to something we've already sent
 */
export function isDuplicateResponse(proposed: string, history: MemoryEntry[]): boolean {
  const proposedWords = new Set(proposed.toLowerCase().split(/\s+/));

  for (const entry of history.slice(-5)) {
    const pastWords = new Set(entry.contentSent.toLowerCase().split(/\s+/));
    const intersection = new Set([...proposedWords].filter(w => pastWords.has(w)));
    const union = new Set([...proposedWords, ...pastWords]);
    const similarity = intersection.size / union.size;

    if (similarity > 0.6) return true; // More than 60% word overlap = duplicate
  }

  return false;
}

export type { MemoryEntry, ConversationContext };
