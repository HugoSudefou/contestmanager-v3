import { BadRequestException, Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put } from '@nestjs/common';
import { IsIn, IsOptional, IsString, MinLength } from 'class-validator';

/** Bonus evaluators get a very simple password (e.g. 1234); every other account needs 6 characters. */
function checkPassword(role: Role, password?: string) {
  if (password == null) return;
  const min = role === 'EVALUATOR' ? 1 : 6;
  if (password.length < min) throw new BadRequestException(`Mot de passe trop court (${min} caractère${min > 1 ? 's' : ''} minimum)`);
}
import { PrismaService } from './prisma.service.js';
import { hashPassword } from './auth.js';
import type { Role } from './generated/prisma/client.js';

class UserDto {
  @IsString() username: string;
  @IsOptional() @IsString() @MinLength(1) password?: string;
  @IsIn(['ADMIN', 'REFEREE', 'TEACHER', 'EVALUATOR']) role: Role;
  @IsOptional() @IsString() firstName?: string;
  @IsOptional() @IsString() lastName?: string;
}

const select = { id: true, username: true, role: true, firstName: true, lastName: true, createdAt: true };

@Controller('users')
export class UsersController {
  constructor(private prisma: PrismaService) {}

  @Get()
  list() {
    return this.prisma.user.findMany({ select, orderBy: { username: 'asc' } });
  }

  @Post()
  async create(@Body() { password, ...dto }: UserDto) {
    if (!password) throw new BadRequestException('Mot de passe requis');
    checkPassword(dto.role, password);
    return this.prisma.user.create({ data: { ...dto, passwordHash: await hashPassword(password) }, select });
  }

  /** Password is only changed when provided. */
  @Put(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() { password, ...dto }: UserDto) {
    checkPassword(dto.role, password);
    const data = password ? { ...dto, passwordHash: await hashPassword(password) } : dto;
    return this.prisma.user.update({ where: { id }, data, select });
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.prisma.user.delete({ where: { id }, select });
  }
}
