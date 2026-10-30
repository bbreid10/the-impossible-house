# THE VELVET HEIST

Prototype 0.1: a sharp vector-art museum robbery for solo or 2–4 live cooperative players.

## Game loop

Steal an artifact from the Museum of Impossible Things and extract it through the Service Exit. Players rearrange gallery access using a rotating atrium, interpret a security blueprint in Records, divert vault lasers, distract a moving guard, fold the service wing, and escape. Raising three alarms causes lockdown. One complete heist, with randomized artifact, patrol offset and laser target for replayability. No external art or libraries.

## Modes

- **Solo:** one operative, automatic folding clamp, calm or eight-minute night shift.
- **Private co-op (2–4):** room code and invite link, two people coordinate folding.
- **Public co-op (2–4):** discovery lobby, no bot teammates.
- **Chat / crew actions:** shared authoritative world and event stream. Other players can move independently and operate museum mechanisms simultaneously.

## Develop

Node >=20, no npm dependencies.

```bash
npm test
npm start
```

Open `http://localhost:4422`. On Render: build `cd velvet-heist && npm install`, start `cd velvet-heist && npm start`, Free service if offered.

## Known prototype limitations

- Online sessions are in memory and reset on deploy/service sleep. No permanent player accounts or progress.
- Browser is the client. Server validates all online movement, visibility of guards, doors, vault security, and shared actions.
- Solo HTML operates offline, but only the hosted version provides multiplayer.
- Vector scenes are original, scalable illustrations, not photorealistic environments. Museum consists of one handcrafted floor, not a full campaign.
