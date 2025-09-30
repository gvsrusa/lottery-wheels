# Repository Guidelines

## Project Structure & Module Organization
The project is a Vite-powered React SPA. All application code lives in `src/`; `main.jsx` mounts the root component and `App.jsx` hosts page composition. Shared media sit under `src/assets/`, while global styles are in `App.css` and `index.css`. Static files served as-is belong in `public/`. Build artifacts land in `dist/` and should stay untracked. Tooling lives at the root (`vite.config.js`, `eslint.config.js`, `package.json`).

## Build, Test, and Development Commands
Run `npm install` before any work to sync dependencies. Use `npm run dev` for the local dev server with hot reload, and `npm run preview` to inspect the production bundle locally. `npm run build` creates the optimized output in `dist/`. `npm run lint` executes ESLint across the repo; fix reported issues before committing.

## Coding Style & Naming Conventions
Stick to modern ES modules, React function components, and hooks. Prefer PascalCase for component files (`MyComponent.jsx`) and camelCase for utilities and local variables. Keep indentation at two spaces and favor descriptive prop names over abbreviations. Rely on the configured ESLint rules; they enforce React Hook safety and flag unused variables (except intentionally exported constants).

## Testing Guidelines
Automated testing is not yet configured. When introducing features, document manual verification steps in the PR and, where feasible, add component or hook tests using Vitest + React Testing Library in `src/__tests__/` or alongside the component (`Component.test.jsx`). Update `package.json` with a `test` script when you introduce a runner, and ensure CI-ready commands are reproducible locally.

## Commit & Pull Request Guidelines
Follow the existing history and write imperative, capitalized commit subjects without trailing periods (e.g., `Add wheel spin controls`). Group related changes into a single commit to keep diffs focused. Each PR should include: a concise summary, screenshots or GIFs for UI updates, links to any tracked issues, and confirmation that `npm run lint`, `npm run build`, and manual checks passed. Tag reviewers only when the branch is ready.
