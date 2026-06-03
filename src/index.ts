interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

interface McpToolExport {
  tools: McpToolDefinition[];
  callTool: (name: string, args: Record<string, unknown>) => Promise<unknown>;
  meter?: { credits: number };
  cost?: Record<string, unknown>;
  provider?: string;
}

/**
 * PyPI MCP — wraps the Python Package Index (PyPI) JSON API (free, no auth).
 *
 * Look up Python packages on PyPI: metadata, versions, dependencies, release
 * artifacts (the files `pip install` downloads), and download statistics.
 *
 * Tools:
 * - get_package          — metadata for a Python package's latest release
 * - get_package_version  — metadata + dependencies for a specific version
 * - list_releases        — all published version strings for a package
 * - get_download_stats   — recent download counts (via pypistats.org)
 */


const BASE = 'https://pypi.org';
const STATS_BASE = 'https://pypistats.org';
const UA = 'pipeworx/1.0 (+https://pipeworx.io)';

interface PypiUrl {
  filename: string;
  size: number;
  packagetype: string;
  upload_time_iso_8601: string;
}

interface PypiInfo {
  name: string;
  summary: string | null;
  version: string;
  author: string | null;
  license: string | null;
  home_page: string | null;
  project_urls: Record<string, string> | null;
  requires_python: string | null;
  requires_dist: string[] | null;
  keywords: string | null;
  classifiers: string[] | null;
}

interface PypiResponse {
  info: PypiInfo;
  urls?: PypiUrl[];
  releases: Record<string, unknown[]>;
}

const tools: McpToolExport['tools'] = [
  {
    name: 'get_package',
    description:
      'Get metadata for a Python package on PyPI (the Python Package Index). Returns the latest version, summary, author, license, project URLs, required Python version, keywords, classifiers, and the release artifact files that `pip install` would download. Pass the exact pip package name (e.g. "requests", "numpy").',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Exact PyPI package name, e.g. "requests".' },
      },
      required: ['name'],
    },
  },
  {
    name: 'get_package_version',
    description:
      'Get metadata for a specific version of a Python package on PyPI. Returns the summary, required Python version, the full dependency list (requires_dist, i.e. what pip would resolve), and the downloadable files for that version. Use to inspect a pinned release like requests 2.31.0.',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Exact PyPI package name, e.g. "requests".' },
        version: { type: 'string', description: 'Version string, e.g. "2.31.0".' },
      },
      required: ['name', 'version'],
    },
  },
  {
    name: 'list_releases',
    description:
      'List all published version strings for a Python package on PyPI, sorted, plus the latest version. Useful to see a package\'s release history or check which versions are available to pip install.',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Exact PyPI package name, e.g. "requests".' },
      },
      required: ['name'],
    },
  },
  {
    name: 'get_download_stats',
    description:
      'Get recent download counts for a Python package (last day, last week, last month) from pypistats.org. Gauges how popular a pip package is.',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Exact PyPI package name, e.g. "requests".' },
      },
      required: ['name'],
    },
  },
];

async function pyGet(url: string): Promise<unknown | { error: number; message: string }> {
  const res = await fetch(url, { headers: { Accept: 'application/json', 'User-Agent': UA } });
  if (!res.ok) {
    const text = await res.text().then((t) => t.slice(0, 200)).catch(() => '');
    return { error: res.status, message: text || res.statusText };
  }
  return res.json();
}

function isError(v: unknown): v is { error: number; message: string } {
  return typeof v === 'object' && v !== null && 'error' in v;
}

function reqStr(args: Record<string, unknown>, key: string): string {
  const v = args[key];
  if (typeof v !== 'string' || !v.trim()) {
    throw new Error(`Required argument "${key}" is missing. Pass a string, e.g. "requests".`);
  }
  return v.trim();
}

function mapFiles(urls: PypiUrl[] | undefined) {
  return (urls ?? []).map((u) => ({
    filename: u.filename,
    size: u.size,
    packagetype: u.packagetype,
    upload_time: u.upload_time_iso_8601,
  }));
}

async function callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  switch (name) {
    case 'get_package': {
      const pkg = reqStr(args, 'name');
      const data = await pyGet(`${BASE}/pypi/${encodeURIComponent(pkg)}/json`);
      if (isError(data)) return data;
      const { info, urls } = data as PypiResponse;
      return {
        name: info.name,
        summary: info.summary,
        version: info.version,
        author: info.author,
        license: info.license,
        home_page: info.home_page,
        project_urls: info.project_urls,
        requires_python: info.requires_python,
        keywords: info.keywords,
        classifiers: (info.classifiers ?? []).slice(0, 15),
        latest_release_files: mapFiles(urls),
      };
    }
    case 'get_package_version': {
      const pkg = reqStr(args, 'name');
      const version = reqStr(args, 'version');
      const data = await pyGet(
        `${BASE}/pypi/${encodeURIComponent(pkg)}/${encodeURIComponent(version)}/json`,
      );
      if (isError(data)) return data;
      const { info, urls } = data as PypiResponse;
      return {
        name: info.name,
        version: info.version,
        summary: info.summary,
        requires_python: info.requires_python,
        requires_dist: info.requires_dist,
        files: mapFiles(urls),
      };
    }
    case 'list_releases': {
      const pkg = reqStr(args, 'name');
      const data = await pyGet(`${BASE}/pypi/${encodeURIComponent(pkg)}/json`);
      if (isError(data)) return data;
      const { info, releases } = data as PypiResponse;
      let versions = Object.keys(releases).sort();
      if (versions.length > 100) versions = versions.slice(-100);
      return { name: info.name, latest: info.version, releases: versions };
    }
    case 'get_download_stats': {
      const pkg = reqStr(args, 'name');
      const data = await pyGet(`${STATS_BASE}/api/packages/${encodeURIComponent(pkg)}/recent`);
      if (isError(data)) return data;
      const d = data as { data: { last_day: number; last_week: number; last_month: number } };
      return {
        name: pkg,
        last_day: d.data.last_day,
        last_week: d.data.last_week,
        last_month: d.data.last_month,
      };
    }
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

export default { tools, callTool, meter: { credits: 1 } } satisfies McpToolExport;
