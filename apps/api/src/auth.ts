import {
  Body,
  CanActivate,
  Controller,
  ExecutionContext,
  Injectable,
  Post,
  SetMetadata,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { randomBytes, scrypt as scryptCb, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { IsString } from 'class-validator';
import { PrismaService } from './prisma.service.js';
import type { Role } from './generated/prisma/client.js';

const scrypt = promisify(scryptCb) as (pw: string, salt: Buffer, len: number) => Promise<Buffer>;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await scrypt(password, salt, 64);
  return `${salt.toString('hex')}:${hash.toString('hex')}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const actual = await scrypt(password, Buffer.from(salt, 'hex'), 64);
  return timingSafeEqual(actual, Buffer.from(hash, 'hex'));
}

export interface AuthUser {
  id: number;
  username: string;
  role: Role;
}

/** Routes are ADMIN-only by default; loosen with @Public() or @Roles(...). */
export const Public = () => SetMetadata('roles', 'public');
export const Roles = (...roles: Role[]) => SetMetadata('roles', roles);

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private jwt: JwtService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const roles = this.reflector.getAllAndOverride<Role[] | 'public'>('roles', [ctx.getHandler(), ctx.getClass()]) ?? [
      'ADMIN',
    ];
    if (roles === 'public') return true;
    const req = ctx.switchToHttp().getRequest();
    const token = /^Bearer (.+)$/.exec(req.headers.authorization ?? '')?.[1];
    if (!token) throw new UnauthorizedException('Connexion requise');
    try {
      req.user = await this.jwt.verifyAsync<AuthUser>(token);
    } catch {
      throw new UnauthorizedException('Session expirée, reconnectez-vous');
    }
    if (!roles.includes(req.user.role)) throw new ForbiddenException('Droits insuffisants');
    return true;
  }
}

class LoginDto {
  @IsString() username: string;
  @IsString() password: string;
}

@Controller('auth')
export class AuthController {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  @Public()
  @Post('login')
  async login(@Body() dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { username: dto.username } });
    if (!user || !(await verifyPassword(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Identifiant ou mot de passe incorrect');
    }
    const payload: AuthUser = { id: user.id, username: user.username, role: user.role };
    return { token: await this.jwt.signAsync(payload), user: payload };
  }
}
