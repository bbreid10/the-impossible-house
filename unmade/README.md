# The Unmade Line · Prototype 0.1

**An original world-folding night railway.** Build the track by moving the landscape, then watch the train cross. No running, no jumping, no copying a known game's layouts or music.

## Play
- **Solo**: click *Play Solo*. The train waits at each signal while you fold/rotate the world.
- **Online (2–4 people)**: click *Play With Friends*, make a public/private room, share the code/link, and have everyone mark Ready. The host starts the run.
- **Co-op bridge**: one worker braces the hinge and **another worker** unfolds the bridge twice. Other mechanisms can be manipulated in parallel. Everyone sees the same world and train.
- Three crossings: **Broken Span** (fold/brace), **Moon Observatory** (focus/rotate), **Unmade Pass** (fold/turn/illuminate).
- Two modes: **No Clock** and **8-minute Night Shift**. The train waits for safe passage; this is not an obstacle-dodging runner.
- **Chat** is available inside multiplayer runs. Room codes are private unless the host lists the lobby publicly.

## Run locally
Install Node.js 20+ and run:

```bash
npm start
```

Open http://127.0.0.1:4173. `PORT` is honored for Render deployment.

## Test

```bash
npm test
```

The first build includes 16 automated tests covering all three crossings, solo completion, 2–4-player lobbies, real cooperative manipulation, synchronized server events, chat, and access control. UI smoke checks at 1440×900 and 390×844 included complete playthroughs.

## Scope and limitations
- Prototype intentionally has three handcrafted spatial challenges rather than a full campaign or randomized procedural levels.
- Online rooms use **in-memory state**. A Render restart or free instance spin-down can reset them.
- This is **procedural vector illustration**, not full 3D. All key rail/bridge pieces are sharp SVG at every resolution.
- Only one person can hold the hinge, and a different human must fold it in online mode; solo mode doesn't require another person.
- No paid services, purchases, user accounts, external tracking, or bots are used.

## Four-day completion priorities
1. **Day 1:** Establish a short, full playable loop and stable multiplayer. *(prototype implemented)*
2. **Day 2:** Playtest world readability, transition animation, and visual polish.
3. **Day 3:** Test 2–4 people on separate devices, adjust accessibility/timing and fix bugs.
4. **Day 4:** Final balance, device checks, trailer/screenshots, submission packaging.

Title and art are original working material. Do a final third-party title/trademark review before commercial release.
