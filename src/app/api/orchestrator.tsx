"use server";
import { GoogleGenAI, mcpToTool } from "@google/genai";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";

let genAI: GoogleGenAI | null = null;
// let clients = [];

export async function initializeAI(userApiKey: string) {
  if (!userApiKey || typeof userApiKey !== "string") {
    throw new Error("Valid API key required");
  }

  if (!userApiKey.match(/^[A-Za-z0-9_-]+$/)) {
    throw new Error("Invalid API key format");
  }

  genAI = new GoogleGenAI({ apiKey: userApiKey });
}

export async function awaitLLMResponse(client: Client, prompt: string) {
  if (genAI == null) {
    throw new Error("API not initialized");
  }
  const response = await genAI.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      tools: [mcpToTool(client)],
    },
  });
  return response;
}

export async function closeClient(client: Client) {
  await client.close();
}
