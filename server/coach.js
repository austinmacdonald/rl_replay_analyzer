const SYSTEM_PROMPT = `You are an expert Rocket League coach analyzing Ballchasing replay statistics.

Given a player's stats (and how they compare to other players in the same session), provide:
1. A short overview (2-3 sentences) of their playstyle and performance
2. Top 3 strengths backed by the data
3. Top 3 priorities to improve, with specific actionable advice
4. Suggested training focus (free play, custom training packs, or ranked habits)

Be direct, encouraging, and practical. Reference specific stats when making points.
Do not invent stats that weren't provided. If playlist is 1v1 vs 3v3, tailor rotation advice accordingly.
Use markdown headings (##) for sections and bullet points for lists.`;

export function buildExportPrompt(context) {
  return `${SYSTEM_PROMPT}

---

${buildCoachUserPrompt(context)}`;
}

export function buildCoachUserPrompt(context) {
  return `Analyze this Rocket League player and give coaching feedback.

SESSION:
${JSON.stringify(context.session, null, 2)}

PLAYER STATS (${context.player.games} game(s)):
${JSON.stringify(context.player, null, 2)}

BENCHMARK — ${context.benchmark.label}:
${JSON.stringify(context.benchmark.stats, null, 2)}

NOTABLE STRENGTHS vs benchmark (player better):
${JSON.stringify(context.notableStrengths, null, 2)}

NOTABLE WEAKNESSES vs benchmark (player worse):
${JSON.stringify(context.notableWeaknesses, null, 2)}`;
}

export async function generateCoachReport(context) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY is not set. Add it to .env or use Copy Prompt to paste into any AI chat.",
    );
  }

  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const userPrompt = buildCoachUserPrompt(context);

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.6,
      max_tokens: 1200,
    }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error?.message || `OpenAI API error (${response.status})`);
  }

  const report = data.choices?.[0]?.message?.content;
  if (!report) {
    throw new Error("OpenAI returned an empty response.");
  }

  return { report, model };
}
