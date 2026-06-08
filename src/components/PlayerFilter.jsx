export default function PlayerFilter({ players, value, onChange, showGames = false }) {
  if (!players || players.length <= 1) return null;

  return (
    <div className="player-filter">
      <label htmlFor="player-filter-select">
        Show player
        <select
          id="player-filter-select"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="all">All players ({players.length})</option>
          {players.map((player) => (
            <option key={player.key} value={player.key}>
              {player.name}
              {showGames && player.games > 1 ? ` (${player.games} games)` : ""}
              {!showGames && player.team ? ` (${player.team})` : ""}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
