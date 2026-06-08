import { buildPlayerComparison } from "../utils/compareStats.js";
import PlayerCard from "./PlayerCard.jsx";
import PlayerComparison from "./PlayerComparison.jsx";

export default function FilteredPlayerView({ players, playerFilter, isAverage = false }) {
  const selected = players.find((p) => p.key === playerFilter);
  const comparison = buildPlayerComparison(players, playerFilter);

  if (!selected) {
    return <p className="empty-filter">No player matches the current filter.</p>;
  }

  if (comparison) {
    return (
      <div className="filtered-player-view">
        <PlayerComparison comparison={comparison} isAverage={isAverage} />
      </div>
    );
  }

  return (
    <div className="filtered-player-view">
      <PlayerCard
        player={selected}
        teamColor="neutral"
        isAverage={isAverage}
        gamesCount={selected.games}
        mvpRate={selected.mvpRate}
      />
    </div>
  );
}
