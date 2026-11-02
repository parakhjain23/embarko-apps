---
title: Embarko for agents
---

# Embarko for agents

Embarko hosts a web app and gives it a live HTTPS URL. You send the source, it builds and runs the app at `https://<app-name>.embarko.app`. No Dockerfile, no account for the first deploy.

**Deploying? Read only [quickstart](quickstart).** It is the whole happy path on one page.

If this guide and the live API disagree, trust the API. The machine-readable contract is `https://ship.embarko.ai/capabilities` (one topic per URL, no auth).

## Topics

| Page | Read it when |
| --- | --- |
| [quickstart](quickstart) | You are about to deploy. Start here. |
| [rules](rules) | What Embarko is, how to talk to the person, when to ask them, which route to use, retry rules. |
| [deploy](deploy) | The deploy call in full: headers, JSON body, every error code. |
| [status](status) | Polling until live. Every status value. |
| [logs](logs) | Build and runtime logs after a failure. |
| [claim](claim) | Temporary apps, the 24-hour deletion, getting a token. |
| [update](update) | Shipping a new version of an existing app. |
| [env-vars](env-vars) | Secrets and config, and applying them. |
| [data](data) | Where data lives: DATA_DIR and SQLite. |
| [static-sites](static-sites) | Plain HTML sites: live in seconds, no logs, no env vars. |
| [domains](domains) | Custom domains, including the DNS step only the person can do. |
| [rollback](rollback) | Putting an earlier version back. |
| [rename](rename) | Changing the display name (URL stays). |
| [address](address) | Changing the URL itself (old address dies). |
| [delete](delete) | Deleting an app. Irreversible. |
| [analytics](analytics) | Traffic and resource usage. |
| [showcase](showcase) | Listing the app on Embarko Showcase. |
| [feedback](feedback) | Reporting a bug or a docs problem to Embarko. |
| [no-connectivity](no-connectivity) | Your sandbox cannot reach Embarko at all. |
| [not-supported](not-supported) | What will not work: WebSockets, cron, workers, and more. |
| [errors](errors) | Every error code, pointing at the page that handles it. |

Formats: every page is also `<page>.md`, `<page>.json`, `/llms.txt` (this page) and `/llms-full.txt` (everything).
