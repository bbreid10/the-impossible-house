# V7 playtesting and publishing priorities

1. **Play the first three minutes without help.** Give the offline HTML to someone who has never seen the game. Can they locate the objective, switch explorers, turn a cog room and understand the first magical rule? Any hesitation is a UI change worth making.
2. **Check difficulty.** Let two friends attempt the Chapter 2 word hunt together without spoilers. The 10×10 grid has five words, backward and diagonal paths, and a 75-second limit. If no one finishes despite understanding the controls, adjust the time based on data rather than guessing.
3. **Try the Chapter 3 orrery.** They should be able to solve it from the three inscriptions alone. Check that the on-screen arrows and the requirement to reach the Crossing Room are understandable.
4. **Test multi-device networking.** Create a real public or private room, join from two different networks, switch rooms, start a word hunt, have both players discover words concurrently, disconnect/reconnect, and reach an ending.
5. **Deploy the server.** Complete `DEPLOY_ON_RENDER.md`. Render being accessible in a personal browser does not mean it is connected to this ChatGPT session. No public URL for V7 has been verified.
6. **Polish for broader public access.** Add persistent game sessions beyond in-memory Node state, stronger public-chat moderation or preset quick chat, and real-device performance checks. Free deployment can sleep.
7. **Packaging.** Use the new PNG previews from this version as cover candidates, then verify the contest submission rules, deadline and public URL yourself before submitting.

Avoid adding many more mechanics before a fresh player can understand the six varied chapters. These six levels are intentionally distinct in how they use spatial reasoning, clues, cooperation, and optional fast word play.
