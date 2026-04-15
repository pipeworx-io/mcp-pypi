# mcp-pypi

PyPI MCP — wraps the PyPI JSON API (free, no auth)

Part of the [Pipeworx](https://pipeworx.io) open MCP gateway.

## Tools

| Tool | Description |
|------|-------------|

## Quick Start

Add to your MCP client config:

```json
{
  "mcpServers": {
    "pypi": {
      "url": "https://gateway.pipeworx.io/pypi/mcp"
    }
  }
}
```

Or use the CLI:

```bash
npx pipeworx use pypi
```

## License

MIT
