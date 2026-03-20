import Link from "next/link";

export default function DockerInstallPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-text-primary mb-3">Docker Compose</h1>
        <p className="text-text-secondary leading-relaxed">
          The recommended way to self-host Alaii Engage. One command spins up the app, Redis, and an Upstash-compatible REST bridge.
        </p>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6 space-y-6">
        <h2 className="text-lg font-semibold text-text-primary">Prerequisites</h2>
        <ul className="space-y-2 text-sm text-text-secondary">
          <li>• <a href="https://docs.docker.com/get-docker/" className="text-accent hover:underline" target="_blank">Docker</a> and <a href="https://docs.docker.com/compose/" className="text-accent hover:underline" target="_blank">Docker Compose</a> installed</li>
          <li>• An <a href="https://platform.openai.com/api-keys" className="text-accent hover:underline" target="_blank">OpenAI API key</a></li>
          <li>• At least one social platform developer account (Meta, X, Reddit, etc.)</li>
        </ul>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6 space-y-6">
        <Step n={1} title="Clone the repository">
          <Code>{`git clone https://github.com/anthonye4259/alaii-engage.git
cd alaii-engage`}</Code>
        </Step>

        <Step n={2} title="Configure environment">
          <Code>{`cp .env.example .env`}</Code>
          <p className="text-xs text-text-muted mt-2 mb-3">Edit <code className="text-accent">.env</code> and add at minimum:</p>
          <Code>{`# Required
OPENAI_API_KEY=sk-your-openai-key

# Redis is auto-configured by Docker Compose
UPSTASH_REDIS_REST_URL=http://redis-rest:8079
UPSTASH_REDIS_REST_TOKEN=local_dev_token

# Add platform credentials as needed
META_APP_ID=your-meta-app-id
META_APP_SECRET=your-meta-app-secret`}</Code>
        </Step>

        <Step n={3} title="Start everything">
          <Code>{`docker compose up -d`}</Code>
          <p className="text-xs text-text-muted mt-2">This starts three services:</p>
          <div className="mt-2 space-y-1">
            {[
              { name: "app", desc: "Alaii Engage (Next.js)", port: ":3000" },
              { name: "redis", desc: "Redis 7 data store", port: ":6379" },
              { name: "redis-rest", desc: "Upstash-compatible REST bridge", port: ":8079" },
            ].map((s) => (
              <div key={s.name} className="flex items-center gap-3 bg-surface border border-border rounded-lg px-3 py-2 text-xs">
                <code className="text-accent font-semibold">{s.name}</code>
                <span className="text-text-muted">{s.desc}</span>
                <span className="text-text-muted ml-auto font-mono">{s.port}</span>
              </div>
            ))}
          </div>
        </Step>

        <Step n={4} title="Verify">
          <Code>{`curl http://localhost:3000/api/health
# {"status":"ok"}`}</Code>
          <p className="text-xs text-text-muted mt-2">
            Open <a href="http://localhost:3000" className="text-accent hover:underline">http://localhost:3000</a> in your browser to see the dashboard.
          </p>
        </Step>
      </div>

      <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-primary mb-2">📦 What's included</h3>
        <Code>{`# docker-compose.yml services:
services:
  redis:          # Redis 7 with AOF persistence
  redis-rest:     # Serverless Redis HTTP (Upstash-compatible)
  app:            # Alaii Engage (multi-stage Alpine build)`}</Code>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-text-primary mb-3">Updating</h2>
        <Code>{`git pull
docker compose up -d --build`}</Code>
      </div>

      <div className="flex gap-4">
        <Link
          href="/docs/configuration/env"
          className="flex-1 bg-card border border-border rounded-2xl p-5 hover:border-primary transition-colors group"
        >
          <p className="text-sm font-semibold text-text-primary group-hover:text-primary transition-colors">Environment Variables →</p>
          <p className="text-xs text-text-muted mt-1">All configuration options</p>
        </Link>
        <Link
          href="/docs/configuration/platforms"
          className="flex-1 bg-card border border-border rounded-2xl p-5 hover:border-primary transition-colors group"
        >
          <p className="text-sm font-semibold text-text-primary group-hover:text-primary transition-colors">Connect Platforms →</p>
          <p className="text-xs text-text-muted mt-1">Set up Instagram, X, Reddit</p>
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
