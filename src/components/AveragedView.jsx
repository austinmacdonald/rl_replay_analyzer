import AveragedHeader from "./AveragedHeader.jsx";
import FilteredPlayerView from "./FilteredPlayerView.jsx";
import PlayerCard from "./PlayerCard.jsx";

export default function AveragedView({ averaged, failures, playerFilter }) {
  const isFiltered = playerFilter !== "all";

  return (
    <div className="replay-view">
      <AveragedHeader averaged={averaged} failures={failures} playerFilter={playerFilter} />

      <section className="averaged-players">
        {isFiltered ? (
          <FilteredPlayerView
            players={averaged.players}
            playerFilter={playerFilter}
            isAverage
          />
        ) : (
          <>
            <h3>Per-game averages by player</h3>
            <p className="section-desc">
              Stats are averaged across the replays each player appeared in. Select a player to
              compare against everyone else.
            </p>

            <div className="averaged-player-grid">
              {averaged.players.map((player) => (
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
          </>
        )}
      </section>
    </div>
  );
}
