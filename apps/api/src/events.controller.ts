import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Req,
} from '@nestjs/common';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsIn,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { EVAL_PARTS, clampPenalties, computePart, type Answers, type EvalPart, type Sheet } from '@contest/scoring';
import { PrismaService } from './prisma.service.js';
import { Public, Roles, type AuthUser } from './auth.js';
import type { Prisma } from './generated/prisma/client.js';
import { matchWinner } from './bracket.js';

class TournamentDto {
  @IsString() name: string;
  @IsOptional() @IsDateString() date?: string;
  @IsOptional() @IsString() location?: string;
}

class GroupDto {
  @IsString() name: string;
  @IsInt() tournamentId: number;
  @IsInt() contestId: number;
  /** Class letter (A, B, C...): first character of the team codes. Empty = none. */
  @IsOptional() @IsString() @MaxLength(3) letter?: string | null;
}

class TeamDto {
  @IsString() name: string;
  @IsInt() groupId: number;
  /** School name; created if new, removed from the team when empty. */
  @IsOptional() @IsString() schoolName?: string;
  @IsOptional() @IsInt() teacherId?: number | null;
  /** Team number in its class (A1, A2...). Left out on creation = next free number of the class. */
  @IsOptional() @IsInt() @Min(1) @Max(99) number?: number | null;
}

export class StudentDto {
  @IsString() @IsNotEmpty() firstName: string;
  @IsString() @IsNotEmpty() lastName: string;
  @IsOptional() @IsString() role?: string;
}

class StudentsDto {
  @IsArray() @ArrayMaxSize(20) @ValidateNested({ each: true }) @Type(() => StudentDto) students: StudentDto[];
}

class MatchDto {
  @IsInt() groupId: number;
  @IsOptional() @IsInt() tableNumber?: number;
  @IsOptional() @IsDateString() scheduledAt?: string;
  @IsArray() @ArrayUnique() @IsInt({ each: true }) teamIds: number[];
}

class ScoreDto {
  @IsInt() teamId: number;
  @IsObject() answers: Answers;
  @IsInt() @Min(0) penalties: number;
  @IsInt() @Min(0) timeSeconds: number;
}

/** A bonus scored once per team (attitude, pedagogique, technologique). */
class EvaluationDto {
  @IsIn(EVAL_PARTS.map((p) => p.part).filter((p) => p !== 'match')) part: Exclude<EvalPart, 'match'>;
  @IsObject() answers: Answers;
}

const schoolName = { select: { name: true } } as const;
const evaluationSelect = { select: { part: true, score: true, scoredAt: true } } as const;

const matchInclude = {
  participants: { include: { team: { select: { id: true, name: true } } }, orderBy: { id: 'asc' } },
} satisfies Prisma.MatchInclude;

@Controller('tournaments')
export class TournamentsController {
  constructor(private prisma: PrismaService) {}

  @Public()
  @Get()
  list() {
    return this.prisma.tournament.findMany({ orderBy: [{ date: 'desc' }, { id: 'desc' }] });
  }

  /** Everything a referee needs for a tournament, in one call so the app can cache it for offline use. */
  @Public()
  @Get(':id')
  get(@Param('id', ParseIntPipe) id: number) {
    return this.prisma.tournament.findUniqueOrThrow({
      where: { id },
      include: {
        groups: {
          orderBy: [{ letter: 'asc' }, { name: 'asc' }],
          include: {
            contest: true,
            teams: { orderBy: [{ number: 'asc' }, { name: 'asc' }], include: { school: schoolName, evaluations: evaluationSelect } },
            matches: { include: matchInclude, orderBy: [{ scheduledAt: 'asc' }, { id: 'asc' }] },
          },
        },
      },
    });
  }

  @Post()
  create(@Body() dto: TournamentDto) {
    return this.prisma.tournament.create({ data: dto });
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: TournamentDto) {
    return this.prisma.tournament.update({ where: { id }, data: dto });
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.prisma.tournament.delete({ where: { id } });
  }
}

@Controller('groups')
export class GroupsController {
  constructor(private prisma: PrismaService) {}

  /** A new class gets the next free letter of the tournament (A, B, C...) unless one is given. */
  @Post()
  async create(@Body() dto: GroupDto) {
    const letter = dto.letter?.trim().toUpperCase() || (await this.nextLetter(dto.tournamentId));
    return this.prisma.group.create({ data: { ...dto, letter } });
  }

