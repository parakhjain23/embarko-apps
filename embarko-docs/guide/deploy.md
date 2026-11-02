---
topic: deploy
requires: []
---

# Deploy an app

`POST https://ship.embarko.ai/apps` · async for server apps · not idempotent

Send the app's files. Embarko detects the language, builds it and serves it at `https://<app-name>.embarko.app`. No Dockerfile. Redeploying the same name updates the same app.

## Requirements

- Reads its port from `PORT`, binds `0.0.0.0`.
- No Dockerfile.
- Manifest (`package.json`, `requirements.txt`, `pyproject.toml`, `go.mod`, `Gemfile`, `composer.json`, `Cargo.toml`) or `index.html` at the top of what you send. If the root hands its build to a subfolder, send that subfolder.
- One upload is one app with one process. Frontend and backend are two apps.
- Lasting data under `DATA_DIR` ([data](data.md)).
- Production start command. A dev server will OOM at 256MB.
- Leave out `node_modules`, build output, `.git`, `.env*`. Secrets go in env vars.
- No `window.storage` (Claude Artifacts API). Rejected at deploy.

## App name

`^[a-z0-9-]+$`, 3 to 63 chars, no leading or trailing dash. Unique across all of Embarko. It is the address: slugify prose. 130 names are reserved: [reserved-names](reserved-names.md).

## Headers

| Header | Required | Rule |
|---|---|---|
| `X-App-Name` | yes | as above |
| `X-Agent-Name` | send it | your name, lowercase: `claude-code`, `codex`, `cursor`. Up to 60 chars. The owner sees which agent deployed |
| `Authorization: Bearer <token>` | no | permanent from the start, or claims a temporary app |
| `X-App-Version` | no | `^[a-zA-Z0-9._-]+$`, a git SHA. Default: timestamp |
| `X-App-Type` | no | what the app is for: `portfolio`, `task management`. Up to 60 chars. Kept across redeploys |
| `X-Scale-To-Zero` | no | `true` or `false`. [scale-to-zero](scale-to-zero.md) |

## Multipart (server or static)

```bash
tar -czf /tmp/app.tar.gz --exclude=node_modules --exclude=.git --exclude='.env*' -C /path/to/app .
curl -sS -X POST 'https://ship.embarko.ai/apps' -H 'X-App-Name: my-app' -H 'X-Agent-Name: codex' \
  -H 'X-App-Type: portfolio' -F 'source=@/tmp/app.tar.gz'
```

Reply `202`, building:

```json
{ "success": true, "status": "building",
  "app": { "name": "my-app", "kind": "service", "claimed": false, "expiresAt": "2026-10-10T06:50:46.326Z" },
  "next": "Building: poll links.status every 10 seconds until it says \"live\" or \"failed\".",
  "links": { "status": "https://ship.embarko.ai/apps/my-app/status", "feedback": "https://ship.embarko.ai/apps/my-app/customer-query" } }
```

## JSON (when you can't upload a file)

Same endpoint, `Content-Type: application/json`, same replies. Limits: 25MB, 2000 files.

```json
{ "appName": "my-site", "agentName": "codex",
  "files": [ { "path": "index.html", "content": "<h1>Hello</h1>" },
             { "path": "logo.png", "content": "<base64>", "encoding": "base64" } ] }
```

Fields `version`, `appType`, `scaleToZero` mirror the headers.

## Static site reply

Published while the request waits. Usually `200` with `status: "live"` and `links.app`. Nothing to poll. A very large site gets `202` `publishing`: poll every 2 seconds. [static-sites](static-sites.md)

## Every reply

`{ status, app: { name, kind, claimed, expiresAt? }, next, links }`. Do what `next` says. Use the URLs in `links`; don't build them. Errors keep `{ error, code }` and add `next`, `links`.

## Polling

`GET https://ship.embarko.ai/apps/<app-name>/status`, every 10 s (2 s static). Send the same `Authorization` you deployed with. Wait on `building`, `publishing`, `starting`. Final: `live`, `failed`, `crashed`, `not_deployed`. `unknown`: keep polling; report after 2 minutes. **Give up after 10 minutes:** read the logs, tell the person it's taking unusually long, report it. [status](status.md)

## Errors

| Code | Status | Retry | Do |
|---|---|---|---|
| `invalid_app_name` | 400 | No | Slugify and resend |
| `app_name_too_short` / `_too_long` | 400 | No | 3 to 63 chars |
| `invalid_app_version` / `_app_type` / `_agent_name` | 400 | No | Fix or drop the header |
| `missing_source_file` | 400 | No | No `source` field, or empty `files` |
| `invalid_json` / `invalid_file_path` / `_content` / `_encoding` | 400 | No | JSON only: relative paths, string content, `utf8` or `base64` |
| `unauthorized` | 401 | No | Token invalid or revoked. No header is anonymous; a bad header is never anonymous |
| `host_not_allowed` (from your sandbox) | 403 | No | Not Embarko. [no-connectivity](no-connectivity.md) |
| `app_name_taken` | 409 | No | Another account owns it. Pick another. Your own app is a normal redeploy |
| `app_name_reserved` | 409 | No | [reserved-names](reserved-names.md) |
| `rename_in_progress` | 409 | Later | Address change running. Deploy under the new name after |
| `source_too_large` / `too_many_files` | 413 | No | Trim, or use multipart |
| `no_manifest_at_root` | 422 | No | Package from `foundNestedAt` |
| `app_nested_in_subdirectory` | 422 | No | Deploy `deployThisInstead` |
| `unsupported_storage_pattern` | 422 | No | `window.storage` in `filesDetected`. Use SQLite under `DATA_DIR` |
| `invalid_static_root` | 422 | No | `Staticfile` root outside the upload |
| `app_kind_changed` | 422 | No | A static site can't become a server app. New name |
| `deploy_failed` / `publish_failed` | 500 | Once | Check status first, then redeploy once. Repeats: report |
| `app_name_check_failed` | 502 | Yes | Retry identical request once |

**Say:** deploying → "Your app is deploying now. I'll tell you when it's live." · failed → "It didn't go live because of a problem in the code. I'm fixing it now."

**Next:** poll until live. Then [claim](claim.md) if temporary.
