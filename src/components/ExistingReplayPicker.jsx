import { useCallback, useState } from "react";
import { parseReplayIds } from "../utils/parseReplayId.js";

function formatReplayDate(date) {
  if (!date) return "—";
  return new Date(date).toLocaleString();
}

function scoreLabel(item) {
  const blue = item.blue?.goals ?? 0;
  const orange = item.orange?.goals ?? 0;
  return `${blue} – ${orange}`;
}

export default function ExistingReplayPicker({ onLoad, loading, statusMessage, tokenConfigured }) {
  const [library, setLibrary] = useState([]);
  const [nextUrl, setNextUrl] = useState(null);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [libraryError, setLibraryError] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [idInput, setIdInput] = useState("");
  const [playlist, setPlaylist] = useState("");

  const fetchLibrary = useCallback(async (append = false) => {
    setLibraryLoading(true);
    setLibraryError(null);

    try {
      const url = append && nextUrl ? nextUrl.replace("https://ballchasing.com/api", "/api") : null;
      const response = url
        ? await fetch(url)
        : await fetch(
            `/api/replays?${new URLSearchParams({
              uploader: "me",
              count: "25",
              "sort-by": "replay-date",
              "sort-dir": "desc",
              ...(playlist ? { playlist } : {}),
            })}`,
          );

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to load replays.");

      setLibrary((prev) => (append ? [...prev, ...(data.list || [])] : data.list || []));
      setNextUrl(data.next || null);
    } catch (err) {
      setLibraryError(err.message);
    } finally {
      setLibraryLoading(false);
    }
  }, [nextUrl, playlist]);

  function toggleId(id) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function addIdFromInput() {
    const ids = parseReplayIds(idInput);
    if (ids.length === 0) {
      alert("Paste a Ballchasing replay URL or UUID.");
      return;
    }
    setSelectedIds((prev) => new Set([...prev, ...ids]));
    setIdInput("");
  }

  function handleAnalyze() {
    if (selectedIds.size === 0) return;
    onLoad([...selectedIds]);
  }

  if (tokenConfigured === false) {
    return (
      <section className="upload-card">
        <p className="muted">Set BALLCHASING_TOKEN in .env to load existing replays.</p>
      </section>
    );
  }

  const selectedCount = selectedIds.size;

  return (
    <section className="upload-card existing-picker">
      <div className="existing-id-row">
        <label className="id-input-label">
          Replay ID or URL
          <input
            type="text"
            value={idInput}
            onChange={(e) => setIdInput(e.target.value)}
            placeholder="https://ballchasing.com/replay/… or paste UUID"
            disabled={loading}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addIdFromInput())}
          />
        </label>
        <button type="button" className="btn-secondary" onClick={addIdFromInput} disabled={loading}>
          Add
        </button>
      </div>

      <div className="library-controls">
        <label className="visibility-select">
          Playlist filter
          <select
            value={playlist}
            onChange={(e) => setPlaylist(e.target.value)}
            disabled={loading || libraryLoading}
          >
            <option value="">All playlists</option>
            <option value="ranked-duels">Ranked 1v1</option>
            <option value="ranked-doubles">Ranked 2v2</option>
            <option value="ranked-standard">Ranked 3v3</option>
            <option value="ranked-hoops">Hoops</option>
            <option value="ranked-rumble">Rumble</option>
            <option value="ranked-dropshot">Dropshot</option>
            <option value="private">Private</option>
          </select>
        </label>

        <button
          type="button"
          className="btn-secondary"
          onClick={() => fetchLibrary(false)}
          disabled={loading || libraryLoading}
        >
          {libraryLoading ? "Loading…" : "Load my replays"}
        </button>
      </div>

      {libraryError && <div className="banner banner-error">{libraryError}</div>}

      {library.length > 0 && (
        <div className="replay-library">
          <div className="library-header">
            <span>Your replays on Ballchasing</span>
            <button
              type="button"
              className="btn-link"
              onClick={() => setSelectedIds(new Set(library.map((r) => r.id)))}
              disabled={loading}
            >
              Select all shown
            </button>
          </div>
          <ul className="library-list">
            {library.map((item) => (
              <li key={item.id} className={selectedIds.has(item.id) ? "library-item-selected" : ""}>
                <label className="library-item-label">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(item.id)}
                    onChange={() => toggleId(item.id)}
                    disabled={loading}
                  />
                  <span className="library-item-main">
                    <strong>{item.replay_title || item.title || "Untitled"}</strong>
                    <span className="library-item-meta">
                      {item.playlist_name || item.playlist_id} · {scoreLabel(item)} ·{" "}
                      {formatReplayDate(item.date)}
                    </span>
                  </span>
                </label>
              </li>
            ))}
          </ul>
          {nextUrl && (
            <button
              type="button"
              className="btn-secondary btn-load-more"
              onClick={() => fetchLibrary(true)}
              disabled={libraryLoading || loading}
            >
              Load more
            </button>
          )}
        </div>
      )}

      {selectedCount > 0 && (
        <ul className="selected-ids-list">
          {[...selectedIds].map((id) => (
            <li key={id}>
              <code>{id}</code>
              <button
                type="button"
                className="btn-remove"
                onClick={() => toggleId(id)}
                disabled={loading}
                aria-label="Remove"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="upload-controls">
        <button
          type="button"
          className="btn-primary"
          onClick={handleAnalyze}
          disabled={selectedCount === 0 || loading}
        >
          {loading
            ? "Loading…"
            : selectedCount <= 1
              ? "Load replay"
              : `Load & average ${selectedCount} replays`}
        </button>
      </div>

      {statusMessage && <p className="status-message">{statusMessage}</p>}
    </section>
  );
}
