import { useCallback, useMemo, useState } from "react";
import AveragedView from "./components/AveragedView.jsx";
import ReplayView from "./components/ReplayView.jsx";
import CoachPanel from "./components/CoachPanel.jsx";
import ExistingReplayPicker from "./components/ExistingReplayPicker.jsx";
import ResultsToolbar from "./components/ResultsToolbar.jsx";
import TokenSettings from "./components/TokenSettings.jsx";
import { apiFetch, loadToken } from "./utils/api.js";
import {
  listPlayersFromAveraged,
  listPlayersFromReplay,
  savePlayerFilter,
} from "./utils/players.js";
import {
  buildResultFromReplays,
  resolvePlayerFilterForResult,
} from "./utils/processReplays.js";

export default function App() {
  const [userToken, setUserToken] = useState(loadToken);
  const tokenConfigured = Boolean(userToken);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [playerFilter, setPlayerFilter] = useState("all");

  const playerOptions = useMemo(() => {
    if (!result) return [];
    if (result.mode === "single") return listPlayersFromReplay(result.replay);
    if (result.mode === "averaged") return listPlayersFromAveraged(result.averaged);
    return [];
  }, [result]);

  const handlePlayerFilterChange = useCallback((next) => {
    setPlayerFilter(next);
    savePlayerFilter(next);
  }, []);

  const applyResult = useCallback((nextResult) => {
    setPlayerFilter(resolvePlayerFilterForResult(nextResult));
    setResult(nextResult);
    setStatusMessage("");
  }, []);

  const handleLoadReplays = useCallback(
    async (ids) => {
      setLoading(true);
      setError(null);
      setResult(null);

      try {
        setStatusMessage(`Loading ${ids.length} replay(s) from Ballchasing…`);

        const response = await apiFetch("/api/replays/batch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids }),
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Failed to load replays.");
        }

        const failures = (data.failures || []).map((f) => ({
          filename: f.id,
          error: f.error,
        }));

        applyResult(buildResultFromReplays(data.replays, failures));
      } catch (err) {
        setError(err.message);
        setStatusMessage("");
      } finally {
        setLoading(false);
      }
    },
    [applyResult],
  );

  return (
    <div className="app">
      <header className="header">
        <div className="header-inner">
          <div className="brand">
            <span className="brand-icon">⚽</span>
            <div>
              <h1>Ballchasing Replay Stats</h1>
              <p>Load replays from your Ballchasing account — multi-select to average stats</p>
            </div>
          </div>
          <TokenSettings onTokenChange={setUserToken} />
        </div>
      </header>

      <main className="main">
        <ExistingReplayPicker
          onLoad={handleLoadReplays}
          loading={loading}
          statusMessage={statusMessage}
          tokenConfigured={tokenConfigured}
        />

        {error && (
          <div className="banner banner-error" role="alert">
            {error}
          </div>
        )}

        {result?.failures?.length > 0 && (
          <div className="banner banner-warn">
            {result.failures.length} replay(s) could not be loaded — showing the rest.
          </div>
        )}

        {result && (
          <>
            <ResultsToolbar
              players={playerOptions}
              playerFilter={playerFilter}
              onPlayerFilterChange={handlePlayerFilterChange}
              showGames={result.mode === "averaged"}
            />
            <CoachPanel result={result} playerFilter={playerFilter} />
          </>
        )}

        {result?.mode === "single" && result.replay && (
          <ReplayView replay={result.replay} playerFilter={playerFilter} />
        )}

        {result?.mode === "averaged" && result.averaged && (
          <AveragedView
            averaged={result.averaged}
            failures={result.failures}
            playerFilter={playerFilter}
          />
        )}
      </main>

      <footer className="footer">
        Powered by{" "}
        <a href="https://ballchasing.com" target="_blank" rel="noreferrer">
          ballchasing.com
        </a>
      </footer>
    </div>
  );
}
