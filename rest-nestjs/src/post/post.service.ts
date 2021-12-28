import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Prisma } from '@prisma/client';
import { CommentInterface, CommentsInterface, PostInterface, PostsInterface } from './post.interface';

import slugify from 'slugify';

const postAuthorSelect = {
  username: true,
  firstName: true,
  lastName: true,
  followedBy: { select: { id: true } },
};

const commentSelect = {
  id: true,
  createdAt: true,
  updatedAt: true,
  body: true,
  author: { select: postAuthorSelect },
};

const postInclude = {
  author: { select: postAuthorSelect },
  favoritedBy: { select: { id: true } },
};

// map dynamic value "following" (is the current user following this author)
const mapAuthorFollowing = (userId, { followedBy, ...rest }) => ({
  ...rest,
  following: Array.isArray(followedBy) && followedBy.map((f) => f.id).includes(userId),
});

// map dynamic values "following" and "favorited" (from favoritedBy)
const mapDynamicValues = (userId, { favoritedBy, author, ...rest }) => ({
  ...rest,
  favorited: Array.isArray(favoritedBy) && favoritedBy.map((f) => f.id).includes(userId),
  author: mapAuthorFollowing(userId, author),
});

@Injectable()
export class PostService {
  constructor(private prisma: PrismaService) {}

  private static buildFindAllQuery(query): Prisma.Enumerable<Prisma.PostWhereInput> {
    const queries = [];

    if ('author' in query) {
      queries.push({
        author: {
          username: {
            equals: query.author,
          },
        },
      });
    }

    if ('favorited' in query) {
      queries.push({
        favoritedBy: {
          some: {
            username: {
              equals: query.favorited,
            },
          },
        },
      });
    }

    return queries;
  }

  async findAll(query, userId?: string): Promise<PostsInterface> {
    const andQueries = PostService.buildFindAllQuery(query);

    let posts = await this.prisma.post.findMany({
      where: {
        ...(userId && { published: true, authorId: userId }),
        ...(andQueries && { AND: andQueries }),
      },
      include: postInclude,
      ...('limit' in query ? { take: +query.limit } : {}),
      ...('offset' in query ? { skip: +query.offset } : {}),
      ...('orderBy' in query ? { orderBy: +query.orderBy } : {}),
      orderBy: { updatedAt: 'desc' },
    });
    const postsCount = await this.prisma.post.count({
      where: {
        ...(userId && { published: true, authorId: userId }),
        ...(andQueries && { AND: andQueries }),
      },
      orderBy: { updatedAt: 'desc' },
    });

    if (userId) {
      posts = (posts as any).map((a) => mapDynamicValues(userId, a));
    }

    return { posts, postsCount };
  }

  async findFeed(userId: string, query): Promise<PostsInterface> {
    const where = {
      published: true,
      author: {
        followedBy: { some: { id: userId } },
      },
    };
    let posts = await this.prisma.post.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      include: postInclude,
      ...('limit' in query ? { take: +query.limit } : {}),
      ...('offset' in query ? { skip: +query.offset } : {}),
    });
    const postsCount = await this.prisma.post.count({
      where,
      orderBy: { ...('orderBy' in query ? { updatedAt: query.orderBy } : { updatedAt: 'desc' }) },
    });

    posts = (posts as any).map((a) => mapDynamicValues(userId, a));

    return { posts, postsCount };
  }

  async findOne(userId: string, slug: string): Promise<PostInterface> {
    let post: any = await this.prisma.post.findFirst({
      where: { slug },
      include: postInclude,
    });

    post = mapDynamicValues(userId, post);

    return { post };
  }

  async addComment(userId: string, slug: string, { body }): Promise<CommentInterface> {
    const comment: any = await this.prisma.comment.create({
      data: {
        body,
        post: {
          connect: { slug },
        },
        author: {
          connect: { id: userId },
        },
      },
      select: commentSelect,
    });

    return { comment };
  }

  async deleteComment(slug: string, id: string): Promise<void> {
    await this.prisma.post.update({
      where: { slug },
      data: {
        comments: {
          deleteMany: [{ id }],
        },
      },
    });
  }

  async toggleFavorite(userId: string, slug: string, toggleFavorite: boolean): Promise<PostInterface> {
    let post: any = await this.prisma.post.update({
      where: { slug },
      data: {
        favoritedBy: toggleFavorite
          ? {
              ...{
                connect: { id: userId },
              },
            }
          : {
              ...{
                disconnect: { id: userId },
              },
            },
      },
      include: postInclude,
    });

    post = mapDynamicValues(userId, post);

    return { post };
  }

  async findComments(slug: string): Promise<CommentsInterface> {
    const comments: any = await this.prisma.comment.findMany({
      where: { post: { slug } },
      orderBy: { updatedAt: 'desc' },
      select: commentSelect,
    });
    return { comments };
  }

  async create(userId: string, payload): Promise<PostInterface> {
    let post: any = await this.prisma.post.findUnique({
      where: { slug: this.generateSlug(payload.title) },
    });

    if (post) {
      throw new HttpException('A post with this title already exists', HttpStatus.BAD_REQUEST);
    }

    post = await this.prisma.post.create({
      data: {
        ...payload,
        slug: this.generateSlug(payload.title),
        author: {
          connect: { id: userId },
        },
      },
      include: postInclude,
    });

    console.dir(post, { depth: null });
    post = mapDynamicValues(userId, post);
    return { post };
  }

  async update(userId: string, slug: string, data: any): Promise<PostInterface> {
    let post: any = await this.prisma.post.update({
      where: { slug },
      data: {
        ...data,
      },
      include: postInclude,
    });

    post = mapDynamicValues(userId, post);

    return { post };
  }

  async delete(slug: string): Promise<void> {
    await this.prisma.post.delete({ where: { slug } });
  }

  async views(slug: string): Promise<PostInterface> {
    let post = await this.prisma.post.findFirst({
      where: {
        slug,
        published: true,
      },
    });

    if (!post) {
      throw new HttpException('Post not found', HttpStatus.NOT_FOUND);
    }

    post = await this.prisma.post.update({
      where: {
        slug,
      },
      data: {
        viewCount: {
          increment: 1,
        },
      },
    });

    return { post };
  }

  async publish(userId: string, slug: string): Promise<PostInterface> {
    const postData = await this.prisma.post.findUnique({
      where: { slug },
    });

    if (!postData) {
      throw new HttpException('Post not found', HttpStatus.NOT_FOUND);
    }

    let post: any = await this.prisma.post.update({
      where: { slug },
      data: { published: true },
      include: postInclude,
    });

    post = mapDynamicValues(userId, post);

    return { post };
  }

  async getDrafts(userId: string): Promise<PostsInterface> {
    const where = {
      published: false,
      authorId: userId,
    };

    let posts = await this.prisma.post.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      include: postInclude,
    });

    const postsCount = await this.prisma.post.count({
      where,
      orderBy: { updatedAt: 'desc' },
    });

    posts = (posts as any).map((a) => mapDynamicValues(userId, a));

    return { posts, postsCount };
  }

  generateSlug(title: string): string {
    return slugify(title, { lower: true });
  }
}
