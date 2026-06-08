import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";

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
  });
});

app.post("/api/upload", upload.single("replay"), async (req, res) => {
  if (!BALLCHASING_TOKEN) {
    return res.status(500).json({
      error: "BALLCHASING_TOKEN is not set. Copy .env.example to .env and add your token.",
    });
  }

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
});
