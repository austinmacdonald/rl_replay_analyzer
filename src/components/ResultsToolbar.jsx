import PlayerFilter from "./PlayerFilter.jsx";

export default function ResultsToolbar({ players, playerFilter, onPlayerFilterChange, showGames }) {
  if (!players?.length) return null;

  const filtered = playerFilter !== "all";
  const selected = players.find((p) => p.key === playerFilter);

  return (
    <div className="results-toolbar">
      <PlayerFilter
        players={players}
        value={playerFilter}
        onChange={onPlayerFilterChange}
        showGames={showGames}
      />
      {filtered && selected && (
        <span className="filter-active-label">
          Showing stats for <strong>{selected.name}</strong>
        </span>
      )}
    </div>
  );
}
