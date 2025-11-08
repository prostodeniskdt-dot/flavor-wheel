# Flavor Base Patch v1 (safe add-only)

Date: 2025-11-08

This patch adds **three** ingredients with conservative edges to avoid layout explosions in your flavor wheel.

## Files
- `SCHEMA.json` — minimal contract for importer and merge behavior.
- `ingredients.jsonl` — three JSONL records (asparagus, cocoa, ginger).

## Merge Strategy (non-breaking)
- Identify records by `"id"`; also dedupe on `"name"`.
- Upsert only; **never** delete or overwrite existing non-empty fields.
- For edges (`pairings`), merge by `"target"` and keep the **max strength**.
- All new nodes come with 6–8 pairings max to prevent over-dense spokes.

## Import Hints
- If your wheel expects a different field name for edges (e.g. `links`), map:
  - `pairings[*].target` → `links[*].to`
  - `pairings[*].strength` → `links[*].weight`
- If your engine requires IDs for targets, add a map step from canonical names to IDs.

## Provenance
Page references correspond to the ingredient spreads in *The Flavor Matrix*:
- Asparagus — p.36
- Cocoa — p.85
- Ginger — p.133

