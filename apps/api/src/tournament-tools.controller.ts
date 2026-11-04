import { BadRequestException, Body, ConflictException, Controller, Param, ParseIntPipe, Post } from '@nestjs/common';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { randomBytes } from 'node:crypto';
import { PrismaService } from './prisma.service.js';
import { hashPassword } from './auth.js';
import { StudentDto } from './events.controller.js';
import { bracketSeeds, qualify, type Ranked } from './bracket.js';
import { compareResults, type Sheet } from '@contest/scoring';

/** One line of the old "ecole-classe-equipe" workbook, already joined by the app. */
class ImportEntryDto {
  @IsString() @IsNotEmpty() school: string;
  /** "Prénom Nom" */
  @IsString() @IsNotEmpty() teacher: string;
  @IsString() @IsNotEmpty() className: string;
  @IsString() level: string;
  /** Team number from the workbook: the team is called "Équipe <team>". */
  @IsString() @IsNotEmpty() team: string;
  @IsArray() @ArrayMaxSize(20) @ValidateNested({ each: true }) @Type(() => StudentDto) students: StudentDto[];
}

class ImportDto {
  @IsArray() @ArrayMinSize(1) @ArrayMaxSize(1000) @ValidateNested({ each: true }) @Type(() => ImportEntryDto)
  entries: ImportEntryDto[];
  /** Contest id for each level found in the workbook. */
  @IsObject() levelContest: Record<string, number>;
}

class FinalsDto {
  @IsInt() contestId: number;
  @IsIn([2, 4, 8, 16]) size: number;
  @IsOptional() @IsDateString() startAt?: string;
  @IsInt() @Min(1) @Max(120) minutesPerRound: number;
}

export const FINALS_GROUP = 'Phase finale';
const ROUND_NAMES: Record<number, string> = { 1: 'Finale', 2: 'Demi-finales', 3: 'Quarts de finale', 4: 'Huitièmes de finale' };

const slug = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');

@Controller('tournaments/:id')
export class TournamentToolsController {
  constructor(private prisma: PrismaService) {}

  /**
   * Registration import (same workbook as the 2018 back office). Idempotent: existing schools, teachers, groups
   * and teams are reused; a team's students are replaced. New teacher accounts get a random password, returned once.
   */
  @Post('import')
  async import(@Param('id', ParseIntPipe) tournamentId: number, @Body() dto: ImportDto) {
    const missing = [...new Set(dto.entries.map((e) => e.level))].filter((l) => !dto.levelContest[l]);
    if (missing.length) throw new BadRequestException(`Choisissez un concours pour le niveau : ${missing.join(', ')}`);
    await this.prisma.tournament.findUniqueOrThrow({ where: { id: tournamentId } });

    const credentials: { name: string; username: string; password: string }[] = [];
    const counts = { teams: 0, students: 0 };

    await this.prisma.$transaction(
      async (tx) => {
        for (const e of dto.entries) {
          const school = await tx.school.upsert({ where: { name: e.school.trim() }, create: { name: e.school.trim() }, update: {} });

          const [firstName, ...rest] = e.teacher.trim().split(/\s+/);
          const username = slug(e.teacher);
          let teacher = await tx.user.findUnique({ where: { username } });
          if (!teacher) {
            const password = randomBytes(6).toString('base64url');
            teacher = await tx.user.create({
              data: { username, firstName, lastName: rest.join(' '), role: 'TEACHER', schoolId: school.id, passwordHash: await hashPassword(password) },
            });
            credentials.push({ name: e.teacher.trim(), username, password });
          }

          const groupName = `${school.name} - ${e.className.trim()} - ${e.teacher.trim()}`;
          const group =
            (await tx.group.findFirst({ where: { tournamentId, name: groupName } })) ??
            (await tx.group.create({ data: { tournamentId, name: groupName, contestId: Number(dto.levelContest[e.level]) } }));

          const teamName = `Équipe ${e.team.trim()}`;
          const data = { schoolId: school.id, teacherId: teacher.id, groupId: group.id };
          const existing = await tx.team.findFirst({ where: { name: teamName, group: { tournamentId } } });
          const team = existing
            ? await tx.team.update({ where: { id: existing.id }, data })
            : await tx.team.create({ data: { name: teamName, ...data } });
          counts.teams++;

          await tx.student.deleteMany({ where: { teamId: team.id } });
          await tx.student.createMany({ data: e.students.map((s) => ({ ...s, teamId: team.id })) });
          counts.students += e.students.length;
        }
      },
      { timeout: 60_000 },
    );
    return { ...counts, credentials };
  }

  /**
   * Final phase: best team of each group playing `contestId`, then the best others, seeded in a bracket.
   * Later rounds are created empty and filled as winners are scored.
   */
  @Post('finals')
  async finals(@Param('id', ParseIntPipe) tournamentId: number, @Body() dto: FinalsDto) {
    if (await this.prisma.group.findFirst({ where: { tournamentId, name: FINALS_GROUP } })) {
      throw new ConflictException(`La phase finale existe déjà : supprimez le groupe « ${FINALS_GROUP} » pour la régénérer.`);
    }
    const groups = await this.prisma.group.findMany({
      where: { tournamentId, contestId: dto.contestId },
      include: { matches: { include: { participants: true } } },
    });
    const contest = await this.prisma.contest.findUniqueOrThrow({ where: { id: dto.contestId } });
    const timeTiebreak = !!(contest.sheet as unknown as Sheet).timeTiebreak;
    const best = new Map<number, Ranked>();
    for (const g of groups) {
      for (const p of g.matches.flatMap((m) => m.participants)) {
        if (p.score === null) continue;
        const current = best.get(p.teamId);
        const candidate = { teamId: p.teamId, groupId: g.id, best: p.score, timeSeconds: p.timeSeconds };
        if (!current || compareResults({ score: p.score, timeSeconds: p.timeSeconds }, { score: current.best, timeSeconds: current.timeSeconds }, timeTiebreak) < 0) {
          best.set(p.teamId, candidate);
        }
      }
    }
    if (best.size < dto.size) {
      throw new BadRequestException(`Seulement ${best.size} équipe(s) notée(s) sur ce concours : impossible de faire une phase finale à ${dto.size}.`);
    }

    const seeded = qualify([...best.values()], dto.size, timeTiebreak);
    const rounds = Math.log2(dto.size);
    const start = dto.startAt ? new Date(dto.startAt) : null;
    const at = (round: number) => (start ? new Date(start.getTime() + (rounds - round) * dto.minutesPerRound * 60_000) : null);
    const seeds = bracketSeeds(dto.size);

    return this.prisma.$transaction(async (tx) => {
      const group = await tx.group.create({ data: { tournamentId, contestId: dto.contestId, name: FINALS_GROUP } });
      for (let round = rounds; round >= 1; round--) {
        const count = 2 ** (round - 1);
        for (let i = 0; i < count; i++) {
          const teams = round === rounds ? [seeded[seeds[2 * i] - 1], seeded[seeds[2 * i + 1] - 1]] : [];
          await tx.match.create({
            data: {
              groupId: group.id,
              round,
              bracketIndex: i,
              tableNumber: i + 1,
              scheduledAt: at(round),
              participants: { create: teams.map((t) => ({ teamId: t.teamId })) },
            },
          });
        }
      }
      return { groupId: group.id, rounds: Array.from({ length: rounds }, (_, i) => ROUND_NAMES[rounds - i] ?? `Tour ${i + 1}`) };
    });
  }
}
