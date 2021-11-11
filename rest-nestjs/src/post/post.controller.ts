import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { PostService } from './post.service';
import { CreateCommentDto, CreatePostDto } from './dto';
import { CommentInterface, CommentsInterface, PostInterface, PostsInterface } from './post.interface';
import { User } from '../user/user.decorator';

@Controller('posts')
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Get('/')
  async findAll(@User('id') userId: string, @Query() query): Promise<PostsInterface> {
    return await this.postService.findAll(userId, query);
  }

  @Get('feed')
  async getFeed(@User('id') userId: string, @Query() query): Promise<PostsInterface> {
    return await this.postService.findFeed(userId, query);
  }

  @Get(':id')
  async findOne(@User('id') userId: string, @Param('id') postId: string): Promise<PostInterface> {
    return await this.postService.findOne(userId, postId);
  }

  @Get(':id/comments')
  async findComments(@Param('id') postId): Promise<CommentsInterface> {
    return await this.postService.findComments(postId);
  }

  @Post('/')
  async create(@Body() postData: CreatePostDto): Promise<PostInterface> {
    return this.postService.create(postData);
  }

  @Put(':id')
  async update(
    @User('id') userId: string,
    @Param('id') postId,
    @Body('article') articleData: CreatePostDto,
  ): Promise<PostInterface> {
    return this.postService.update(userId, postId, articleData);
  }

  @Delete(':id')
  async delete(@Param('id') id): Promise<void> {
    return this.postService.delete(id);
  }

  @Post(':id/comments')
  async createComment(
    @User('id') userId: string,
    @Param('id') postId,
    @Body('comment') payload: CreateCommentDto,
  ): Promise<CommentInterface> {
    return await this.postService.addComment(userId, postId, payload);
  }

  @Delete(':postId/comments/:id')
  async deleteComment(@Param() params): Promise<void> {
    const { postId, id } = params;
    return await this.postService.deleteComment(postId, id);
  }

  @Post(':id/favorite')
  async favorite(@User('id') userId: string, @Param('id') postId): Promise<PostInterface> {
    return await this.postService.favorite(userId, postId);
  }

  @Delete(':id/favorite')
  async unFavorite(@User('id') userId: string, @Param('id') postId): Promise<PostInterface> {
    return await this.postService.unFavorite(userId, postId);
  }

  @Put(':id/views')
  async incrementPostViewCount(@Param('id') id: string): Promise<PostInterface> {
    return await this.postService.views(id);
  }

  @Put(':id/publish')
  async togglePublishPost(@User('id') userId: string, @Param('id') id: string): Promise<PostInterface> {
    return await this.postService.publish(userId, id);
  }

  @Get(':id/drafts')
  async getDraftsByUser(@User('id') userId: string): Promise<PostsInterface> {
    return await this.postService.getDrafts(userId);
  }
}
