// OpenRouter fallback — used when Groq returns 429
// Free model: deepseek/deepseek-r1:free
// Docs: https://openrouter.ai/docs

import { SYSTEM_PROMPT, userPrompt, type VibeInput } from "./groq";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "deepseek/deepseek-r1:free";

type ChatResponse = {
  choices: { message: { content: string } }[];
};

export async function generateVibeFallback(input: VibeInput): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY is not set");

  const res = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      // OpenRouter attribution headers (recommended for free-tier ranking)
      "HTTP-Referer": "https://aurora.angelrod.dev",
      "X-Title": "Aurora",
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt(input) },
      ],
      temperature: 0.85,
      max_tokens: 200,
    }),
  });

  if (!res.ok) {
    throw new Error(`OpenRouter error: ${res.status} ${await res.text()}`);
  }

  const data = (await res.json()) as ChatResponse;
  const content = data.choices[0]?.message.content?.trim();
  if (!content) throw new Error("OpenRouter returned empty content");
  return content;
}
