# @alaii/mcp-server

> MCP server for Alaii Engage — give Claude, ChatGPT, and AI assistants the ability to generate social media engagement content.

## What is this?

This is a [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) server that exposes Alaii Engage's AI engagement tools to any MCP-compatible AI assistant.

### Available Tools

| Tool | Description |
|------|-------------|
| `generate_engagement` | Generate AI-powered replies, comments, and DMs for any platform |
| `publish_to_instagram` | Publish photos, carousels, and reels to Instagram |
| `check_usage` | View API usage and billing |

## Setup with Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "alaii-engage": {
      "command": "npx",
      "args": ["-y", "@alaii/mcp-server"],
      "env": {
        "ALAII_API_KEY": "ae_your_key"
      }
    }
  }
}
```

Then restart Claude Desktop. You'll see the Alaii Engage tools available in your conversation.

## Setup with Self-Hosted Instance

Point to your own deployment:

```json
{
  "mcpServers": {
    "alaii-engage": {
      "command": "npx",
      "args": ["-y", "@alaii/mcp-server"],
      "env": {
        "ALAII_API_KEY": "ae_your_key",
        "ALAII_BASE_URL": "http://localhost:3000"
      }
    }
  }
}
```

## Example Usage in Claude

> "Generate an Instagram reply to someone who said 'love your new salon!'"

Claude will use the `generate_engagement` tool and return 3 human-like variations.

## Get an API Key

1. Go to [alaii-engage.vercel.app](https://alaii-engage.vercel.app)
2. Sign up (100 free API calls, no credit card)
3. Copy your `ae_` API key

## Links

- [Documentation](https://alaii-engage.vercel.app/docs)
- [GitHub](https://github.com/anthonye4259/alaii-engage)
- [SDK (npm)](https://www.npmjs.com/package/alaii-engage)
