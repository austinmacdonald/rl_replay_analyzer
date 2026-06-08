import {
  formatDelta,
  getDeltaDirection,
} from "../utils/compareStats.js";
import { formatValue, getSectionTitle, humanizeKey } from "../utils/formatStats.js";

const COMPARISON_COLUMNS = [
  ["core", "positioning"],
  ["boost", "demo"],
  ["movement"],
];

function ComparisonSection({ section, selectedStats, othersStats }) {
  const keys = new Set([
    ...Object.keys(selectedStats || {}),
    ...Object.keys(othersStats || {}),
  ]);

  const rows = [...keys]
    .filter((key) => {
      const a = selectedStats?.[key];
      const b = othersStats?.[key];
      return typeof a === "number" || typeof b === "number";
    })
    .map((key) => {
      const selectedVal = selectedStats?.[key];
      const othersVal = othersStats?.[key];
      const delta =
        typeof selectedVal === "number" && typeof othersVal === "number"
          ? selectedVal - othersVal
          : null;

      return {
        key,
        label: humanizeKey(key),
        selectedVal,
        othersVal,
        delta,
        direction: getDeltaDirection(key, delta),
      };
    });

  if (rows.length === 0) return null;

  return (
    <div className="comparison-column">
      <h4 className="comparison-column-title">{getSectionTitle(section)}</h4>
      <div className="comparison-column-rows">
        <div className="comparison-stat-row comparison-stat-header">
          <span className="comparison-stat-label">Stat</span>
          <span>You</span>
          <span>Others</span>
          <span>Δ</span>
        </div>
        {rows.map((row) => (
          <div key={row.key} className="comparison-stat-row">
            <span className="comparison-stat-label" title={row.label}>
              {row.label}
            </span>
            <span className="comparison-stat-you">{formatValue(row.key, row.selectedVal)}</span>
            <span className="comparison-stat-others">{formatValue(row.key, row.othersVal)}</span>
            <span className={`comparison-stat-delta delta delta-${row.direction}`}>
              {formatDelta(row.key, row.delta)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function PlayerComparison({ comparison, isAverage }) {
  const { selected, othersAvg, otherCount } = comparison;
  const core = selected.stats?.core;

  return (
    <section className="player-comparison player-comparison-primary">
      <header className="comparison-header">
        <div className="comparison-title-row">
          <div>
            <h3>{selected.name}</h3>
            <p className="player-meta comparison-meta">
              {selected.car_name || "Unknown car"}
              {isAverage && selected.games != null && (
                <span className="games-badge">
                  {selected.games} game{selected.games !== 1 ? "s" : ""} avg
                </span>
              )}
            </p>
          </div>
          {core && (
            <div className="player-quick-stats">
              <span>{(core.goals ?? 0).toFixed(isAverage ? 1 : 0)}G</span>
              <span>{(core.assists ?? 0).toFixed(isAverage ? 1 : 0)}A</span>
              <span>{(core.saves ?? 0).toFixed(isAverage ? 1 : 0)}S</span>
              <span>{(core.shots ?? 0).toFixed(isAverage ? 1 : 0)}SH</span>
            </div>
          )}
        </div>
        <p className="section-desc">
          vs {isAverage ? "games-weighted " : ""}average of{" "}
          <strong>
            {otherCount} other player{otherCount !== 1 ? "s" : ""}
          </strong>{" "}
          in {isAverage ? "these replays" : "this match"}
        </p>
      </header>

      <div className="comparison-sections-grid">
        {COMPARISON_COLUMNS.map((sections) => (
          <div key={sections.join("-")} className="comparison-column-stack">
            {sections.map((section) => (
              <ComparisonSection
                key={section}
                section={section}
                selectedStats={selected.stats?.[section]}
                othersStats={othersAvg?.[section]}
              />
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
