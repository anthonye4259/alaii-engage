"use client";

import { useState, useRef, useEffect } from "react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const suggestedPrompts = [
  "My business is a barbershop in Brooklyn called Mike's Cuts",
  "We specialize in fades, beard trims, and hot towel shaves",
  "Our tone should be casual, friendly, and use emojis sometimes",
  "Target audience: men 18-35 who care about style",
  "Never mention competitors or offer discounts in comments",
  "Always invite people to book online at mikescuts.com",
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hey! 👋 I'm your engagement AI. Tell me about your business so I can comment, reply, and DM like you would.\n\nShare things like:\n• What your business does\n• Your brand voice and tone\n• Your target audience\n• Things to always mention (website, booking link)\n• Things to never say\n\nThe more context you give me, the better I'll engage on your behalf!",
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
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    // Simulate AI response (replace with actual API call)
    setTimeout(() => {
      const responses: Record<string, string> = {
        default: `Got it! I've saved that to your business profile. Here's what I understand so far:\n\n${userMessage.content}\n\nAnything else you want me to know? The more detail you share about your brand voice and what makes your business unique, the better my engagement will be.`,
      };

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: responses.default,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
      setIsTyping(false);
    }, 1200);
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
            <h1 className="text-lg font-semibold text-text-primary">Teach Your AI</h1>
            <p className="text-text-muted text-xs">Give your agent context about your business</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-5 py-3.5 text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === "user"
                  ? "bg-accent text-white rounded-br-md"
                  : "bg-surface border border-border text-text-primary rounded-bl-md"
              }`}
            >
              {msg.content}
            </div>
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
          <p className="text-xs text-text-muted mb-2">Quick start — click to send:</p>
          <div className="flex flex-wrap gap-2">
            {suggestedPrompts.map((prompt, i) => (
              <button
                key={i}
                onClick={() => handlePromptClick(prompt)}
                className="text-xs px-3 py-1.5 rounded-full bg-surface border border-border text-text-secondary hover:border-accent hover:text-accent transition-colors"
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
            placeholder="Tell me about your business..."
            rows={1}
            className="flex-1 bg-surface border border-border rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent resize-none"
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
          Your info is saved and used to personalize all engagement across your connected accounts.
        </p>
      </div>
    </div>
  );
}
