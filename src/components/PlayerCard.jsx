import { STAT_SECTIONS } from "../utils/formatStats.js";
import StatGroup from "./StatGroup.jsx";

export default function PlayerCard({ player, teamColor, isAverage = false, gamesCount, mvpRate }) {
  const stats = player.stats || {};

  return (
    <article className={`player-card player-${teamColor}`}>
      <header className="player-header">
        <div>
          <h4>{player.name}</h4>
          <p className="player-meta">
            {player.car_name || "Unknown car"}
            {isAverage && gamesCount != null && (
              <span className="games-badge">{gamesCount} game{gamesCount !== 1 ? "s" : ""} avg</span>
            )}
            {!isAverage && player.mvp && <span className="mvp-badge">MVP</span>}
            {isAverage && mvpRate > 0 && (
              <span className="mvp-badge">{mvpRate.toFixed(0)}% MVP</span>
            )}
          </p>
        </div>
        {stats.core && (
          <div className="player-quick-stats">
            <span title={isAverage ? "Avg per game" : undefined}>
              {(stats.core.goals ?? 0).toFixed(isAverage ? 1 : 0)}G
            </span>
            <span>{(stats.core.assists ?? 0).toFixed(isAverage ? 1 : 0)}A</span>
            <span>{(stats.core.saves ?? 0).toFixed(isAverage ? 1 : 0)}S</span>
            <span>{(stats.core.shots ?? 0).toFixed(isAverage ? 1 : 0)}SH</span>
          </div>
        )}
      </header>

      {player.camera && (
        <details className="stat-group camera-group">
          <summary>Camera &amp; Settings</summary>
          <dl className="stat-grid">
            {Object.entries(player.camera).map(([key, value]) => (
              <div key={key} className="stat-row">
                <dt>{key.replace(/_/g, " ")}</dt>
                <dd>{value}</dd>
              </div>
            ))}
            {player.steering_sensitivity != null && (
              <div className="stat-row">
                <dt>Steering Sensitivity</dt>
                <dd>
                  {typeof player.steering_sensitivity === "number"
                    ? player.steering_sensitivity.toFixed(2)
                    : player.steering_sensitivity}
                </dd>
              </div>
            )}
          </dl>
        </details>
      )}

      {STAT_SECTIONS.map((section) => (
        <StatGroup key={section} title={section} stats={stats[section]} defaultOpen={section === "core"} />
      ))}
    </article>
  );
}
