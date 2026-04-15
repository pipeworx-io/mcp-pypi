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
}

/**
 * PyPI MCP — wraps the PyPI JSON API (free, no auth)
 *
 * Tools:
 * - search_packages: look up a package by name (PyPI has no keyword search API;
 *   this resolves the exact name via /pypi/{name}/json)
 * - get_package: fetch metadata for a specific package
 * - get_release: fetch metadata for a specific package version
 */


const BASE = 'https://pypi.org';

const tools: McpToolExport['tools'] = [
  {
    name: 'search_packages',
    description:
      'Look up a PyPI package by exact name. Returns the latest version, summary, author, license, and project URLs. Note: PyPI does not expose a keyword search API; use the exact package name.',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Exact PyPI package name (e.g., "requests", "numpy")',
        },
      },
      required: ['name'],
    },
  },
  {
    name: 'get_package',
    description:
      'Get full metadata for a PyPI package: latest version, summary, author, license, requires_python, project_urls, and recent release list.',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'PyPI package name',
        },
      },
      required: ['name'],
    },
  },
  {
    name: 'get_release',
    description:
      'Get metadata for a specific version of a PyPI package, including requires_python, upload time, and download URLs.',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'PyPI package name',
        },
        version: {
          type: 'string',
          description: 'Version string (e.g., "2.28.2")',
        },
      },
      required: ['name', 'version'],
    },
  },
];

async function pypiGet(path: string): Promise<unknown> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) {
    if (res.status === 404) throw new Error(`Package not found: ${path}`);
    throw new Error(`PyPI API error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

function formatPackageInfo(data: {
  info: {
    name: string;
    version: string;
    summary: string | null;
    author: string | null;
    author_email: string | null;
    license: string | null;
    requires_python: string | null;
    home_page: string | null;
    project_urls: Record<string, string> | null;
    classifiers: string[];
    keywords: string | null;
  };
  releases: Record<string, unknown[]>;
  urls: { filename: string; upload_time: string; url: string; packagetype: string }[];
}) {
  const { info } = data;
  const recentVersions = Object.keys(data.releases)
    .filter((v) => data.releases[v].length > 0)
    .slice(-10)
    .reverse();

  return {
    name: info.name,
    version: info.version,
    summary: info.summary ?? null,
    author: info.author ?? null,
    author_email: info.author_email ?? null,
    license: info.license ?? null,
    requires_python: info.requires_python ?? null,
    home_page: info.home_page ?? null,
    project_urls: info.project_urls ?? {},
    keywords: info.keywords ?? null,
    recent_versions: recentVersions,
    latest_files: data.urls.map((u) => ({
      filename: u.filename,
      packagetype: u.packagetype,
      upload_time: u.upload_time,
      url: u.url,
    })),
  };
}

async function searchPackages(name: string) {
  const data = (await pypiGet(`/pypi/${encodeURIComponent(name)}/json`)) as Parameters<
    typeof formatPackageInfo
  >[0];
  return formatPackageInfo(data);
}

async function getPackage(name: string) {
  const data = (await pypiGet(`/pypi/${encodeURIComponent(name)}/json`)) as Parameters<
    typeof formatPackageInfo
  >[0];
  return formatPackageInfo(data);
}

async function getRelease(name: string, version: string) {
  const data = (await pypiGet(
    `/pypi/${encodeURIComponent(name)}/${encodeURIComponent(version)}/json`,
  )) as {
    info: {
      name: string;
      version: string;
      summary: string | null;
      author: string | null;
      license: string | null;
      requires_python: string | null;
      requires_dist: string[] | null;
    };
    urls: {
      filename: string;
      packagetype: string;
      upload_time: string;
      size: number;
      url: string;
      digests: { sha256: string };
    }[];
  };

  return {
    name: data.info.name,
    version: data.info.version,
    summary: data.info.summary ?? null,
    author: data.info.author ?? null,
    license: data.info.license ?? null,
    requires_python: data.info.requires_python ?? null,
    requires_dist: data.info.requires_dist ?? [],
    files: data.urls.map((u) => ({
      filename: u.filename,
      packagetype: u.packagetype,
      upload_time: u.upload_time,
      size: u.size,
      url: u.url,
      sha256: u.digests.sha256,
    })),
  };
}

async function callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  switch (name) {
    case 'search_packages':
      return searchPackages(args.name as string);
    case 'get_package':
      return getPackage(args.name as string);
    case 'get_release':
      return getRelease(args.name as string, args.version as string);
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

export default { tools, callTool } satisfies McpToolExport;
