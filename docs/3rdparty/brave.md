 brave mcp key: BSAFysCbmXCmO7tE7o4UEgid1EtLNwf

An MCP server implementation that integrates the Brave Search API, providing comprehensive search capabilities including web search, local business search, image search, 
video search, news search, and AI-powered summarization. This project supports both STDIO and HTTP transports, with STDIO as the default mode.

Migration
1.x to 2.x
Default transport now STDIO
To follow established MCP conventions, the server now defaults to STDIO. If you would like to continue using HTTP, you will need to set the BRAVE_MCP_TRANSPORT environment variable to http, or provide the runtime argument --transport http when launching the server.

Response structure of brave_image_search
Version 1.x of the MCP server would return base64-encoded image data along with image URLs. This dramatically slowed down the response, as well as consumed unnecessarily context in the session. Version 2.x removes the base64-encoded data, and returns a response object that more closely reflects the original Brave Search API response. The updated output schema is defined in src/tools/images/schemas/output.ts.

Tools
Web Search (brave_web_search)
Performs comprehensive web searches with rich result types and advanced filtering options.

Parameters:

query (string, required): Search terms (max 400 chars, 50 words)
country (string, optional): Country code (default: "US")
search_lang (string, optional): Search language (default: "en")
ui_lang (string, optional): UI language (default: "en-US")
count (number, optional): Results per page (1-20, default: 10)
offset (number, optional): Pagination offset (max 9, default: 0)
safesearch (string, optional): Content filtering ("off", "moderate", "strict", default: "moderate")
freshness (string, optional): Time filter ("pd", "pw", "pm", "py", or date range)
text_decorations (boolean, optional): Include highlighting markers (default: true)
spellcheck (boolean, optional): Enable spell checking (default: true)
result_filter (array, optional): Filter result types (default: ["web", "query"])
goggles (array, optional): Custom re-ranking definitions
units (string, optional): Measurement units ("metric" or "imperial")
extra_snippets (boolean, optional): Get additional excerpts (Pro plans only)
summary (boolean, optional): Enable summary key generation for AI summarization
Local Search (brave_local_search)
Searches for local businesses and places with detailed information including ratings, hours, and AI-generated descriptions.

Parameters:

Same as brave_web_search with automatic location filtering
Automatically includes "web" and "locations" in result_filter
Note: Requires Pro plan for full local search capabilities. Falls back to web search otherwise.

Video Search (brave_video_search)
Searches for videos with comprehensive metadata and thumbnail information.

Parameters:

query (string, required): Search terms (max 400 chars, 50 words)
country (string, optional): Country code (default: "US")
search_lang (string, optional): Search language (default: "en")
ui_lang (string, optional): UI language (default: "en-US")
count (number, optional): Results per page (1-50, default: 20)
offset (number, optional): Pagination offset (max 9, default: 0)
spellcheck (boolean, optional): Enable spell checking (default: true)
safesearch (string, optional): Content filtering ("off", "moderate", "strict", default: "moderate")
freshness (string, optional): Time filter ("pd", "pw", "pm", "py", or date range)
Image Search (brave_image_search)
Searches for images with automatic fetching and base64 encoding for direct display.

Parameters:

query (string, required): Search terms (max 400 chars, 50 words)
country (string, optional): Country code (default: "US")
search_lang (string, optional): Search language (default: "en")
count (number, optional): Results per page (1-200, default: 50)
safesearch (string, optional): Content filtering ("off", "strict", default: "strict")
spellcheck (boolean, optional): Enable spell checking (default: true)
News Search (brave_news_search)
Searches for current news articles with freshness controls and breaking news indicators.

Parameters:

query (string, required): Search terms (max 400 chars, 50 words)
country (string, optional): Country code (default: "US")
search_lang (string, optional): Search language (default: "en")
ui_lang (string, optional): UI language (default: "en-US")
count (number, optional): Results per page (1-50, default: 20)
offset (number, optional): Pagination offset (max 9, default: 0)
spellcheck (boolean, optional): Enable spell checking (default: true)
safesearch (string, optional): Content filtering ("off", "moderate", "strict", default: "moderate")
freshness (string, optional): Time filter (default: "pd" for last 24 hours)
extra_snippets (boolean, optional): Get additional excerpts (Pro plans only)
goggles (array, optional): Custom re-ranking definitions
Summarizer Search (brave_summarizer)
Generates AI-powered summaries from web search results using Brave's summarization API.

Parameters:

key (string, required): Summary key from web search results (use summary: true in web search)
entity_info (boolean, optional): Include entity information (default: false)
inline_references (boolean, optional): Add source URL references (default: false)
Usage: First perform a web search with summary: true, then use the returned summary key with this tool.

Configuration
Getting an API Key
Sign up for a Brave Search API account
Choose a plan:
Free: 2,000 queries/month, basic web search
Pro: Enhanced features including local search, AI summaries, extra snippets
Generate your API key from the developer dashboard
Environment Variables
The server supports the following environment variables:

