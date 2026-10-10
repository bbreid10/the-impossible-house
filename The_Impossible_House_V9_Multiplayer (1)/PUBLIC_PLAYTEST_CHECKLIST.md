# Public playtest checklist (V7)

## Before sharing

1. Publish the **Node web service** from the GitHub repository. Check the Render dashboard says **Live** and open its exact `https://...onrender.com` URL.
2. Test `YOUR_PUBLIC_URL/api/health` in a browser. It should return JSON containing `"ok":true`.
3. On a phone and a second computer, open the **same public URL**. One person creates a private room, copies the invitation link, the other joins, both mark Ready, and host starts. Verify each explorer moves independently while rotating the same room.
4. Start Chapter 2 for word hunts through the solo chapter picker, but for real online word hunt progress use the host's multiplayer chapter progression. Make sure two players can click different words and both see a shared found list and timer.
5. If you need strangers to join, select Public when creating the lobby and have the others click Browse public rooms. Only share public room codes with people you trust during early testing; live chat is not fully moderated.

## Useful feedback questions

- Without external instruction, could you get into Room C?
- What did you think the ROTATE buttons did before using them?
- Did you understand what changing a rule altered on the map?
- Was the word search easy to locate? Was 75 seconds a fair timer?
- Did the puzzles feel too easy, fair, or frustrating?
- Which room or puzzle was most fun? Where did you stop or get confused?

**Prototype limitation:** Render free services may sleep when idle; restarting or deploying the server resets online rooms because multiplayer state is currently in memory. Public playtest URL is not assigned by this source ZIP.
