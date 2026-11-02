---
title: Deploy
check: curl -s https://ship.embarko.ai/apps/<app-name>/status | grep -q '"status":"live"'
---

# Deploy

Uploads an app's source. Embarko builds and runs it. Same call for a first deploy and an update.

**Call:** `POST https://ship.embarko.ai/apps`. Auth optional: `Authorization: Bearer <deploy token>`. Without it the app is temporary ([claim](claim)).

## Headers

| Header | Required | Rule |
| --- | --- | --- |
| `X-App-Name` | yes | `^[a-z0-9-]+$`, 3 to 63 chars, no leading or trailing dash, unique platform-wide |
| `X-App-Version` | no | `^[a-zA-Z0-9._-]+$`. Default: a timestamp. Never reuse `latest`. |
| `X-Agent-Name` | no | Your agent name, lowercase, up to 60 printable ASCII chars. Always send it. |
| `X-App-Type` | no | What the app is for, up to 60 chars: `portfolio`, `task management`. Omit if unknown. |
| `X-Scale-To-Zero` | no | `true` lets an idle app sleep after 360 minutes. Cold start 4 to 9 seconds. Default: always on. |

## Steps

1. Package: `tar -czf /tmp/app.tar.gz --exclude=node_modules --exclude=.git --exclude='.env*' -C /path/to/app .` The manifest must be at the archive root.
2. Send it as the `source` multipart field:

```bash
curl -sS -X POST https://ship.embarko.ai/apps \
  -H "X-App-Name: my-app" -H "X-App-Version: v3" -H "X-Agent-Name: claude" \
  -F "source=@/tmp/app.tar.gz"
```

3. Read the reply. Server app, HTTP 202:

```json
{ "success": true, "status": "building",
  "app": { "name": "my-app", "kind": "service", "claimed": true },
  "next": "Building: poll links.status every 10 seconds until it says \"live\" or \"failed\".",
  "links": { "status": "https://ship.embarko.ai/apps/my-app/status", "feedback": "https://ship.embarko.ai/apps/my-app/customer-query" } }
```

Static site, HTTP 200, `"status": "live"` with `links.app`. See [static-sites](static-sites).

4. Poll `links.status` ([status](status)) until `live`.

## JSON body instead of a file

Same URL, `Content-Type: application/json`, same replies:

```json
{ "appName": "my-app", "version": "v3", "agentName": "claude", "appType": "portfolio", "scaleToZero": false,
  "files": [ { "path": "index.html", "content": "<h1>hi</h1>" },
             { "path": "logo.png", "content": "<base64>", "encoding": "base64" } ] }
```

Limits: 25MB body, 2000 files. Headers win over body fields.

## Limits

- Memory 256MB per app.
- One upload is one app running one process. Frontend plus backend is two deploys.
- Local `.env` is not read. Set config with [env-vars](env-vars).

## Errors

| code | HTTP | Retry | Do |
| --- | --- | --- | --- |
| `unauthorized` | 401 | no | Token present but invalid. Drop the header for a temporary app, or get a new token ([claim](claim)). |
| `invalid_app_name` | 400 or 409 | no | Pattern, or leading/trailing dash. Fix the name. |
| `app_name_too_short`, `app_name_too_long` | 409 | no | 3 to 63 chars. |
| `app_name_reserved` | 409 | never | Pick another name. |
| `app_name_taken` | 409 | no | Another company owns it. Pick another name. |
| `rename_in_progress` | 409 | later | The app's address is moving. Wait minutes, deploy under the new name. |
| `app_name_check_failed` | 502 | yes | Transient. |
| `invalid_app_version`, `invalid_app_type`, `invalid_agent_name` | 400 | no | Fix or omit the header. |
| `missing_source_file` | 400 | no | Attach `source`, or a non-empty `files`. |
| `invalid_json`, `invalid_file_path`, `invalid_file_content`, `invalid_file_encoding` | 400 | no | Fix the body as `next` says. |
| `source_too_large`, `too_many_files` | 413 | no | Use the tar.gz upload. |
| `no_manifest_at_root` | 422 | no | `foundNestedAt` names the folder. Package that folder. |
| `app_nested_in_subdirectory` | 422 | no | Package `deployThisInstead`. |
| `unsupported_storage_pattern` | 422 | no | `filesDetected` use `window.storage`. Replace with SQLite ([data](data)). |
| `invalid_static_root` | 422 | no | Staticfile `root:` must be inside the upload. |
| `app_kind_changed` | 422 | no | A static site cannot become a server app. Use a new name. |
| `publish_failed` | 500 | once | Static publish failed on Embarko's side. |
| `deploy_failed` | 500 | once | Upload unreadable. Check the tar.gz. |

Say: "Your app is deploying now. I'll tell you when it's live."
