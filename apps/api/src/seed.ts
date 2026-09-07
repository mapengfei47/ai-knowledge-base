import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { hash } from 'bcryptjs';
import { PrismaClient } from './generated/prisma/client';

async function seed() {
  const { DATABASE_URL, ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME } = process.env;
  if (!DATABASE_URL || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
    throw new Error('DATABASE_URL, ADMIN_EMAIL, and ADMIN_PASSWORD are required for seeding');
  }
  if (ADMIN_PASSWORD.length < 10) {
    throw new Error('ADMIN_PASSWORD must contain at least 10 characters');
  }

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: DATABASE_URL }),
  });

  try {
    const passwordHash = await hash(ADMIN_PASSWORD, 12);
    const user = await prisma.user.upsert({
      where: { email: ADMIN_EMAIL.toLowerCase() },
      update: { name: ADMIN_NAME ?? 'Demo Admin', passwordHash },
      create: {
        email: ADMIN_EMAIL.toLowerCase(),
        name: ADMIN_NAME ?? 'Demo Admin',
        passwordHash,
      },
    });
    console.log(`Seeded administrator: ${user.email}`);
  } finally {
    await prisma.$disconnect();
  }
}

void seed();
