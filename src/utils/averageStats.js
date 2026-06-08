import { playerKey } from "./players.js";

function getAllPlayers(replay) {
  return [...(replay.blue?.players || []), ...(replay.orange?.players || [])];
}

function averageNumbers(values) {
  const nums = values.filter((v) => typeof v === "number" && !Number.isNaN(v));
  if (nums.length === 0) return undefined;
  return nums.reduce((sum, n) => sum + n, 0) / nums.length;
}

function averageStatObject(statObjects) {
  const keys = new Set();
  statObjects.forEach((obj) => {
    if (obj) Object.keys(obj).forEach((k) => keys.add(k));
  });

  const result = {};
  for (const key of keys) {
    const values = statObjects.map((obj) => obj?.[key]).filter((v) => v !== undefined && v !== null);
    if (values.length === 0) continue;

    if (values.every((v) => typeof v === "number")) {
      result[key] = averageNumbers(values);
    } else if (values.every((v) => typeof v === "boolean")) {
      result[key] = values.filter(Boolean).length / values.length >= 0.5;
    }
  }

  if (result.shots > 0 && result.goals != null) {
    result.shooting_percentage = (result.goals / result.shots) * 100;
  }

  return result;
}

function averageCamera(cameras) {
  const valid = cameras.filter(Boolean);
  if (valid.length === 0) return null;

  const keys = new Set();
  valid.forEach((c) => Object.keys(c).forEach((k) => keys.add(k)));

  const result = {};
  for (const key of keys) {
    const values = valid.map((c) => c[key]).filter((v) => typeof v === "number");
    if (values.length > 0) result[key] = averageNumbers(values);
  }
  return Object.keys(result).length > 0 ? result : valid[0];
}

const STAT_SECTIONS = ["core", "boost", "movement", "positioning", "demo"];

function averagePlayerStats(playerSnapshots) {
  const stats = {};

  for (const section of STAT_SECTIONS) {
    const sections = playerSnapshots.map((p) => p.stats?.[section]).filter(Boolean);
    if (sections.length > 0) {
      stats[section] = averageStatObject(sections);
    }
  }

  return stats;
}

export function averageReplays(replays) {
  const playerMap = new Map();

  for (const replay of replays) {
    for (const player of getAllPlayers(replay)) {
      const key = playerKey(player);
      if (!playerMap.has(key)) {
        playerMap.set(key, {
          key,
          name: player.name,
          id: player.id,
          car_name: player.car_name,
          snapshots: [],
        });
      }
      const entry = playerMap.get(key);
      entry.snapshots.push(player);
      if (!entry.car_name && player.car_name) entry.car_name = player.car_name;
    }
  }

  const players = [...playerMap.values()]
    .map((entry) => {
      const games = entry.snapshots.length;
      const mvpCount = entry.snapshots.filter((p) => p.mvp || p.stats?.core?.mvp).length;

      return {
        key: entry.key,
        name: entry.name,
        id: entry.id,
        car_name: entry.car_name,
        games,
        mvpRate: games > 0 ? (mvpCount / games) * 100 : 0,
        stats: averagePlayerStats(entry.snapshots),
        camera: averageCamera(entry.snapshots.map((p) => p.camera)),
        steering_sensitivity: averageNumbers(
          entry.snapshots.map((p) => p.steering_sensitivity).filter((v) => typeof v === "number"),
        ),
      };
    })
    .sort((a, b) => b.games - a.games || a.name.localeCompare(b.name));

  const durations = replays.map((r) => r.duration).filter((d) => typeof d === "number");
  const playlists = [...new Set(replays.map((r) => r.playlist_name || r.playlist_id).filter(Boolean))];
  const dates = replays.map((r) => r.date).filter(Boolean).sort();

  return {
    replayCount: replays.length,
    avgDuration: averageNumbers(durations),
    playlists,
    dateFrom: dates[0] || null,
    dateTo: dates[dates.length - 1] || null,
    replays: replays.map((r) => ({
      id: r.id,
      title: r.title,
      date: r.date,
      playlist_name: r.playlist_name || r.playlist_id,
      map_name: r.map_name || r.map_code,
      duration: r.duration,
      link: r.link,
    })),
    players,
  };
}
