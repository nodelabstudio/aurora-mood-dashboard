// Groq client — primary LLM for /api/vibe
// Groq exposes an OpenAI-compatible API, so we hit it via fetch (no SDK).
// Docs: https://console.groq.com/docs

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.3-70b-versatile";

export type VibeInput = {
  city: string;
  condition: string;
  temp: number;
  hour: number;
};

export class GroqRateLimitError extends Error {
  constructor() {
    super("groq_rate_limit");
    this.name = "GroqRateLimitError";
  }
}

export const SYSTEM_PROMPT =
  "You are a literary weather narrator. Write a single 50–70 word paragraph in " +
  "present tense, sensory and atmospheric, in the spirit of Haruki Murakami. " +
  "No emojis, no quotation marks, no headings. Avoid clichés like 'crisp', " +
  "'gentle', 'painted'. Don't name the city directly — let it be a place. " +
  "Output the paragraph only, nothing else.";

export function userPrompt(input: VibeInput): string {
  return `Place: ${input.city}. Condition: ${input.condition}. Temperature: ${input.temp.toFixed(0)}°C. Local hour: ${input.hour} (24h).`;
}

type ChatResponse = {
  choices: { message: { content: string } }[];
};

export async function generateVibe(input: VibeInput): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY is not set");

  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
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

  if (res.status === 429) throw new GroqRateLimitError();
  if (!res.ok) throw new Error(`Groq error: ${res.status} ${await res.text()}`);

  const data = (await res.json()) as ChatResponse;
  const content = data.choices[0]?.message.content?.trim();
  if (!content) throw new Error("Groq returned empty content");
  return content;
}
