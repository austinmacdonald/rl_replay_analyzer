import { useCallback, useState } from "react";
import { buildCoachPayload } from "../utils/buildCoachPayload.js";

export default function CoachPanel({ result, playerFilter }) {
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [copying, setCopying] = useState(false);

  const payload = buildCoachPayload(result, playerFilter);
  const playerName = payload?.player?.name;

  const handleCopyPrompt = useCallback(async () => {
    setCopying(true);
    setError(null);

    try {
      const res = await fetch("/api/coach/prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ context: payload }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      await navigator.clipboard.writeText(data.prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setCopying(false);
    }
  }, [payload]);

  if (!result) return null;

  if (playerFilter === "all") {
    return (
      <section className="coach-panel coach-panel-hint">
        <p>
          Select a player above, then copy a coaching prompt to paste into ChatGPT, Cursor, or any
          AI agent.
        </p>
      </section>
    );
  }

  if (!payload) {
    return (
      <section className="coach-panel coach-panel-hint">
        <p>Not enough data for this player (need at least one other player for comparison).</p>
      </section>
    );
  }

  return (
    <section className="coach-panel">
      <header className="coach-panel-header">
        <div>
          <h3>AI Coaching Prompt</h3>
          <p className="section-desc">
            Copy stats for <strong>{playerName}</strong> vs the session average and paste into any
            AI chat for improvement tips.
          </p>
        </div>
        <div className="coach-actions">
          <button
            type="button"
            className="btn-primary"
            onClick={handleCopyPrompt}
            disabled={copying}
          >
            {copied ? "Copied!" : copying ? "Copying…" : "Copy Prompt"}
          </button>
        </div>
      </header>

      {error && (
        <div className="banner banner-error" role="alert">
          {error}
        </div>
      )}
    </section>
  );
}
