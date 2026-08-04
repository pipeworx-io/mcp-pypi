# mcp-pypi

PyPI MCP — wraps the Python Package Index (PyPI) JSON API (free, no auth).

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1394+ live data sources.

## Tools

| Tool | Description |
|------|-------------|
| `get_package` | Get metadata for a Python package on PyPI (the Python Package Index). Returns the latest version, summary, author, license, project URLs, required Python version, keywords, classifiers, and the release artifact files that `pip install` would download. Pass the exact pip package name (e.g. "requests", "numpy"). |
| `get_package_version` | Get metadata for a specific version of a Python package on PyPI. Returns the summary, required Python version, the full dependency list (requires_dist, i.e. what pip would resolve), and the downloadable files for that version. Use to inspect a pinned release like requests 2.31.0. |
| `list_releases` | List all published version strings for a Python package on PyPI, sorted, plus the latest version. Useful to see a package's release history or check which versions are available to pip install. |
| `get_download_stats` | Get recent download counts for a Python package (last day, last week, last month) from pypistats.org. Gauges how popular a pip package is. |

## Quick Start

Add to your MCP client (Claude Desktop, Cursor, Windsurf, etc.):

```json
{
  "mcpServers": {
    "pypi": {
      "url": "https://gateway.pipeworx.io/pypi/mcp"
    }
  }
}
```

Or connect to the full Pipeworx gateway for access to all 1394+ data sources:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English:

```
ask_pipeworx({ question: "your question about Pypi data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
