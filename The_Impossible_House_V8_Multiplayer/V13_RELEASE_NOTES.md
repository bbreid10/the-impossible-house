# The Impossible House · V13 First Person

An original browser escape-room mystery for 1–4 players.

**Public test URL:** https://the-impossible-house-playtest.onrender.com

## What changed in V13
- First-person point-and-click presentation: one illustrated room at a time
- Six navigable rooms in each chapter, real connected doorways, optional sketch map (M)
- Flashlight (F) brightens hidden details; investigation never requires twitch reflexes
- Turning Hall rotation (left and right) still physically changes available exits
- House Rules still create genuine navigable mirror, gear, and wall connections
- Shared server-authoritative 75-second word hunts remain in Chapters 2 and 6
- No visible teammate avatars in the scene: co-op relies on shared state, action feed, live changes, and team chat
- Friends can create public or private rooms, using real players only (up to four)

## Deployment
Existing Render web service uses its old repository folder path `The_Impossible_House_V8_Multiplayer` (the folder name is historical; the code is V13). Build: `cd The_Impossible_House_V8_Multiplayer && npm install`. Start: `cd The_Impossible_House_V8_Multiplayer && npm start`. Do not change the Render URL.

## Testing
Run `npm test`. For local multiplayer, run `npm start`, open `http://localhost:4173` in two different browser sessions, and create/join a private room.
Online game rooms are stored in memory and will reset if Render's free instance sleeps or restarts.
