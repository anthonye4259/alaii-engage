"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const suggestedPrompts = [
  "Generate an Instagram comment for a fitness post",
  "Write a LinkedIn DM to a new connection",
  "How should I engage with posts about my industry?",
  "What hashtags should I target?",
  "Help me craft my brand voice guidelines",
  "Write a TikTok comment that feels natural",
];

export default function ChatPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: `Hey${user?.email ? " " + user.email.split("@")[0] : ""}! 👋 I'm your engagement AI assistant.\n\nI can help you:\n• **Generate content** — comments, replies, DMs for any platform\n• **Refine your voice** — tell me about your business and I'll adapt\n• **Try out ideas** — paste a post and I'll write a response\n• **Strategize** — what hashtags, what tone, what timing\n\nJust ask! Or click a suggestion below to get started.`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    try {
      // Use real AI generation
      const res = await fetch("/api/v1/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: detectPlatform(userMessage.content),
          type: "comment_reply",
          context: { originalContent: userMessage.content },
        }),
      });

      let aiContent: string;
      if (res.ok) {
        const data = await res.json();
        const variations = data.variations || [data.content];
        aiContent = `Here are some options:\n\n${variations.map((v: string, i: number) => `**Option ${i + 1}:** ${v}`).join("\n\n")}\n\n${data.confidence ? `Confidence: ${Math.round(data.confidence * 100)}%` : ""}\n\nWant me to adjust the tone, make it shorter, or try a different approach?`;
      } else {
        aiContent = "I'd be happy to help! Could you give me a bit more context? For example:\n\n• What platform is this for?\n• What kind of content are you responding to?\n• What's the tone you're going for?\n\nThe more specific you are, the better I can tailor the response.";
      }

      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: "assistant", content: aiContent, timestamp: new Date() },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: "assistant", content: "Something went wrong. Try again?", timestamp: new Date() },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handlePromptClick = (prompt: string) => {
    setInput(prompt);
    inputRef.current?.focus();
  };

  return (
    <div className="max-w-3xl mx-auto flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="pb-4 border-b border-border mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-semibold text-text-primary">AI Assistant</h1>
            <p className="text-text-muted text-xs">Generate engagement content, refine your voice, strategize growth</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[80%] rounded-2xl px-5 py-3.5 text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === "user"
                  ? "bg-primary text-white rounded-br-md"
                  : "bg-surface border border-border text-text-primary rounded-bl-md"
              }`}
              dangerouslySetInnerHTML={{
                __html: msg.content
                  .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                  .replace(/\n/g, "<br/>"),
              }}
            />
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-surface border border-border rounded-2xl rounded-bl-md px-5 py-3.5">
              <div className="flex gap-1.5">
                <div className="w-2 h-2 rounded-full bg-text-muted animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-2 h-2 rounded-full bg-text-muted animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-2 h-2 rounded-full bg-text-muted animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Prompts */}
      {messages.length <= 1 && (
        <div className="pb-3">
          <p className="text-xs text-text-muted mb-2">Try asking:</p>
          <div className="flex flex-wrap gap-2">
            {suggestedPrompts.map((prompt, i) => (
              <button
                key={i}
                onClick={() => handlePromptClick(prompt)}
                className="text-xs px-3 py-1.5 rounded-full bg-surface border border-border text-text-secondary hover:border-primary hover:text-primary transition-colors"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-border pt-4">
        <div className="flex gap-3">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me anything about engagement..."
            rows={1}
            className="flex-1 bg-surface border border-border rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary resize-none"
            style={{ minHeight: "44px", maxHeight: "120px" }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="gradient-primary text-white px-5 py-3 rounded-xl text-sm font-medium transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          >
            Send
          </button>
        </div>
        <p className="text-xs text-text-muted mt-2">
          Uses your AI content generator. Each message costs 1 API call ($0.01).
        </p>
      </div>
    </div>
  );
}

function detectPlatform(text: string): string {
  const lower = text.toLowerCase();
  if (lower.includes("instagram") || lower.includes("ig")) return "instagram";
  if (lower.includes("tiktok") || lower.includes("tik tok")) return "tiktok";
  if (lower.includes("linkedin")) return "linkedin";
  if (lower.includes("reddit")) return "reddit";
  if (lower.includes("facebook") || lower.includes("fb")) return "facebook";
  if (lower.includes("twitter") || lower.includes(" x ")) return "x";
  return "instagram";
}
