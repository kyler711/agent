// Groq (https://console.groq.com) - free, fast, OpenAI-compatible chat API.

export async function chatComplete({ system, messages }) {
  // .trim() guards against a stray trailing newline/space, which is an easy
  // mistake to make when pasting a value into a host's env var UI (it can
  // otherwise turn "openai/gpt-oss-120b" into "openai/gpt-oss-120b\n" and
  // cause a confusing "model not found" error).
  const apiKey = (process.env.GROQ_API_KEY || "").trim();
  const model = (process.env.GROQ_MODEL || "openai/gpt-oss-120b").trim();

  if (!apiKey) {
    throw new Error("Missing GROQ_API_KEY in your .env.local");
  }

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.4,
      max_tokens: 400,
      messages: [{ role: "system", content: system }, ...messages],
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Groq API error ${res.status}: ${text}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() || "";
}
