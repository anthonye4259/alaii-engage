// TikTok Headless Connector
// Fallback for like, follow, and engagement actions not in official API

import { BrowserSession, sleep, randomDelay } from "./browser-session";

interface TikTokCredentials {
  username: string;
  password: string;
}

export class TikTokHeadless {
  private session: BrowserSession;
  private loggedIn = false;

  constructor(accountId: string, proxy?: { server: string; username?: string; password?: string }) {
    this.session = new BrowserSession({
      accountId,
      platform: "tiktok",
      proxy,
    });
  }

  async login(creds: TikTokCredentials): Promise<boolean> {
    const page = await this.session.launch();

    try {
      await page.goto("https://www.tiktok.com/login/phone-or-email/email", {
        waitUntil: "networkidle2",
        timeout: 30000,
      });
      await sleep(randomDelay("pageLoad"));

      // Type email/username
      const loginInput = await page.$('input[name="username"], input[placeholder*="email"], input[placeholder*="Email"]');
      if (loginInput) {
        await loginInput.click();
        await sleep(300);
        await this.session.humanType('input[name="username"]', creds.username);
      }
      await sleep(500);

      // Type password
      const pwInput = await page.$('input[type="password"]');
      if (pwInput) {
        await pwInput.click();
        await sleep(300);
        await this.session.humanType('input[type="password"]', creds.password);
      }
      await sleep(800);

      // Click login
      const loginBtn = await page.$('button[type="submit"]');
      if (loginBtn) await loginBtn.click();

      await sleep(randomDelay("pageLoad"));
      await page.waitForNavigation({ waitUntil: "networkidle2", timeout: 15000 }).catch(() => {});

      const detection = await this.session.checkForDetection();
      if (detection.detected) {
        console.error(`[tiktok-headless] Login blocked: ${detection.signal}`);
        return false;
      }

      this.loggedIn = true;
      console.log(`[tiktok-headless] Logged in as @${creds.username}`);
      return true;
    } catch (err) {
      console.error("[tiktok-headless] Login failed:", err);
      this.session.recordAction(false);
      return false;
    }
  }

  // Like a video
  async likeVideo(videoUrl: string): Promise<boolean> {
    if (!this.loggedIn || this.session.isPaused()) return false;

    const page = this.session.getPage();
    if (!page) return false;

    try {
      await page.goto(videoUrl, { waitUntil: "networkidle2", timeout: 20000 });
      await sleep(randomDelay("pageLoad"));

      // Watch video for a bit (appear natural)
      await sleep(3000 + Math.random() * 5000);

      // Find like button
      const likeBtn = await page.$('[data-e2e="like-icon"], button[aria-label*="like" i]');
      if (likeBtn) {
        await likeBtn.click();
        await sleep(randomDelay("betweenActions"));
      }

      const detection = await this.session.checkForDetection();
      this.session.recordAction(!detection.detected);
      console.log(`[tiktok-headless] Liked: ${videoUrl}`);
      return !detection.detected;
    } catch (err) {
      console.error("[tiktok-headless] Like failed:", err);
      this.session.recordAction(false);
      return false;
    }
  }

  // Comment on a video
  async commentOnVideo(videoUrl: string, comment: string): Promise<boolean> {
    if (!this.loggedIn || this.session.isPaused()) return false;

    const page = this.session.getPage();
    if (!page) return false;

    try {
      await page.goto(videoUrl, { waitUntil: "networkidle2", timeout: 20000 });
      await sleep(randomDelay("pageLoad"));

      // Watch video briefly
      await sleep(2000 + Math.random() * 3000);

      // Click comment area
      const commentArea = await page.$('[data-e2e="comment-input"], div[contenteditable="true"]');
      if (!commentArea) {
        console.log("[tiktok-headless] Comment area not found");
        return false;
      }

      await commentArea.click();
      await sleep(500);
      await page.keyboard.type(comment, { delay: randomDelay("betweenKeys") });
      await sleep(1000);

      // Submit comment
      const postBtn = await page.$('[data-e2e="comment-post"], button[aria-label*="Post" i]');
      if (postBtn) await postBtn.click();

      await sleep(randomDelay("betweenActions"));

      const detection = await this.session.checkForDetection();
      this.session.recordAction(!detection.detected);
      console.log(`[tiktok-headless] Commented on: ${videoUrl}`);
      return !detection.detected;
    } catch (err) {
      console.error("[tiktok-headless] Comment failed:", err);
      this.session.recordAction(false);
      return false;
    }
  }

  // Follow a user
  async followUser(profileUrl: string): Promise<boolean> {
    if (!this.loggedIn || this.session.isPaused()) return false;

    const page = this.session.getPage();
    if (!page) return false;

    try {
      await page.goto(profileUrl, { waitUntil: "networkidle2", timeout: 20000 });
      await sleep(randomDelay("pageLoad"));

      const followBtn = await page.$('[data-e2e="follow-button"], button:has-text("Follow")');
      if (followBtn) {
        await followBtn.click();
        await sleep(randomDelay("betweenActions"));
      }

      const detection = await this.session.checkForDetection();
      this.session.recordAction(!detection.detected);
      return !detection.detected;
    } catch (err) {
      console.error("[tiktok-headless] Follow failed:", err);
      this.session.recordAction(false);
      return false;
    }
  }

  // Browse For You page and engage
  async engageFeed(maxActions = 3): Promise<number> {
    if (!this.loggedIn || this.session.isPaused()) return 0;

    const page = this.session.getPage();
    if (!page) return 0;

    let engaged = 0;

    try {
      await page.goto("https://www.tiktok.com/foryou", { waitUntil: "networkidle2", timeout: 20000 });
      await sleep(randomDelay("pageLoad"));

      for (let i = 0; i < maxActions && !this.session.isPaused(); i++) {
        // Watch current video
        await sleep(5000 + Math.random() * 10000);

        // Like it
        const likeBtn = await page.$('[data-e2e="like-icon"]');
        if (likeBtn) {
          await likeBtn.click();
          engaged++;
          await sleep(randomDelay("betweenActions"));
        }

        // Scroll to next video
        await page.keyboard.press("ArrowDown");
        await sleep(2000);
      }
    } catch (err) {
      console.error("[tiktok-headless] Feed engagement failed:", err);
    }

    return engaged;
  }

  async close(): Promise<void> {
    await this.session.close();
  }

  getMetrics() {
    return this.session.getMetrics();
  }
}
