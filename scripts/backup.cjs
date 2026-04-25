#!/usr/bin/env node

/**
 * Local backup script for trad-directory database.
 * Exports tables as JSON, generates restore.sql, writes manifest.json.
 *
 * Usage:
 *   node scripts/backup.cjs              # Export to local backups/ dir
 *   node scripts/backup.cjs --push       # Export and push to GitHub backup repo
 *   node scripts/backup.cjs --dir /path  # Custom output directory
 */

const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

require("dotenv").config();

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

// Columns that are auto-generated and need sequence resets
const SEQUENCE_TABLES = {
  countries: "countries_id_seq",
  states: "states_id_seq",
  cities: "cities_id_seq",
  tattoo_shops: "tattoo_shops_id_seq",
  artists: "artists_id_seq",
  submissions: "submissions_id_seq",
  profiles: "profiles_id_seq",
};

async function fetchAllRows(supabase, table) {
  const rows = [];
  let offset = 0;
  const pageSize = 1000;

  while (true) {
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .range(offset, offset + pageSize - 1)
      .order("id", { ascending: true });

    if (error) {
      // Some tables (like artist_location) may not have an 'id' column
      if (error.message && error.message.includes("id")) {
        const { data: allData, error: retryError } = await supabase
          .from(table)
          .select("*")
          .range(offset, offset + pageSize - 1);
        if (retryError) throw new Error(`Failed to fetch ${table}: ${retryError.message}`);
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

function escapeSQL(value) {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "boolean") return value ? "TRUE" : "FALSE";
  if (typeof value === "number") return String(value);
  if (value instanceof Date) return `'${value.toISOString()}'`;
  if (typeof value === "object") {
    return `'${JSON.stringify(value).replace(/'/g, "''")}'::jsonb`;
  }
  return `'${String(value).replace(/'/g, "''")}'`;
}

function generateInsertSQL(table, rows) {
  if (rows.length === 0) return `-- ${table}: no rows\n`;

  const columns = Object.keys(rows[0]);
  const lines = [`-- ${table}: ${rows.length} rows`];

  for (const row of rows) {
    const values = columns.map(col => escapeSQL(row[col]));
    lines.push(
      `INSERT INTO ${table} (${columns.join(", ")}) VALUES (${values.join(", ")}) ON CONFLICT DO NOTHING;`
    );
  }

  // Reset sequence if applicable
  if (SEQUENCE_TABLES[table]) {
    lines.push(
      `SELECT setval('${SEQUENCE_TABLES[table]}', (SELECT COALESCE(MAX(id), 0) FROM ${table}));`
    );
  }

  lines.push("");
  return lines.join("\n");
}

async function main() {
  const args = process.argv.slice(2);
  const shouldPush = args.includes("--push");
  const dirIndex = args.indexOf("--dir");
  const backupDir = dirIndex !== -1 ? args[dirIndex + 1] : path.join(process.cwd(), "backups");

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error("Missing SUPABASE_URL and/or SUPABASE_SERVICE_KEY in .env");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Create output directories
  const dataDir = path.join(backupDir, "data");
  fs.mkdirSync(dataDir, { recursive: true });

  console.log(`Backing up to ${backupDir}\n`);

  const manifest = {
    timestamp: new Date().toISOString(),
    tables: {},
    totalRows: 0,
  };

  let restoreSQL = [
    "-- Trad Directory Database Restore",
    `-- Generated: ${new Date().toISOString()}`,
    "-- Apply in Supabase SQL Editor",
    "",
    "BEGIN;",
    "",
  ];

  // Export each table
  for (const table of TABLES) {
    process.stdout.write(`  ${table}...`);

    try {
      const rows = await fetchAllRows(supabase, table);

      // Write JSON
      fs.writeFileSync(
        path.join(dataDir, `${table}.json`),
        JSON.stringify(rows, null, 2) + "\n"
      );

      // Add to restore SQL
      restoreSQL.push(generateInsertSQL(table, rows));

      manifest.tables[table] = rows.length;
      manifest.totalRows += rows.length;

      console.log(` ${rows.length} rows`);
    } catch (err) {
      console.log(` ERROR: ${err.message}`);
      manifest.tables[table] = { error: err.message };
    }
  }

  restoreSQL.push("COMMIT;");
  restoreSQL.push("");

  // Write restore.sql
  fs.writeFileSync(path.join(backupDir, "restore.sql"), restoreSQL.join("\n"));

  // Write manifest
  fs.writeFileSync(
    path.join(backupDir, "manifest.json"),
    JSON.stringify(manifest, null, 2) + "\n"
  );

  console.log(`\nTotal: ${manifest.totalRows} rows across ${TABLES.length} tables`);
  console.log(`Output: ${backupDir}`);

  // Push to GitHub backup repo
  if (shouldPush) {
    const backupRepo = process.env.BACKUP_REPO;
    const githubToken = process.env.BACKUP_GITHUB_TOKEN;

    if (!backupRepo || !githubToken) {
      console.error("\nMissing BACKUP_REPO or BACKUP_GITHUB_TOKEN in .env");
      process.exit(1);
    }

    console.log(`\nPushing to ${backupRepo}...`);

    try {
      const repoDir = path.join(
        require("os").tmpdir(),
        "trad-directory-backup-push"
      );

      // Clone or pull
      if (fs.existsSync(repoDir)) {
        execSync("git pull --ff-only", { cwd: repoDir, stdio: "pipe" });
      } else {
        execSync(
          `git clone https://x-access-token:${githubToken}@github.com/${backupRepo}.git ${repoDir}`,
          { stdio: "pipe" }
        );
      }

      // Copy backup files
      const targetDataDir = path.join(repoDir, "data");
      fs.mkdirSync(targetDataDir, { recursive: true });

      for (const file of fs.readdirSync(dataDir)) {
        fs.copyFileSync(
          path.join(dataDir, file),
          path.join(targetDataDir, file)
        );
      }
      fs.copyFileSync(
        path.join(backupDir, "restore.sql"),
        path.join(repoDir, "restore.sql")
      );
      fs.copyFileSync(
        path.join(backupDir, "manifest.json"),
        path.join(repoDir, "manifest.json")
      );

      // Commit and push
      execSync("git add -A", { cwd: repoDir, stdio: "pipe" });

      const tableSummary = Object.entries(manifest.tables)
        .filter(([, v]) => typeof v === "number")
        .map(([t, c]) => `${t}: ${c}`)
        .join(", ");

      const commitMsg = `Backup ${new Date().toISOString().slice(0, 16)}Z — ${manifest.totalRows} rows (${tableSummary})`;

      try {
        execSync(`git commit -m "${commitMsg}"`, {
          cwd: repoDir,
          stdio: "pipe",
        });
        execSync("git push", { cwd: repoDir, stdio: "pipe" });
        console.log("Pushed successfully.");
      } catch (e) {
        if (e.stderr && e.stderr.toString().includes("nothing to commit")) {
          console.log("No changes to push (backup identical to last).");
        } else {
          throw e;
        }
      }
    } catch (err) {
      console.error(`Push failed: ${err.message}`);
      process.exit(1);
    }
  }
}

main().catch(err => {
  console.error("Backup failed:", err);
  process.exit(1);
});
