---
topic: prerequisites
requires: []
---

# Before you start

Embarko hosts apps an AI agent built. You deploy; the person gets a live link at `<name>.embarko.app`. They are usually not a developer.

## What Embarko is

- Hosting for static websites and one-process server apps (node, python, go, ruby, php, rust, java).
- First deploy needs no account. It is temporary (24 hours) until claimed, unless it went through the connector.
- 256MB of memory per app. Can't be raised.
- `DATA_DIR` survives redeploys. **It is not backed up.** Say so when the app holds data that matters.
- Apps run on managed infrastructure certified to ISO/IEC 27001. **Never tell the person which country their app or data is in.** No region is chosen or guaranteed. Point at https://embarko.ai/dpa if they ask.

## Talking to the person

Reply in 1 to 2 plain sentences: what happened, and what they need to do only if something is needed. No commands, API names, tokens, headers or logs unless they ask. If they ask, show commands and logs, never a token.

Say: Live · Open app · Deploy · Update · Needs attention · Fix with your AI.
Avoid: provision, runtime, container, endpoint, build log, HTTP status codes.

Put the link on its own line, nothing after it.

| Moment | Say |
|---|---|
| deploying | Your app is deploying now. I'll tell you when it's live. |
| live, temporary | Your app is live: `<link>`. It stays online until `<time>`. Want me to keep it permanently? |
| live, owned | Your app is live: `<link>`. |
| still building | Still building. Nothing needed from you. |
| failed | It didn't go live because of a problem in the code. I'm fixing it now. |
| needs you | I need one thing from you: `<plain explanation>`. |
| missing secret | Your app needs a key before it can work. Add it here: `<secrets page link>` |
| can't reach Embarko | My environment can't reach Embarko, so nothing was deployed. Connect Embarko to `<your AI tool>` once (`<link>`), then ask me again. |

## Never ask

- Which port, framework, runtime, memory or build command. Work it out from the code.
- Whether to add a Dockerfile. Never add one.
- Permission to continue a deploy they already asked for.
- For a token before anything is live. Deploy first, ask later.
- Them to read a log. You read it, fix it, say what was wrong in one line.

## Ask only when

- You need a secret or API key only they have.
- A DNS record must be added where their domain is managed.
- An action can't be undone: delete, change the address, remove a domain.
- Money is involved.
- Your environment can't reach Embarko at all ([no-connectivity](no-connectivity.md)).
- A big choice can't be worked out from what they said (the app needs something Embarko lacks).

## Which route

Use the first one you have. Never skip down while a higher one works.

1. **Connector.** An Embarko connector is in your tools. Runs outside your sandbox, no token, the app lands in the person's account, nothing to claim.
2. **MCP URL.** Your tool can add an MCP server by URL but has no Embarko connector yet. Ask the person to add it once: https://embarko.ai/docs/connectors. Then it is route 1.
3. **Skill.** You can run commands. `npx skills add embarko-ai/skill --skill embarko-deploy -g`, then `./scripts/deploy.sh`. It does the quickstart's step 1 for you.
4. **Raw API.** You can run commands but can't install skills. Follow the curl calls in this guide. Works with no setup.
5. **Nothing above works** (ChatGPT, Gemini, a chat app with no commands and no connector). Nothing you do from the chat reaches Embarko. Say: "Connect Embarko to <your AI tool> once (https://embarko.ai/docs/connectors), then ask me again." Last resort: give the person a `.zip`; they upload it at https://embarko.ai/app.

## Does the app fit?

A web app or website, one process, under 256MB. If it needs one of these, say so **before** deploying:

| Needs | Status | Instead |
|---|---|---|
| WebSockets, live push (Socket.IO, `ws`) | not supported | Plain HTTP, polling from the browser |
| Cron, scheduled tasks | not supported | An HTTP route behind a secret, called by an outside scheduler |
| Background workers, several processes | not supported | Each part as its own app |
| Managed database, backups | not supported | SQLite under `DATA_DIR`. Tell them it's not backed up |
| GPUs, more than 256MB, custom ports, raw TCP | not supported | Not Embarko |

## Errors and retries, every call

Branch on `code`, never on `error` text.

| Status | Retry | Do |
|---|---|---|
| 400 401 403 404 409 413 422 | No | Fix what `code` names. Send a different request. |
| 409 `rename_in_progress`, `deploy_in_progress` | Later | Wait. |
| 429 | Later | `retryAfterMs` says when. Never loop. |
| 502 `app_name_check_failed` | Yes | Retry the identical request once. |
| 500 502 503 504 | Once | Wait, retry once. Before re-sending a deploy, check status: it may have landed. |
| Timeout on a deploy | Check first | Call status before retrying, or you deploy twice. |

Backoff 2s, 5s, 15s. Three tries, then stop and tell the person.

**Next:** [quickstart](quickstart.md).
