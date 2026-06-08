import { useCallback, useEffect, useMemo, useState } from "react";

import AveragedView from "./components/AveragedView.jsx";

import ReplayView from "./components/ReplayView.jsx";

import CoachPanel from "./components/CoachPanel.jsx";

import InputTabs from "./components/InputTabs.jsx";

import ResultsToolbar from "./components/ResultsToolbar.jsx";

import { averageReplays } from "./utils/averageStats.js";

import {

  listPlayersFromAveraged,

  listPlayersFromReplay,

  savePlayerFilter,

} from "./utils/players.js";

import {

  buildResultFromReplays,

  resolvePlayerFilterForResult,

} from "./utils/processReplays.js";



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

      .then((data) => {

        setTokenConfigured(data.tokenConfigured);

      })

      .catch(() => {

        setTokenConfigured(false);

      });

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



  const applyResult = useCallback((nextResult) => {

    setPlayerFilter(resolvePlayerFilterForResult(nextResult));

    setResult(nextResult);

    setStatusMessage("");

  }, []);



  const handleUpload = useCallback(

    async (files, visibility) => {

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



        const nextResult = buildResultFromReplays(replays, failures);

        nextResult.source = "upload";

        if (replays.length === 1) nextResult.duplicate = duplicateCount > 0;

        else nextResult.duplicateCount = duplicateCount;



        applyResult(nextResult);

      } catch (err) {

        setError(err.message);

        setStatusMessage("");

      } finally {

        setLoading(false);

      }

    },

    [applyResult],

  );



  const handleLoadExisting = useCallback(

    async (ids) => {

      setLoading(true);

      setError(null);

      setResult(null);



      try {

        setStatusMessage(`Loading ${ids.length} replay(s) from Ballchasing…`);



        const response = await fetch("/api/replays/batch", {

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



        const nextResult = buildResultFromReplays(data.replays, failures);

        nextResult.source = "existing";

        applyResult(nextResult);

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

              <p>

                Upload replays or load existing ones from Ballchasing — multi-select averages stats

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

        <InputTabs

          onUpload={handleUpload}

          onLoadExisting={handleLoadExisting}

          loading={loading}

          statusMessage={statusMessage}

          tokenConfigured={tokenConfigured}

        />



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



        {result?.failures?.length > 0 && result.source === "existing" && (

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


