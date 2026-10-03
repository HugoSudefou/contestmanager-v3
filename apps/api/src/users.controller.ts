import { BadRequestException, Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put } from '@nestjs/common';
import { IsIn, IsOptional, IsString, MinLength } from 'class-validator';
import { PrismaService } from './prisma.service.js';
import { hashPassword } from './auth.js';
import type { Role } from './generated/prisma/client.js';

class UserDto {
  @IsString() username: string;
  @IsOptional() @IsString() @MinLength(6) password?: string;
  @IsIn(['ADMIN', 'REFEREE']) role: Role;
}

const select = { id: true, username: true, role: true, createdAt: true };

@Controller('users')
export class UsersController {
  constructor(private prisma: PrismaService) {}

  @Get()
  list() {
    return this.prisma.user.findMany({ select, orderBy: { username: 'asc' } });
  }

  @Post()
  async create(@Body() { password, ...dto }: UserDto) {
    if (!password) throw new BadRequestException('Mot de passe requis (6 caractères minimum)');
    return this.prisma.user.create({ data: { ...dto, passwordHash: await hashPassword(password) }, select });
  }

  /** Password is only changed when provided. */
  @Put(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() { password, ...dto }: UserDto) {
    const data = password ? { ...dto, passwordHash: await hashPassword(password) } : dto;
    return this.prisma.user.update({ where: { id }, data, select });
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.prisma.user.delete({ where: { id }, select });
  }
}
