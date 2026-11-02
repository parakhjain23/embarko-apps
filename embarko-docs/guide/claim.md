---
topic: claim
requires: [deploy]
---

# Keep a temporary app

An app deployed over HTTP without a token is deleted 24 hours after its first deploy (`app.expiresAt`). No reminder email. Claiming makes it permanent at the same link. Connector deploys are already permanent.

**Claiming = redeploy the same name with a deploy token.**

## Steps

1. Check for a token: `$DEPLOY_TOKEN`, then the first line of `~/.embarko/credentials`. If one exists, go to step 4.
2. Confirm the person's email (whoever reads that inbox gets the token). Send once. Always `202`; the token goes to their inbox, never to you.

   ```bash
   curl -sS -X POST 'https://ship.embarko.ai/api/public/deploy-tokens/request' \
     -H 'Content-Type: application/json' -d '{"email":"person@example.com"}'
   ```

3. Ask them to paste the token. Save it: `mkdir -p ~/.embarko && echo "<token>" > ~/.embarko/credentials && chmod 600 ~/.embarko/credentials`. Never repeat it back. Or they create one at https://embarko.ai/app/tokens.
4. Redeploy, same `X-App-Name`, with `-H "Authorization: Bearer <token>"`. Reply: `app.claimed: true`, `next` starts "Claimed, so the app is permanent now."
5. Send the token on every later call, including status and logs. A claimed app answers 404 without it.

## Limits

- Rate limit: 5 per email, 10 per IP, per hour. Reply is `202` even when limited. Call once.
- Tokens don't expire. Each request makes a new one; old ones keep working. A token belongs to the person's workspace, not to one app.
- A new email gets an account and a workspace. A known email gets one new token per workspace, all emailed.
- Redeploying under a new name does **not** claim the old one.

## Errors

| Code | Status | Do |
|---|---|---|
| `unauthorized` | 401 | The pasted token is wrong or revoked. Ask them to check they copied all of it. |

**Say:** offer → "Your app is live: `<link>`. It stays online until `<time>`. Want to keep it? Tell me your email." · ask → "I've sent a code to `<email>` (check spam too). Paste it here." · done → "Done: your app is permanent."
