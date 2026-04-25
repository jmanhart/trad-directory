import { createClient } from "@supabase/supabase-js";
import * as Sentry from "@sentry/node";

export const config = { maxDuration: 60 };

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV || "production",
});

const TABLES = [
  "countries",
  "states",
  "cities",
  "tattoo_shops",
  "artists",
  "artist_location",
  "artist_shop",
  "submissions",
  "profiles",
  "saved_artists",
];

const SEQUENCE_TABLES: Record<string, string> = {
  countries: "countries_id_seq",
  states: "states_id_seq",
  cities: "cities_id_seq",
  tattoo_shops: "tattoo_shops_id_seq",
  artists: "artists_id_seq",
  submissions: "submissions_id_seq",
  profiles: "profiles_id_seq",
};

function escapeSQL(value: unknown): string {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "boolean") return value ? "TRUE" : "FALSE";
  if (typeof value === "number") return String(value);
  if (value instanceof Date) return `'${value.toISOString()}'`;
  if (typeof value === "object") {
    return `'${JSON.stringify(value).replace(/'/g, "''")}'::jsonb`;
  }
  return `'${String(value).replace(/'/g, "''")}'`;
}

function generateInsertSQL(
  table: string,
  rows: Record<string, unknown>[]
): string {
  if (rows.length === 0) return `-- ${table}: no rows\n`;

  const columns = Object.keys(rows[0]);
  const lines = [`-- ${table}: ${rows.length} rows`];

  for (const row of rows) {
    const values = columns.map(col => escapeSQL(row[col]));
    lines.push(
      `INSERT INTO ${table} (${columns.join(", ")}) VALUES (${values.join(", ")}) ON CONFLICT DO NOTHING;`
    );
  }

  if (SEQUENCE_TABLES[table]) {
    lines.push(
      `SELECT setval('${SEQUENCE_TABLES[table]}', (SELECT COALESCE(MAX(id), 0) FROM ${table}));`
    );
  }

  lines.push("");
  return lines.join("\n");
}

async function fetchAllRows(
  supabase: any,
  table: string
): Promise<Record<string, unknown>[]> {
  const rows: Record<string, unknown>[] = [];
  let offset = 0;
  const pageSize = 1000;

  while (true) {
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .range(offset, offset + pageSize - 1)
      .order("id", { ascending: true });

    if (error) {
      if (error.message && error.message.includes("id")) {
        const { data: allData, error: retryError } = await supabase
          .from(table)
          .select("*")
          .range(offset, offset + pageSize - 1);
        if (retryError)
          throw new Error(`Failed to fetch ${table}: ${retryError.message}`);
        if (!allData || allData.length === 0) break;
        rows.push(...allData);
        if (allData.length < pageSize) break;
        offset += pageSize;
        continue;
      }
      throw new Error(`Failed to fetch ${table}: ${error.message}`);
    }

    if (!data || data.length === 0) break;
    rows.push(...data);
    if (data.length < pageSize) break;
    offset += pageSize;
  }

  return rows;
}

