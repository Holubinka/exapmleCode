import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { PostController } from './post.controller';
import { PostService } from './post.service';
import { AuthMiddleware } from '../auth/auth.middleware';
import { UserModule } from '../user/user.module';
import { PrismaService } from '../prisma.service';

@Module({
  imports: [UserModule],
  providers: [PostService, PrismaService],
  controllers: [PostController],
})
export class PostModule implements NestModule {
  public configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .forRoutes(
        { path: 'articles/feed', method: RequestMethod.GET },
        { path: 'articles', method: RequestMethod.POST },
        { path: 'articles/:id', method: RequestMethod.DELETE },
        { path: 'articles/:id', method: RequestMethod.PUT },
        { path: 'articles/:id/comments', method: RequestMethod.POST },
        { path: 'articles/:postId/comments/:id', method: RequestMethod.DELETE },
        { path: 'articles/:id/favorite', method: RequestMethod.POST },
        { path: 'articles/:id/favorite', method: RequestMethod.DELETE },
      );
  }
}
