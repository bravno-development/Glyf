import { pool } from "../src/config/database.ts";

const MIGRATIONS_DIR = new URL(".", import.meta.url).pathname;

async function run() {
  const client = await pool.connect();

  try {
    // Create migrations tracking table if it doesn't exist
    await client.queryObject(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        applied_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Get already-applied migrations
    const applied = await client.queryObject<{ name: string }>(
      "SELECT name FROM _migrations ORDER BY name"
    );
    const appliedNames = new Set(applied.rows.map((r) => r.name));

    // Read all .sql files from the migrations directory
    const entries: Deno.DirEntry[] = [];
    for await (const entry of Deno.readDir(MIGRATIONS_DIR)) {
      if (entry.isFile && entry.name.endsWith(".sql")) {
        entries.push(entry);
      }
    }
    entries.sort((a, b) => a.name.localeCompare(b.name));

    let count = 0;
    for (const entry of entries) {
      if (appliedNames.has(entry.name)) {
        console.log(`  skip: ${entry.name} (already applied)`);
        continue;
      }

      const sql = await Deno.readTextFile(`${MIGRATIONS_DIR}${entry.name}`);

      await client.queryObject("BEGIN");
      try {
        await client.queryObject(sql);
        await client.queryObject(
          "INSERT INTO _migrations (name) VALUES ($1)",
          [entry.name]
        );
        await client.queryObject("COMMIT");
        console.log(`  done: ${entry.name}`);
        count++;
      } catch (err) {
        await client.queryObject("ROLLBACK");
        console.error(`  FAIL: ${entry.name}`, err);
        Deno.exit(1);
      }
    }

    if (count === 0) {
      console.log("All migrations already applied.");
    } else {
      console.log(`Applied ${count} migration(s).`);
    }
  } finally {
    client.release();
    await pool.end();
  }
}

run();
