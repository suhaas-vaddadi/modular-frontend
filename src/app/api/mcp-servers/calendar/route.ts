import { experimental_createMCPClient } from "ai";
import { Experimental_StdioMCPTransport } from "ai/mcp-stdio";
import { addTools } from "../../tools";

export async function PUT(req: Request) {
  const { email } = await req.json();

  try {
    const transport = new Experimental_StdioMCPTransport({
      command: "uvx",
      args: ["workspace-mcp", "--tools", "gmail", "calendar", "drive"],
      env: {
        ...process.env,
        USER_GOOGLE_EMAIL: email,
        WORKSPACE_MCP_PORT: "8001",
      },
    });

    const stdioClient = await experimental_createMCPClient({
      transport,
    });

    const tools = await stdioClient.tools();
    addTools(tools);
    return Response.json({ message: "GSuite tools successfully added" });
  } catch (error) {
    const err = error as Error;
    return Response.json({ error: err.message }, { status: 400 });
  }
}
