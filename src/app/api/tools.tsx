"use server";
import { Tool } from "ai";

let tools: Record<string, Tool> = {};

export async function addTools(addedTools: Record<string, Tool>) {
  tools = { ...tools, ...addedTools };
}

export async function fetchTools() {
  return tools;
}
