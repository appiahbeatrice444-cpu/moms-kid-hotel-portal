#!/usr/bin/env node
const path = require("node:path");
const { DatabaseSync } = require("node:sqlite");

const dbPath = process.env.DATABASE_FILE || path.resolve(__dirname, "data/beatrice.sqlite");

let db;
try {
  db = new DatabaseSync(dbPath);
} catch (err) {
  console.error(`Unable to open database at ${dbPath}:`, err.message);
  process.exit(1);
}

const args = process.argv.slice(2);
const firstArg = args[0];

if (!firstArg) {
  // Overview of all tables
  console.log(`\n========================================================`);
  console.log(`  BEATRICE HOTEL SQLite DATABASE MANAGEMENT SYSTEM`);
  console.log(`  File: ${dbPath}`);
  console.log(`========================================================\n`);

  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all();

  console.log("TABLE SUMMARY:");
  console.log("--------------------------------------------------------");
  for (const table of tables) {
    const count = db.prepare(`SELECT COUNT(*) as count FROM "${table.name}"`).get().count;
    console.log(`  • ${table.name.padEnd(26)} : ${count} row(s)`);
  }
  console.log("--------------------------------------------------------\n");
  console.log("Usage tips:");
  console.log("  node view-db.js <tableName>         View all rows in a table (e.g. node view-db.js users)");
  console.log("  node view-db.js \"SELECT ...\"        Execute a custom read-only SQL query\n");
  process.exit(0);
}

// If argument looks like a SELECT query
if (/^\s*SELECT/i.test(firstArg)) {
  try {
    const rows = db.prepare(firstArg).all();
    console.log(`\nQuery: ${firstArg}\n`);
    console.table(rows);
    console.log(`(${rows.length} row(s) returned)\n`);
  } catch (err) {
    console.error("Query error:", err.message);
    process.exit(1);
  }
} else {
  // Treat as table name
  const tableName = firstArg.trim();
  try {
    const tableExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name = ?").get(tableName);
    if (!tableExists) {
      console.error(`Table "${tableName}" does not exist in ${dbPath}.`);
      process.exit(1);
    }
    const columns = db.prepare(`PRAGMA table_info("${tableName}")`).all();
    console.log(`\n========================================================`);
    console.log(`TABLE: ${tableName}`);
    console.log(`Columns: ${columns.map(c => `${c.name} (${c.type})`).join(", ")}`);
    console.log(`========================================================\n`);

    const rows = db.prepare(`SELECT * FROM "${tableName}" LIMIT 100`).all();
    if (rows.length === 0) {
      console.log("(Table is currently empty)");
    } else {
      // Mask password hash/salt for security
      const safe = rows.map(r => {
        const copy = { ...r };
        if (copy.password_hash) copy.password_hash = copy.password_hash.slice(0, 10) + "...";
        if (copy.password_salt) copy.password_salt = copy.password_salt.slice(0, 8) + "...";
        if (copy.token_hash) copy.token_hash = copy.token_hash.slice(0, 8) + "...";
        return copy;
      });
      console.table(safe);
    }
    console.log();
  } catch (err) {
    console.error(`Error querying table ${tableName}:`, err.message);
    process.exit(1);
  }
}
