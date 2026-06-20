# Ballchasing Replay Stats Viewer

Load replays from your [Ballchasing](https://ballchasing.com) account and view all player and team stats in a clean web UI. Multi-select replays to average stats per player.

**Live app:** [rl-replay-analyzer.onrender.com](https://rl-replay-analyzer.onrender.com/)

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