BRAVE_API_KEY: Your Brave Search API key (required)
BRAVE_MCP_TRANSPORT: Transport mode ("http" or "stdio", default: "stdio")
BRAVE_MCP_PORT: HTTP server port (default: 8080)
BRAVE_MCP_HOST: HTTP server host (default: "0.0.0.0")
BRAVE_MCP_LOG_LEVEL: Desired logging level("debug", "info", "notice", "warning", "error", "critical", "alert", or "emergency", default: "info")
BRAVE_MCP_ENABLED_TOOLS: When used, specifies a whitelist for supported tools
BRAVE_MCP_DISABLED_TOOLS: When used, specifies a blacklist for supported tools
Command Line Options
node dist/index.js [options]

Options:
  --brave-api-key <string>    Brave API key
  --transport <stdio|http>    Transport type (default: stdio)
  --port <number>             HTTP server port (default: 8080)
  --host <string>             HTTP server host (default: 0.0.0.0)
  --logging-level <string>    Desired logging level (one of _debug_, _info_, _notice_, _warning_, _error_, _critical_, _alert_, or _emergency_)
  --enabled-tools             Tools whitelist (only the specified tools will be enabled)
  --disabled-tools            Tools blacklist (included tools will be disabled)
Installation
Installing via Smithery
To install Brave Search automatically via Smithery:

npx -y @smithery/cli install brave
Usage with Claude Desktop
Add this to your claude_desktop_config.json:

Docker
{
  "mcpServers": {
    "brave-search": {
      "command": "docker",
      "args": ["run", "-i", "--rm", "-e", "BRAVE_API_KEY", "docker.io/mcp/brave-search"],
      "env": {
        "BRAVE_API_KEY": "YOUR_API_KEY_HERE"
      }
    }
  }
}
NPX
{
  "mcpServers": {
    "brave-search": {
      "command": "npx",
      "args": ["-y", "@brave/brave-search-mcp-server", "--transport", "http"],
      "env": {
        "BRAVE_API_KEY": "YOUR_API_KEY_HERE"
      }
    }
  }
}
Usage with VS Code
For quick installation, use the one-click installation buttons below:

Install with NPX in VS Code Install with NPX in VS Code Insiders
Install with Docker in VS Code Install with Docker in VS Code Insiders

For manual installation, add the following to your User Settings (JSON) or .vscode/mcp.json:

Docker
{
  "inputs": [
    {
      "password": true,
      "id": "brave-api-key",
      "type": "promptString",
      "description": "Brave Search API Key",
    }
  ],
  "servers": {
    "brave-search": {
      "command": "docker",
      "args": ["run", "-i", "--rm", "-e", "BRAVE_API_KEY", "mcp/brave-search"],
      "env": {
        "BRAVE_API_KEY": "${input:brave-api-key}"
      }
    }
  }
}
NPX
{
  "inputs": [
    {
      "password": true,
      "id": "brave-api-key",
      "type": "promptString",
      "description": "Brave Search API Key",
    }
  ],
  "servers": {
    "brave-search-mcp-server": {
      "command": "npx",
      "args": ["-y", "@brave/brave-search-mcp-server", "--transport", "stdio"],
      "env": {
        "BRAVE_API_KEY": "${input:brave-api-key}"
      }
    }
  }
}
Build
Docker
docker build -t mcp/brave-search:latest .
Local Build
npm install
npm run build
Development
Prerequisites
Node.js 22.x or higher
npm
Brave Search API key
Setup
Clone the repository:
git clone https://github.com/brave/brave-search-mcp-server.git
cd brave-search-mcp-server
Install dependencies:
npm install
Build the project:
npm run build
Testing via Claude Desktop
Add a reference to your local build in claude_desktop_config.json:

{
  "mcpServers": {
    "brave-search-dev": {
      "command": "node",
      "args": ["C:\\GitHub\\brave-search-mcp-server\\dist\\index.js"], // Verify your path
      "env": {
        "BRAVE_API_KEY": "YOUR_API_KEY_HERE"
      }
    }
  }
}
Testing via MCP Inspector
Build and start the server:
npm run build
node dist/index.js
In another terminal, start the MCP Inspector:
npx @modelcontextprotocol/inspector node dist/index.js
STDIO is the default mode. For HTTP mode testing, add --transport http to the arguments in the Inspector UI.

Testing via Smithery.AI
Establish and acquire a smithery.ai account and API key
Run npm run install, npm run smithery:build, and lastly npm run smithery:dev to begin testing
Available Scripts
npm run build: Build the TypeScript project

npm run watch: Watch for changes and rebuild

npm run format: Format code with Prettier

npm run format:check: Check code formatting

npm run prepare: Format and build (runs automatically on npm install)

npm run inspector: Launch an instance of MCP Inspector

npm run inspector:stdio: Launch a instance of MCP Inspector, configured for STDIO

npm run smithery:build: Build the project for smithery.ai

npm run smithery:dev: Launch the development environment for smithery.ai