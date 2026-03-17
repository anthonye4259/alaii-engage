// Browser Session Manager
// Manages headless browser sessions with human-like behavior,
// fingerprint rotation, cookie persistence, and auto-pause on detection.

import type { Browser, Page } from "puppeteer-core";

export interface SessionConfig {
  accountId: string;
  platform: string;
  proxy?: { server: string; username?: string; password?: string };
  userAgent?: string;
  viewport?: { width: number; height: number };
  cookiePath?: string; // Path to saved cookies for session persistence
}

export interface SessionMetrics {
  actionsThisSession: number;
  lastActionAt: number;
  errorsThisSession: number;
  captchasHit: number;
  startedAt: number;
}

// Human-like delay ranges (ms)
const DELAYS = {
  beforeType: { min: 200, max: 600 },
  betweenKeys: { min: 50, max: 150 },
  beforeClick: { min: 300, max: 800 },
  betweenActions: { min: 3000, max: 8000 },
  pageLoad: { min: 2000, max: 5000 },
  scrollPause: { min: 500, max: 1500 },
};

// Randomized user agents to rotate
const USER_AGENTS = [
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3.1 Safari/605.1.15",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
];

const VIEWPORTS = [
  { width: 1920, height: 1080 },
  { width: 1440, height: 900 },
  { width: 1366, height: 768 },
  { width: 1536, height: 864 },
];

export function randomDelay(type: keyof typeof DELAYS): number {
  const { min, max } = DELAYS[type];
  return Math.floor(Math.random() * (max - min) + min);
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export class BrowserSession {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private config: SessionConfig;
  private metrics: SessionMetrics;
  private paused = false;

  constructor(config: SessionConfig) {
    this.config = config;
    this.metrics = {
      actionsThisSession: 0,
      lastActionAt: 0,
      errorsThisSession: 0,
      captchasHit: 0,
      startedAt: Date.now(),
    };
  }

  async launch(): Promise<Page> {
    // Dynamic import to avoid bundling issues
    const puppeteer = await import("puppeteer-core");

    const ua = this.config.userAgent || pickRandom(USER_AGENTS);
    const vp = this.config.viewport || pickRandom(VIEWPORTS);

    const launchArgs = [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-blink-features=AutomationControlled",
      `--window-size=${vp.width},${vp.height}`,
    ];

    if (this.config.proxy) {
      launchArgs.push(`--proxy-server=${this.config.proxy.server}`);
    }

    // Use system Chrome or CHROME_PATH env var
    const executablePath = process.env.CHROME_PATH ||
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

    this.browser = await puppeteer.default.launch({
      executablePath,
      headless: true,
      args: launchArgs,
    });

    this.page = await this.browser.newPage();

    // Anti-detection: override navigator.webdriver
    await this.page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, "webdriver", { get: () => false });
      // Override chrome automation flags
      (window as unknown as Record<string, unknown>).chrome = { runtime: {} };
    });

    await this.page.setUserAgent(ua);
    await this.page.setViewport(vp);

    // Set proxy auth if needed
    if (this.config.proxy?.username) {
      await this.page.authenticate({
        username: this.config.proxy.username,
        password: this.config.proxy.password || "",
      });
    }

    console.log(`[headless] Session launched for ${this.config.platform}/${this.config.accountId}`);
    return this.page;
  }

  getPage(): Page | null {
    return this.page;
  }

  // Human-like typing
  async humanType(selector: string, text: string): Promise<void> {
    if (!this.page || this.paused) return;
    await sleep(randomDelay("beforeType"));
    await this.page.click(selector);
    for (const char of text) {
      await this.page.type(selector, char, { delay: randomDelay("betweenKeys") });
    }
  }

  // Human-like click with random offset
  async humanClick(selector: string): Promise<void> {
    if (!this.page || this.paused) return;
    await sleep(randomDelay("beforeClick"));

    const element = await this.page.$(selector);
    if (!element) throw new Error(`Element not found: ${selector}`);

    const box = await element.boundingBox();
    if (!box) throw new Error(`No bounding box for: ${selector}`);

    // Click with slight random offset from center
    const x = box.x + box.width / 2 + (Math.random() - 0.5) * 6;
    const y = box.y + box.height / 2 + (Math.random() - 0.5) * 6;
    await this.page.mouse.click(x, y);
  }

  // Human-like scroll
  async humanScroll(amount?: number): Promise<void> {
    if (!this.page || this.paused) return;
    const scrollAmount = amount || Math.floor(Math.random() * 400 + 200);
    await this.page.evaluate((px) => window.scrollBy(0, px), scrollAmount);
    await sleep(randomDelay("scrollPause"));
  }

  // Wait between actions (human-like)
  async waitBetweenActions(): Promise<void> {
    await sleep(randomDelay("betweenActions"));
  }

  // Check for common detection signals
  async checkForDetection(): Promise<{ detected: boolean; signal: string }> {
    if (!this.page) return { detected: false, signal: "" };

    const url = this.page.url();
    const content = await this.page.content();

    // Check for common detection patterns
    const detectionSignals = [
      { pattern: /challenge|captcha|verify/i, signal: "captcha_challenge" },
      { pattern: /suspicious.*activity/i, signal: "suspicious_activity" },
      { pattern: /temporarily.*blocked/i, signal: "temp_blocked" },
      { pattern: /action.*blocked/i, signal: "action_blocked" },
      { pattern: /try.*again.*later/i, signal: "rate_limited" },
      { pattern: /unusual.*login/i, signal: "unusual_login" },
      { pattern: /confirm.*identity/i, signal: "identity_check" },
    ];

    for (const { pattern, signal } of detectionSignals) {
      if (pattern.test(url) || pattern.test(content)) {
        this.metrics.captchasHit++;
        console.warn(`[headless] Detection signal: ${signal} on ${this.config.platform}`);

        // Auto-pause if too many signals
        if (this.metrics.captchasHit >= 2) {
          this.paused = true;
          console.error(`[headless] AUTO-PAUSED ${this.config.platform}/${this.config.accountId} after ${this.metrics.captchasHit} detection signals`);
        }

        return { detected: true, signal };
      }
    }

    return { detected: false, signal: "" };
  }

  // Record an action for metrics
  recordAction(success: boolean): void {
    this.metrics.actionsThisSession++;
    this.metrics.lastActionAt = Date.now();
    if (!success) this.metrics.errorsThisSession++;

    // Auto-pause if error rate too high
    if (this.metrics.errorsThisSession > 3) {
      this.paused = true;
      console.error(`[headless] AUTO-PAUSED due to error rate: ${this.metrics.errorsThisSession} errors`);
    }
  }

  isPaused(): boolean {
    return this.paused;
  }

  getMetrics(): SessionMetrics {
    return { ...this.metrics };
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
      console.log(`[headless] Session closed for ${this.config.platform}/${this.config.accountId}`);
    }
  }
}