  private async nextLetter(tournamentId: number): Promise<string> {
    const used = new Set((await this.prisma.group.findMany({ where: { tournamentId }, select: { letter: true } })).map((g) => g.letter));
    for (let i = 0; i < 26; i++) {
      const l = String.fromCharCode(65 + i);
      if (!used.has(l)) return l;
    }
    return '';
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: GroupDto) {
    return this.prisma.group.update({ where: { id }, data: { ...dto, letter: dto.letter?.trim().toUpperCase() || null } });
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.prisma.group.delete({ where: { id } });
  }
}

@Controller('teams')
export class TeamsController {
  constructor(private prisma: PrismaService) {}

  @Public()
  @Get(':id')
  get(@Param('id', ParseIntPipe) id: number) {
    return this.prisma.team.findUniqueOrThrow({
      where: { id },
      include: {
        school: schoolName,
        group: { include: { tournament: true, contest: { select: { id: true, name: true } } } },
        participations: { include: { match: { include: matchInclude } }, orderBy: { matchId: 'asc' } },
        evaluations: { select: { part: true, score: true, scoredAt: true, answers: true } },
      },
    });
  }

  /**
   * A bonus scored once for the team (re-sending overwrites). The server recomputes the score from the answers
   * with the missions of that part only.
   */
  @Roles('REFEREE', 'EVALUATOR', 'ADMIN')
  @Post(':id/evaluations')
  async evaluate(@Param('id', ParseIntPipe) teamId: number, @Body() dto: EvaluationDto, @Req() req: { user: AuthUser }) {
    // The referee scores the attitude; the advisers / referents score the poster, oral and technology bonuses.
    const allowed = dto.part === 'attitude' ? ['REFEREE', 'ADMIN'] : ['EVALUATOR', 'ADMIN'];
    if (!allowed.includes(req.user.role)) {
      throw new ForbiddenException(dto.part === 'attitude' ? "Le bonus Attitude est noté par l'arbitre" : 'Ce bonus est noté avec l\'accès « Bonus pédagogique et technologique »');
    }
    const team = await this.prisma.team.findUnique({ where: { id: teamId }, include: { group: { include: { contest: true } } } });
    if (!team) throw new NotFoundException('Équipe inconnue');
    const sheet = team.group.contest.sheet as unknown as Sheet;
    const score = computePart(sheet, dto.part, dto.answers).total;
    const data = { score, answers: dto.answers as Prisma.InputJsonValue, evaluatorId: req.user.id, scoredAt: new Date() };
    return this.prisma.teamEvaluation.upsert({
      where: { teamId_part: { teamId, part: dto.part } },
      create: { teamId, part: dto.part, ...data },
      update: data,
    });
  }

  @Post()
  async create(@Body() { schoolName, ...dto }: TeamDto) {
    const number = dto.number ?? ((await this.prisma.team.aggregate({ where: { groupId: dto.groupId }, _max: { number: true } }))._max.number ?? 0) + 1;
    return this.prisma.team.create({ data: { ...dto, number, schoolId: await this.schoolId(schoolName) } });
  }

  @Put(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() { schoolName, ...dto }: TeamDto) {
    return this.prisma.team.update({ where: { id }, data: { ...dto, schoolId: await this.schoolId(schoolName) } });
  }

  /** Finds or creates the school by name; blank = no school. */
  private async schoolId(name?: string): Promise<number | null> {
    const clean = name?.trim();
    if (!clean) return null;
    return (await this.prisma.school.upsert({ where: { name: clean }, create: { name: clean }, update: {} })).id;
  }

  /** Students are personal data of minors: only admins and the team's own teacher. */
  @Roles('ADMIN', 'TEACHER')
  @Get(':id/students')
  async students(@Param('id', ParseIntPipe) id: number, @Req() req: { user: AuthUser }) {
    await this.assertCanManage(id, req.user);
    return this.prisma.student.findMany({ where: { teamId: id }, orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }] });
  }

  @Roles('ADMIN', 'TEACHER')
  @Put(':id/students')
  async setStudents(@Param('id', ParseIntPipe) id: number, @Body() dto: StudentsDto, @Req() req: { user: AuthUser }) {
    await this.assertCanManage(id, req.user);
    await this.prisma.$transaction([
      this.prisma.student.deleteMany({ where: { teamId: id } }),
      this.prisma.student.createMany({ data: dto.students.map((s) => ({ ...s, teamId: id })) }),
    ]);
    return this.students(id, req);
  }

  private async assertCanManage(teamId: number, user: AuthUser) {
    const team = await this.prisma.team.findUniqueOrThrow({ where: { id: teamId }, select: { teacherId: true } });
    if (user.role !== 'ADMIN' && team.teacherId !== user.id) throw new ForbiddenException("Ce n'est pas une de vos équipes");
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.prisma.team.delete({ where: { id } });
  }
}

