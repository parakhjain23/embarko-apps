---
topic: analytics
requires: [deploy, claim]
---

# How is it doing?

`GET https://ship.embarko.ai/api/apps/<app-name>/analytics?range=7d` · token always

Requests by status, errors, CPU and memory for a range. `range`: `24h` (default), `7d`, `30d`, `90d`, `all`.

## Errors

| Status | Do |
|---|---|
| 503 | analytics is down right now. **Not zero visitors.** Say that |
| 401 / 404 | bad token, or not your app |

## Limits

No alerting, no export. Memory near 256MB means the app is close to being OOM-killed: say so.

**Say:** "About 1,200 visits this week, no errors. It's running comfortably." In their terms, not raw numbers.
