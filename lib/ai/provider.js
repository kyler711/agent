// Single switch for which AI backend powers the receptionist.
// To add a paid provider (e.g. OpenAI) later: create lib/ai/openai.js with
// the same chatComplete({ system, messages }) shape, then add a case below.

import { chatComplete as groqComplete } from "./groq";
import { chatComplete as geminiComplete } from "./gemini";

export async function chatComplete({ system, messages }) {
  const provider = (process.env.AI_PROVIDER || "groq").toLowerCase();

  switch (provider) {
    case "groq":
      return groqComplete({ system, messages });
    case "gemini":
      return geminiComplete({ system, messages });
    default:
      throw new Error(`Unknown AI_PROVIDER "${provider}". Use "groq" or "gemini".`);
  }
}
