import { NextRequest } from "next/server";

export const runtime = "nodejs";

const JARVIS_SYSTEM_PROMPT = `You are JARVIS — an advanced AI operating system. You are intelligent, concise, and premium.
Your personality: elite executive AI copilot, strategic thinking, subtle wit, calm confidence.
You specialize in coding, debugging, automation, business strategy, research, and productivity.
Keep responses sharp and high-value. Never be verbose without purpose. Never be cringe or childish.
Format responses with markdown when helpful. Use code blocks for code.`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, provider, model, apiKey } = body as {
      messages: Array<{ role: string; content: string }>;
      provider: "anthropic" | "openrouter";
      model: string;
      apiKey: string;
    };

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "API key not configured. Go to Settings → System Config to add your key." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (provider === "anthropic") {
      return handleAnthropic(messages, model, apiKey);
    } else {
      return handleOpenRouter(messages, model, apiKey);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error occurred";
    console.error("[JARVIS API] Chat error:", message);
    const status = message.includes("rate limit") || message.includes("429") ? 429 : 500;
    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  }
}

async function handleAnthropic(
  messages: Array<{ role: string; content: string }>,
  model: string,
  apiKey: string
) {
  const { default: Anthropic } = await import("@anthropic-ai/sdk");
  const client = new Anthropic({ apiKey });

  const anthropicMessages = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

  const stream = await client.messages.stream({
    model,
    max_tokens: 4096,
    system: JARVIS_SYSTEM_PROMPT,
    messages: anthropicMessages,
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          if (
            chunk.type === "content_block_delta" &&
            chunk.delta.type === "text_delta"
          ) {
            const data = JSON.stringify({ text: chunk.delta.text });
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          }
        }
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      } catch (err) {
        controller.error(err);
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

async function handleOpenRouter(
  messages: Array<{ role: string; content: string }>,
  model: string,
  apiKey: string
) {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://jarvis-os.vercel.app",
      "X-Title": "JARVIS OS",
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "system", content: JARVIS_SYSTEM_PROMPT }, ...messages],
      stream: true,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    console.error("[JARVIS API] OpenRouter error:", response.status, err);
    return new Response(JSON.stringify({ error: `OpenRouter error (${response.status}): ${err}` }), { status: response.status });
  }

  return new Response(response.body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
