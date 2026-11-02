# DESIGN

Rules for this guide. Keep them when you change anything.

## Who reads it

AI agents (Claude, Codex, Cursor, ChatGPT) acting for a person who is usually not a developer. The agent is the reader. The person is the audience of the "Say:" lines only.

## 1. Audit first, write second

- Every limit, code, header and reply shape comes from the code. Sources, in priority order:
  1. `hostnsoft-deploy/capabilities.js` (the platform's own contract)
  2. `hostnsoft-deploy/deploy-response.js`, `server.js`, `json-source.js`, `claim-project.js`, `project-lookup.js`
  3. `hostnsoft-api/src/routes/agentApps.routes.ts`, `publicTokens.routes.ts`, `publicCustomerQuery.routes.ts`, `middleware/deployTokenContext.ts`, `services/showcase.ts`, `services/slugChangeFlow.ts`
  4. The skill (`skill/SKILL.md`, `scripts/deploy.sh`) for route priority and wording
- A limit not enforced in code is left out. Never invent a number.
- State what is not supported before an agent builds.
- Each fact has one home. Elsewhere, link. The current homes:

| Fact | Home |
| --- | --- |
| Talking to the person, when to ask, retry rules, identity, temp vs permanent | `rules` |
| Deploy headers, JSON body, deploy error codes | `deploy` |
| Status values | `status` |
| Log signatures | `logs` |
| Token request, rate limits, credential file | `claim` |
| DATA_DIR, SQLite, no backups | `data` |
| Static site limits | `static-sites` |
| What won't work | `not-supported` |
| Code to page index | `errors` |

## 2. Structure

- `README.md` is the contents page and `/llms.txt`. Two sentences on the product, "Deploying? Read only quickstart", one line per topic, "trust the API" line.
- `quickstart.md` is the whole happy path, numbered, with exact commands and exact replies. It ends with the "The person wants X, read Y" table. Every topic must be in that table or reachable from one that is.
- `rules.md` is the behaviour page.
- One topic per task after that. Opened only on failure or on request.

## 3. Every page can be the first page

Each topic declares frontmatter:

```
---
title: Env vars
requires: [claim]
check: <one command that proves THIS topic is done>
---
```

`server.js` inserts a generated block after the H1: "Before this" (each required topic, linked, with that topic's `check`), "Route priority", "Reply to the person". The wording lives in `server.js` only. Never hand-write that block in a page.

## 4. Shape of a topic page

Title. One sentence. `**Call:**` line with method, URL, auth. `## Steps`, numbered, one action each, copy-paste commands, real reply JSON. `## Limits`. `## Errors` table: code, HTTP, retry, do. A final `Say:` line. Nothing else. No history, no reasons.

## 5. Content rules that must stay

- 202 is not done. Poll to a terminal state. Verify the URL before reporting.
- The app name is the identity. Same name updates, new name creates.
- No token means deleted after 24 hours. Claim by redeploying with a token.
- Retry by status code with backoff. Branch on `code`, never on `error` text.
- Ask the person only for: a secret they hold, DNS, money, irreversible actions, no connectivity, real ambiguity, no token when permanence is wanted. Never ask about hosting decisions.
- No connectivity: stop retrying, say it plainly, offer the connector, leave a script.
- Never claim where data is located. Never host content the person has no right to publish.

## 6. Writing

Plain words. Short sentences. Answer first. Headings are the reader's question. Numbers in plain units. Whole guide under about 8,000 words (`wc -w docs/*.md`). Each topic under about 500. Keep topic names and anchors stable; other systems link to them.

## 7. Formats

Every page is served as HTML (browsers), markdown (curl and agents, same URL), `<topic>.md`, `<topic>.json` (title, requires, check, headings, markdown), `/llms.txt`, `/llms-full.txt`. All generated from `docs/*.md` at request time. Unknown topic is a 404 JSON with the topic list.

## 8. Test before calling it done

Run `node test.js`. Then give a fresh agent only the `/llms.txt` URL and a small app. It must deploy, report correctly, and handle one failure without extra help. Fix every line it stumbled on. Repeat with an agent that cannot run commands (JSON body path).

## Adding a topic

1. Create `docs/<topic>.md` with the frontmatter and the shape above.
2. Add one line to `README.md`'s table and, if the person can ask for it, one row to the quickstart table.
3. Add its codes to `errors.md`.
4. `node test.js`.
