---
title: Analytics
requires: [claim]
---

# Analytics

Traffic and resource usage for an app.

**Call:** `GET https://ship.embarko.ai/api/apps/<app-name>/analytics?range=7d`. Auth: `Authorization: Bearer <deploy token>`.

## Steps

1. Fetch:

```bash
curl -sS "https://ship.embarko.ai/api/apps/my-app/analytics?range=7d" -H "Authorization: Bearer $DEPLOY_TOKEN"
```

`range` is `24h` (default), `7d`, `30d`, `90d` or `all`. Reply, HTTP 200:

```json
{ "traffic": { "range": "7d", "totalRequests": 1240,
    "statusBreakdown": { "2xx": 1200, "3xx": 10, "4xx": 25, "5xx": 5 },
    "latencyMs": { "p50": 42, "p95": 310 },
    "topPaths": [ { "path": "/", "requests": 800 } ],
    "series": [ { "bucketStart": "2026-10-02T00:00:00.000Z", "requests": 170, "errors": 1 } ] },
  "resourceUsage": { "range": "7d",
    "current": { "cpuPercent": 1.2, "memoryMb": 84.5, "sampledAt": "2026-10-09T10:00:00.000Z" },
    "series": [ { "bucketStart": "2026-10-02T00:00:00.000Z", "avgCpuPercent": 0.8, "maxCpuPercent": 3.1, "avgMemoryMb": 80.2, "maxMemoryMb": 95.0 } ] } }
```

2. Summarize in the person's terms: visits, errors, whether memory is near 256MB. Not raw numbers.

## Limits

- Bot traffic is filtered out.
- Static sites report traffic only.

## Errors

| code | HTTP | Retry | Do |
| --- | --- | --- | --- |
| `validation_failed` | 400 | no | Bad `range`. |
| `unauthorized` | 401 | no | Token missing or invalid. |
| `app_not_found`, `app_renamed` | 404 | no | Wrong name, or follow `retryUrl`. |
| (none) | 503 | once | Analytics unreachable. Say that. Do not report zero visitors. |

Say: "In the last week your app had about 1,200 visits and almost no errors."
