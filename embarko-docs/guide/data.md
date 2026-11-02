---
topic: data
requires: []
---

# Saving data

Every redeploy builds a fresh image and starts a fresh container. **The only folder kept is `DATA_DIR`.** Everything else resets.

## Steps

1. Write anything lasting under `path.join(process.env.DATA_DIR, ...)`. Create folders on startup with `{ recursive: true }`.
2. Database: SQLite (`better-sqlite3` in Node) with its file under `DATA_DIR`, including the `-wal` and `-shm` files.

```js
const dir = process.env.DATA_DIR;
fs.mkdirSync(dir, { recursive: true });
const db = new Database(path.join(dir, "app.db"));
```

3. Uploads: `DATA_DIR/uploads`, served through your own route.

## What survives

| Event | `DATA_DIR` | Everything else |
|---|---|---|
| Redeploy, restart, crash, sleep and wake, rollback | kept | reset |
| Delete the app | **destroyed** | destroyed |
| Loss of the machine | **lost** | lost |

## Limits

- **Not backed up.** One machine, no snapshot, no restore. If the data matters, have the app export it (a download, an endpoint that streams the SQLite file). Tell the person plainly.
- No managed database, no Postgres or MySQL to connect to. One process means one writer; SQLite fits.
- `window.storage` is rejected at deploy (`422 unsupported_storage_pattern`, files in `filesDetected`). PGlite is no longer supported.
- Disk has no quota. Cap uploads and caches yourself.
- Static sites have no `DATA_DIR`.
- `PORT`, `APP_NAME`, `APP_VERSION`, `DATA_DIR` are set by Embarko.
- `ENOENT` on startup usually means a path outside `DATA_DIR`.

**Next:** point storage at `DATA_DIR` before the first deploy.
