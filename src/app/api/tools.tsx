"use server";
import { Tool } from "ai";

let tools: Record<string, Tool> = {};

export function addTools(addedTools: Record<string, Tool>) {
  tools = { ...tools, ...addedTools };
}

export function fetchTools() {
  return tools;
}
