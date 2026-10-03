import 'dotenv/config';
import {
  ArgumentsHost,
  Catch,
  ConflictException,
  ExceptionFilter,
  NotFoundException,
  ValidationPipe,
} from '@nestjs/common';
import { BaseExceptionFilter, NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { mkdirSync } from 'node:fs';
import { AppModule } from './app.module.js';
import { PrismaService } from './prisma.service.js';
import { hashPassword } from './auth.js';
import { UPLOAD_DIR } from './uploads.controller.js';
import { Prisma } from './generated/prisma/client.js';

/** Turns "record not found" and "still referenced" database errors into 404 / 409 instead of 500. */
@Catch(Prisma.PrismaClientKnownRequestError)
class PrismaErrorFilter extends BaseExceptionFilter implements ExceptionFilter {
  catch(e: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    if (e.code === 'P2025') return super.catch(new NotFoundException('Élément introuvable'), host);
    if (e.code === 'P2002') return super.catch(new ConflictException('Cet élément existe déjà'), host);
    if (e.code === 'P2003') return super.catch(new ConflictException('Élément encore utilisé ailleurs'), host);
    return super.catch(e, host);
  }
}

async function bootstrap() {
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is required');
  mkdirSync(UPLOAD_DIR, { recursive: true });

  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.enableCors();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new PrismaErrorFilter(app.getHttpAdapter()));
  app.useStaticAssets(UPLOAD_DIR, { prefix: `/${UPLOAD_DIR}/` });

  // First start: create the admin account so the admin UI is reachable.
  const prisma = app.get(PrismaService);
  if ((await prisma.user.count()) === 0) {
    await prisma.user.create({
      data: {
        username: process.env.ADMIN_USERNAME ?? 'admin',
        passwordHash: await hashPassword(process.env.ADMIN_PASSWORD ?? 'change-me'),
        role: 'ADMIN',
      },
    });
  }

  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
