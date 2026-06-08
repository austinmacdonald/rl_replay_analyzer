# Ballchasing Replay Stats Viewer

Upload one or more Rocket League `.replay` files, send them to the [Ballchasing API](https://ballchasing.com/doc/api), and view all player and team stats in a clean web UI. Multi-upload averages stats per player across all replays.

## Setup

1. **Get a Ballchasing API token** from [ballchasing.com/upload](https://ballchasing.com/upload)

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure environment**

   ```bash
   cp .env.example .env
   ```

   Edit `.env` and set your token:

   ```
   BALLCHASING_TOKEN=your_token_here
   PORT=3001
   ```

## Run

**Development** (frontend + API with hot reload):

```bash
npm run dev
```

- Frontend: http://localhost:5173
- API: http://localhost:3001

**Production**:

```bash
npm run build
npm start
```

Open http://localhost:3001

## How it works

1. You drop or select one or more `.replay` files in the browser
2. Each file is uploaded to `POST /api/v2/upload` on Ballchasing and polled until `ok`
3. **Single replay:** full match stats (teams, players, all categories)
4. **Multiple replays:** per-player per-game averages (matched by platform ID), plus session summary and replay list

## Stats displayed

Per player: core, boost, movement, positioning, demos, camera settings

Per team: aggregated stats + ball possession

Match metadata: map, playlist, duration, score, season, overtime
