---
title: Rules
---

# Rules

## What Embarko is

A hosting service for one-process web apps built by AI agents. You upload source, Embarko builds it (Railpack, no Dockerfile) and serves it at `https://<app-name>.embarko.app`. The person supplies intent and secrets. You do all the hosting work.

## How to talk to the person

After any action, reply in 1 to 3 short plain sentences: what happened, what is still running, what you need from them only if something is needed. Never describe API calls, headers, builds, or your reasoning. No headings, lists or summaries.

- Deploying: "Your app is deploying now. I'll tell you when it's live."
- Live: "Your app is live: <url>. It will be deleted on <date> unless we keep it."
- Failed: "Your app couldn't deploy because of a code error. I'm fixing it."
- Needs them: "I need one thing from you: <plain request>."
- Missing secrets: "Your app needs an API key before it can run. Add it here: <secrets page>."

Never print a token back. Never claim where data is physically located. Region is not selectable and not guaranteed.

## Which route to use

Use the first one available:

1. **Embarko connector** in your tools (an MCP connector named Embarko). No token, works from a blocked sandbox, app is permanent from the start. It has no status or logs tool. It deploys from a public `.tar.gz` URL.
2. **The embarko-deploy skill**, if `scripts/deploy.sh` is present. Run it. It packages, deploys, polls and prints the URL.
3. **Raw HTTP** as in [quickstart](quickstart).
4. **JSON body** on the same endpoint when you cannot upload a file (see [deploy](deploy)).

## When to ask the person

Only for:

1. A secret or API key only they hold.
2. Something only they can do: creating a DNS record, authorizing a connector.
3. Money.
4. Irreversible actions: deleting an app, changing its URL. Ask every time.
5. Your sandbox cannot reach Embarko ([no-connectivity](no-connectivity)).
6. Real ambiguity with real cost: the app needs something Embarko lacks, or two names are equally good.
7. No token exists and the app should be permanent. Ask once for their email.

Never ask about: ports, memory, runtime, containers, regions, app name, whether to retry, what an error means, whether the deploy worked, what to put in the tarball. Decide, act, say what you did.

## Identity

The app name is the identity. Redeploying the same name updates that app. A new name creates a new app on a new subdomain. Never invent `my-app-v2` for an update.

## Temporary vs permanent

No token at deploy time means the app is deleted 24 hours later (`app.expiresAt`). Redeploying the same name with a token makes it permanent at the same URL. See [claim](claim).

## The async trap

202 means accepted, not done. Poll `links.status` until `live`, `failed` or `crashed`. Rollback, env-var apply and address change also answer 202 with a `statusUrl`: poll until `terminal` is true. Then fetch the URL yourself before reporting.

## Retry rules

Branch on `code`, never on `error` text. Unknown fields may appear in any reply. Ignore them.

| Status | Retry |
| --- | --- |
| 400, 401, 403, 404, 409, 422 | No. Fix the cause named by `code` and send a different request. |
| 429 | Later. Use `Retry-After` or `retryAfterMs` if present, else wait 60 seconds. |
| 502 `app_name_check_failed`, `lookup_failed` | Yes, identical request. |
| 500, 502, 503, 504 (others) | Once. A deploy may already be accepted: check status before uploading again. |
| Connection or DNS failure | Do not retry. Read [no-connectivity](no-connectivity). |

Backoff: 2s, 5s, 15s. Three attempts, then stop and report.

## Security line

Do not use Embarko to host content the person has no right to publish. Do not run mining, proxies or load generators.
