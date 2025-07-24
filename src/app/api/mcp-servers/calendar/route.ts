import { experimental_createMCPClient } from "ai";
import { Experimental_StdioMCPTransport } from "ai/mcp-stdio";
import { addTools } from "../../tools";

export async function PUT(req: Request) {
  const { client_id, client_secret } = await req.json();

  try {
    const transport = new Experimental_StdioMCPTransport({
      command: "uvx",
      args: ["workspace-mcp", "--tools", "gmail", "calendar", "drive"],
      env: {
        GOOGLE_OAUTH_CLIENT_ID: client_id,
        GOOGLE_OAUTH_CLIENT_SECRET: client_secret,
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
