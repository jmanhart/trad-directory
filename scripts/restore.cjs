#!/usr/bin/env node

/**
 * Restore script for trad-directory database from JSON backups.
 *
 * Usage:
 *   node scripts/restore.cjs                     # Dry-run, show what would happen
 *   node scripts/restore.cjs --execute           # Actually restore all tables
 *   node scripts/restore.cjs --table artists     # Restore single table (dry-run)
 *   node scripts/restore.cjs --table artists --execute  # Restore single table
 *   node scripts/restore.cjs --dir /path/to/backups     # Custom backup directory
 */

const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

require("dotenv").config();

// FK-safe order: insert in this order, delete in reverse
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

const SEQUENCE_TABLES = {
  countries: "countries_id_seq",
  states: "states_id_seq",
  cities: "cities_id_seq",
  tattoo_shops: "tattoo_shops_id_seq",
  artists: "artists_id_seq",
  submissions: "submissions_id_seq",
  profiles: "profiles_id_seq",
};

async function main() {
  const args = process.argv.slice(2);
  const execute = args.includes("--execute");
  const tableIndex = args.indexOf("--table");
  const singleTable = tableIndex !== -1 ? args[tableIndex + 1] : null;
  const dirIndex = args.indexOf("--dir");
  const backupDir = dirIndex !== -1 ? args[dirIndex + 1] : path.join(process.cwd(), "backups");

  if (singleTable && !TABLES.includes(singleTable)) {
    console.error(`Unknown table: ${singleTable}`);
    console.error(`Valid tables: ${TABLES.join(", ")}`);
    process.exit(1);
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error("Missing SUPABASE_URL and/or SUPABASE_SERVICE_KEY in .env");
    process.exit(1);
  }

  // Validate backup directory
  const dataDir = path.join(backupDir, "data");
  const manifestPath = path.join(backupDir, "manifest.json");

  if (!fs.existsSync(dataDir)) {
    console.error(`Backup data directory not found: ${dataDir}`);
    console.error("Run 'node scripts/backup.cjs' first to create a backup.");
    process.exit(1);
  }

  // Load manifest
  let manifest = null;
  if (fs.existsSync(manifestPath)) {
    manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
    console.log(`Backup from: ${manifest.timestamp}`);
    console.log(`Total rows in backup: ${manifest.totalRows}\n`);
  }

  const tablesToRestore = singleTable ? [singleTable] : TABLES;
  const tablesToDelete = [...tablesToRestore].reverse();

  // Load all backup data first
  const backupData = {};
  for (const table of tablesToRestore) {
    const filePath = path.join(dataDir, `${table}.json`);
    if (!fs.existsSync(filePath)) {
      console.warn(`  Skipping ${table}: no backup file found`);
      continue;
    }

    const rows = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    backupData[table] = rows;

    // Validate against manifest
    if (manifest && manifest.tables[table] !== undefined) {
      const expected = manifest.tables[table];
      if (rows.length !== expected) {
        console.warn(
          `  WARNING: ${table} has ${rows.length} rows but manifest says ${expected}`
        );
      }
    }
  }

  if (!execute) {
    console.log("=== DRY RUN (pass --execute to actually restore) ===\n");

    console.log("Tables to delete (reverse FK order):");
    for (const table of tablesToDelete) {
      if (backupData[table]) {
        console.log(`  DELETE FROM ${table}`);
      }
    }

    console.log("\nTables to insert (FK order):");
    for (const table of tablesToRestore) {
      if (backupData[table]) {
        console.log(`  INSERT INTO ${table}: ${backupData[table].length} rows`);
      }
    }

    console.log("\nSequences to reset:");
    for (const table of tablesToRestore) {
      if (backupData[table] && SEQUENCE_TABLES[table]) {
        const maxId = Math.max(
          0,
          ...backupData[table].map(r => r.id || 0)
        );
        console.log(`  ${SEQUENCE_TABLES[table]} -> ${maxId}`);
      }
    }

    console.log("\nRun with --execute to perform the restore.");
    return;
  }

  // Safety confirmation
  console.log("=== EXECUTING RESTORE ===\n");
  console.log(
    "WARNING: This will DELETE existing data and replace it with backup data."
  );
  console.log("Press Ctrl+C within 5 seconds to cancel...\n");
  await new Promise(resolve => setTimeout(resolve, 5000));

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Phase 1: Delete in reverse FK order
  console.log("Phase 1: Deleting existing data...");
  for (const table of tablesToDelete) {
    if (!backupData[table]) continue;
    process.stdout.write(`  DELETE FROM ${table}...`);

    const { error } = await supabase.from(table).delete().neq("id", -999999);

    if (error) {
      // Tables without 'id' column (like artist_location, artist_shop)
      const { error: retryError } = await supabase
        .from(table)
        .delete()
        .gte("artist_id", 0);

      if (retryError) {
        console.log(` ERROR: ${retryError.message}`);
        console.error("Aborting restore to prevent data loss.");
        process.exit(1);
      }
    }

    console.log(" done");
  }

  // Phase 2: Insert in FK order
  console.log("\nPhase 2: Inserting backup data...");
  for (const table of tablesToRestore) {
    const rows = backupData[table];
    if (!rows) continue;

    process.stdout.write(`  ${table} (${rows.length} rows)...`);

    if (rows.length === 0) {
      console.log(" skipped (empty)");
      continue;
    }

    // Insert in batches of 500
    const batchSize = 500;
    let inserted = 0;

    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      const { error } = await supabase.from(table).insert(batch);

      if (error) {
        console.log(` ERROR at row ${i}: ${error.message}`);
        console.error("Continuing with remaining tables...");
        break;
      }

      inserted += batch.length;
    }

    console.log(` ${inserted} rows inserted`);
  }

  // Phase 3: Reset sequences
  console.log("\nPhase 3: Resetting sequences...");
  for (const table of tablesToRestore) {
    const rows = backupData[table];
    if (!rows || !SEQUENCE_TABLES[table]) continue;

    const maxId = Math.max(0, ...rows.map(r => r.id || 0));
    process.stdout.write(`  ${SEQUENCE_TABLES[table]} -> ${maxId}...`);

    const { error } = await supabase.rpc("setval_sequence", {
      seq_name: SEQUENCE_TABLES[table],
      seq_value: maxId,
    });

    if (error) {
      // Fallback: use raw SQL if RPC doesn't exist
      console.log(
        ` NOTE: Run manually: SELECT setval('${SEQUENCE_TABLES[table]}', ${maxId});`
      );
    } else {
      console.log(" done");
    }
  }

  // Verify
  console.log("\nPhase 4: Verifying...");
  for (const table of tablesToRestore) {
    if (!backupData[table]) continue;

    const { count, error } = await supabase
      .from(table)
      .select("*", { count: "exact", head: true });

    const expected = backupData[table].length;
    const actual = count || 0;
    const status = actual === expected ? "OK" : "MISMATCH";

    console.log(
      `  ${table}: ${actual} rows (expected ${expected}) ${status}`
    );
  }

  console.log("\nRestore complete.");
}

main().catch(err => {
  console.error("Restore failed:", err);
  process.exit(1);
});
