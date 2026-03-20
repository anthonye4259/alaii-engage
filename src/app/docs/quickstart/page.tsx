import Link from "next/link";

export default function QuickstartPage() {
  const baseUrl = "https://alaii-engage.vercel.app";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-text-primary mb-3">Quickstart</h1>
        <p className="text-text-secondary leading-relaxed">
          Get Alaii Engage running and make your first AI-generated engagement in under 5 minutes.
        </p>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6 space-y-6">
        <Step n={1} title="Clone and start">
          <Code>{`git clone https://github.com/anthonye4259/alaii-engage.git
cd alaii-engage
cp .env.example .env

# Add your OpenAI key to .env
echo "OPENAI_API_KEY=sk-your-key" >> .env

# Start with Docker
docker compose up`}</Code>
          <p className="text-xs text-text-muted mt-2">
            No Docker? Use <code className="text-accent">npm install && npm run dev</code> instead.
          </p>
        </Step>

        <Step n={2} title="Create an account">
          <Code>{`curl -X POST http://localhost:3000/api/auth/signup \\
  -H "Content-Type: application/json" \\
  -d '{"email":"you@example.com","password":"yourpass"}'`}</Code>
          <p className="text-xs text-text-muted mt-2">
            Save the <code className="text-accent">apiKey</code> from the response — you'll need it for all API calls.
          </p>
        </Step>

        <Step n={3} title="Generate your first AI engagement">
          <Code>{`curl -X POST http://localhost:3000/api/v1/generate \\
  -H "Authorization: Bearer ae_your_key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "platform": "instagram",
    "type": "comment_reply",
    "context": {
      "originalContent": "Just opened my new salon!",
      "authorName": "beauty_studio"
    }
  }'`}</Code>
        </Step>

        <Step n={4} title="See the response">
          <Code>{`{
  "content": "Congrats on the grand opening!! 🎉 Can't wait to check it out",
  "variations": [
    "Congrats on the grand opening!! 🎉 Can't wait to check it out",
    "this is so exciting! wishing you all the success 💪",
    "Love seeing new businesses pop up, definitely bookmarking this 🔥"
  ],
  "confidence": 0.94,
  "meta": {
    "model": "gpt-4o-mini",
    "platform": "instagram",
    "type": "comment_reply"
  }
}`}</Code>
        </Step>
      </div>

      <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-primary mb-2">💡 What just happened?</h3>
        <p className="text-sm text-text-secondary">
          Alaii Engage analyzed the post context, selected an Instagram-appropriate personality,
          and generated 3 human-like variations with anti-detection measures (varied grammar, emoji usage, casual tone).
          The AI learns from engagement outcomes over time to improve response quality.
        </p>
      </div>

      <div className="flex gap-4">
        <Link
          href="/docs/installation/docker"
          className="flex-1 bg-card border border-border rounded-2xl p-5 hover:border-primary transition-colors group"
        >
          <p className="text-sm font-semibold text-text-primary group-hover:text-primary transition-colors">Docker Setup →</p>
          <p className="text-xs text-text-muted mt-1">Full installation guide</p>
        </Link>
        <Link
          href="/docs/configuration/platforms"
          className="flex-1 bg-card border border-border rounded-2xl p-5 hover:border-primary transition-colors group"
        >
          <p className="text-sm font-semibold text-text-primary group-hover:text-primary transition-colors">Connect Platforms →</p>
          <p className="text-xs text-text-muted mt-1">Link Instagram, X, Reddit, etc.</p>
        </Link>
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

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-3">
        <span className="w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">
          {n}
        </span>
        <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
      </div>
      {children}
    </div>
  );
}
