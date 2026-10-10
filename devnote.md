# Dev notes (for me — keep out of the public repo, add to .gitignore)

## Adding content (src/App.tsx)
- New project: copy an object in `PROJECTS`, give it a new `id` (ECE_009...) and set `track: 'Embedded' | 'VLSI'`. Auto-placed on the trail.
- New experience: copy an object at the END of `EXPERIENCES`. Auto-placed on the red trail.
- Trail geometry: `src/trailLayoutData.ts`.

## Tuning (src/TrailSection.tsx, top of file)
- `BLEND_HALF_HEIGHT`, `BLEND_PIXEL`, `NO_PIXEL_ZONES`: red -> green pixel blend
- `USE_BLUR_GLOW`: true = original blur glow (prettier, slower)

## Performance
- Lag culprits: backdrop-blur, SVG blur filters, huge canvases, big images/videos in public/pictures.
