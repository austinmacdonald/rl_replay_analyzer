import { getSectionTitle, statsToRows } from "../utils/formatStats.js";

export default function StatGroup({ title, stats, defaultOpen = true }) {
  if (!stats || Object.keys(stats).length === 0) return null;

  const rows = statsToRows(stats);

  return (
    <details className="stat-group" open={defaultOpen}>
      <summary>{getSectionTitle(title)}</summary>
      <dl className="stat-grid">
        {rows.map((row) => (
          <div key={row.key} className="stat-row">
            <dt>{row.label}</dt>
            <dd>{row.value}</dd>
          </div>
        ))}
      </dl>
    </details>
  );
}
