import {
  createGoogleGenerativeAI,
  GoogleGenerativeAIProvider,
} from "@ai-sdk/google";
import { createOpenAI, OpenAIProvider } from "@ai-sdk/openai";
import { AnthropicProvider, createAnthropic } from "@ai-sdk/anthropic";
import { streamText } from "ai";
import { fetchTools } from "../tools";

interface ModelConfig {
  provider: OpenAIProvider | AnthropicProvider | GoogleGenerativeAIProvider;
  modelName: string;
}

let modelConfig: ModelConfig | null = null;

function assignModel(providerName: string, modelName: string, apiKey: string) {
  if (!apiKey.match(/^[A-Za-z0-9_-]+$/)) {
    throw new Error("Invalid API key format");
  }

  const configs: Record<string, () => ModelConfig> = {
    Google: () => ({
      provider: createGoogleGenerativeAI({ apiKey }),
      modelName: modelName,
    }),
    Claude: () => ({
      provider: createAnthropic({ apiKey }),
      modelName: modelName,
    }),
    OpenAI: () => ({
      provider: createOpenAI({ apiKey }),
      modelName: modelName,
    }),
  };

  modelConfig = configs[providerName]?.();

  if (!modelConfig) {
    throw new Error(`Unsupported provider: ${providerName}`);
  }
}

export async function PUT(req: Request) {
  const { provider, model, apiKey } = await req.json();

  try {
    assignModel(provider, model, apiKey);
    return Response.json({ message: "Model assigned successfully" });
  } catch (error) {
    const err = error as Error;
    return Response.json({ error: err.message }, { status: 400 });
  }
}

export async function POST(req: Request) {
  if (modelConfig == null) {
    return new Response(JSON.stringify({ error: "No API Key configured" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const { messages } = await req.json();

    const result = streamText({
      model: modelConfig.provider(modelConfig.modelName),
      system: "You are a helpful assistant",
      messages: messages,
      tools: await fetchTools(),
      maxSteps: 3,
    });
    console.log(result);
    return result.toDataStreamResponse();
  } catch (error) {
    const err = error as Error;
    return Response.json({ error: err.message }, { status: 400 });
  }
}
