# alaii-engage

> AI-powered social media engagement SDK — generate human-like replies, comments, and DMs across Instagram, TikTok, X, LinkedIn, Reddit, and Facebook.

[![npm](https://img.shields.io/npm/v/alaii-engage)](https://www.npmjs.com/package/alaii-engage)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

## Install

```bash
npm install alaii-engage
```

## Quick Start

```typescript
import { AlaiEngage } from "alaii-engage";

const alaii = new AlaiEngage({ apiKey: "ae_your_key" });

// Generate an AI reply to an Instagram comment
const reply = await alaii.generate({
  platform: "instagram",
  type: "comment_reply",
  context: {
    originalContent: "Just opened my new salon!",
    authorName: "beauty_studio",
  },
});

console.log(reply.content);
// "Congrats on the grand opening!! 🎉 Can't wait to check it out"

console.log(reply.variations);
// 3 human-like variations to choose from
```

## Sign Up Programmatically

```typescript
import { AlaiEngage } from "alaii-engage";

const { apiKey } = await AlaiEngage.signup("dev@app.com", "password");
const alaii = new AlaiEngage({ apiKey });
```

## API

### `new AlaiEngage({ apiKey, baseUrl? })`

Create a client instance. Uses the managed API at `alaii-engage.vercel.app` by default, or point to your self-hosted instance.

### `alaii.generate(options)`

Generate AI engagement content.

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `platform` | `"instagram" \| "tiktok" \| "x" \| "linkedin" \| "reddit" \| "facebook"` | ✅ | Target platform |
| `type` | `"comment_reply" \| "hashtag_comment" \| "dm_welcome" \| "dm_outreach" \| "repost_caption"` | ✅ | Content type |
| `context` | `object` | | Post context (originalContent, authorName, hashtag) |
| `business` | `object` | | Business context (businessName, industry, tone) |

### `alaii.publish(options)`

Publish content to Instagram.

### `alaii.usage()`

Check API usage for the current billing period.

### `AlaiEngage.signup(email, password)`

Create a new account and get an API key. Static method — no instance needed.

## Pricing

- **Free:** 100 API calls
- **Pay-per-call:** $0.01/call after free tier
- **Self-hosted:** Free forever — [deploy your own](https://github.com/anthonye4259/alaii-engage)

## Links

- [Documentation](https://alaii-engage.vercel.app/docs)
- [GitHub](https://github.com/anthonye4259/alaii-engage)
- [API Reference](https://alaii-engage.vercel.app/docs/api/generate)
