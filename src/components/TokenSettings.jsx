import { useState } from "react";
import { apiFetch, loadToken, saveToken } from "../utils/api.js";

export default function TokenSettings({ onTokenChange }) {
  const [open, setOpen] = useState(!loadToken());
  const [value, setValue] = useState(loadToken);
  const [status, setStatus] = useState(null);
  const [testing, setTesting] = useState(false);

  const hasToken = Boolean(value);

  async function handleSave(e) {
    e.preventDefault();
    saveToken(value);
    onTokenChange(value.trim());
    setStatus(value.trim() ? "Token saved in this browser." : "Token removed.");
    if (value.trim()) setOpen(false);
  }

  async function handleTest() {
    setTesting(true);
    setStatus(null);
    saveToken(value);

    try {
      const res = await apiFetch("/api/ping");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Invalid token.");
      setStatus(`Token works — logged in as ${data.name || "Ballchasing user"}.`);
      onTokenChange(value.trim());
    } catch (err) {
      setStatus(err.message);
    } finally {
      setTesting(false);
    }
  }

  function handleClear() {
    setValue("");
    saveToken("");
    onTokenChange("");
    setStatus("Token removed.");
    setOpen(true);
  }

  return (
    <section className="token-settings">
      <div className="token-settings-bar">
        <span className={`token-status ${hasToken ? "token-status-ok" : "token-status-missing"}`}>
          {hasToken ? "Your API token set" : "No API token — add yours to continue"}
        </span>
        <button type="button" className="btn-link" onClick={() => setOpen((o) => !o)}>
          {open ? "Hide" : hasToken ? "Change token" : "Add token"}
        </button>
      </div>

      {open && (
        <form className="token-settings-form" onSubmit={handleSave}>
          <label>
            Ballchasing API token
            <input
              type="password"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Paste token from ballchasing.com/upload"
              autoComplete="off"
            />
          </label>
          <p className="token-help">
            Get a free token at{" "}
            <a href="https://ballchasing.com/upload" target="_blank" rel="noreferrer">
              ballchasing.com/upload
            </a>
            . Stored only in your browser — used to load your replays.
          </p>
          <div className="token-actions">
            <button type="button" className="btn-secondary" onClick={handleTest} disabled={testing || !value.trim()}>
              {testing ? "Testing…" : "Test token"}
            </button>
            <button type="submit" className="btn-primary" disabled={!value.trim()}>
              Save token
            </button>
            {value && (
              <button type="button" className="btn-link" onClick={handleClear}>
                Clear
              </button>
            )}
          </div>
          {status && <p className="token-status-msg">{status}</p>}
        </form>
      )}
    </section>
  );
}
