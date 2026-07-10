import postgres from 'postgres';

async function main() {
  const sql = postgres(process.env.DATABASE_URL as string);

  const setting = await sql`
    SELECT key, value FROM admin_settings WHERE key = 'vote_cast_points'
  `;
  console.log('Setting:', setting);

  const txns = await sql`
    SELECT id, type, amount, note, created_at
    FROM point_transactions
    WHERE type = 'vote_cast'
    ORDER BY created_at DESC
    LIMIT 5
  `;
  console.log('Transactions:', txns);

  await sql.end();
}

main().catch(console.error);
