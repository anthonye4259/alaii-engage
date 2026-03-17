// Reddit Headless Connector
// Fallback for engagement actions

import { BrowserSession, sleep, randomDelay } from "./browser-session";

interface RedditCredentials {
  username: string;
  password: string;
}

export class RedditHeadless {
  private session: BrowserSession;
  private loggedIn = false;

  constructor(accountId: string, proxy?: { server: string; username?: string; password?: string }) {
    this.session = new BrowserSession({
      accountId,
      platform: "reddit",
      proxy,
    });
  }

  async login(creds: RedditCredentials): Promise<boolean> {
    const page = await this.session.launch();

    try {
      await page.goto("https://www.reddit.com/login/", { waitUntil: "networkidle2", timeout: 30000 });
      await sleep(randomDelay("pageLoad"));

      // Enter username
      const usernameInput = await page.$('#loginUsername, input[name="username"]');
      if (usernameInput) {
        await usernameInput.click();
        await page.keyboard.type(creds.username, { delay: randomDelay("betweenKeys") });
      }
      await sleep(500);

      // Enter password
      const pwInput = await page.$('#loginPassword, input[name="password"]');
      if (pwInput) {
        await pwInput.click();
        await page.keyboard.type(creds.password, { delay: randomDelay("betweenKeys") });
      }
      await sleep(800);

      // Submit
      const loginBtn = await page.$('button[type="submit"]');
      if (loginBtn) await loginBtn.click();
      await sleep(randomDelay("pageLoad"));

      await page.waitForNavigation({ waitUntil: "networkidle2", timeout: 15000 }).catch(() => {});

      const detection = await this.session.checkForDetection();
      if (detection.detected) return false;

      this.loggedIn = true;
      console.log(`[reddit-headless] Logged in as u/${creds.username}`);
      return true;
    } catch (err) {
      console.error("[reddit-headless] Login failed:", err);
      this.session.recordAction(false);
      return false;
    }
  }

  // Upvote a post
  async upvotePost(postUrl: string): Promise<boolean> {
    if (!this.loggedIn || this.session.isPaused()) return false;

    const page = this.session.getPage();
    if (!page) return false;

    try {
      await page.goto(postUrl, { waitUntil: "networkidle2", timeout: 20000 });
      await sleep(randomDelay("pageLoad"));

      // Read post briefly
      await sleep(3000 + Math.random() * 5000);

      const upvoteBtn = await page.$('button[aria-label="upvote"], [data-click-id="upvote"]');
      if (upvoteBtn) {
        await upvoteBtn.click();
        await sleep(randomDelay("betweenActions"));
      }

      const detection = await this.session.checkForDetection();
      this.session.recordAction(!detection.detected);
      return !detection.detected;
    } catch (err) {
      console.error("[reddit-headless] Upvote failed:", err);
      this.session.recordAction(false);
      return false;
    }
  }

  // Comment on a post
  async commentOnPost(postUrl: string, comment: string): Promise<boolean> {
    if (!this.loggedIn || this.session.isPaused()) return false;

    const page = this.session.getPage();
    if (!page) return false;

    try {
      await page.goto(postUrl, { waitUntil: "networkidle2", timeout: 20000 });
      await sleep(randomDelay("pageLoad"));

      // Read post
      await sleep(5000 + Math.random() * 5000);

      // Find comment box
      const commentBox = await page.$('div[contenteditable="true"], textarea[placeholder*="comment" i]');
      if (!commentBox) {
        console.log("[reddit-headless] Comment box not found");
        return false;
      }

      await commentBox.click();
      await sleep(500);
      await page.keyboard.type(comment, { delay: randomDelay("betweenKeys") });
      await sleep(1000);

      // Submit
      const submitBtn = await page.$('button:has-text("Comment"), button[type="submit"]');
      if (submitBtn) await submitBtn.click();

      await sleep(randomDelay("betweenActions"));

      const detection = await this.session.checkForDetection();
      this.session.recordAction(!detection.detected);
      return !detection.detected;
    } catch (err) {
      console.error("[reddit-headless] Comment failed:", err);
      this.session.recordAction(false);
      return false;
    }
  }

  // Browse a subreddit and engage
  async engageSubreddit(subreddit: string, maxActions = 3): Promise<number> {
    if (!this.loggedIn || this.session.isPaused()) return 0;

    const page = this.session.getPage();
    if (!page) return 0;

    let engaged = 0;

    try {
      await page.goto(`https://www.reddit.com/r/${subreddit}/new/`, {
        waitUntil: "networkidle2",
        timeout: 20000,
      });
      await sleep(randomDelay("pageLoad"));

      for (let i = 0; i < maxActions && !this.session.isPaused(); i++) {
        // Read posts
        await sleep(4000 + Math.random() * 6000);

        // Upvote
        const upvoteBtns = await page.$$('button[aria-label="upvote"]');
        if (upvoteBtns.length > i) {
          await upvoteBtns[i].click();
          engaged++;
          await this.session.waitBetweenActions();
        }

        await this.session.humanScroll();
      }
    } catch (err) {
      console.error("[reddit-headless] Subreddit engagement failed:", err);
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
