# FAD Deploy

Deployment is **manual at sprint close**, not on every push. The global "git push → VPS auto-pulls + builds" Friday convention does **not** apply to FAD — frontend deploys are an explicit `out/` copy, not a `git pull` on the VPS.

## Full sequence

```bash
# 1. Frontend build
cd frontend
npm run build      # generates out/

# 2. Copy out/ to VPS
#    Target: /var/www/friday-dashboard/
#    (rsync or scp — see deploy.sh / deploy-production.sh in repo root)

# 3. Backend (only if backend changed this sprint)
cd ../backend
npm run build      # tsc
#    Deploy backend artifacts and restart the backend service per VPS conventions.

# 4. Verify chunk hashes changed in /var/www/friday-dashboard/_next/static/chunks/
#    Stale cached JS in browsers is a real failure mode. New chunk filenames force cache-bust.
```

The repo includes `deploy.sh` and `deploy-production.sh` scripts. Read them before running — they encode the actual VPS paths and may have evolved past this doc.

## Cache-bust strategy

Next.js emits hashed chunk filenames in `_next/static/chunks/`. The hash is the freshness signal: if hashes haven't changed, browsers will serve old JS from cache and your "deploy" silently has no user-visible effect.

**Always diff chunk hashes between the prior `out/` and the new one before declaring deploy complete.**

## Post-deploy verification

- `https://admin.friday.mu` loads.
- Sign-in works (JWT path through FAD backend).
- One golden-path flow per touched module — open Inbox, click into a conversation, etc.
- Check the browser network tab on first load: are chunk hashes the new ones, not cached?

## Rollback

Two options, in order of preference:

1. **`git revert` + redeploy** — clean history, easy to reason about.
2. **Restore previous `out/` to `/var/www/friday-dashboard/`** if you kept the prior build artifact. Faster, but doesn't undo backend changes if any shipped.

Backend rollback (if applicable): redeploy the prior backend artifact and restart.
