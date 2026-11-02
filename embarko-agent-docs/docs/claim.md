---
title: Claim
requires: [deploy]
check: test -n "$DEPLOY_TOKEN" || test -s ~/.embarko/credentials
---

# Claim

Makes a temporary app permanent at the same URL by redeploying it with a deploy token.

**Call:** `POST https://ship.embarko.ai/api/public/deploy-tokens/request`, no auth. Then `POST /apps` again with `Authorization: Bearer <token>`.

## Steps

1. Look for a token you already have: `$DEPLOY_TOKEN`, then `~/.embarko/credentials`. If found, skip to step 5. Never ask twice.
2. Ask the person for their email. Say the token will be emailed to them.
3. Request it once:

```bash
curl -sS -X POST https://ship.embarko.ai/api/public/deploy-tokens/request \
  -H "Content-Type: application/json" -d '{"email": "them@example.com"}'
```

Reply, always HTTP 202 whatever happened:

```json
{ "message": "If this email address is valid, a deploy token for each of your companies has been sent to it. Check the inbox (and spam folder). Each request creates a new token; your existing tokens keep working." }
```

An account is created if none exists. The token is never in the reply.

4. Ask them to paste the token. Save it yourself:

```bash
mkdir -p ~/.embarko && printf '%s\n' "<token>" > ~/.embarko/credentials && chmod 600 ~/.embarko/credentials
```

5. Redeploy the same `X-App-Name` with `-H "Authorization: Bearer <token>"` ([deploy](deploy)). The reply's `next` starts with "Claimed, so the app is permanent now."
6. From now on send the same header on status and logs too. A claimed app answers 404 without it.

Alternative for people who prefer a browser: `https://embarko.ai/app/tokens`, create a token, paste it.

## Limits

- Deletion time is `app.expiresAt` in the deploy or status reply, 24 hours after the first deploy. No reminder email: you tell them.
- Token requests: 5 per email per hour, 10 per IP per hour. Over the limit is 429.
- Tokens are company-wide and do not expire.
- An empty or invented token is 401, not a temporary deploy.
- An app deployed through an Embarko connector is already permanent. Nothing to claim.

## Errors

| code | HTTP | Retry | Do |
| --- | --- | --- | --- |
| `validation_failed` | 400 | no | Bad email. `details` names the field. |
| (none) | 429 | later | Rate limited. Wait an hour. |
| `unauthorized` | 401 | no | The pasted token is wrong. Ask them to check. |

Say: "I need your email to keep the app. Embarko will send you a token. Paste it here and I'll finish."
