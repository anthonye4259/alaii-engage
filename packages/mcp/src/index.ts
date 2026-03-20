#!/usr/bin/env node

/**
 * Alaii Engage MCP Server
 *
 * Exposes AI social media engagement tools to Claude, ChatGPT,
 * and any MCP-compatible AI assistant.
 *
 * Tools:
 *   - generate_engagement: Generate AI-powered replies, comments, DMs
 *   - publish_to_instagram: Publish photos, carousels, reels
 *   - check_usage: View API usage and billing
 *
 * Setup:
 *   ALAII_API_KEY=ae_your_key npx @alaii/mcp-server
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const API_KEY = process.env.ALAII_API_KEY || "";
const BASE_URL = (process.env.ALAII_BASE_URL || "https://alaii-engage.vercel.app").replace(/\/$/, "");

async function apiCall(method: string, path: string, body?: unknown) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return res.json();
}

const server = new Server(
  { name: "alaii-engage", version: "0.1.0" },
  { capabilities: { tools: {} } }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "generate_engagement",
      description:
        "Generate AI-powered, human-like social media engagement content. " +
        "Produces 3 variations tailored to the specified platform with anti-detection measures. " +
        "Supports Instagram, TikTok, X, LinkedIn, Reddit, and Facebook. " +
        "Cost: $0.01/call.",
      inputSchema: {
        type: "object" as const,
        properties: {
          platform: {
            type: "string",
            enum: ["instagram", "tiktok", "x", "linkedin", "reddit", "facebook"],
            description: "Target social media platform",
          },
          type: {
            type: "string",
            enum: ["comment_reply", "hashtag_comment", "dm_welcome", "dm_outreach", "repost_caption"],
            description: "Type of content to generate",
          },
          originalContent: {
            type: "string",
            description: "The original post/comment to reply to (improves AI quality)",
          },
          authorName: {
            type: "string",
            description: "Username of the original author",
          },
          hashtag: {
            type: "string",
            description: "Relevant hashtag for context",
          },
          businessName: {
            type: "string",
            description: "Your business name for brand voice",
          },
          industry: {
            type: "string",
            description: "Your industry (e.g., fitness, beauty, tech)",
          },
          tone: {
            type: "string",
            description: "Desired tone (e.g., friendly, professional, witty)",
          },
        },
        required: ["platform", "type"],
      },
    },
    {
      name: "publish_to_instagram",
      description:
        "Publish a photo, carousel, or reel to Instagram using the Meta Content Publishing API.",
      inputSchema: {
        type: "object" as const,
        properties: {
          type: {
            type: "string",
            enum: ["photo", "carousel", "reel"],
            description: "Type of content to publish",
          },
          caption: {
            type: "string",
            description: "Post caption",
          },
          imageUrl: {
            type: "string",
            description: "Public URL of the image (for photo type)",
          },
          imageUrls: {
            type: "array",
            items: { type: "string" },
            description: "Array of public image URLs (for carousel type)",
          },
          videoUrl: {
            type: "string",
            description: "Public URL of the video (for reel type)",
          },
        },
        required: ["type", "caption"],
      },
    },
    {
      name: "check_usage",
      description:
        "Check your current API usage, billing period, and estimated costs for Alaii Engage.",
      inputSchema: {
        type: "object" as const,
        properties: {},
      },
    },
  ],
}));

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "generate_engagement": {
        const { platform, type, originalContent, authorName, hashtag, businessName, industry, tone } =
          args as Record<string, string>;

        const result = await apiCall("POST", "/api/v1/generate", {
          platform,
          type,
          context: {
            ...(originalContent ? { originalContent } : {}),
            ...(authorName ? { authorName } : {}),
            ...(hashtag ? { hashtag } : {}),
          },
          business: {
            ...(businessName ? { businessName } : {}),
            ...(industry ? { industry } : {}),
            ...(tone ? { tone } : {}),
          },
        });

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "publish_to_instagram": {
        const result = await apiCall("POST", "/api/v1/publish", args);
        return {
          content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
        };
      }

      case "check_usage": {
        const result = await apiCall("GET", "/api/v1/usage");
        return {
          content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
        };
      }

      default:
        return { content: [{ type: "text" as const, text: `Unknown tool: ${name}` }] };
    }
  } catch (err) {
    return {
      content: [{ type: "text" as const, text: `Error: ${err}` }],
      isError: true,
    };
  }
});

// Start the server
async function main() {
  if (!API_KEY) {
    console.error("Error: ALAII_API_KEY environment variable is required");
    console.error("Get your API key at https://alaii-engage.vercel.app/docs/quickstart");
    process.exit(1);
  }

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Alaii Engage MCP server running");
}

main().catch(console.error);
