import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './src/db/schema';

async function main() {
  const connectionString = 'postgres://postgres:Quang123%40@localhost:5432/flow_db';
  const pool = new Pool({ connectionString });
  const db = drizzle(pool, { schema });
  
  console.log('Seeding mock user...');
  try {
    await db.insert(schema.users).values({
      id: 1,
      username: 'testuser',
      passwordHash: 'hash',
    });
    console.log('Done!');
  } catch (e: any) {
    console.log('User might already exist or error:', e.message);
  }
  process.exit(0);
}
main();
