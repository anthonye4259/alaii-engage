// X (Twitter) Headless Connector
// Fallback for engagement actions

import { BrowserSession, sleep, randomDelay } from "./browser-session";

interface XCredentials {
  username: string;
  password: string;
}

export class XHeadless {
  private session: BrowserSession;
  private loggedIn = false;

  constructor(accountId: string, proxy?: { server: string; username?: string; password?: string }) {
    this.session = new BrowserSession({
      accountId,
      platform: "x",
      proxy,
    });
  }

  async login(creds: XCredentials): Promise<boolean> {
    const page = await this.session.launch();

    try {
      await page.goto("https://x.com/i/flow/login", { waitUntil: "networkidle2", timeout: 30000 });
      await sleep(randomDelay("pageLoad"));

      // Enter username
      const usernameInput = await page.$('input[autocomplete="username"]');
      if (usernameInput) {
        await usernameInput.click();
        await sleep(300);
        await page.keyboard.type(creds.username, { delay: randomDelay("betweenKeys") });
        await sleep(500);
      }

      // Click Next
      const nextBtn = await page.$('button:has-text("Next"), [role="button"]:has-text("Next")');
      if (nextBtn) await nextBtn.click();
      await sleep(2000);

      // Enter password
      const pwInput = await page.$('input[type="password"]');
      if (pwInput) {
        await pwInput.click();
        await sleep(300);
        await page.keyboard.type(creds.password, { delay: randomDelay("betweenKeys") });
        await sleep(500);
      }

      // Click Log in
      const loginBtn = await page.$('button:has-text("Log in"), [role="button"]:has-text("Log in")');
      if (loginBtn) await loginBtn.click();
      await sleep(randomDelay("pageLoad"));

      await page.waitForNavigation({ waitUntil: "networkidle2", timeout: 15000 }).catch(() => {});

      const detection = await this.session.checkForDetection();
      if (detection.detected) return false;

      this.loggedIn = true;
      console.log(`[x-headless] Logged in as @${creds.username}`);
      return true;
    } catch (err) {
      console.error("[x-headless] Login failed:", err);
      this.session.recordAction(false);
      return false;
    }
  }

  // Like a tweet
  async likeTweet(tweetUrl: string): Promise<boolean> {
    if (!this.loggedIn || this.session.isPaused()) return false;

    const page = this.session.getPage();
    if (!page) return false;

    try {
      await page.goto(tweetUrl, { waitUntil: "networkidle2", timeout: 20000 });
      await sleep(randomDelay("pageLoad"));

      // Read tweet briefly
      await sleep(2000 + Math.random() * 3000);

      const likeBtn = await page.$('[data-testid="like"]');
      if (likeBtn) {
        await likeBtn.click();
        await sleep(randomDelay("betweenActions"));
      }

      const detection = await this.session.checkForDetection();
      this.session.recordAction(!detection.detected);
      return !detection.detected;
    } catch (err) {
      console.error("[x-headless] Like failed:", err);
      this.session.recordAction(false);
      return false;
    }
  }

  // Reply to a tweet
  async replyToTweet(tweetUrl: string, reply: string): Promise<boolean> {
    if (!this.loggedIn || this.session.isPaused()) return false;

    const page = this.session.getPage();
    if (!page) return false;

    try {
      await page.goto(tweetUrl, { waitUntil: "networkidle2", timeout: 20000 });
      await sleep(randomDelay("pageLoad"));

      // Click reply area
      const replyArea = await page.$('[data-testid="tweetTextarea_0"]');
      if (replyArea) {
        await replyArea.click();
        await sleep(500);
        await page.keyboard.type(reply, { delay: randomDelay("betweenKeys") });
        await sleep(1000);
      }

      // Click reply button
      const replyBtn = await page.$('[data-testid="tweetButtonInline"]');
      if (replyBtn) await replyBtn.click();

      await sleep(randomDelay("betweenActions"));

      const detection = await this.session.checkForDetection();
      this.session.recordAction(!detection.detected);
      return !detection.detected;
    } catch (err) {
      console.error("[x-headless] Reply failed:", err);
      this.session.recordAction(false);
      return false;
    }
  }

  // Retweet
  async retweet(tweetUrl: string): Promise<boolean> {
    if (!this.loggedIn || this.session.isPaused()) return false;

    const page = this.session.getPage();
    if (!page) return false;

    try {
      await page.goto(tweetUrl, { waitUntil: "networkidle2", timeout: 20000 });
      await sleep(randomDelay("pageLoad"));

      const retweetBtn = await page.$('[data-testid="retweet"]');
      if (retweetBtn) {
        await retweetBtn.click();
        await sleep(1000);

        // Confirm retweet in dropdown
        const confirmBtn = await page.$('[data-testid="retweetConfirm"]');
        if (confirmBtn) await confirmBtn.click();
      }

      await sleep(randomDelay("betweenActions"));
      const detection = await this.session.checkForDetection();
      this.session.recordAction(!detection.detected);
      return !detection.detected;
    } catch (err) {
      console.error("[x-headless] Retweet failed:", err);
      this.session.recordAction(false);
      return false;
    }
  }

  // Follow a user profile
  async followUser(profileUrl: string): Promise<boolean> {
    if (!this.loggedIn || this.session.isPaused()) return false;

    const page = this.session.getPage();
    if (!page) return false;

    try {
      await page.goto(profileUrl, { waitUntil: "networkidle2", timeout: 20000 });
      await sleep(randomDelay("pageLoad"));

      const followBtn = await page.$('[data-testid$="-follow"]');
      if (followBtn) {
        await followBtn.click();
        await sleep(randomDelay("betweenActions"));
      }

      const detection = await this.session.checkForDetection();
      this.session.recordAction(!detection.detected);
      return !detection.detected;
    } catch (err) {
      console.error("[x-headless] Follow failed:", err);
      this.session.recordAction(false);
      return false;
    }
  }

  // Browse and engage with search results
  async engageSearch(query: string, maxActions = 3): Promise<number> {
    if (!this.loggedIn || this.session.isPaused()) return 0;

    const page = this.session.getPage();
    if (!page) return 0;

    let engaged = 0;

    try {
      await page.goto(`https://x.com/search?q=${encodeURIComponent(query)}&f=live`, {
        waitUntil: "networkidle2",
        timeout: 20000,
      });
      await sleep(randomDelay("pageLoad"));

      for (let i = 0; i < maxActions && !this.session.isPaused(); i++) {
        // Read tweets
        await sleep(3000 + Math.random() * 4000);

        // Like a tweet
        const likeBtns = await page.$$('[data-testid="like"]');
        if (likeBtns.length > i) {
          await likeBtns[i].click();
          engaged++;
          await this.session.waitBetweenActions();
        }

        // Scroll
        await this.session.humanScroll();
      }
    } catch (err) {
      console.error("[x-headless] Search engagement failed:", err);
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
