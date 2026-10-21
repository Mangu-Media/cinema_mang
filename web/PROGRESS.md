# Progress

Started: 2026-09-16 18:13 EDT
Updated: 2026-09-16 ~19:20 EDT

## Completed

- Watch slice 1: recs, history, player extras, browse sort, tests.
- Watch slice 2: vault, Top 10, decades, people, +15 PD titles, card peek, credits, skip/remaining.
- Watch slice 3: expressionist + pre-code, hover trailer, row arrows, play from start / mark watched.
- Studio: skip-to-floor, job loading/error/404, FAILED banner, Open in Watch on Night Shift, tab numbers + 1–7 keys, empty shots CTA, honest ingest pipeline errors.

## Tests / commands

- Stream unit tests: 28+ passed.
- `tsc --noEmit`: pass after each slice.
- `npm run build`: pass.
- Production Watch home: last match `divergesFromBaseline: false`.

## Browser

Watch: home, vault, people, Murnau, Sunrise, search, 1920s, help, expressionist, pre-code.
Studio: floor home, ingest, Night Shift job. Skip-to-floor present. Open in Watch present.
No console errors, no overflow on those smokes.

## Blockers / risks

- Archive.org thumbs/prints may 404; VaultArt + embed fallback remain.
- No git in this sandbox — cannot commit/push from here.
- Auth stays off.

## Next 3

1. Pipeline/home loading ≠ empty (query chrome)
2. Ingest nested-label / select focus polish
3. Captions only if a real VTT exists
