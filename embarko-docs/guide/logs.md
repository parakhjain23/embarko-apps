---
topic: logs
requires: [deploy]
---

# Logs

`GET https://ship.embarko.ai/apps/<app-name>/logs?stream=stderr` · same auth as status · `stream` defaults to `stdout`

About the last 8KB of the running app. A snapshot, not a stream: call again to follow.

**Build failed?** No container started, so the same call returns the **build** output (`source: "build"`) and names the failing command. Read it before guessing.

## What the lines mean

| In the log | Meaning | Fix |
|---|---|---|
| `exit code: 127` | command not found in the build | the build tool isn't in dependencies, or the real app is in a subfolder. A trailing `docker-import … no such file` line is noise |
| `OOM Killed`, `Exit Code: 137` | over 256MB | production start command, drop unused deps, don't hold big data in memory. The limit can't be raised |
| `Not Restarting`, `Exceeded allowed attempts` | crash loop, a symptom | the real cause is logged **above** this line |
| `ENOENT` on start | path outside `DATA_DIR` | move it |
| `EADDRINUSE` or no requests arrive | fixed port or `localhost` | read `PORT`, bind `0.0.0.0` |

## Replies

Runtime: `{ "available": true, "allocId", "stream", "logs" }`.
Static site: `{ "status": "not_available", "available": false, "reason": "..." }`. Nothing runs; check the files and redeploy.
Nothing deployed yet: `{ "available": false }` with `next` pointing at status.

## Limits

No retention promise. For long-term logs, ship them from inside the app to your own service.

**Say:** failed → "It didn't go live because of a problem in the code. I'm fixing it now." Never paste a log unless asked.

**Next:** fix what the log names, redeploy same name. Down meanwhile? [rollback](rollback.md).
