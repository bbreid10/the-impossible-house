# The Impossible House · V12

An atmospheric, browser-based cooperative escape-room mystery. Play with 2–4 explorers, or test alone by switching between two characters. No account or install is needed. Each room contains clues, puzzles, or mechanisms that can change the geography of the house.

## Play

Public game: https://the-impossible-house-playtest.onrender.com

Start with **Begin the Story**. Read the letter on the desk in A, use its symbols to unlock the cabinet in F, wind the crank, rotate Room B and read the hidden inscription. Make `MIRRORS ARE DOORS` true, walk through the newly opened F ↔ D passage, activate both seals, and escape through Room C.

## Run locally

Requires Node 20 or higher. Run `npm start` and visit http://localhost:4173. For automated tests run `npm test`.

## Deploy

A Render Node Web Service already runs from this repository. Build: `npm install`. Start: `npm start` from the `The_Impossible_House_V8_Multiplayer` folder. Auto-deploys from `main` should preserve the existing Render free service and URL.

## Technology

Pure Node.js server, server-validated actions, shared state broadcasts through SSE, procedural SVG characters, CSS-based gameplay UI, illustration atlas, no third-party runtime dependencies. All rooms and rules use the same engine in solo and online sessions.

Read [V12_RELEASE_NOTES.md](V12_RELEASE_NOTES.md) for the newest puzzle and visual changes. Online rooms are transient in-memory sessions, which may reset on free-hosting sleep or deployment.
