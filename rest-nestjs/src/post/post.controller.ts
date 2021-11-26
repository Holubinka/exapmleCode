import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { PostService } from './post.service';
import { CreateCommentDto, CreatePostDto } from './dto';
import { CommentInterface, CommentsInterface, PostInterface, PostsInterface } from './post.interface';
import { User } from '../shared/decorators/user.decorator';
import { HasRoles } from '../shared/decorators/role.decorator';
import { Role } from '../user/user.interface';
import { RolesGuard } from '../shared/guards/roles.guard';

@Controller('posts')
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Get('/')
  @HasRoles(Role.ADMIN)
  @UseGuards(RolesGuard)
  async findAll(@Query() query): Promise<PostsInterface> {
    return await this.postService.findAll(query);
  }

  @Get('/my')
  async findAllByUser(@User('id') userId: string, @Query() query): Promise<PostsInterface> {
    return await this.postService.findAll(query, userId);
  }

  @Get('feed')
  async getFeed(@User('id') userId: string, @Query() query): Promise<PostsInterface> {
    return await this.postService.findFeed(userId, query);
  }

  @Get('/drafts')
  async getDraftsByUser(@User('id') userId: string): Promise<PostsInterface> {
    return await this.postService.getDrafts(userId);
  }

  @Get(':slug')
  async findOne(@User('id') userId: string, @Param('slug') slug: string): Promise<PostInterface> {
    return await this.postService.findOne(userId, slug);
  }

  @Get(':slug/comments')
  async findComments(@Param('slug') slug): Promise<CommentsInterface> {
    return await this.postService.findComments(slug);
  }

  @Post('/')
  async create(@User('id') userId: string, @Body() postData: CreatePostDto): Promise<PostInterface> {
    return this.postService.create(userId, postData);
  }

  @Put(':slug')
  async update(
    @User('id') userId: string,
    @Param('slug') slug,
    @Body('article') articleData: CreatePostDto,
  ): Promise<PostInterface> {
    return this.postService.update(userId, slug, articleData);
  }

  @Delete(':slug')
  async delete(@Param('slug') slug): Promise<void> {
    return this.postService.delete(slug);
  }

  @Post(':slug/comments')
  async createComment(
    @User('id') userId: string,
    @Param('slug') slug,
    @Body('comment') payload: CreateCommentDto,
  ): Promise<CommentInterface> {
    return await this.postService.addComment(userId, slug, payload);
  }

  @Delete(':slug/comments/:id')
  async deleteComment(@Param() params): Promise<void> {
    const { slug, id } = params;
    return await this.postService.deleteComment(slug, id);
  }

  @Post(':slug/favorite')
  async favorite(@User('id') userId: string, @Param('slug') slug): Promise<PostInterface> {
    return await this.postService.toggleFavorite(userId, slug, true);
  }

  @Delete(':slug/favorite')
  async unFavorite(@User('id') userId: string, @Param('slug') slug): Promise<PostInterface> {
    return await this.postService.toggleFavorite(userId, slug, false);
  }

  @Put(':slug/views')
  async incrementPostViewCount(@Param('slug') slug: string): Promise<PostInterface> {
    return await this.postService.views(slug);
  }

  @Put(':slug/publish')
  async publishPost(@User('id') userId: string, @Param('slug') slug: string): Promise<PostInterface> {
    return await this.postService.publish(userId, slug);
  }
}
