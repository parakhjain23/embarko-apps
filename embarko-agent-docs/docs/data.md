---
title: Data
---

# Data

Where an app keeps anything that must last: the folder in `DATA_DIR`, with SQLite for a database.

**Call:** none. This is a code rule.

## Steps

1. Write durable files under `path.join(process.env.DATA_DIR, ...)`. Create subfolders on startup with `{ recursive: true }`.
2. For a database use SQLite with the file under `DATA_DIR`:

```js
const Database = require('better-sqlite3');
const db = new Database(`${process.env.DATA_DIR}/app.db`);
```

Keep the `-wal` and `-shm` files there too.

3. Never use `window.storage`. It exists only in the Claude Artifacts sandbox and is rejected at deploy time (422 `unsupported_storage_pattern`).

## Limits

- Everything outside `DATA_DIR` is wiped on every redeploy.
- `DATA_DIR` survives redeploys, restarts and sleeping. It lives on one machine and does not survive losing that machine.
- No backups. Tell the person. If the data matters, give the app an export route.
- No managed database, no object storage, no disk quota: cap logs, uploads and caches yourself.
- Static sites have no `DATA_DIR`.
- PGlite is not supported. Port it to `better-sqlite3`.

## Errors

None at runtime. Data loss shows up as `ENOENT` in [logs](logs) after a redeploy.

Say: "Your app's data is kept between updates, but it isn't backed up."
