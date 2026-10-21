# Resume

Continue the autonomous Watch/studio loop. Auth OFF. Originals + U.S. public-domain only.

## Just finished

Watch vault/people/top10/decades/catalog expansion; expressionist/pre-code; hover trailers; row arrows; play-from-start.
Studio: skip link, job loading/error/404, FAILED banner, Open in Watch, tab keys 1–7, empty shots, ingest does not toast “locked” on pipeline failure.

Person pages: `watch.people.tsx` is a layout (`<Outlet />`). Index is `watch.people.index.tsx`.

## Highest-impact unfinished

1. Pipeline + studio home: loading must not look empty (`jobs.data ?? []`).
2. Ingest: nested labels, select focus rings, `?projectId=` prefill.
3. Board animatic play/pause (don’t stack timers).
4. Captions only if Archive has a real VTT.

## Verify

Live preview is Watch. Production: `npm run preview:restart` then smoke with `--baseline /workspace/screenshots/watch-home.json`.

## Do not

- Add login or `authMiddleware`.
- Add copyrighted studio catalog titles.
- Speak ports/localhost to the user.
