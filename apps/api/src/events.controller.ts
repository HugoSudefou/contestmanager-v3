import { Body, Controller, Delete, Get, NotFoundException, Param, ParseIntPipe, Post, Put, Req } from '@nestjs/common';
import { ArrayUnique, IsArray, IsDateString, IsInt, IsObject, IsOptional, IsString, Min } from 'class-validator';
import { computeSheet, type Answers, type Sheet } from '@contest/scoring';
import { PrismaService } from './prisma.service.js';
import { Public, Roles, type AuthUser } from './auth.js';
import type { Prisma } from './generated/prisma/client.js';

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
  @IsOptional() @IsString() school?: string;
  @IsOptional() @IsString() members?: string;
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
            teams: { orderBy: { name: 'asc' } },
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
        group: { include: { tournament: true, contest: { select: { id: true, name: true } } } },
        participations: { include: { match: { include: matchInclude } }, orderBy: { matchId: 'asc' } },
      },
    });
  }

  @Post()
  create(@Body() dto: TeamDto) {
    return this.prisma.team.create({ data: dto });
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: TeamDto) {
    return this.prisma.team.update({ where: { id }, data: dto });
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
    return this.prisma.matchParticipant.update({
      where: { id: participant.id },
      data: {
        score: result.total,
        answers: dto.answers as Prisma.InputJsonValue,
        penalties: dto.penalties,
        timeSeconds: dto.timeSeconds,
        refereeId: req.user.id,
        scoredAt: new Date(),
      },
    });
  }
}
