# alaii-engage

AI Social Media Engagement CLI — generate human-like engagement content from your terminal.

## Install

```bash
npx alaii-engage
```

## Commands

```bash
npx alaii-engage signup                    # Create account, get API key
npx alaii-engage login                     # Log in to existing account
npx alaii-engage generate --platform instagram --type comment_reply --context "great post!"
npx alaii-engage usage                     # Check API usage
npx alaii-engage webhook --url https://...  # Register webhook
```

## Environment Variable

```bash
export ALAII_API_KEY=ae_your_key
npx alaii-engage generate --platform tiktok --context "love this!"
```

## Pricing

- **Free**: 100 API calls/month
- **Pro ($40/mo)**: 10,000 calls/month
- **Agency ($99/mo)**: 50,000 calls/month

## Links

- [App](https://alaii-engage.vercel.app)
- [API Docs](https://alaii-engage.vercel.app/docs)
- [OpenAPI Spec](https://alaii-engage.vercel.app/openapi.json)
