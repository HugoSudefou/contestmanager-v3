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
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { clampPenalties, computeSheet, type Answers, type Sheet } from '@contest/scoring';
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
}

class TeamDto {
  @IsString() name: string;
  @IsInt() groupId: number;
  /** School name; created if new, removed from the team when empty. */
  @IsOptional() @IsString() schoolName?: string;
  @IsOptional() @IsInt() teacherId?: number | null;
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

const schoolName = { select: { name: true } } as const;

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
          orderBy: { name: 'asc' },
          include: {
            contest: true,
            teams: { orderBy: { name: 'asc' }, include: { school: schoolName } },
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

  @Post()
  create(@Body() dto: GroupDto) {
    return this.prisma.group.create({ data: dto });
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: GroupDto) {
    return this.prisma.group.update({ where: { id }, data: dto });
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
      },
    });
  }

  @Post()
  async create(@Body() { schoolName, ...dto }: TeamDto) {
    return this.prisma.team.create({ data: { ...dto, schoolId: await this.schoolId(schoolName) } });
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
    const result = computeSheet(sheet, dto.answers, dto.penalties);
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
      },
    });
  }
}
