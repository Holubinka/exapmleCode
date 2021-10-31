import { Get, Post, Body, Put, Delete, Query, Param, Controller } from '@nestjs/common';
import { PostService } from './post.service';
import { CreatePostDto, CreateCommentDto } from './dto';
import { ArticlesRO, ArticleRO } from './post.interface';
import { Comment as CommentModel } from '@prisma/client';
import { User } from '../user/user.decorator';

@Controller('posts')
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Get()
  async findAll(@User('id') userId: number, @Query() query): Promise<ArticlesRO> {
    return await this.postService.findAll(userId, query);
  }

  @Get('feed')
  async getFeed(@User('id') userId: number, @Query() query): Promise<ArticlesRO> {
    return await this.postService.findFeed(userId, query);
  }

  @Get(':id')
  async findOne(@User('id') userId: number, @Param('id') postId: string): Promise<ArticleRO> {
    return await this.postService.findOne(userId, postId);
  }

  @Get(':id/comments')
  async findComments(@Param('id') postId): Promise<CommentModel> {
    return await this.postService.findComments(postId);
  }

  @Post()
  async create(@User('id') userId: number, @Body() postData: CreatePostDto) {
    return this.postService.create(userId, postData);
  }

  @Put(':id')
  async update(@User('id') userId: number, @Param() params, @Body('article') articleData: CreatePostDto) {
    // Todo: update slug also when title gets changed
    return this.postService.update(userId, params.slug, articleData);
  }

  @Delete(':id')
  async delete(@Param() params) {
    return this.postService.delete(params.id);
  }

  @Post(':id/comments')
  async createComment(
    @User('id') userId: number,
    @Param('id') postId,
    @Body('comment') payload: CreateCommentDto,
  ) {
    return await this.postService.addComment(userId, postId, payload);
  }

  @Delete(':postId/comments/:id')
  async deleteComment(@Param() params) {
    const { postId, id } = params;
    return await this.postService.deleteComment(postId, id);
  }

  @Post(':id/favorite')
  async favorite(@User('id') userId: number, @Param('id') postId) {
    return await this.postService.favorite(userId, postId);
  }

  @Delete(':id/favorite')
  async unFavorite(@User('id') userId: number, @Param('id') postId) {
    return await this.postService.unFavorite(userId, postId);
  }
}
