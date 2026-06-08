import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import { buildExportPrompt, generateCoachReport } from "./coach.js";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

const PORT = process.env.PORT || 3001;
const BALLCHASING_TOKEN = process.env.BALLCHASING_TOKEN;
const BALLCHASING_BASE = "https://ballchasing.com/api";

app.use(cors());
app.use(express.json());

function ballchasingHeaders() {
  return { Authorization: BALLCHASING_TOKEN };
}

async function ballchasingFetch(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: { ...ballchasingHeaders(), ...options.headers },
  });
  return response;
}

async function pollReplay(replayId, maxAttempts = 60, intervalMs = 2000) {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const response = await ballchasingFetch(`${BALLCHASING_BASE}/replays/${replayId}`);
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
  res.json({
    ok: true,
    tokenConfigured: Boolean(BALLCHASING_TOKEN),
    coachConfigured: Boolean(process.env.OPENAI_API_KEY),
  });
});

app.post("/api/coach/prompt", (req, res) => {
  const { context } = req.body || {};
  if (!context?.player) {
    return res.status(400).json({ error: "Missing coaching context. Select a player first." });
  }

  res.json({ prompt: buildExportPrompt(context) });
});

app.post("/api/coach", async (req, res) => {
  const { context } = req.body || {};
  if (!context?.player) {
    return res.status(400).json({ error: "Missing coaching context. Select a player first." });
  }

  try {
    const { report, model } = await generateCoachReport(context);
    res.json({ report, model });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message || "Coaching request failed." });
  }
});

function requireToken(res) {
  if (!BALLCHASING_TOKEN) {
    res.status(500).json({
      error: "BALLCHASING_TOKEN is not set. Copy .env.example to .env and add your token.",
    });
    return false;
  }
  return true;
}

app.get("/api/replays", async (req, res) => {
  if (!requireToken(res)) return;

  try {
    const params = new URLSearchParams(req.query);
    if (!params.has("uploader") && !params.has("player-id") && !params.has("player-name")) {
      params.set("uploader", "me");
    }

    const response = await ballchasingFetch(`${BALLCHASING_BASE}/replays?${params}`);
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
  if (!requireToken(res)) return;

  try {
    const replay = await pollReplay(req.params.id);
    res.json({ replay });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message || "Failed to fetch replay." });
  }
});

app.post("/api/replays/batch", async (req, res) => {
  if (!requireToken(res)) return;

  const ids = req.body?.ids;
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: "Provide an array of replay IDs." });
  }

  try {
    const replays = [];
    const failures = [];

    for (const id of ids) {
      try {
        const replay = await pollReplay(id);
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

app.post("/api/upload", upload.single("replay"), async (req, res) => {
  if (!requireToken(res)) return;

  if (!req.file) {
    return res.status(400).json({ error: "No replay file provided." });
  }

  if (!req.file.originalname.toLowerCase().endsWith(".replay")) {
    return res.status(400).json({ error: "File must be a .replay file." });
  }

  try {
    const formData = new FormData();
    formData.append(
      "file",
      new Blob([req.file.buffer], { type: "application/octet-stream" }),
      req.file.originalname,
    );

    const visibility = req.query.visibility || "private";
    const uploadResponse = await ballchasingFetch(
      `${BALLCHASING_BASE}/v2/upload?visibility=${visibility}`,
      { method: "POST", body: formData },
    );

    const uploadBody = await uploadResponse.json().catch(() => ({}));

    if (!uploadResponse.ok && uploadResponse.status !== 409) {
      return res.status(uploadResponse.status).json({
        error: uploadBody.error || "Upload to Ballchasing failed.",
      });
    }

    const replayId = uploadBody.id;
    if (!replayId) {
      return res.status(500).json({ error: "Ballchasing did not return a replay ID." });
    }

    const replay = await pollReplay(replayId);
    res.json({
      duplicate: uploadResponse.status === 409,
      replay,
    });
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
  if (!BALLCHASING_TOKEN) {
    console.warn("Warning: BALLCHASING_TOKEN is not set.");
  }
  if (!process.env.OPENAI_API_KEY) {
    console.warn("Warning: OPENAI_API_KEY is not set — AI coaching disabled (Copy Prompt still works).");
  }
});
