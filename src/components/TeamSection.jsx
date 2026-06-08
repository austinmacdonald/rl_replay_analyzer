import { matchesPlayerFilter } from "../utils/players.js";
import PlayerCard from "./PlayerCard.jsx";
import StatGroup from "./StatGroup.jsx";

export default function TeamSection({ team, color, playerFilter = "all" }) {
  const teamStats = team.stats || {};
  const isFiltered = playerFilter !== "all";
  const visiblePlayers = (team.players || []).filter((p) => matchesPlayerFilter(p, playerFilter));

  return (
    <section className={`team-section team-${color}`}>
      <header className="team-header">
        <h3>{team.name || (color === "blue" ? "Blue Team" : "Orange Team")}</h3>
        {!isFiltered && (
          <span className="team-goals">{teamStats.core?.goals ?? team.goals ?? 0} goals</span>
        )}
      </header>

      {!isFiltered && teamStats.ball && (
        <div className="team-ball-stats">
          <StatGroup title="ball" stats={teamStats.ball} defaultOpen />
        </div>
      )}

      {!isFiltered && (
        <div className="team-aggregate">
          <h4>Team Totals</h4>
          {["core", "boost", "movement", "positioning", "demo"].map((section) => (
            <StatGroup
              key={section}
              title={section}
              stats={teamStats[section]}
              defaultOpen={section === "core"}
            />
          ))}
        </div>
      )}

      <div className="players-list">
        <h4>{isFiltered ? "Player" : "Players"}</h4>
        {visiblePlayers.length === 0 ? (
          <p className="empty-filter">No players on this team match the filter.</p>
        ) : (
          visiblePlayers.map((player) => (
            <PlayerCard
              key={player.id?.id || player.name}
              player={player}
              teamColor={color}
            />
          ))
        )}
      </div>
    </section>
  );
}
