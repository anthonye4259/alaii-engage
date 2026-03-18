"use client";

import { useState } from "react";

type Section = "overview" | "auth" | "generate" | "usage" | "errors";

const sections: { id: Section; label: string; icon: string }[] = [
  { id: "overview", label: "Overview", icon: "📋" },
  { id: "auth", label: "Authentication", icon: "🔐" },
  { id: "generate", label: "Generate Content", icon: "⚡" },
  { id: "usage", label: "Usage & Billing", icon: "📊" },
  { id: "errors", label: "Errors", icon: "🚨" },
];

export default function DocsPage() {
  const [active, setActive] = useState<Section>("overview");
  const baseUrl = "https://alaii-engage.vercel.app";

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary">API Documentation</h1>
        <p className="text-text-secondary text-sm mt-2">
          Everything you need to integrate Alaii Engage into your app or agent.
          <span className="ml-2 text-accent font-mono text-xs">v1</span>
        </p>
      </div>

      <div className="flex gap-8">
        {/* Sidebar */}
        <nav className="w-48 shrink-0">
          <ul className="space-y-1 sticky top-8">
            {sections.map((s) => (
              <li key={s.id}>
                <button
                  onClick={() => setActive(s.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    active === s.id
                      ? "bg-primary/10 text-primary"
                      : "text-text-muted hover:text-text-secondary hover:bg-surface"
                  }`}
                >
                  <span className="mr-2">{s.icon}</span>
                  {s.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-6">
          {active === "overview" && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-card border border-border rounded-2xl p-6">
                <h2 className="text-lg font-semibold text-text-primary mb-3">Base URL</h2>
                <pre className="bg-background border border-border rounded-xl p-4 font-mono text-sm text-accent overflow-x-auto">
                  {baseUrl}
                </pre>
              </div>

              <div className="bg-card border border-border rounded-2xl p-6">
                <h2 className="text-lg font-semibold text-text-primary mb-3">Quick Start</h2>
                <p className="text-text-secondary text-sm mb-4">Three API calls to get started:</p>
                <div className="space-y-4">
                  <Step n={1} title="Sign up and get your API key">
                    <Code>{`curl -X POST ${baseUrl}/api/auth/signup \\
  -H "Content-Type: application/json" \\
  -d '{"email":"dev@app.com","password":"yourpass"}'`}</Code>
                  </Step>
                  <Step n={2} title="Generate engagement content">
                    <Code>{`curl -X POST ${baseUrl}/api/v1/generate \\
  -H "Authorization: Bearer ae_your_key" \\
  -H "Content-Type: application/json" \\
  -d '{"platform":"instagram","type":"comment_reply","context":{"originalContent":"love your work!"}}'`}</Code>
                  </Step>
                  <Step n={3} title="Check your usage">
                    <Code>{`curl ${baseUrl}/api/v1/usage \\
  -H "Authorization: Bearer ae_your_key"`}</Code>
                  </Step>
                </div>
              </div>

              <div className="bg-card border border-border rounded-2xl p-6">
                <h2 className="text-lg font-semibold text-text-primary mb-3">Supported Platforms</h2>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { name: "Instagram", id: "instagram" },
                    { name: "TikTok", id: "tiktok" },
                    { name: "X (Twitter)", id: "x" },
                    { name: "LinkedIn", id: "linkedin" },
                    { name: "Reddit", id: "reddit" },
                    { name: "Facebook", id: "facebook" },
                  ].map((p) => (
                    <div key={p.id} className="bg-surface border border-border rounded-xl px-4 py-3 text-sm">
                      <span className="font-medium text-text-primary">{p.name}</span>
                      <span className="text-text-muted font-mono text-xs ml-2">{p.id}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {active === "auth" && (
            <div className="space-y-6 animate-fade-in">
              <Endpoint method="POST" path="/api/auth/signup" desc="Create a new account and get an API key">
                <h4 className="text-sm font-semibold text-text-primary mb-2">Request Body</h4>
                <Code>{`{
  "email": "dev@app.com",     // required
  "password": "yourpass"      // required, min 6 chars
}`}</Code>
                <h4 className="text-sm font-semibold text-text-primary mt-4 mb-2">Response</h4>
                <Code>{`{
  "success": true,
  "user": {
    "email": "dev@app.com",
    "plan": "free",
    "apiKey": "ae_4ceeae96...",   // Use this for all API calls
    "createdAt": "2026-03-18T..."
  }
}`}</Code>
              </Endpoint>

              <Endpoint method="POST" path="/api/auth/login" desc="Sign in and get your API key">
                <Code>{`{
  "email": "dev@app.com",
  "password": "yourpass"
}`}</Code>
              </Endpoint>

              <Endpoint method="GET" path="/api/auth/me" desc="Get current user (verify API key)">
                <p className="text-text-muted text-sm mb-3">Add your API key in the Authorization header:</p>
                <Code>{`Authorization: Bearer ae_your_key`}</Code>
              </Endpoint>
            </div>
          )}

          {active === "generate" && (
            <div className="space-y-6 animate-fade-in">
              <Endpoint method="POST" path="/api/v1/generate" desc="Generate AI engagement content — $0.01/call">
                <h4 className="text-sm font-semibold text-text-primary mb-2">Request Body</h4>
                <Code>{`{
  "platform": "instagram",         // required: instagram, tiktok, x, linkedin, reddit, facebook
  "type": "comment_reply",         // required: see types below
  "context": {                     // optional context for personalization
    "originalContent": "love your service!",
    "authorName": "sarah_fitness",
    "authorBio": "NASM certified trainer",
    "hashtag": "#fitnessstudio"
  },
  "business": {                    // optional: overrides account defaults
    "businessName": "FitPro Studio",
    "industry": "fitness",
    "description": "Personal training gym",
    "tone": "friendly and motivating",
    "targetAudience": "adults 25-45"
  }
}`}</Code>

                <h4 className="text-sm font-semibold text-text-primary mt-5 mb-2">Content Types</h4>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "comment_reply", desc: "Reply to a comment on your post" },
                    { id: "hashtag_comment", desc: "Comment on a post by hashtag" },
                    { id: "dm_welcome", desc: "Welcome DM to a new follower" },
                    { id: "dm_outreach", desc: "Cold outreach DM" },
                    { id: "repost_caption", desc: "Caption for a repost/share" },
                  ].map((t) => (
                    <div key={t.id} className="bg-surface border border-border rounded-xl px-3 py-2">
                      <code className="text-xs text-accent">{t.id}</code>
                      <p className="text-xs text-text-muted mt-0.5">{t.desc}</p>
                    </div>
                  ))}
                </div>

                <h4 className="text-sm font-semibold text-text-primary mt-5 mb-2">Response</h4>
                <Code>{`{
  "content": "That's amazing work! 🔥",         // Best variation
  "variations": [                                // All 3 variations
    "That's amazing work! 🔥",
    "wow this is genuinely impressive, keep going",
    "Love seeing this kind of quality content 💪"
  ],
  "confidence": 0.92,                            // 0-1 confidence score
  "usage": {
    "callsThisPeriod": 47,
    "estimatedCost": 0.47
  },
  "meta": {
    "model": "gpt-4o-mini",
    "platform": "instagram",
    "type": "comment_reply"
  }
}`}</Code>
              </Endpoint>
            </div>
          )}

          {active === "usage" && (
            <div className="space-y-6 animate-fade-in">
              <Endpoint method="GET" path="/api/v1/usage" desc="Check your current billing period usage">
                <h4 className="text-sm font-semibold text-text-primary mb-2">Response</h4>
                <Code>{`{
  "callsThisPeriod": 1423,
  "estimatedCost": 14.23,           // $0.01 × 1,423 calls
  "periodStart": "2026-03-01T...",
  "periodEnd": "2026-03-31T...",
  "ratePerCall": 0.01
}`}</Code>
              </Endpoint>

              <div className="bg-card border border-border rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-text-primary mb-3">Pricing</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-surface rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-text-primary">$0.01</p>
                    <p className="text-xs text-text-muted mt-1">per API call</p>
                  </div>
                  <div className="bg-surface rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-text-primary">$0</p>
                    <p className="text-xs text-text-muted mt-1">monthly minimum</p>
                  </div>
                  <div className="bg-surface rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-text-primary">3</p>
                    <p className="text-xs text-text-muted mt-1">variations per call</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {active === "errors" && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-card border border-border rounded-2xl p-6">
                <h2 className="text-lg font-semibold text-text-primary mb-4">Error Codes</h2>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 text-text-muted font-medium">Code</th>
                      <th className="text-left py-2 text-text-muted font-medium">Meaning</th>
                      <th className="text-left py-2 text-text-muted font-medium">Fix</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { code: "400", meaning: "Bad request", fix: "Check required fields: platform, type" },
                      { code: "401", meaning: "Unauthorized", fix: "Add header: Authorization: Bearer ae_your_key" },
                      { code: "500", meaning: "Generation failed", fix: "Retry — OpenAI may be temporarily unavailable" },
                    ].map((e) => (
                      <tr key={e.code} className="border-b border-border">
                        <td className="py-3 font-mono text-error">{e.code}</td>
                        <td className="py-3 text-text-primary">{e.meaning}</td>
                        <td className="py-3 text-text-muted">{e.fix}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="bg-card border border-border rounded-2xl p-6">
                <h2 className="text-lg font-semibold text-text-primary mb-3">All Responses</h2>
                <p className="text-text-secondary text-sm">
                  Every response includes standard JSON. Errors always have an <code className="text-accent">error</code> field:
                </p>
                <Code>{`// Success
{ "success": true, "user": { ... } }

// Error
{ "error": "Invalid email or password" }`}</Code>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------- Helpers ---------- */

function Code({ children }: { children: string }) {
  return (
    <pre className="bg-background border border-border rounded-xl p-4 font-mono text-xs text-text-secondary overflow-x-auto whitespace-pre">
      {children}
    </pre>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
          {n}
        </span>
        <p className="text-sm font-medium text-text-primary">{title}</p>
      </div>
      {children}
    </div>
  );
}

function Endpoint({ method, path, desc, children }: { method: string; path: string; desc: string; children: React.ReactNode }) {
  const color = method === "GET" ? "text-success" : method === "POST" ? "text-accent" : "text-warning";
  return (
    <div className="bg-card border border-border rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-2">
        <span className={`font-mono text-xs font-bold ${color} bg-surface px-2 py-1 rounded`}>
          {method}
        </span>
        <code className="font-mono text-sm text-text-primary">{path}</code>
      </div>
      <p className="text-text-secondary text-sm mb-4">{desc}</p>
      {children}
    </div>
  );
}
