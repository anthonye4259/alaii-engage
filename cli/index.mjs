#!/usr/bin/env node

/**
 * alaii-engage CLI
 *
 * Quick setup and usage from terminal:
 *   npx alaii-engage signup
 *   npx alaii-engage generate --platform instagram --type comment_reply --context "great post!"
 *   npx alaii-engage usage
 */

const API_BASE = "https://alaii-engage.vercel.app";

const [,, command, ...args] = process.argv;

async function main() {
  switch (command) {
    case "signup": return signup();
    case "login": return login();
    case "generate": return generate();
    case "usage": return usage();
    case "webhook": return webhook();
    default: return help();
  }
}

function help() {
  console.log(`
  ╔═══════════════════════════════════╗
  ║       🤖 Alaii Engage CLI         ║
  ║   AI Social Media Engagement      ║
  ╚═══════════════════════════════════╝

  Commands:
    signup                     Create an account and get API key
    login                      Log in with existing account
    generate                   Generate engagement content
    usage                      Check your API usage
    webhook --url <url>        Register a webhook

  Generate options:
    --platform  instagram|tiktok|x|linkedin|reddit|facebook
    --type      comment_reply|hashtag_comment|dm_welcome|dm_outreach
    --context   "The content you're responding to"
    --key       Your API key (or set ALAII_API_KEY env var)

  Examples:
    npx alaii-engage signup
    npx alaii-engage generate --platform instagram --type comment_reply --context "love this!" --key ae_xxx
    ALAII_API_KEY=ae_xxx npx alaii-engage usage

  Pricing: Free = 100 calls/mo | Pro $40 = 10K | Agency $99 = 50K | Dev $0.01/call
  Docs:    ${API_BASE}/docs
  Spec:    ${API_BASE}/openapi.json
  `);
}

async function signup() {
  const readline = await import("readline");
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const ask = (q) => new Promise((r) => rl.question(q, r));

  const email = await ask("Email: ");
  const password = await ask("Password: ");
  rl.close();

  const res = await fetch(`${API_BASE}/api/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();

  if (res.ok) {
    console.log(`\n✅ Account created!`);
    console.log(`   API Key: ${data.user.apiKey}`);
    console.log(`   Plan: Free (100 calls/month)`);
    console.log(`\nSave your key: export ALAII_API_KEY=${data.user.apiKey}`);
  } else {
    console.error(`\n❌ ${data.error}`);
  }
}

async function login() {
  const readline = await import("readline");
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const ask = (q) => new Promise((r) => rl.question(q, r));

  const email = await ask("Email: ");
  const password = await ask("Password: ");
  rl.close();

  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();

  if (res.ok) {
    console.log(`\n✅ Logged in!`);
    console.log(`   API Key: ${data.user.apiKey}`);
    console.log(`\nSave your key: export ALAII_API_KEY=${data.user.apiKey}`);
  } else {
    console.error(`\n❌ ${data.error}`);
  }
}

async function generate() {
  const key = getArg("--key") || process.env.ALAII_API_KEY;
  if (!key) return console.error("❌ No API key. Use --key or set ALAII_API_KEY");

  const platform = getArg("--platform") || "instagram";
  const type = getArg("--type") || "comment_reply";
  const context = getArg("--context") || "Great content!";

  const res = await fetch(`${API_BASE}/api/v1/generate`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ platform, type, context: { originalContent: context } }),
  });
  const data = await res.json();

  if (res.ok) {
    console.log(`\n🤖 Generated for ${platform} (${type}):\n`);
    (data.variations || [data.content]).forEach((v, i) => {
      console.log(`  ${i + 1}. ${v}`);
    });
    if (data.confidence) console.log(`\n  Confidence: ${Math.round(data.confidence * 100)}%`);
  } else {
    console.error(`\n❌ ${data.error}`);
  }
}

async function usage() {
  const key = getArg("--key") || process.env.ALAII_API_KEY;
  if (!key) return console.error("❌ No API key. Use --key or set ALAII_API_KEY");

  const res = await fetch(`${API_BASE}/api/v1/usage`, {
    headers: { Authorization: `Bearer ${key}` },
  });
  const data = await res.json();

  if (res.ok) {
    console.log(`\n📊 Usage:`);
    console.log(`   Calls this period: ${data.callsThisPeriod}`);
    console.log(`   Estimated cost:    $${data.estimatedCost}`);
    console.log(`   Plan:              ${data.plan || "free"}`);
  } else {
    console.error(`\n❌ ${data.error}`);
  }
}

async function webhook() {
  const key = getArg("--key") || process.env.ALAII_API_KEY;
  if (!key) return console.error("❌ No API key. Use --key or set ALAII_API_KEY");
  const url = getArg("--url");
  if (!url) return console.error("❌ Use --url to specify webhook URL");

  const res = await fetch(`${API_BASE}/api/v1/webhooks`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
  const data = await res.json();

  if (res.ok) {
    console.log(`\n✅ Webhook registered: ${url}`);
  } else {
    console.error(`\n❌ ${data.error}`);
  }
}

function getArg(flag) {
  const idx = args.indexOf(flag);
  return idx !== -1 ? args[idx + 1] : null;
}

main().catch(console.error);
