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
        { path: 'posts/feed', method: RequestMethod.GET },
        { path: 'posts', method: RequestMethod.GET },
        { path: 'posts', method: RequestMethod.POST },
        { path: 'posts/:id', method: RequestMethod.DELETE },
        { path: 'posts/:id', method: RequestMethod.PUT },
        { path: 'posts/:id', method: RequestMethod.GET },
        { path: 'posts/:id/comments', method: RequestMethod.POST },
        { path: 'posts/:id/comments', method: RequestMethod.GET },
        { path: 'posts/:postId/comments/:id', method: RequestMethod.DELETE },
        { path: 'posts/:id/favorite', method: RequestMethod.POST },
        { path: 'posts/:id/favorite', method: RequestMethod.DELETE },
        { path: 'posts/:id/views', method: RequestMethod.PUT },
        { path: 'posts/:id/publish', method: RequestMethod.PUT },
        { path: 'posts/:id/drafts', method: RequestMethod.GET },
      );
  }
}
