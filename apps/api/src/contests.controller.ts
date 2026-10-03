import { BadRequestException, Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Query } from '@nestjs/common';
import { IsBoolean, IsObject, IsOptional, IsString } from 'class-validator';
import { validateSheet } from '@contest/scoring';
import { PrismaService } from './prisma.service.js';
import { Public } from './auth.js';
import type { Prisma } from './generated/prisma/client.js';

class ContestDto {
  @IsString() name: string;
  @IsString() season: string;
  @IsOptional() @IsString() description?: string;
  @IsObject() sheet: object;
  @IsOptional() @IsBoolean() published?: boolean;
}

@Controller('contests')
export class ContestsController {
  constructor(private prisma: PrismaService) {}

  /** The app lists published contests; the admin passes ?all=1 to see drafts too. */
  @Public()
  @Get()
  list(@Query('all') all?: string) {
    return this.prisma.contest.findMany({
      where: all ? {} : { published: true },
      orderBy: [{ season: 'desc' }, { name: 'asc' }],
    });
  }

  @Public()
  @Get(':id')
  get(@Param('id', ParseIntPipe) id: number) {
    return this.prisma.contest.findUniqueOrThrow({ where: { id } });
  }

  @Post()
  create(@Body() dto: ContestDto) {
    return this.prisma.contest.create({ data: this.data(dto) });
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: ContestDto) {
    return this.prisma.contest.update({ where: { id }, data: this.data(dto) });
  }

  @Post(':id/duplicate')
  async duplicate(@Param('id', ParseIntPipe) id: number) {
    const { name, season, description, sheet } = await this.prisma.contest.findUniqueOrThrow({ where: { id } });
    return this.prisma.contest.create({
      data: { name: `${name} (copie)`, season, description, sheet: sheet as Prisma.InputJsonValue },
    });
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.prisma.contest.delete({ where: { id } });
  }

  private data(dto: ContestDto) {
    const errors = validateSheet(dto.sheet);
    if (errors.length) throw new BadRequestException(errors);
    return { ...dto, sheet: dto.sheet as Prisma.InputJsonValue };
  }
}
