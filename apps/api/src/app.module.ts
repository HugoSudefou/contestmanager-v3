import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { PrismaService } from './prisma.service.js';
import { AuthController, AuthGuard } from './auth.js';
import { ContestsController } from './contests.controller.js';
import {
  GroupsController,
  MatchesController,
  TeamsController,
  TournamentsController,
} from './events.controller.js';
import { UsersController } from './users.controller.js';
import { UploadsController } from './uploads.controller.js';

@Module({
  imports: [
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET,
      // Long enough to cover a whole competition day offline.
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [
    AuthController,
    ContestsController,
    TournamentsController,
    GroupsController,
    TeamsController,
    MatchesController,
    UsersController,
    UploadsController,
  ],
  providers: [PrismaService, { provide: APP_GUARD, useClass: AuthGuard }],
})
export class AppModule {}
