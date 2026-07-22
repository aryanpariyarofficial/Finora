/**
 * Migration runner.
 *
 *   node scripts/migrate.js            apply pending migrations
 *   node scripts/migrate.js --status   list applied / pending
 *   node scripts/migrate.js --baseline mark all current files as applied
 *                                      (use once, when the DB already has them)
 *
 * Tracks applied files in a `schema_migrations` table. Each file runs inside a
 * transaction, so a failure rolls back cleanly.
 */
const fs = require("fs");
const path = require("path");
const { getClient } = require("./db");

const DIR = path.join(__dirname, "..", "supabase", "migrations");

async function ensureTable(c) {
  await c.query(`
    create table if not exists public.schema_migrations (
      filename text primary key,
      applied_at timestamptz not null default now()
    )
  `);
}

function migrationFiles() {
  return fs
    .readdirSync(DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();
}

(async () => {
  const mode = process.argv[2];
  const c = getClient();
  await c.connect();
  await ensureTable(c);

  const { rows } = await c.query("select filename from public.schema_migrations");
  const applied = new Set(rows.map((r) => r.filename));
  const files = migrationFiles();
  const pending = files.filter((f) => !applied.has(f));

  if (mode === "--status") {
    for (const f of files) {
      console.log(`${applied.has(f) ? "✅" : "⬜"} ${f}`);
    }
    console.log(`\n${pending.length} pending`);
    await c.end();
    return;
  }

  if (mode === "--baseline") {
    for (const f of pending) {
      await c.query(
        "insert into public.schema_migrations (filename) values ($1) on conflict do nothing",
        [f],
      );
      console.log(`marked applied (not run): ${f}`);
    }
    await c.end();
    return;
  }

  if (pending.length === 0) {
    console.log("Nothing to apply — database is up to date.");
    await c.end();
    return;
  }

  for (const f of pending) {
    const sql = fs.readFileSync(path.join(DIR, f), "utf8");
    process.stdout.write(`applying ${f} ... `);
    try {
      await c.query("begin");
      await c.query(sql);
      await c.query(
        "insert into public.schema_migrations (filename) values ($1)",
        [f],
      );
      await c.query("commit");
      console.log("✅");
    } catch (e) {
      await c.query("rollback");
      console.log("❌");
      console.error(`\n${f} failed:\n${e.message}\n`);
      await c.end();
      process.exit(1);
    }
  }

  console.log(`\nDone — ${pending.length} migration(s) applied.`);
  await c.end();
})().catch((e) => {
  console.error("FAILED:", e.message);
  process.exit(1);
});
