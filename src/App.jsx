import { useCallback, useEffect, useMemo, useState } from "react";
import AveragedView from "./components/AveragedView.jsx";
import ReplayView from "./components/ReplayView.jsx";
import ResultsToolbar from "./components/ResultsToolbar.jsx";
import UploadZone from "./components/UploadZone.jsx";
import { averageReplays } from "./utils/averageStats.js";
import {
  listPlayersFromAveraged,
  listPlayersFromReplay,
  loadSavedPlayerFilter,
  savePlayerFilter,
} from "./utils/players.js";

async function uploadSingleReplay(file, visibility) {
  const formData = new FormData();
  formData.append("replay", file);

  const response = await fetch(`/api/upload?visibility=${visibility}`, {
    method: "POST",
    body: formData,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Upload failed.");
  }

  return data;
}

function resolvePlayerFilter(savedFilter, players) {
  if (savedFilter === "all") return "all";
  if (players.some((p) => p.key === savedFilter)) return savedFilter;
  return "all";
}

export default function App() {
  const [tokenConfigured, setTokenConfigured] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [playerFilter, setPlayerFilter] = useState("all");

  useEffect(() => {
    fetch("/api/health")
      .then((r) => r.json())
      .then((data) => setTokenConfigured(data.tokenConfigured))
      .catch(() => setTokenConfigured(false));
  }, []);

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

  const handleUpload = useCallback(async (files, visibility) => {
    setLoading(true);
    setError(null);
    setResult(null);

    const fileList = Array.from(files);
    const replays = [];
    const failures = [];
    let duplicateCount = 0;

    try {
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        setStatusMessage(
          fileList.length === 1
            ? "Uploading replay to Ballchasing…"
            : `Processing replay ${i + 1} of ${fileList.length}: ${file.name}`,
        );

        try {
          const data = await uploadSingleReplay(file, visibility);
          if (data.duplicate) duplicateCount++;
          replays.push(data.replay);
        } catch (err) {
          failures.push({ filename: file.name, error: err.message });
        }
      }

      if (replays.length === 0) {
        throw new Error("All replays failed to process. Check your token and try again.");
      }

      let nextResult;
      if (replays.length === 1) {
        nextResult = {
          mode: "single",
          replay: replays[0],
          duplicate: duplicateCount > 0,
          failures,
        };
      } else {
        nextResult = {
          mode: "averaged",
          averaged: averageReplays(replays),
          duplicateCount,
          failures,
        };
      }

      const players =
        nextResult.mode === "single"
          ? listPlayersFromReplay(nextResult.replay)
          : listPlayersFromAveraged(nextResult.averaged);

      setPlayerFilter(resolvePlayerFilter(loadSavedPlayerFilter(), players));
      setResult(nextResult);
      setStatusMessage("");
    } catch (err) {
      setError(err.message);
      setStatusMessage("");
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <div className="app">
      <header className="header">
        <div className="header-inner">
          <div className="brand">
            <span className="brand-icon">⚽</span>
            <div>
              <h1>Ballchasing Replay Stats</h1>
              <p>
                Upload one or more Rocket League replays — multi-upload shows per-game averaged stats
              </p>
            </div>
          </div>
          {tokenConfigured === false && (
            <div className="banner banner-warn">
              Set <code>BALLCHASING_TOKEN</code> in your <code>.env</code> file. Get one at{" "}
              <a href="https://ballchasing.com/upload" target="_blank" rel="noreferrer">
                ballchasing.com/upload
              </a>
            </div>
          )}
        </div>
      </header>

      <main className="main">
        <UploadZone onUpload={handleUpload} loading={loading} statusMessage={statusMessage} />

        {error && (
          <div className="banner banner-error" role="alert">
            {error}
          </div>
        )}

        {result?.mode === "single" && result.duplicate && (
          <div className="banner banner-info">
            This replay was already on Ballchasing — showing existing analysis.
          </div>
        )}

        {result?.mode === "averaged" && result.duplicateCount > 0 && (
          <div className="banner banner-info">
            {result.duplicateCount} replay(s) were already on Ballchasing — used existing analysis.
          </div>
        )}

        {result && (
          <ResultsToolbar
            players={playerOptions}
            playerFilter={playerFilter}
            onPlayerFilterChange={handlePlayerFilterChange}
            showGames={result.mode === "averaged"}
          />
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
