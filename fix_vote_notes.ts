import postgres from 'postgres';

async function main() {
  const sql = postgres(process.env.DATABASE_URL as string);

  // Find all battle_vote_received notes that still contain a raw UUID
  const rows = await sql`
    SELECT id, note
    FROM point_transactions
    WHERE type = 'battle_vote_received'
      AND note LIKE 'Vote by %'
      AND note ~ '^Vote by [0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  `;

  console.log(`Found ${rows.length} rows to backfill`);

  let updated = 0;
  for (const row of rows) {
    const userId = (row.note as string).replace('Vote by ', '').trim();
    const [user] = await sql`
      SELECT username, name FROM users WHERE id = ${userId}::uuid LIMIT 1
    `;
    if (!user) {
      console.log(`  Skip ${row.id} — user ${userId} not found`);
      continue;
    }
    const handle = user.username
      ? `@${user.username}`
      : user.name ?? `user:${userId.slice(0, 8)}`;
    await sql`
      UPDATE point_transactions
      SET note = ${'Vote by ' + handle}
      WHERE id = ${row.id}::uuid
    `;
    updated++;
  }

  console.log(`Updated ${updated} / ${rows.length} rows`);
  await sql.end();
}

main().catch(console.error);
