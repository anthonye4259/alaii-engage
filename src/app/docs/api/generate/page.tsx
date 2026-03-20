export default function APIGeneratePage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-text-primary mb-3">Generate Content</h1>
        <p className="text-text-secondary leading-relaxed">
          The core endpoint. Generate AI-powered, platform-specific engagement content at <strong>$0.01/call</strong>.
        </p>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-2">
          <span className="font-mono text-xs font-bold text-blue-400 bg-surface px-2 py-1 rounded">POST</span>
          <code className="font-mono text-sm text-text-primary">/api/v1/generate</code>
        </div>
        <p className="text-text-secondary text-sm mb-4">Generate AI engagement content tailored to a specific platform and context.</p>

        <h4 className="text-sm font-semibold text-text-primary mb-2">Request Body</h4>
        <Code>{`{
  "platform": "instagram",           // required
  "type": "comment_reply",           // required
  "context": {                       // optional — improves quality
    "originalContent": "Just opened my new salon!",
    "authorName": "beauty_studio",
    "authorBio": "Hair stylist | NYC",
    "hashtag": "#hairstylist"
  },
  "business": {                      // optional — overrides defaults
    "businessName": "FitPro Studio",
    "industry": "fitness",
    "description": "Personal training gym",
    "tone": "friendly and motivating",
    "targetAudience": "adults 25-45"
  }
}`}</Code>

        <h4 className="text-sm font-semibold text-text-primary mt-5 mb-2">Platforms</h4>
        <div className="flex flex-wrap gap-2 mb-5">
          {["instagram", "tiktok", "x", "linkedin", "reddit", "facebook"].map((p) => (
            <code key={p} className="text-xs text-accent bg-surface border border-border px-2 py-1 rounded">{p}</code>
          ))}
        </div>

        <h4 className="text-sm font-semibold text-text-primary mb-2">Content Types</h4>
        <div className="grid grid-cols-2 gap-2 mb-5">
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

        <h4 className="text-sm font-semibold text-text-primary mb-2">Response</h4>
        <Code>{`{
  "content": "Congrats on the grand opening!! 🎉",
  "variations": [
    "Congrats on the grand opening!! 🎉",
    "this is so exciting! wishing you success 💪",
    "Love seeing new businesses, bookmarking this 🔥"
  ],
  "confidence": 0.94,
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
      </div>

      <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-primary mb-2">💡 Pro tip</h3>
        <p className="text-sm text-text-secondary">
          The more context you provide (author name, bio, hashtag, post content), the more natural the AI response will be.
          Without context, the AI generates generic engagement that works but won&apos;t stand out.
        </p>
      </div>
    </div>
  );
}

function Code({ children }: { children: string }) {
  return (
    <pre className="bg-background border border-border rounded-xl p-4 font-mono text-xs text-text-secondary overflow-x-auto whitespace-pre">
      {children}
    </pre>
  );
}
