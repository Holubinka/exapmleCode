import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { PrismaService } from '../prisma.service';
import { AuthMiddleware } from '../auth/auth.middleware';

@Module({
  controllers: [UserController],
  providers: [PrismaService, UserService],
  exports: [UserService],
})
export class UserModule implements NestModule {
  public configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .forRoutes(
        { path: 'users', method: RequestMethod.GET },
        { path: 'users/:id', method: RequestMethod.PATCH },
        { path: 'users/me', method: RequestMethod.GET },
        { path: 'users/:username', method: RequestMethod.DELETE },
        { path: 'users/:username/follow', method: RequestMethod.POST },
        { path: 'users/:username/follow', method: RequestMethod.DELETE },
      );
  }
}
