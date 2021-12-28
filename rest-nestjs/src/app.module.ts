import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { PrismaService } from './prisma.service';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { PostModule } from './post/post.module';
import { CoreModule } from './core/core.module';

@Module({
  imports: [UserModule, AuthModule, PostModule, CoreModule],
  controllers: [AppController],
  providers: [PrismaService, AppService],
})
export class AppModule {}
