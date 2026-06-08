import { STAT_SECTIONS } from "./formatStats.js";
import { playerKey } from "./players.js";

const HIGHER_IS_BETTER = new Set([
  "goals",
  "assists",
  "saves",
  "shots",
  "score",
  "shooting_percentage",
  "inflicted",
  "bcpm",
  "avg_speed",
  "avg_speed_percentage",
  "total_distance",
  "time_supersonic_speed",
  "percent_supersonic_speed",
  "amount_collected",
  "amount_stolen",
  "time_full_boost",
  "percent_full_boost",
  "time_closest_to_ball",
  "percent_closest_to_ball",
]);

const LOWER_IS_BETTER = new Set([
  "goals_against",
  "shots_against",
  "time_zero_boost",
  "percent_zero_boost",
  "taken",
  "goals_against_while_last_defender",
  "amount_used_while_supersonic",
  "time_farthest_from_ball",
  "percent_farthest_from_ball",
]);

export function getComparablePlayersFromReplay(replay) {
  const players = [];

  for (const player of [...(replay.blue?.players || []), ...(replay.orange?.players || [])]) {
    players.push({
      key: playerKey(player),
      name: player.name,
      games: 1,
      stats: player.stats || {},
      car_name: player.car_name,
      camera: player.camera,
      mvp: player.mvp,
      steering_sensitivity: player.steering_sensitivity,
    });
  }

  return players;
}

function averagePlayerRecords(players) {
  const totalWeight = players.reduce((sum, p) => sum + (p.games || 1), 0);
  if (totalWeight === 0) return {};

  const stats = {};

  for (const section of STAT_SECTIONS) {
    const keys = new Set();
    players.forEach((p) => {
      if (p.stats?.[section]) Object.keys(p.stats[section]).forEach((k) => keys.add(k));
    });

    const sectionStats = {};
    for (const key of keys) {
      let weightedSum = 0;
      let weightSum = 0;

      for (const player of players) {
        const value = player.stats?.[section]?.[key];
        if (typeof value === "number" && !Number.isNaN(value)) {
          const weight = player.games || 1;
          weightedSum += value * weight;
          weightSum += weight;
        }
      }

      if (weightSum > 0) sectionStats[key] = weightedSum / weightSum;
    }

    if (Object.keys(sectionStats).length > 0) stats[section] = sectionStats;
  }

  if (stats.core?.shots > 0 && stats.core?.goals != null) {
    stats.core.shooting_percentage = (stats.core.goals / stats.core.shots) * 100;
  }

  return stats;
}

export function buildPlayerComparison(players, selectedKey) {
  const selected = players.find((p) => playerKey(p) === selectedKey);
  const others = players.filter((p) => playerKey(p) !== selectedKey);

  if (!selected || others.length === 0) return null;

  return {
    selected,
    othersAvg: averagePlayerRecords(others),
    otherCount: others.length,
    otherNames: others.map((p) => p.name),
  };
}

export function getDeltaDirection(key, delta) {
  if (Math.abs(delta) < 0.005) return "neutral";
  if (HIGHER_IS_BETTER.has(key)) return delta > 0 ? "better" : "worse";
  if (LOWER_IS_BETTER.has(key)) return delta < 0 ? "better" : "worse";
  return "neutral";
}

export function formatDelta(key, delta) {
  if (delta == null || Number.isNaN(delta)) return "—";
  const sign = delta > 0 ? "+" : "";
  const abs = Math.abs(delta);

  if (key.startsWith("percent_") || key === "shooting_percentage" || key === "avg_speed_percentage") {
    return `${sign}${delta.toFixed(1)}%`;
  }
  if (key.startsWith("time_") && !key.includes("percent")) {
    return `${sign}${delta.toFixed(1)}s`;
  }
  if (abs < 10 && !Number.isInteger(delta)) {
    return `${sign}${delta.toFixed(2)}`;
  }
  return `${sign}${delta.toFixed(1)}`;
}
