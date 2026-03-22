/**
 * MCP (Model Context Protocol) client integration.
 * Connect to MCP servers to expose their tools to the AI agent.
 *
 * Configure MCP server URLs in .env.local:
 * MCP_SERVERS=https://your-mcp-server.com/mcp
 *
 * Agents can dynamically use tools via MCP (web search, GitHub reader,
 * PDF parser, SQL queries, code execution, etc.).
 */

import { Client } from "@modelcontextprotocol/sdk/client";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const MCP_SERVER_URLS = process.env.MCP_SERVERS?.split(",").map((s) => s.trim()).filter(Boolean) ?? [];

export type MCPToolDefinition = {
  serverUrl: string;
  name: string;
  description?: string;
  inputSchema?: Record<string, unknown>;
};

let cachedTools: Map<string, MCPToolDefinition> | null = null;
let lastServerList: string = "";
let cacheTimestamp = 0;
const CACHE_TTL = 1 * 60 * 1000; // 1 minute when dynamic

/**
 * Fetch available tools from configured MCP servers.
 * Supports passing dynamic user-defined servers.
 */
export async function getMCPTools(userServers: string[] = []): Promise<Map<string, MCPToolDefinition>> {
  const allServers = Array.from(new Set([...MCP_SERVER_URLS, ...userServers]));
  const serverKey = allServers.sort().join(",");
  const now = Date.now();
  
  if (cachedTools && serverKey === lastServerList && (now - cacheTimestamp < CACHE_TTL)) {
    return cachedTools;
  }

  const tools = new Map<string, MCPToolDefinition>();

  for (const serverUrl of allServers) {
    try {
      const transport = new StreamableHTTPClientTransport(new URL(serverUrl));
      // Add timeout to transport start
      await Promise.race([
         transport.start(),
         new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout connecting to MCP")), 4000))
      ]);
      const client = new Client({ name: "askit", version: "1.0.0" });
      await client.connect(transport);

      const { tools: serverTools } = await client.listTools();
      for (const t of serverTools ?? []) {
        tools.set(t.name, {
          serverUrl,
          name: t.name,
          description: t.description ?? undefined,
          inputSchema: t.inputSchema as Record<string, unknown> | undefined,
        });
      }

      await client.close();
    } catch (err) {
      console.warn(`[MCP] Failed to connect to ${serverUrl}:`, err);
    }
  }
  
  cachedTools = tools;
  lastServerList = serverKey;
  cacheTimestamp = Date.now();
  return tools;
}

export async function listMCPTools(userServers: string[] = []): Promise<MCPToolDefinition[]> {
  return Array.from((await getMCPTools(userServers)).values());
}

/**
 * Call an MCP tool by name with the given arguments.
 */
export async function callMCPTool(
  serverUrl: string,
  toolName: string,
  args: Record<string, unknown>
): Promise<{ content: Array<{ type: string; text?: string }> }> {
  try {
    const transport = new StreamableHTTPClientTransport(new URL(serverUrl));
    await transport.start();
    const client = new Client({ name: "askit", version: "1.0.0" });
    await client.connect(transport);

    const result = await client.callTool({ name: toolName, arguments: args });
    await client.close();

    return result as { content: Array<{ type: string; text?: string }> };
  } catch (err) {
    console.error(`[MCP] Failed to call ${toolName} on ${serverUrl}:`, err);
    throw err;
  }
}
