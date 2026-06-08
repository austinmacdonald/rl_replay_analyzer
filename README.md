# Ballchasing Replay Stats Viewer

Load replays from your [Ballchasing](https://ballchasing.com) account and view all player and team stats in a clean web UI. Multi-select replays to average stats per player.

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Run the app** (see below), then paste your [Ballchasing API token](https://ballchasing.com/upload) in the header — stored in your browser only.

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

1. Add your Ballchasing API token
2. Click **Load my replays** or paste replay URLs/UUIDs
3. Select one or many replays, then **Load replay** or **Load & average**
4. **Single replay:** full match stats (teams, players, all categories)
5. **Multiple replays:** per-player per-game averages, plus session summary

## Stats displayed

Per player: core, boost, movement, positioning, demos, camera settings

Per team: aggregated stats + ball possession

Match metadata: map, playlist, duration, score, season, overtime

## AI Coaching

1. **Select a player** from the dropdown
2. Click **Copy Prompt** and paste into ChatGPT, Cursor, Gemini, or any AI agent for improvement tips
