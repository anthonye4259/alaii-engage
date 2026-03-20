<div align="center">

# ⚡ Alaii Engage

**Open-source AI engagement engine for social media.**

Automate replies, comments, DMs, and growth across Instagram, TikTok, X, LinkedIn, Reddit, and Facebook — powered by AI that sounds human.

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/alaii-app/engage)

[Demo](https://alaii.app) · [API Docs](https://alaii.app/docs) · [Discord](https://discord.gg/alaii)

</div>

---

## What is Alaii Engage?

Most social media tools handle **publishing** — scheduling posts, managing calendars. Alaii Engage handles what happens **after you post**: replying to comments, engaging with your niche, welcoming new followers, and learning what works.

### Key Features

- 🤖 **AI-Powered Replies** — Context-aware responses that reference specific post content, never generic
- 🎭 **Platform Personalities** — Different tone for each platform (casual TikTok, professional LinkedIn, witty X)
- 🛡️ **Anti-Detection** — Varied timing, imperfect grammar, mixed emoji usage — indistinguishable from human
- 📊 **Performance Learning** — Tracks which reply styles get the most engagement, improves over time
- 🧠 **Conversation Memory** — Remembers past interactions for natural follow-ups
- ⚡ **Real-Time Webhooks** — Instant replies via Meta webhooks (not polling)
- 📸 **Content Publishing** — Publish photos, carousels, and reels to Instagram
- 🔑 **Developer API** — Other AI agents can use your engagement engine at $0.01/call
- 🔒 **Rate Limiting & Safety** — Built-in content screening, account health monitoring, platform-aware rate limits

### Supported Platforms

| Platform | Comments | DMs | Likes | Publish |
|----------|----------|-----|-------|---------|
| Instagram | ✅ | ✅ | ❌ | ✅ |
| Facebook | ✅ | ✅ | ✅ | ✅ |
| X / Twitter | ✅ | ✅ | ✅ | ✅ |
| LinkedIn | ✅ | ❌ | ✅ | ✅ |
| Reddit | ✅ | ✅ | ✅ | ✅ |
| TikTok | ✅ | ❌ | ✅ | ✅ |

---

## Quick Start

### Option 1: Docker (recommended)

```bash
git clone https://github.com/alaii-app/engage.git
cd engage
cp .env.example .env
# Add your OpenAI API key to .env
docker compose up
```

Open [http://localhost:3000](http://localhost:3000) — done.

### Option 2: Manual

```bash
git clone https://github.com/alaii-app/engage.git
cd engage
npm install
cp .env.example .env
# Add your OpenAI key and Redis URL to .env
npm run dev
```

### Option 3: One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/alaii-app/engage&env=OPENAI_API_KEY,UPSTASH_REDIS_REST_URL,UPSTASH_REDIS_REST_TOKEN)

---

## How It Works

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Cron Job   │────▶│    Agent     │────▶│  AI Content  │
│  (10 min)    │     │  Orchestrator│     │  Generator   │
└──────────────┘     └──────┬───────┘     └──────────────┘
                            │
              ┌─────────────┼─────────────┐
              ▼             ▼             ▼
      ┌──────────┐  ┌──────────┐  ┌──────────┐
      │ Instagram│  │    X     │  │  Reddit  │
      │ Facebook │  │ LinkedIn │  │  TikTok  │
      └──────────┘  └──────────┘  └──────────┘
              │             │             │
              └─────────────┼─────────────┘
                            ▼
                    ┌──────────────┐
                    │ Performance  │
                    │  Learning    │
                    └──────────────┘
```

1. **Cron** runs every 10 minutes (or instantly via webhooks)
2. **Agent** scans connected accounts for new comments, mentions, DMs
3. **AI Generator** crafts platform-specific, context-aware responses
4. **Engagement Engine** posts replies with rate limiting and safety checks
5. **Performance Learning** tracks results and improves future responses

---

## API Usage

Sign up and get an API key, then:

```bash
curl -X POST https://localhost:3000/api/v1/generate \
  -H "Authorization: Bearer ae_your_key" \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "instagram",
    "type": "comment_reply",
    "context": {
      "originalContent": "love your work!",
      "authorName": "sarah_fitness"
    }
  }'
```

Returns 3 human-like variations tailored to the platform.

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/signup` | POST | Create account, get API key |
| `/api/v1/generate` | POST | Generate engagement content |
| `/api/v1/publish` | POST | Publish to Instagram |
| `/api/v1/queue` | GET/POST | View/manage engagement queue |
| `/api/v1/analytics` | GET | Engagement analytics |
| `/api/v1/usage` | GET | API usage stats |
| `/api/webhooks/meta` | GET/POST | Meta real-time webhooks |

---

## Architecture

```
src/
├── app/                    # Next.js pages + API routes
│   ├── api/
│   │   ├── cron/           # Scheduled jobs (engage, track-outcomes)
│   │   ├── v1/             # Public API (generate, publish, queue)
│   │   ├── webhooks/       # Meta webhook handler
│   │   └── stripe/         # Payments (optional)
│   ├── dashboard/          # Analytics dashboard
│   └── landing/            # Marketing pages
├── lib/
│   ├── agent.ts            # Core orchestrator — the brain
│   ├── ai-generator.ts     # AI content generation with anti-detection
│   ├── engage.ts           # Platform action execution with safety
│   ├── rate-limiter.ts     # Per-platform rate limiting
│   ├── content-safety.ts   # Content screening
│   ├── account-health.ts   # Account safety monitoring
│   ├── performance-learning.ts  # Learns from engagement outcomes
│   ├── conversation-memory.ts   # Remembers past interactions
│   ├── store.ts            # Redis/in-memory persistence
│   └── platforms/          # Platform API connectors
│       ├── instagram.ts
│       ├── tiktok.ts
│       ├── x.ts
│       ├── reddit.ts
│       ├── linkedin.ts
│       └── facebook.ts
```

---

## Environment Variables

See [`.env.example`](.env.example) for all variables. The only required one to get started:

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | ✅ | Powers AI content generation |
| `UPSTASH_REDIS_REST_URL` | ✅ | Persistent storage (auto-configured with Docker) |
| `UPSTASH_REDIS_REST_TOKEN` | ✅ | Redis auth (auto-configured with Docker) |
| `META_APP_ID` | For IG/FB | Meta developer app |
| `X_CLIENT_ID` | For X | Twitter developer app |
| `LINKEDIN_CLIENT_ID` | For LinkedIn | LinkedIn developer app |
| `REDDIT_CLIENT_ID` | For Reddit | Reddit developer app |

---

## Self-Hosting vs. Managed

| | Self-Hosted (Free) | Managed (alaii.app) |
|---|---|---|
| **Price** | Free forever | $40/mo or $0.01/call |
| **Setup** | You manage infra | One-click |
| **Cron jobs** | You configure | Built-in |
| **Webhooks** | You set up SSL + domain | Pre-configured |
| **Support** | Community (Discord) | Priority |
| **Updates** | Manual git pull | Automatic |

---

## Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

```bash
# Development
npm run dev          # Start dev server on :3000
npm run build        # Production build
npm run lint         # Lint check
```

---

## License

Alaii Engage is open-source under the [AGPL-3.0 License](LICENSE). You can self-host for free. Modifications must be open-sourced under the same license.

**Built by [Alaii](https://alaii.app)** — AI-powered business tools for service professionals.
