// Vercel Serverless Function — Node.js runtime
// Keeps GROQ_API_KEY server-side. Never expose it to the frontend.

const MAX_INPUT_LENGTH = 300; // characters — adjust to your longest realistic item description

export default async function handler(req, res) {
  // CORS headers — needed so the local test HTML page (a different origin)
  // can call this endpoint. Fine to keep for now; you can restrict
  // Access-Control-Allow-Origin to your real frontend's origin later.
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Browsers send an OPTIONS preflight before the real POST when the
  // origin differs. This must be handled BEFORE the POST-only check below,
  // or the preflight itself gets rejected with 405 and the real request
  // never fires — which is exactly what was happening.
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { text, kind = "item" } = req.body ?? {};

  if (typeof text !== "string" || text.trim().length === 0) {
    return res.status(400).json({ error: "Input text is required" });
  }

  if (text.length > MAX_INPUT_LENGTH) {
    return res.status(400).json({
      error: `Input too long. Max ${MAX_INPUT_LENGTH} characters.`,
    });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.error("GROQ_API_KEY is not set");
    return res.status(500).json({ error: "Server misconfiguration" });
  }

  const isTerms = kind === "terms";
  const systemPrompt = `You improve text used in a formal quotation.
Text type: ${isTerms ? "Terms and Conditions" : "Item description"}.
Rules:
- Fix all obvious spelling mistakes, grammar errors, punctuation issues, spacing problems, and inconsistent capitalization.
- Improve clarity, readability, and professionalism while preserving the original meaning exactly.
- Keep item descriptions concise.
- For Terms and Conditions, return each separate rule as its own numbered line using exactly this format: 1. Rule one\n2. Rule two\n3. Rule three. If the input contains only one rule, still prefix it with 1.\n
- Never invent, remove, or change prices, quantities, materials, measurements, dates, warranties, payment requirements, deadlines, or promises.
- Preserve numbered lists and paragraph breaks when they are present.
- Return ONLY the improved text, with no explanation, quotes, or extra commentary.`;

  try {
    const groqResponse = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "openai/gpt-oss-20b",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: text },
          ],
          temperature: 0.2,
          reasoning_effort: "low",
          max_completion_tokens: isTerms ? 600 : 220,
        }),
      }
    );

    if (!groqResponse.ok) {
      const errorBody = await groqResponse.text();
      console.error("Groq API error:", groqResponse.status, errorBody);

      if (groqResponse.status === 429) {
        return res.status(429).json({ error: "Rate limit reached. Try again shortly." });
      }
      if (groqResponse.status === 401 || groqResponse.status === 403) {
        return res.status(502).json({ error: "The Groq API key was rejected. Check or regenerate GROQ_API_KEY." });
      }
      if (groqResponse.status === 400) {
        return res.status(502).json({ error: "Groq rejected the request. Check the configured model and request format." });
      }
      return res.status(502).json({ error: "AI provider request failed" });
    }

    const data = await groqResponse.json();
    const message = data?.choices?.[0]?.message;
    const rawContent = message?.content;
    const suggestion = Array.isArray(rawContent)
      ? rawContent.map((part) => typeof part === "string" ? part : part?.text || "").join("").trim()
      : typeof rawContent === "string" ? rawContent.trim() : "";

    if (!suggestion) {
      console.error("Groq response did not contain message content", {
        choiceCount: Array.isArray(data?.choices) ? data.choices.length : 0,
        messageKeys: message ? Object.keys(message) : [],
        finishReason: data?.choices?.[0]?.finish_reason || null,
      });
      return res.status(502).json({ error: "No suggestion returned" });
    }

    return res.status(200).json({ suggestion });
  } catch (err) {
    console.error("suggest-wording handler error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}