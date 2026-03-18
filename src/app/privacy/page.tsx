import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Privacy Policy for Alaii Engage — AI Social Media Engagement Automation",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <nav className="flex items-center justify-between max-w-4xl mx-auto px-6 py-5">
        <Link href="/landing" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#4A9FD4] to-[#63B3E4] flex items-center justify-center">
            <span className="text-white font-bold text-sm">A</span>
          </div>
          <span className="text-lg font-bold" style={{ color: "var(--text-primary, #1e293b)" }}>Alaii Engage</span>
        </Link>
      </nav>

      <article className="max-w-3xl mx-auto px-6 py-12 prose prose-slate" style={{ color: "var(--text-primary, #1e293b)" }}>
        <h1>Privacy Policy</h1>
        <p className="text-sm" style={{ color: "var(--text-muted, #94a3b8)" }}>Last updated: March 18, 2026</p>

        <h2>1. Information We Collect</h2>
        <p>When you create an account, we collect your <strong>email address</strong> and a <strong>hashed password</strong>. We never store your password in plain text.</p>
        <p>When you connect social media accounts, we store <strong>OAuth access tokens</strong> provided by each platform (Instagram, TikTok, X, LinkedIn, Reddit, Facebook). We do not store your social media passwords.</p>
        <p>When you use our API, we log: API calls made, timestamps, platforms used, and content generated. We do <strong>not</strong> log the full content of your social media posts or comments.</p>

        <h2>2. How We Use Your Information</h2>
        <ul>
          <li><strong>Account management</strong> — to authenticate you and manage your subscription</li>
          <li><strong>Engagement automation</strong> — to generate and post AI-powered content on your connected social media accounts, on your behalf</li>
          <li><strong>Usage metering</strong> — to track API calls for billing purposes</li>
          <li><strong>Product improvement</strong> — aggregated, anonymized usage statistics to improve our AI models</li>
        </ul>
        <p>We <strong>never</strong> sell your personal information to third parties.</p>

        <h2>3. Social Media Data</h2>
        <p>We access your social media data only through official platform APIs (Instagram Graph API, X API v2, Reddit API, etc.) using OAuth 2.0 tokens you explicitly grant us.</p>
        <p>We access: your posts, comments on your posts, mentions of your account, and follower events — only as needed to perform engagement actions you have enabled.</p>
        <p>We <strong>do not</strong>: access your private messages without explicit permission, post without your authorization, or share your social media data with third parties.</p>

        <h2>4. Data Storage &amp; Security</h2>
        <p>Your data is stored securely using:</p>
        <ul>
          <li>Upstash Redis (encrypted at rest, TLS in transit)</li>
          <li>Vercel infrastructure (SOC 2 Type II compliant)</li>
          <li>HTTPS-only connections</li>
          <li>httpOnly, secure, sameSite cookies for session management</li>
        </ul>

        <h2>5. Data Retention</h2>
        <ul>
          <li><strong>Account data</strong> — retained until you delete your account</li>
          <li><strong>OAuth tokens</strong> — retained until you disconnect the account or the token expires</li>
          <li><strong>Engagement logs</strong> — retained for 90 days</li>
          <li><strong>Conversation memory</strong> — 30-day TTL, automatically deleted</li>
        </ul>

        <h2>6. Your Rights</h2>
        <p>You can:</p>
        <ul>
          <li><strong>Access</strong> your data via the Settings page and API</li>
          <li><strong>Delete</strong> your account and all associated data at any time</li>
          <li><strong>Disconnect</strong> any social media account to revoke our access</li>
          <li><strong>Export</strong> your data by contacting us</li>
        </ul>

        <h2>7. Third-Party Services</h2>
        <p>We use the following third-party services:</p>
        <ul>
          <li><strong>OpenAI</strong> — for AI content generation (your context is sent to OpenAI's API)</li>
          <li><strong>Stripe</strong> — for payment processing</li>
          <li><strong>Vercel</strong> — for hosting</li>
          <li><strong>Upstash</strong> — for data storage</li>
        </ul>

        <h2>8. Cookies</h2>
        <p>We use a single session cookie (<code>alaii_session</code>) for authentication. We do not use tracking cookies or third-party analytics.</p>

        <h2>9. Changes</h2>
        <p>We may update this policy. Material changes will be communicated via email or in-app notification.</p>

        <h2>10. Contact</h2>
        <p>Questions? Email <strong>privacy@alaii.com</strong></p>
      </article>
    </div>
  );
}
