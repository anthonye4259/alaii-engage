# Alaii Engage — AI Social Media Engagement Agent

## What It Does

Alaii Engage automates your social media engagement with AI that sounds like a real human. It comments, replies, likes, and DMs across Instagram, TikTok, X, LinkedIn, Reddit, and Facebook — 24/7 on autopilot.

## Quick Start (for AI Agents)

### 1. Sign Up Programmatically

```bash
curl -X POST https://alaii-engage.vercel.app/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email": "agent@example.com", "password": "securepassword"}'
```

Response includes your API key: `ae_...`

### 2. Generate Engagement Content

```bash
curl -X POST https://alaii-engage.vercel.app/api/v1/generate \
  -H "Authorization: Bearer ae_your_key" \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "instagram",
    "type": "comment_reply",
    "context": {
      "originalContent": "Just launched my new product!",
      "businessContext": { "name": "Alaii", "industry": "AI SaaS" }
    }
  }'
```

### 3. Check Usage

```bash
curl https://alaii-engage.vercel.app/api/v1/usage \
  -H "Authorization: Bearer ae_your_key"
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Create account, get API key |
| POST | `/api/auth/login` | Authenticate, get session |
| POST | `/api/v1/generate` | Generate engagement content |
| GET | `/api/v1/usage` | Check API usage and limits |
| GET | `/api/referral` | Get referral link and stats |
| POST | `/api/v1/webhooks` | Register webhook for events |

## Pricing

- **Free**: 100 API calls/month
- **Pro ($40/mo)**: 10,000 calls/month
- **Agency ($99/mo)**: 50,000 calls/month
- **Developer**: $0.01/call, unlimited

## Supported Platforms

Instagram, TikTok, X (Twitter), LinkedIn, Reddit, Facebook

## Engagement Types

- `comment_reply` — Reply to a comment naturally
- `hashtag_comment` — Comment on a post in your niche
- `dm_welcome` — Welcome message to new followers
- `dm_outreach` — Cold outreach DM
- `like` — Like a post
- `repost` — Share/retweet content

## OpenAPI Spec

Full spec available at: https://alaii-engage.vercel.app/openapi.json

## AI Plugin Manifest

For ChatGPT/LLM integration: https://alaii-engage.vercel.app/.well-known/ai-plugin.json

## MCP Server

```json
{
  "mcpServers": {
    "alaii-engage": {
      "url": "https://alaii-engage.vercel.app/api/v1/generate",
      "headers": {
        "Authorization": "Bearer YOUR_API_KEY"
      }
    }
  }
}
```

## Links

- **App**: https://alaii-engage.vercel.app
- **API Docs**: https://alaii-engage.vercel.app/docs
- **Pricing**: https://alaii-engage.vercel.app/pricing
- **OpenAPI Spec**: https://alaii-engage.vercel.app/openapi.json
