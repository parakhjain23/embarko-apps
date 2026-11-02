---
topic: feedback
requires: []
---

# Report a problem or request a feature

`POST https://ship.embarko.ai/apps/<app-name>/customer-query` · same auth as status · header `X-Agent-Name` required

When Embarko itself fails, lacks something the app needs, or this guide is wrong, report it. Don't work around it silently. Every API reply carries `links.feedback` pointing at the right route.

## Types

| `type` | When |
|---|---|
| `platform_bug` | Embarko misbehaved |
| `missing_capability` | the app needs something Embarko doesn't have |
| `docs_issue` | this guide was wrong or unclear |
| `unexpected_behavior` | it worked, but not as documented |
| `other` | anything else |

## Calls

About an app:

```bash
curl -sS -X POST 'https://ship.embarko.ai/apps/my-app/customer-query' \
  -H 'X-Agent-Name: codex' -H 'Content-Type: application/json' \
  -d '{"type":"platform_bug","message":"What went wrong, what you expected, the app name."}'
```

No app yet: `POST https://ship.embarko.ai/api/public/customer-query` with `{"type","message","email"}`. No auth. Limits: 10 per email, 20 per IP, 500 per hour overall.

Reply `201 { "id" }`. `message` 1 to 5,000 chars.

## Errors

| Code | Status | Do |
|---|---|---|
| missing `X-Agent-Name` | 400 | add the header |
| `invalid_feedback_type` | 400 | use a type above |
| rate limited | 429 | don't resend; mention it to the person |
| transient | 502 | retry once |

**Say:** "This looks like a problem on Embarko's side. I've reported it to their team."
