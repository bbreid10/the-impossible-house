# The Impossible House · V8 Archive Edition

A **six-chapter, 2–4-player cooperative online escape-room game**, plus a true offline solo playtest (where you control two explorers). Players physically rotate rooms, discover clues, and write laws that alter the map. The same authoritative Node engine powers both solo and the server.

## Play immediately

- Open `PLAY_SOLO_OFFLINE.html` in Chrome or Edge. Start **Begin the story**. Choose each explorer by clicking their portraits. The guide starts **ON** in Chapter 1 and gives one move at a time, with a clear route to Room C.
- To test multiplayer locally, run `npm start` and open `http://localhost:4173` in separate browsers. Create a public or private lobby and join with another device or tab.
- To publish for other people, follow `DEPLOY_ON_RENDER.md`. Downloading the ZIP is not the same thing as publishing a public game.

## What's new in V8

**Real rewrites:**
- `MIRRORS ARE DOORS` lets you teleport between the two mirror rooms AND remotely examine the other mirror's room to read its description or clue.
- `ROOMS TURN TOGETHER` rotates linked gears in opposite directions AND creates a walkable shaft between the two cog rooms even when regular doors are misaligned.
- `WALLS BECOME DOORS` opens multiple previously sealed wall passages in Chapters 3 and 6.

Only one law is in force at a time. The affected rooms are outlined in brass, newly opened passages appear on the floor plan, and a **REALITY REWRITTEN** banner confirms the exact changed rooms.

**Clear Chapter 1:** Five story steps, each with a current instruction and a progress indicator. Room C is labeled EXIT SEALED until both explorers activate the D and E seals. Rotating controls are directly under the six rooms. Beginners can use the Guide one move at a time without needing to read a solution document.

**Varied puzzles:** physical room routing, clue deduction, portraits, brass symbol dials, ordered runes, multiple law swaps, and two *optional* timed shared word hunts. There is no word-search shortcut on the home menu. A torn page is found naturally in Room D during Chapter 2 or Room A during Chapter 6. The explorer who discovers it starts the timed hunt; everyone can submit answers simultaneously, with one synchronized timer and found-word list.

**New art:** chapter-specific line-drawn architectural room illustrations, a dark cinematic house-diorama cover, brushed-ink textures, muted parchment, and minimal brass. Character customization still includes diverse skin tones, natural hairstyles, hair colors, adult outfits, and accessories.

## Reliability and limits

Run `npm test` to execute 29 automated tests, including a full six-chapter escape and a real two-client HTTP word hunt. Test with real devices once deployed too. User profiles and solo saves use local browser storage. Online room state is currently in Node process memory; sleeping/restarts clear active rooms. The chat has basic filtering and session-only reports, not professional moderation. Use trusted playtesters first.
