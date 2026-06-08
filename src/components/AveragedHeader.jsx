function formatDuration(seconds) {
  if (seconds == null) return "—";
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function AveragedHeader({ averaged, failures, playerFilter = "all" }) {
  const selectedPlayer =
    playerFilter !== "all" ? averaged.players.find((p) => p.key === playerFilter) : null;
  const meta = [
    { label: "Replays", value: averaged.replayCount },
    { label: "Avg Duration", value: formatDuration(averaged.avgDuration) },
    { label: "Playlists", value: averaged.playlists.join(", ") || "—" },
    {
      label: "Date Range",
      value:
        averaged.dateFrom && averaged.dateTo
          ? `${new Date(averaged.dateFrom).toLocaleDateString()} – ${new Date(averaged.dateTo).toLocaleDateString()}`
          : "—",
    },
    {
      label: "Unique Players",
      value: selectedPlayer ? `1 of ${averaged.players.length}` : averaged.players.length,
    },
    ...(selectedPlayer
      ? [{ label: "Games (player)", value: `${selectedPlayer.games} of ${averaged.replayCount}` }]
      : []),
  ];

  return (
    <section className="replay-header averaged-header">
      <div className="replay-title-row">
        <h2>
          {selectedPlayer
            ? `${selectedPlayer.name} — averaged over ${selectedPlayer.games} game${selectedPlayer.games !== 1 ? "s" : ""}`
            : `Averaged Stats — ${averaged.replayCount} replays`}
        </h2>
      </div>

      <div className="meta-grid">
        {meta.map((item) => (
          <div key={item.label} className="meta-item">
            <span className="meta-label">{item.label}</span>
            <span className="meta-value">{item.value}</span>
          </div>
        ))}
      </div>

      {failures?.length > 0 && (
        <div className="banner banner-warn failure-list">
          <strong>{failures.length} replay(s) failed:</strong>
          <ul>
            {failures.map((f) => (
              <li key={f.filename}>
                {f.filename}: {f.error}
              </li>
            ))}
          </ul>
        </div>
      )}

      <details className="replay-list-details">
        <summary>Included replays ({averaged.replays.length})</summary>
        <ul className="replay-list">
          {averaged.replays.map((r) => (
            <li key={r.id}>
              <span className="replay-list-title">{r.title || "Untitled"}</span>
              <span className="replay-list-meta">
                {r.playlist_name && `${r.playlist_name} · `}
                {r.map_name && `${r.map_name} · `}
                {formatDuration(r.duration)}
              </span>
              {r.link && (
                <a
                  href={r.link.replace("/api/replays/", "/replay/")}
                  target="_blank"
                  rel="noreferrer"
                  className="link-out"
                >
                  View ↗
                </a>
              )}
            </li>
          ))}
        </ul>
      </details>
    </section>
  );
}
