# mcp-pypi

PyPI MCP — wraps the Python Package Index (PyPI) JSON API (free, no auth).

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1476+ live data sources.

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

### What this endpoint actually serves

`tools/list` at `https://gateway.pipeworx.io/pypi/mcp` returns the tools in the table
above **plus the shared Pipeworx meta-tools** — `ask_pipeworx`,
`discover_tools`, `search_within`, `remember`/`recall` and the rest of the
gateway-wide set. So the tool count you see is larger than this table: a
single-pack endpoint currently lists roughly 30 shared tools alongside the
pack's own. The connection's `initialize` response states its exact scope, and
is the authoritative answer for a given day.

This is deliberate, not multiplexing by accident. The meta-tools are what let a
scoped connection answer a question this pack does not cover — via
`ask_pipeworx`, which routes across the whole catalog — without you adding a
second MCP server. There is currently no way to mount a pack endpoint without
them; if the extra schemas cost you more context than the routing is worth,
connect to the full gateway once rather than to several pack endpoints.

Or connect to the full Pipeworx gateway to get every pack's tools listed
directly, instead of just this one's:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

Both URLs reach the same gateway and the same 1476+ data sources. The
only difference is which pack's tools are listed **directly**; `ask_pipeworx`
reaches all of them from either one.

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English —
this works on the pack endpoint above as well as on the full gateway:

```
ask_pipeworx({ question: "your question about Pypi data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
