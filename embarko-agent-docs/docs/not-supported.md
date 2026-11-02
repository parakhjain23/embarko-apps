---
title: Not supported
---

# Not supported

Things that will not work on Embarko. Most deploy fine and fail silently at runtime, so check before building.

**Call:** `GET https://ship.embarko.ai/capabilities/not-supported` for the live list.

| Feature | What happens | Use instead |
| --- | --- | --- |
| WebSockets (Socket.IO, `ws`, Pusher-style) | Connections never work | Plain HTTP polling from the browser |
| Cron and scheduled jobs | No scheduler. In-process timers die on redeploy or sleep | An HTTP route guarded by a secret env var, called by an external scheduler |
| Background workers and queues | No work outlives the request | Do it in the request, or elsewhere |
| Multiple processes | One upload runs one process in one language | Two apps, or serve the built frontend from the backend |
| Dockerfile | Rejected, language is detected | Standard project layout |
| Managed database | None | SQLite under `DATA_DIR` ([data](data)) |
| Backups | None | Give the app an export route |
| Secrets store | None | Env vars ([env-vars](env-vars)) |
| Memory above 256MB | Not changeable by an agent | Shrink the footprint |
| Region choice | Not selectable, not guaranteed | Never promise a location |
| `window.storage` | Rejected at deploy, 422 | SQLite |
| GPUs | None | Host elsewhere |

## Limits

- CPU is a shared slice, not a guarantee. Add timeouts around heavy work.
- Disk has no quota. Cap logs, uploads and caches yourself.
- Response headers, including Content-Security-Policy, are set by the platform.

## Errors

None. These do not fail at deploy time, except `window.storage` and a Dockerfile.

Say: "This app needs <feature>, which Embarko doesn't support. I can change it to <alternative> or we host it elsewhere. Which do you prefer?"
