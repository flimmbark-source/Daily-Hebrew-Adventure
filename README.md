# Daily Hebrew Adventure

A Vite + React + TypeScript prototype that scaffolds the Daily Hebrew Adventure experience. It uses Tailwind CSS for styling and Zustand to manage interactive scene state.

## Getting Started

```bash
npm install
npm run dev
```

Visit `http://localhost:5173` (or whichever port Vite chooses) to interact with the app. Click **Start Scene** to load the café encounter and read the opening NPC line.

## Available Scripts

- `npm run dev` – start the Vite development server.
- `npm run build` – type-check and produce a production build.
- `npm run lint` – run ESLint with the recommended configuration.

## Project Structure

- `src/game` – Zustand stores and game-specific logic.
- `src/components` – shared UI components (placeholder for future work).
- `src/scenes` – scene data and schemas, including the sample `cafe.json` scene.

## Styling

Tailwind CSS is configured with `tailwind.config.js` and imported via `src/index.css`.
