import { experimental_createMCPClient } from "ai";
import { Experimental_StdioMCPTransport } from "ai/mcp-stdio";
import { addTools } from "../../tools";

export async function PUT(req: Request) {
  const { client_id, client_secret, refresh_token } = await req.json();

  const transport = new Experimental_StdioMCPTransport({
    command: "npx",
    args: ["@gongrzhe/server-calendar-mcp"],
    env: {
      GOOGLE_CLIENT_ID: client_id,
      GOOGLE_CLIENT_SECRET: client_secret,
      GOOGLE_REFRESH_TOKEN: refresh_token,
    },
  });
  const stdioClient = await experimental_createMCPClient({
    transport,
  });

  const tools = await stdioClient.tools();
  addTools(tools);
}
