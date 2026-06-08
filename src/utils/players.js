export function playerKey(player) {
  if (player.key) return player.key;
  if (player.id?.platform && player.id?.id) {
    return `${player.id.platform}:${player.id.id}`;
  }
  return `name:${player.name}`;
}

export function listPlayersFromReplay(replay) {
  const players = [];

  for (const [team, teamData] of [
    ["blue", replay.blue],
    ["orange", replay.orange],
  ]) {
    for (const player of teamData?.players || []) {
      players.push({
        key: playerKey(player),
        name: player.name,
        team,
        games: 1,
        id: player.id,
      });
    }
  }

  return players.sort((a, b) => a.name.localeCompare(b.name));
}

export function listPlayersFromAveraged(averaged) {
  return (averaged.players || []).map((player) => ({
    key: playerKey(player),
    name: player.name,
    games: player.games,
    id: player.id,
  }));
}

export function matchesPlayerFilter(player, filterKey) {
  if (!filterKey || filterKey === "all") return true;
  return playerKey(player) === filterKey;
}

const STORAGE_KEY = "ballchasing-player-filter";

export function loadSavedPlayerFilter() {
  try {
    return localStorage.getItem(STORAGE_KEY) || "all";
  } catch {
    return "all";
  }
}

export function savePlayerFilter(filterKey) {
  try {
    if (filterKey === "all") {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY, filterKey);
    }
  } catch {
    // ignore
  }
}
