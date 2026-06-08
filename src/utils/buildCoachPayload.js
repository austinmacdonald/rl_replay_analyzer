import {
  buildPlayerComparison,
  formatDelta,
  getComparablePlayersFromReplay,
  getDeltaDirection,
} from "./compareStats.js";
import { STAT_SECTIONS } from "./formatStats.js";

function getPlayersFromResult(result) {
  if (result.mode === "averaged") return result.averaged.players;
  if (result.mode === "single") return getComparablePlayersFromReplay(result.replay);
  return [];
}

function getSessionMeta(result) {
  if (result.mode === "averaged") {
    const { averaged } = result;
    return {
      mode: "averaged",
      replayCount: averaged.replayCount,
      playlists: averaged.playlists,
      dateFrom: averaged.dateFrom,
      dateTo: averaged.dateTo,
    };
  }

  const { replay } = result;
  return {
    mode: "single",
    replayCount: 1,
    playlists: [replay.playlist_name || replay.playlist_id].filter(Boolean),
    map: replay.map_name || replay.map_code,
    title: replay.title,
    teamSize: replay.team_size,
  };
}

function extractNotableDeltas(comparison) {
  if (!comparison) return { strengths: [], weaknesses: [] };

  const rows = [];
  const { selected, othersAvg } = comparison;

  for (const section of STAT_SECTIONS) {
    const selectedSection = selected.stats?.[section] || {};
    const othersSection = othersAvg?.[section] || {};
    const keys = new Set([...Object.keys(selectedSection), ...Object.keys(othersSection)]);

    for (const key of keys) {
      const playerVal = selectedSection[key];
      const othersVal = othersSection[key];
      if (typeof playerVal !== "number" || typeof othersVal !== "number") continue;

      const delta = playerVal - othersVal;
      const direction = getDeltaDirection(key, delta);
      if (direction === "neutral") continue;

      rows.push({
        section,
        stat: key,
        player: round(playerVal),
        othersAvg: round(othersVal),
        delta: formatDelta(key, delta),
        direction,
      });
    }
  }

  const strengths = rows.filter((r) => r.direction === "better").slice(0, 8);
  const weaknesses = rows.filter((r) => r.direction === "worse").slice(0, 8);

  return { strengths, weaknesses };
}

function round(n) {
  return Math.round(n * 100) / 100;
}

function slimStats(stats) {
  if (!stats) return {};
  const slim = {};
  for (const section of STAT_SECTIONS) {
    if (stats[section]) slim[section] = stats[section];
  }
  return slim;
}

export function buildCoachPayload(result, playerFilter) {
  if (!result || playerFilter === "all") {
    return null;
  }

  const players = getPlayersFromResult(result);
  const comparison = buildPlayerComparison(players, playerFilter);
  if (!comparison) return null;

  const { selected, othersAvg, otherCount } = comparison;
  const session = getSessionMeta(result);
  const { strengths, weaknesses } = extractNotableDeltas(comparison);

  return {
    session,
    player: {
      name: selected.name,
      games: selected.games || 1,
      car: selected.car_name,
      stats: slimStats(selected.stats),
    },
    benchmark: {
      label: `Average of ${otherCount} other players`,
      stats: slimStats(othersAvg),
    },
    notableStrengths: strengths,
    notableWeaknesses: weaknesses,
  };
}
