export default function APIAuthPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-text-primary mb-3">Authentication</h1>
        <p className="text-text-secondary leading-relaxed">
          All API requests require a Bearer token. Sign up to get your <code className="text-accent">ae_</code> prefixed API key.
        </p>
      </div>

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
    "apiKey": "ae_4ceeae96...",
    "createdAt": "2026-03-18T..."
  }
}`}</Code>
      </Endpoint>

      <Endpoint method="POST" path="/api/auth/login" desc="Sign in and retrieve your API key">
        <Code>{`{
  "email": "dev@app.com",
  "password": "yourpass"
}`}</Code>
      </Endpoint>

      <Endpoint method="GET" path="/api/auth/me" desc="Verify your API key and get account info">
        <Code>{`Authorization: Bearer ae_your_key`}</Code>
      </Endpoint>

      <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-primary mb-2">💡 Free tier</h3>
        <p className="text-sm text-text-secondary">
          Every account starts with <strong>100 free API calls</strong>. No credit card required. After that, usage is billed at $0.01/call.
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

function Endpoint({ method, path, desc, children }: { method: string; path: string; desc: string; children: React.ReactNode }) {
  const color = method === "GET" ? "text-green-400" : "text-blue-400";
  return (
    <div className="bg-card border border-border rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-2">
        <span className={`font-mono text-xs font-bold ${color} bg-surface px-2 py-1 rounded`}>{method}</span>
        <code className="font-mono text-sm text-text-primary">{path}</code>
      </div>
      <p className="text-text-secondary text-sm mb-4">{desc}</p>
      {children}
    </div>
  );
}
