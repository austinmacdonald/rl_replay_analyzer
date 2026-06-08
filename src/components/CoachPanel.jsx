import { useCallback, useState } from "react";
import { buildCoachPayload } from "../utils/buildCoachPayload.js";

function SimpleMarkdown({ text }) {
  const blocks = text.split(/\n(?=## )/);

  return (
    <div className="coach-report">
      {blocks.map((block, i) => {
        const lines = block.trim().split("\n");
        const isHeading = lines[0]?.startsWith("## ");
        return (
          <div key={i} className="coach-block">
            {isHeading ? (
              <>
                <h4>{lines[0].replace(/^##\s*/, "")}</h4>
                {lines.slice(1).map((line, j) => (
                  <p key={j} className={line.startsWith("- ") ? "coach-bullet" : ""}>
                    {line.replace(/^- /, "• ")}
                  </p>
                ))}
              </>
            ) : (
              lines.map((line, j) => (
                <p key={j} className={line.startsWith("- ") ? "coach-bullet" : ""}>
                  {line.replace(/^- /, "• ")}
                </p>
              ))
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function CoachPanel({ result, playerFilter, coachConfigured }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [report, setReport] = useState(null);
  const [copied, setCopied] = useState(false);

  const payload = buildCoachPayload(result, playerFilter);
  const playerName = payload?.player?.name;

  const getPromptText = useCallback(async () => {
    const res = await fetch("/api/coach/prompt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ context: payload }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return data.prompt;
  }, [payload]);

  const handleCopyPrompt = useCallback(async () => {
    try {
      const prompt = await getPromptText();
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      setError(err.message);
    }
  }, [getPromptText]);

  const handleGetCoaching = useCallback(async () => {
    setLoading(true);
    setError(null);
    setReport(null);

    try {
      const response = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ context: payload }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Coaching request failed.");

      setReport(data.report);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [payload]);

  if (!result) return null;

  if (playerFilter === "all") {
    return (
      <section className="coach-panel coach-panel-hint">
        <p>
          Select a player above to get an <strong>AI coaching overview</strong> and improvement tips
          based on their stats vs everyone else in the upload.
        </p>
      </section>
    );
  }

  if (!payload) {
    return (
      <section className="coach-panel coach-panel-hint">
        <p>Not enough data to coach this player (need at least one other player for comparison).</p>
      </section>
    );
  }

  return (
    <section className="coach-panel">
      <header className="coach-panel-header">
        <div>
          <h3>AI Coach</h3>
          <p className="section-desc">
            Get an overview and improvement tips for <strong>{playerName}</strong> using their stats
            vs the session average.
          </p>
        </div>
        <div className="coach-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={handleCopyPrompt}
            disabled={loading}
          >
            {copied ? "Copied!" : "Copy Prompt"}
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={handleGetCoaching}
            disabled={loading || !coachConfigured}
            title={!coachConfigured ? "Set OPENAI_API_KEY in .env" : undefined}
          >
            {loading ? "Analyzing…" : "Get AI Coaching"}
          </button>
        </div>
      </header>

      {!coachConfigured && (
        <div className="banner banner-warn">
          Add <code>OPENAI_API_KEY</code> to <code>.env</code> for in-app coaching, or use{" "}
          <strong>Copy Prompt</strong> to paste into ChatGPT, Cursor, or any AI agent.
        </div>
      )}

      {error && (
        <div className="banner banner-error" role="alert">
          {error}
        </div>
      )}

      {report && <SimpleMarkdown text={report} />}
    </section>
  );
}
