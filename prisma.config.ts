import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'pnpm --filter @akb/api seed',
  },
  // Prisma 7 keeps connection details outside the schema so secrets never enter generated code.
  datasource: {
    url: env('DATABASE_URL'),
  },
});
