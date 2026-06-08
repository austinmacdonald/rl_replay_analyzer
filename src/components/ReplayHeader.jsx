function formatDuration(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function ReplayHeader({ replay }) {
  const meta = [
    { label: "Map", value: replay.map_name || replay.map_code },
    { label: "Playlist", value: replay.playlist_name || replay.playlist_id },
    { label: "Duration", value: formatDuration(replay.duration || 0) },
    { label: "Date", value: replay.date ? new Date(replay.date).toLocaleString() : "—" },
    { label: "Season", value: replay.season != null ? `S${replay.season}` : "—" },
    { label: "Team Size", value: replay.team_size ?? "—" },
    {
      label: "Overtime",
      value: replay.overtime ? `Yes (${replay.overtime_seconds}s)` : "No",
    },
  ];

  return (
    <section className="replay-header">
      <div className="replay-title-row">
        <h2>{replay.title || "Untitled Replay"}</h2>
        {replay.link && (
          <a href={replay.link.replace("/api/replays/", "/replay/")} target="_blank" rel="noreferrer" className="link-out">
            View on Ballchasing ↗
          </a>
        )}
      </div>

      <div className="meta-grid">
        {meta.map((item) => (
          <div key={item.label} className="meta-item">
            <span className="meta-label">{item.label}</span>
            <span className="meta-value">{item.value}</span>
          </div>
        ))}
      </div>

      <div className="score-row">
        <div className="score-team score-blue">
          <span className="score-label">{replay.blue?.name || "Blue"}</span>
          <span className="score-number">{replay.blue?.stats?.core?.goals ?? replay.blue?.goals ?? 0}</span>
        </div>
        <span className="score-divider">—</span>
        <div className="score-team score-orange">
          <span className="score-number">{replay.orange?.stats?.core?.goals ?? replay.orange?.goals ?? 0}</span>
          <span className="score-label">{replay.orange?.name || "Orange"}</span>
        </div>
      </div>
    </section>
  );
}
