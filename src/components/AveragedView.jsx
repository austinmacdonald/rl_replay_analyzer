import { matchesPlayerFilter } from "../utils/players.js";
import AveragedHeader from "./AveragedHeader.jsx";
import PlayerCard from "./PlayerCard.jsx";

export default function AveragedView({ averaged, failures, playerFilter }) {
  const filteredPlayers = averaged.players.filter((p) => matchesPlayerFilter(p, playerFilter));
  const isFiltered = playerFilter !== "all";

  return (
    <div className="replay-view">
      <AveragedHeader averaged={averaged} failures={failures} playerFilter={playerFilter} />

      <section className="averaged-players">
        <h3>{isFiltered ? "Averaged player stats" : "Per-game averages by player"}</h3>
        <p className="section-desc">
          {isFiltered
            ? "Per-game averages across the replays this player appeared in."
            : "Stats are averaged across the replays each player appeared in. Players are sorted by games played."}
        </p>

        {filteredPlayers.length === 0 ? (
          <p className="empty-filter">No player matches the current filter.</p>
        ) : (
          <div className={`averaged-player-grid ${isFiltered ? "averaged-player-grid-single" : ""}`}>
            {filteredPlayers.map((player) => (
              <PlayerCard
                key={player.key || player.id?.id || player.name}
                player={player}
                teamColor="neutral"
                isAverage
                gamesCount={player.games}
                mvpRate={player.mvpRate}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