@Controller('matches')
export class MatchesController {
  constructor(private prisma: PrismaService) {}

  @Post()
  create(@Body() { teamIds, ...dto }: MatchDto) {
    return this.prisma.match.create({
      data: { ...dto, participants: { create: teamIds.map((teamId) => ({ teamId })) } },
      include: matchInclude,
    });
  }

  /** Keeps the results of teams that stay in the match. */
  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() { teamIds, ...dto }: MatchDto) {
    return this.prisma.match.update({
      where: { id },
      data: {
        ...dto,
        participants: {
          deleteMany: { teamId: { notIn: teamIds } },
          connectOrCreate: teamIds.map((teamId) => ({
            where: { matchId_teamId: { matchId: id, teamId } },
            create: { teamId },
          })),
        },
      },
      include: matchInclude,
    });
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.prisma.match.delete({ where: { id } });
  }

  /** The server recomputes the total from the answers: the app's live total is only a preview. Re-sending overwrites. */
  @Roles('REFEREE', 'ADMIN')
  @Post(':id/scores')
  async score(@Param('id', ParseIntPipe) matchId: number, @Body() dto: ScoreDto, @Req() req: { user: AuthUser }) {
    const participant = await this.prisma.matchParticipant.findUnique({
      where: { matchId_teamId: { matchId, teamId: dto.teamId } },
      include: { match: { include: { group: { include: { contest: true } } } } },
    });
    if (!participant) throw new NotFoundException("Cette équipe ne joue pas ce match");
    const sheet = participant.match.group.contest.sheet as unknown as Sheet;
    // Only the missions and penalties: the bonuses are scored once per team (POST /teams/:id/evaluations).
    const result = computePart(sheet, 'match', dto.answers, dto.penalties);
    const saved = await this.prisma.matchParticipant.update({
      where: { id: participant.id },
      data: {
        score: result.total,
        answers: dto.answers as Prisma.InputJsonValue,
        penalties: clampPenalties(sheet, dto.penalties),
        timeSeconds: dto.timeSeconds,
        refereeId: req.user.id,
        scoredAt: new Date(),
      },
    });
    if (participant.match.round && participant.match.round > 1) await this.advance(matchId);
    return saved;
  }

  /** Final phase: puts the winner of a finished match into the next round (replacing a previous, unscored winner). */
  private async advance(matchId: number) {
    const match = await this.prisma.match.findUniqueOrThrow({
      where: { id: matchId },
      include: { participants: true, group: { include: { contest: true } } },
    });
    const winner = matchWinner(match.participants, !!(match.group.contest.sheet as unknown as Sheet).timeTiebreak);
    const next = await this.prisma.match.findFirst({
      where: { groupId: match.groupId, round: match.round! - 1, bracketIndex: Math.floor(match.bracketIndex! / 2) },
    });
    if (!winner || !next) return;
    await this.prisma.$transaction([
      this.prisma.matchParticipant.deleteMany({
        where: { matchId: next.id, score: null, teamId: { in: match.participants.map((p) => p.teamId) } },
      }),
      this.prisma.matchParticipant.upsert({
        where: { matchId_teamId: { matchId: next.id, teamId: winner } },
        create: { matchId: next.id, teamId: winner },
        update: {},
      }),
    ]);
  }
}

@Controller('me')
export class MeController {
  constructor(private prisma: PrismaService) {}

  /** Teacher space: their teams with students, matches and scores. */
  @Roles('TEACHER', 'ADMIN')
  @Get('teams')
  teams(@Req() req: { user: AuthUser }) {
    return this.prisma.team.findMany({
      where: { teacherId: req.user.id },
      orderBy: { name: 'asc' },
      include: {
        school: schoolName,
        students: { orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }] },
        group: { include: { tournament: true, contest: { select: { id: true, name: true } } } },
        participations: { include: { match: { include: matchInclude } }, orderBy: { matchId: 'asc' } },
        evaluations: { select: { part: true, score: true, scoredAt: true, answers: true } },
      },
    });
  }
}
