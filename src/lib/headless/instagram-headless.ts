// Instagram Headless Connector
// Fallback for actions not available via official API
// Uses browser automation with human-like behavior

import { BrowserSession, sleep, randomDelay } from "./browser-session";

interface IGCredentials {
  username: string;
  password: string;
}

export class InstagramHeadless {
  private session: BrowserSession;
  private loggedIn = false;

  constructor(accountId: string, proxy?: { server: string; username?: string; password?: string }) {
    this.session = new BrowserSession({
      accountId,
      platform: "instagram",
      proxy,
    });
  }

  async login(creds: IGCredentials): Promise<boolean> {
    const page = await this.session.launch();

    try {
      await page.goto("https://www.instagram.com/accounts/login/", {
        waitUntil: "networkidle2",
        timeout: 30000,
      });

      await sleep(randomDelay("pageLoad"));

      // Accept cookies if dialog appears
      try {
        const cookieBtn = await page.$('button[class*="cookie"]');
        if (cookieBtn) await this.session.humanClick('button[class*="cookie"]');
      } catch { /* no cookie dialog */ }

      // Type username
      await this.session.humanType('input[name="username"]', creds.username);
      await sleep(500);

      // Type password
      await this.session.humanType('input[name="password"]', creds.password);
      await sleep(800);

      // Click login button
      await this.session.humanClick('button[type="submit"]');
      await sleep(randomDelay("pageLoad"));

      // Wait for navigation
      await page.waitForNavigation({ waitUntil: "networkidle2", timeout: 15000 }).catch(() => {});

      // Check for detection
      const detection = await this.session.checkForDetection();
      if (detection.detected) {
        console.error(`[ig-headless] Login blocked: ${detection.signal}`);
        return false;
      }

      // Handle "Save Login Info" dialog
      try {
        const notNowBtn = await page.$('button:has-text("Not Now")');
        if (notNowBtn) await this.session.humanClick('button:has-text("Not Now")');
      } catch { /* no dialog */ }

      // Handle "Turn on Notifications" dialog
      try {
        await sleep(2000);
        const notifBtn = await page.$('button:has-text("Not Now")');
        if (notifBtn) await this.session.humanClick('button:has-text("Not Now")');
      } catch { /* no dialog */ }

      this.loggedIn = true;
      console.log(`[ig-headless] Logged in as @${creds.username}`);
      return true;
    } catch (err) {
      console.error("[ig-headless] Login failed:", err);
      this.session.recordAction(false);
      return false;
    }
  }

  // Like a post by URL
  async likePost(postUrl: string): Promise<boolean> {
    if (!this.loggedIn || this.session.isPaused()) return false;

    const page = this.session.getPage();
    if (!page) return false;

    try {
      await page.goto(postUrl, { waitUntil: "networkidle2", timeout: 20000 });
      await sleep(randomDelay("pageLoad"));

      // Find and click the like button (heart icon)
      const likeBtn = await page.$('svg[aria-label="Like"]');
      if (!likeBtn) {
        console.log("[ig-headless] Post already liked or button not found");
        return false;
      }

      const parent = await likeBtn.evaluateHandle((el) => el.closest("button"));
      if (parent) {
        await (parent as unknown as { click: () => Promise<void> }).click();
        await sleep(randomDelay("betweenActions"));
      }

      const detection = await this.session.checkForDetection();
      this.session.recordAction(!detection.detected);

      console.log(`[ig-headless] Liked: ${postUrl}`);
      return !detection.detected;
    } catch (err) {
      console.error("[ig-headless] Like failed:", err);
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

      // Click the comment textarea
      const commentArea = await page.$('textarea[aria-label="Add a comment…"]');
      if (!commentArea) {
        console.log("[ig-headless] Comment textarea not found");
        return false;
      }

      await commentArea.click();
      await sleep(500);

      // Type the comment with human-like delays
      await this.session.humanType('textarea[aria-label="Add a comment…"]', comment);
      await sleep(1000);

      // Click Post button
      const postBtn = await page.$('button:has-text("Post")');
      if (postBtn) {
        await postBtn.click();
        await sleep(randomDelay("betweenActions"));
      }

      const detection = await this.session.checkForDetection();
      this.session.recordAction(!detection.detected);

      console.log(`[ig-headless] Commented on: ${postUrl}`);
      return !detection.detected;
    } catch (err) {
      console.error("[ig-headless] Comment failed:", err);
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

      const followBtn = await page.$('button:has-text("Follow")');
      if (!followBtn) {
        console.log("[ig-headless] Already following or button not found");
        return false;
      }

      await this.session.humanClick('button:has-text("Follow")');
      await sleep(randomDelay("betweenActions"));

      const detection = await this.session.checkForDetection();
      this.session.recordAction(!detection.detected);
      return !detection.detected;
    } catch (err) {
      console.error("[ig-headless] Follow failed:", err);
      this.session.recordAction(false);
      return false;
    }
  }

  // Browse hashtag feed and engage
  async engageHashtag(hashtag: string, maxActions = 3): Promise<number> {
    if (!this.loggedIn || this.session.isPaused()) return 0;

    const page = this.session.getPage();
    if (!page) return 0;

    let engaged = 0;

    try {
      await page.goto(`https://www.instagram.com/explore/tags/${hashtag}/`, {
        waitUntil: "networkidle2",
        timeout: 20000,
      });
      await sleep(randomDelay("pageLoad"));

      // Scroll through the feed
      for (let i = 0; i < maxActions && !this.session.isPaused(); i++) {
        await this.session.humanScroll();
        await this.session.waitBetweenActions();

        // Find post links
        const postLinks = await page.$$('a[href*="/p/"]');
        if (postLinks.length > i) {
          const href = await postLinks[i].evaluate((el) => el.getAttribute("href"));
          if (href) {
            const liked = await this.likePost(`https://www.instagram.com${href}`);
            if (liked) engaged++;
            await this.session.waitBetweenActions();
          }
        }
      }
    } catch (err) {
      console.error("[ig-headless] Hashtag engagement failed:", err);
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
