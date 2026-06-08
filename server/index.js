import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { buildExportPrompt } from "./coach.js";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

const PORT = process.env.PORT || 3001;
const BALLCHASING_BASE = "https://ballchasing.com/api";

app.use(cors());
app.use(express.json());

function requireToken(req, res) {
  const token = req.headers.authorization?.trim();
  if (!token) {
    res.status(401).json({
      error: "Add your Ballchasing API token in the app settings.",
    });
    return null;
  }
  return token;
}

async function ballchasingFetch(url, token, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: { Authorization: token, ...options.headers },
  });
  return response;
}

async function pollReplay(replayId, token, maxAttempts = 60, intervalMs = 2000) {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const response = await ballchasingFetch(`${BALLCHASING_BASE}/replays/${replayId}`, token);
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Failed to fetch replay (${response.status}): ${text}`);
    }

    const replay = await response.json();
    if (replay.status === "ok") return replay;
    if (replay.status === "failed") {
      throw new Error("Ballchasing failed to parse this replay.");
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  throw new Error("Replay processing timed out. Try again in a moment.");
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/ping", async (req, res) => {
  const token = requireToken(req, res);
  if (!token) return;

  try {
    const response = await ballchasingFetch(`${BALLCHASING_BASE}/`, token);
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return res.status(response.status).json({
        error: data.error || "Invalid Ballchasing API token.",
      });
    }

    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message || "Failed to reach Ballchasing." });
  }
});

app.post("/api/coach/prompt", (req, res) => {
  const { context } = req.body || {};
  if (!context?.player) {
    return res.status(400).json({ error: "Missing coaching context. Select a player first." });
  }

  res.json({ prompt: buildExportPrompt(context) });
});

app.get("/api/replays", async (req, res) => {
  const token = requireToken(req, res);
  if (!token) return;

  try {
    const params = new URLSearchParams(req.query);
    if (!params.has("uploader") && !params.has("player-id") && !params.has("player-name")) {
      params.set("uploader", "me");
    }

    const response = await ballchasingFetch(`${BALLCHASING_BASE}/replays?${params}`, token);
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return res.status(response.status).json({
        error: data.error || "Failed to list replays from Ballchasing.",
      });
    }

    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message || "Unexpected server error." });
  }
});

app.get("/api/replays/:id", async (req, res) => {
  const token = requireToken(req, res);
  if (!token) return;

  try {
    const replay = await pollReplay(req.params.id, token);
    res.json({ replay });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message || "Failed to fetch replay." });
  }
});

app.post("/api/replays/batch", async (req, res) => {
  const token = requireToken(req, res);
  if (!token) return;

  const ids = req.body?.ids;
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: "Provide an array of replay IDs." });
  }

  try {
    const replays = [];
    const failures = [];

    for (const id of ids) {
      try {
        const replay = await pollReplay(id, token);
        replays.push(replay);
      } catch (err) {
        failures.push({ id, error: err.message });
      }
    }

    if (replays.length === 0) {
      return res.status(500).json({ error: "All replays failed to load.", failures });
    }

    res.json({ replays, failures });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message || "Unexpected server error." });
  }
});

const distPath = path.join(__dirname, "..", "dist");
app.use(express.static(distPath));
app.get("*", (_req, res) => {
  res.sendFile(path.join(distPath, "index.html"), (err) => {
    if (err) res.status(404).json({ error: "Not found" });
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
