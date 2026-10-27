# Postmarked Elsewhere 0.4 · The Navigator’s Desk

This is a standalone browser game with an optional Node 20+ multiplayer server. It has one replayable shift with two deliveries, public/private rooms for 2–4 players, solo play, chat, fold-and-rotate teamwork, delivery time/postage constraints, a small ink-spill event, and secure shared state.

## Key improvements

- The atlas now clearly labels the Night Post (courier start), delivery building, east/west banks, the interrupted road, hinged bridge and moving gate.
- A more tactile editorial isometric paper-city illustration replaces the previous flat facade diagram. Vector artwork remains sharp at desktop and mobile sizes.
- The bridge and gate controls stay beside the map on desktop and ABOVE it on narrow screens. The next Dispatch step is also on the same visible rail.
- The envelope's reverse has a clear route-inspection note in two numbered observations, without giving away the required orientation.
- The optional Postbag, Chat and Activity panels appear from the top bar and do not occupy permanent desk space.
- Solo and online use the existing authoritative engine with the same puzzle difficulty. No player avatars are required for remote multiplayer.

## Run the game

```bash
npm start
```

Open `http://localhost:4174`. Server endpoints include `/api/health` and private/public lobby APIs. The zip includes a solo offline HTML for download as a separate artifact.

## Known limitations

This remains a two-delivery vertical-slice playtest, not finished game art, a long campaign, or persistent-room backend. Render's free instance can sleep; active rooms are in RAM and will reset on restart. Full real-human user studies are not yet complete.
