import OpenAI from "openai";

let nimClient: OpenAI;

function getNimClient(): OpenAI {
  if (!nimClient) {
    const apiKey = process.env.NIM_API_KEY;
    if (!apiKey) {
      throw new Error("Missing NIM_API_KEY environment variable");
    }
    nimClient = new OpenAI({
      baseURL: "https://integrate.api.nvidia.com/v1",
      apiKey,
    });
  }
  return nimClient;
}

const CHAT_MODEL = process.env.NIM_CHAT_MODEL || "nvidia/nemotron-3-super-120b-a12b";
const EMBED_MODEL = process.env.NIM_EMBED_MODEL || "nvidia/llama-3.2-nv-embedqa-1b-v2";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export async function nimChat(
  messages: ChatMessage[],
  options?: { temperature?: number; maxTokens?: number }
): Promise<string> {
  const client = getNimClient();
  const response = await client.chat.completions.create({
    model: CHAT_MODEL,
    messages,
    temperature: options?.temperature ?? 0.3,
    max_tokens: options?.maxTokens ?? 1024,
  });
  return response.choices[0]?.message?.content || "";
}

export async function nimChatStream(
  messages: ChatMessage[],
  options?: { temperature?: number; maxTokens?: number }
) {
  const client = getNimClient();
  return client.chat.completions.create({
    model: CHAT_MODEL,
    messages,
    temperature: options?.temperature ?? 0.3,
    max_tokens: options?.maxTokens ?? 1024,
    stream: true,
  });
}

export async function nimEmbed(texts: string[]): Promise<number[][]> {
  const client = getNimClient();
  const response = await client.embeddings.create({
    model: EMBED_MODEL,
    input: texts,
    encoding_format: "float",
  });
  return response.data.map((d) => d.embedding);
}

export async function nimEmbedSingle(text: string): Promise<number[]> {
  const results = await nimEmbed([text]);
  return results[0];
}