async function pushToGitHub(
  files: Record<string, string>,
  manifest: Record<string, unknown>,
  token: string,
  repo: string
): Promise<void> {
  const baseUrl = `https://api.github.com/repos/${repo}`;
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "Content-Type": "application/json",
    "X-GitHub-Api-Version": "2022-11-28",
  };

  // Get the default branch ref
  const refRes = await fetch(`${baseUrl}/git/ref/heads/main`, { headers });
  if (!refRes.ok) {
    throw new Error(`Failed to get ref: ${refRes.status} ${await refRes.text()}`);
  }
  const refData = (await refRes.json()) as { object: { sha: string } };
  const parentSha = refData.object.sha;

  // Get the parent commit's tree
  const commitRes = await fetch(`${baseUrl}/git/commits/${parentSha}`, {
    headers,
  });
  if (!commitRes.ok) {
    throw new Error(`Failed to get commit: ${commitRes.status}`);
  }
  const commitData = (await commitRes.json()) as { tree: { sha: string } };
  const baseTreeSha = commitData.tree.sha;

  // Create blobs for each file
  const treeItems: {
    path: string;
    mode: string;
    type: string;
    sha: string;
  }[] = [];

  for (const [filePath, content] of Object.entries(files)) {
    const blobRes = await fetch(`${baseUrl}/git/blobs`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        content: Buffer.from(content).toString("base64"),
        encoding: "base64",
      }),
    });

    if (!blobRes.ok) {
      throw new Error(
        `Failed to create blob for ${filePath}: ${blobRes.status}`
      );
    }

    const blobData = (await blobRes.json()) as { sha: string };
    treeItems.push({
      path: filePath,
      mode: "100644",
      type: "blob",
      sha: blobData.sha,
    });
  }

  // Create tree
  const treeRes = await fetch(`${baseUrl}/git/trees`, {
    method: "POST",
    headers,
    body: JSON.stringify({ base_tree: baseTreeSha, tree: treeItems }),
  });

  if (!treeRes.ok) {
    throw new Error(`Failed to create tree: ${treeRes.status}`);
  }

  const treeData = (await treeRes.json()) as { sha: string };

  // Create commit
  const tableSummary = Object.entries(
    manifest.tables as Record<string, number>
  )
    .filter(([, v]) => typeof v === "number")
    .map(([t, c]) => `${t}: ${c}`)
    .join(", ");

  const commitMessage = `Backup ${new Date().toISOString().slice(0, 16)}Z — ${manifest.totalRows} rows (${tableSummary})`;

  const newCommitRes = await fetch(`${baseUrl}/git/commits`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      message: commitMessage,
      tree: treeData.sha,
      parents: [parentSha],
    }),
  });

  if (!newCommitRes.ok) {
    throw new Error(`Failed to create commit: ${newCommitRes.status}`);
  }

  const newCommitData = (await newCommitRes.json()) as { sha: string };

  // Update ref
  const updateRefRes = await fetch(`${baseUrl}/git/refs/heads/main`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ sha: newCommitData.sha }),
  });

  if (!updateRefRes.ok) {
    throw new Error(`Failed to update ref: ${updateRefRes.status}`);
  }
}

export default async function handler(req: any, res: any) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  // Verify CRON_SECRET
  const authHeader = req.headers["authorization"];
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    res.status(500).json({ error: "Server configuration error" });
    return;
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const checkInId = Sentry.captureCheckIn(
    { monitorSlug: "database-backup", status: "in_progress" },
    {
      schedule: { type: "crontab", value: "0 7 * * 0" },
      checkinMargin: 5,
      maxRuntime: 5,
      timezone: "Etc/UTC",
    }
  );

  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
    const githubToken = process.env.BACKUP_GITHUB_TOKEN;
    const backupRepo = process.env.BACKUP_REPO;

    if (!supabaseUrl || !supabaseKey) {
      res.status(500).json({ error: "Missing Supabase config" });
      return;
    }

    if (!githubToken || !backupRepo) {
      res.status(500).json({ error: "Missing backup repo config" });
      return;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const manifest: Record<string, unknown> = {
      timestamp: new Date().toISOString(),
      tables: {} as Record<string, number>,
      totalRows: 0,
    };

    const files: Record<string, string> = {};
    const restoreLines = [
      "-- Trad Directory Database Restore",
      `-- Generated: ${new Date().toISOString()}`,
      "-- Apply in Supabase SQL Editor",
      "",
      "BEGIN;",
      "",
    ];

    for (const table of TABLES) {
      const rows = await fetchAllRows(supabase, table);

      files[`data/${table}.json`] = JSON.stringify(rows, null, 2) + "\n";
      restoreLines.push(generateInsertSQL(table, rows));

      (manifest.tables as Record<string, number>)[table] = rows.length;
      (manifest.totalRows as number) += rows.length;
    }

    // Fix totalRows type
    manifest.totalRows = TABLES.reduce(
      (sum, t) => sum + ((manifest.tables as Record<string, number>)[t] || 0),
      0
    );

    restoreLines.push("COMMIT;");
    restoreLines.push("");

    files["restore.sql"] = restoreLines.join("\n");
    files["manifest.json"] = JSON.stringify(manifest, null, 2) + "\n";

    // Push to GitHub
    await pushToGitHub(files, manifest, githubToken, backupRepo);

    Sentry.captureCheckIn({
      checkInId,
      monitorSlug: "database-backup",
      status: "ok",
    });
    await Sentry.flush(5000);

    res.status(200).json({
      success: true,
      timestamp: manifest.timestamp,
      totalRows: manifest.totalRows,
      tables: manifest.tables,
    });
  } catch (error: any) {
    Sentry.captureCheckIn({
      checkInId,
      monitorSlug: "database-backup",
      status: "error",
    });
    Sentry.captureException(error);
    await Sentry.flush(5000);

    console.error("Backup failed:", error);
    res.status(500).json({ error: `Backup failed: ${error.message}` });
  }
}
