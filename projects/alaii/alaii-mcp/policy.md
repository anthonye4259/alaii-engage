Alaii MCP — Engagement Policy (MVP)

Purpose
- Ensure safe, compliant automation of engagement actions (comments, replies, likes, reposts, DMs) for connected business/creator accounts.

Key rules
1. Account requirements
   - Only Business or Creator accounts may enable automated engagement features.
   - Account owners must complete OAuth connect and accept Terms of Use for automated engagement.

2. Rate limits / throttling
   - Default: 30 actions/account/minute. Configurable per-customer after trust signals.
   - Progressive ramp: new accounts start at 5 actions/minute and ramp to default over 48–72 hours.

3. DM rules
   - Outbound DMs default to "queued for human approval" unless the customer has explicit whitelisting via partnership or elevated app scopes.
   - AutoSend (instant DMs) only allowed after review and explicit customer opt-in and business verification.

4. Content safety
   - All outbound templates pass through spam/abuse filters (blocklists, profanity, harassment detection).
   - High-risk phrases trigger manual review.

5. Monitoring & remediation
   - Track per-account health metrics (flags, removed comments, account warnings). Auto-pause accounts with signs of platform enforcement.
   - Provide instant revoke token and pause actions button in the dashboard.

6. Audit & transparency
   - Log all automated actions with timestamps, templates used, and actor (bot/user).
   - Expose audit logs to connected account owners for 90 days.

7. Whitelisting & partnerships
   - Pursue platform partnerships to enable higher-volume actions and safer DM flows for enterprise customers.

Enforcement
- Violations (spam, rapid abuse, repeated platform flags) lead to immediate pause and a manual review. Reinstatement requires corrective action and possible contract terms.

Notes
- These policies are conservative by design to protect account reputation and platform relationships. We can tune limits and approvals for trusted enterprise customers after initial rollout.
