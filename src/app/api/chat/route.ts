import { streamText } from "ai";
import {
  createGoogleGenerativeAI,
  GoogleGenerativeAIProvider,
} from "@ai-sdk/google";
import { createOpenAI, OpenAIProvider } from "@ai-sdk/openai";
import { AnthropicProvider, createAnthropic } from "@ai-sdk/anthropic";

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
    gemini: () => ({
      provider: createGoogleGenerativeAI({ apiKey }),
      modelName: modelName,
    }),
    claude: () => ({
      provider: createAnthropic({ apiKey }),
      modelName: modelName,
    }),
    openai: () => ({
      provider: createOpenAI({ apiKey }),
      modelName: modelName,
    }),
  };

  modelConfig = configs[providerName]?.();
}

export async function PUT(req: Request) {
  const { provider, model, apiKey } = await req.json();

  try {
    assignModel(provider, model, apiKey);
  } catch (error) {
    const err = error as Error;
    return Response.json({ error: err.message }, { status: 400 });
  }
}

export async function POST(req: Request) {
  if (modelConfig == null) {
    throw new Error("No API Key");
  }

  const { messages } = await req.json();

  const result = streamText({
    model: modelConfig.provider(modelConfig.modelName),
    system: "You are a helpful assistant",
    messages: messages,
  });

  return result.toDataStreamResponse();
}
