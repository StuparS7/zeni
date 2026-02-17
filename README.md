# Zombie Wave Shooter (M1)

Minimal multiplayer skeleton with authoritative Node server and socket.io client. Milestone 1 covers connect + movement sync.

## Run
- Server: `cd server && npm install && npm start` (if port 3000 is busy: `set PORT=4000 && npm start`)
- Browser client: open `http://localhost:3000` (or chosen PORT). Open două tab-uri ferestre pentru multiplayer rapid.

## Controls
- Move: `WASD` or arrows.
- Mouse move: sets facing angle (for later combat).

## Notes
- Default room code is `DEMO`; clients auto-join.
- Lobby UI (M2): complete a name + room code, apasă “Create / Join Room”; listează jucătorii din cameră.
- Server is authoritative: clients only send input; positions come from server snapshots.
- Tick: 20 Hz physics, 10 Hz snapshots; client renders at 60 fps with simple prediction/reconciliation.
