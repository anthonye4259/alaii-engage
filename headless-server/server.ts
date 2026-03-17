/**
 * Headless Browser Service — Standalone Express server
 *
 * Wraps the Puppeteer headless connectors as HTTP endpoints.
 * Deploy on a VPS/Railway/Render with Chrome installed.
 *
 * POST /execute  — Run a headless action (like, comment, follow, etc.)
 * POST /close    — Close a session
 * GET  /health   — Health check
 */

import express from "express";
import {
  executeHeadless,
  closeSession,
  closeAllSessions,
  type HeadlessConfig,
  type HeadlessAction,
  type HeadlessPlatform,
} from "./headless/index";

const app = express();
app.use(express.json());

const API_KEY = process.env.HEADLESS_API_KEY || "dev-key";

// Auth middleware
function auth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const key = req.headers["x-api-key"] || req.headers.authorization?.replace("Bearer ", "");
  if (key !== API_KEY) {
    res.status(401).json({ error: "Invalid API key" });
    return;
  }
  next();
}

app.use(auth);

// ---------------------------------------------------------------------------
// POST /execute — Run a headless action
// ---------------------------------------------------------------------------
app.post("/execute", async (req, res) => {
  const { platform, accountId, credentials, action, target, content, proxy, maxActions } = req.body;

  if (!platform || !accountId || !credentials || !action) {
    res.status(400).json({
      error: "Missing required fields: platform, accountId, credentials, action",
    });
    return;
  }

  const config: HeadlessConfig = {
    platform: platform as HeadlessPlatform,
    accountId,
    credentials: {
      username: credentials.username,
      password: credentials.password,
    },
    proxy: proxy || undefined,
    maxActionsPerSession: maxActions || 10,
  };

  try {
    const result = await executeHeadless(config, action as HeadlessAction, target || "", content || "");

    console.log(`[headless] ${action} on ${platform}/${target}: ${result.success ? "✅" : "❌"}`);

    res.json(result);
  } catch (err) {
    console.error(`[headless] Error:`, err);
    res.status(500).json({ error: String(err) });
  }
});

// ---------------------------------------------------------------------------
// POST /close — Close a specific session
// ---------------------------------------------------------------------------
app.post("/close", async (req, res) => {
  const { platform, accountId } = req.body;

  if (!platform || !accountId) {
    res.status(400).json({ error: "Missing platform or accountId" });
    return;
  }

  try {
    await closeSession(platform, accountId);
    res.json({ success: true, message: `Session closed for ${platform}:${accountId}` });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ---------------------------------------------------------------------------
// POST /close-all — Close all sessions (for graceful shutdown)
// ---------------------------------------------------------------------------
app.post("/close-all", async (_req, res) => {
  try {
    await closeAllSessions();
    res.json({ success: true, message: "All sessions closed" });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ---------------------------------------------------------------------------
// GET /health — Health check
// ---------------------------------------------------------------------------
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "alaii-headless",
    uptime: process.uptime(),
    memory: process.memoryUsage(),
  });
});

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------
const PORT = parseInt(process.env.PORT || "3099", 10);

app.listen(PORT, () => {
  console.log(`🤖 Headless service running on port ${PORT}`);
  console.log(`   POST /execute — Run a headless action`);
  console.log(`   POST /close   — Close a session`);
  console.log(`   GET  /health  — Health check`);
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("[headless] SIGTERM received, closing all sessions...");
  await closeAllSessions();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("[headless] SIGINT received, closing all sessions...");
  await closeAllSessions();
  process.exit(0);
});
