# Shine Daniel — Portfolio

Personal portfolio of an Electronics & Communication Engineering student at RSET, Kochi, aspiring VLSI & embedded systems engineer.

**Live site:** https://kaine-codes.github.io

## What's inside

- **Hero:** Lego-brick intro with a working circuit switch that lights up my name
- **Experience:** a Minecraft-style redstone trail with a card for each role
- **Projects:** a circuit-board trail that forks into Embedded, VLSI and All
- **Skills, certifications and contact:** the rest of the page

## Built with

React, TypeScript, Vite, Tailwind CSS, Motion and Lucide icons.

## Run it locally

```bash
npm install
npm run dev
```

Build for production with `npm run build`.

## Adding content

Open `src/App.tsx`:

- **New project:** copy an object in `PROJECTS`, give it a new `id` (like `ECE_009`) and set `track` to `'Embedded'` or `'VLSI'`. It is placed on the trail automatically.
- **New experience:** copy an object at the end of `EXPERIENCES`. It is placed on the red trail automatically.

Trail geometry lives in `src/trailLayoutData.ts`.

## Credits

Designed and built by Shine Daniel. © 2026
