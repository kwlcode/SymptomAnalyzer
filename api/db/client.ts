import { env } from '../env';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../db/tables';

const sql = neon(env.DATABASE_URL!);
export const db = drizzle(sql as any, { schema });
