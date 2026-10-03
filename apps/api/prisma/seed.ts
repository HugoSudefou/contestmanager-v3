import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';

/** Imports the 2019 sheets of the old app (skipped if a contest with the same name exists) and a demo tournament. */
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });

const contests = JSON.parse(readFileSync(new URL('./seed-contests.json', import.meta.url), 'utf8'));
for (const c of contests) {
  if (await prisma.contest.findFirst({ where: { name: c.name } })) continue;
  await prisma.contest.create({ data: c });
  console.log('Concours importé :', c.name);
}

// Demo data only on request: SEED_DEMO=1 npx prisma db seed
if (process.env.SEED_DEMO && (await prisma.tournament.count()) === 0) {
  const [c2, c3] = await Promise.all(contests.map((c: { name: string }) => prisma.contest.findFirstOrThrow({ where: { name: c.name } })));
  const tournament = await prisma.tournament.create({ data: { name: 'Tournoi de démonstration', location: 'Gymnase' } });
  for (const [name, contest] of [['CE1-CE2', c2], ['CM1-CM2', c3]] as const) {
    const group = await prisma.group.create({ data: { name, tournamentId: tournament.id, contestId: contest.id } });
    const teams = await Promise.all(
      ['Les Robotines', 'Bip Bip', 'Mécano Kids', 'Les Circuits'].map((t) =>
        prisma.team.create({ data: { name: `${t} (${name})`, school: 'École Jules Ferry', groupId: group.id } }),
      ),
    );
    for (let i = 0; i < teams.length; i += 2) {
      await prisma.match.create({
        data: {
          groupId: group.id,
          tableNumber: i / 2 + 1,
          scheduledAt: new Date(Date.now() + i * 15 * 60_000),
          participants: { create: [{ teamId: teams[i].id }, { teamId: teams[i + 1].id }] },
        },
      });
    }
  }
  console.log('Tournoi de démonstration créé');
}

await prisma.$disconnect();
