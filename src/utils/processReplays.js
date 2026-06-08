import { averageReplays } from "./averageStats.js";
import {
  listPlayersFromAveraged,
  listPlayersFromReplay,
  loadSavedPlayerFilter,
} from "./players.js";

export function buildResultFromReplays(replays, failures = []) {
  if (replays.length === 0) {
    throw new Error("No replays to analyze.");
  }

  if (replays.length === 1) {
    return {
      mode: "single",
      replay: replays[0],
      failures,
    };
  }

  return {
    mode: "averaged",
    averaged: averageReplays(replays),
    failures,
  };
}

export function resolvePlayerFilterForResult(result) {
  const players =
    result.mode === "single"
      ? listPlayersFromReplay(result.replay)
      : listPlayersFromAveraged(result.averaged);

  const saved = loadSavedPlayerFilter();
  if (saved === "all") return "all";
  if (players.some((p) => p.key === saved)) return saved;
  return "all";
}
