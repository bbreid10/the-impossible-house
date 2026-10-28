# The Unmade Line 0.2 - First gameplay pass

- Three live junctions added. The train pauses and requires a left/right branch selection based on an illuminated lamp. Incorrect choices reduce the score but never cause an instant failure. The engine keeps the train stationary at a signal until the crew chooses correctly.
- The locomotive now follows a curved illuminated branch instead of always moving in a straight line.
- Visual track endpoints, bridge alignment, rotating gate status and connected rail signals are stronger and closer to the actual geometry.
- Bracing requires distinct players on all three stages, including lens stabilization and the cliff anchor; solo uses automatic clamps.
- Optional drag-to-unfold on the first bridge (tap and buttons remain accessible).
- Scores and signal errors shown in results for replayable performance.
- Slightly richer night architecture, color, and rail lighting. This is still procedural 2D art and needs additional polish before final submission.

## Verification
- Node automated engine and HTTP/SSE tests
- Full 3-stage browser solo walkthrough on 1440x900 and 390x844 viewports, no JS page errors or horizontal overflow
- Live co-op public/private room code mechanics retained
