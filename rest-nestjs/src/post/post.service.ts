import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreatePostDto } from './dto';
import { Prisma } from '@prisma/client';
import { CommentInterface, CommentsInterface, PostInterface, PostsInterface } from './post.interface';
import { UserService } from '../user/user.service';

const postAuthorSelect = {
  email: true,
  username: true,
  firstName: true,
  lastName: true,
  bio: true,
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
  constructor(private prisma: PrismaService, private userService: UserService) {}

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

  async findAll(userId: string, query): Promise<PostsInterface> {
    const andQueries = PostService.buildFindAllQuery(query);
    let posts = await this.prisma.post.findMany({
      where: { published: true, AND: andQueries },
      orderBy: { createdAt: 'desc' },
      include: postInclude,
      ...('limit' in query ? { take: +query.limit } : {}),
      ...('offset' in query ? { skip: +query.offset } : {}),
    });
    const postsCount = await this.prisma.post.count({
      where: { AND: andQueries },
      orderBy: { createdAt: 'desc' },
    });

    posts = (posts as any).map((a) => mapDynamicValues(userId, a));

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
      orderBy: { createdAt: 'desc' },
      include: postInclude,
      ...('limit' in query ? { take: +query.limit } : {}),
      ...('offset' in query ? { skip: +query.offset } : {}),
    });
    const postsCount = await this.prisma.post.count({
      where,
      orderBy: { createdAt: 'desc' },
    });

    posts = (posts as any).map((a) => mapDynamicValues(userId, a));

    return { posts, postsCount };
  }

  async findOne(userId: string, id: string): Promise<PostInterface> {
    let post: any = await this.prisma.post.findFirst({
      where: { id },
      include: postInclude,
    });

    post = mapDynamicValues(userId, post);

    return { post };
  }

  async addComment(userId: string, postId: string, { body }): Promise<CommentInterface> {
    const comment: any = await this.prisma.comment.create({
      data: {
        body,
        post: {
          connect: { id: postId },
        },
        author: {
          connect: { id: userId },
        },
      },
      select: commentSelect,
    });

    return { comment };
  }

  async deleteComment(postId: string, id: string): Promise<void> {
    await this.prisma.post.update({
      where: { id: postId },
      data: {
        comments: {
          deleteMany: [{ id }],
        },
      },
    });
  }

  async favorite(userId: string, id: string): Promise<PostInterface> {
    let post: any = await this.prisma.post.update({
      where: { id },
      data: {
        favoritedBy: {
          connect: { id: userId },
        },
      },
      include: postInclude,
    });

    post = mapDynamicValues(userId, post);

    return { post };
  }

  async unFavorite(userId: string, id: string): Promise<PostInterface> {
    let post: any = await this.prisma.post.update({
      where: { id },
      data: {
        favoritedBy: {
          disconnect: { id: userId },
        },
      },
      include: postInclude,
    });

    post = mapDynamicValues(userId, post);

    return { post };
  }

  async findComments(postId: string): Promise<CommentsInterface> {
    const comments: any = await this.prisma.comment.findMany({
      where: { post: { id: postId } },
      orderBy: { createdAt: 'desc' },
      select: commentSelect,
    });
    return { comments };
  }

  async create({ authorEmail, ...payload }: CreatePostDto): Promise<PostInterface> {
    const user = await this.userService.getUserByEmail(authorEmail);

    console.dir({ include: postInclude }, { depth: null });
    let post: any = await this.prisma.post.create({
      data: {
        ...payload,
        author: {
          connect: { id: user.id },
        },
      },
      include: postInclude,
    });

    console.dir(post, { depth: null });
    post = mapDynamicValues(user.id, post);
    return { post };
  }

  async update(userId: string, id: string, data: any): Promise<PostInterface> {
    let post: any = await this.prisma.post.update({
      where: { id },
      data: {
        ...data,
      },
      include: postInclude,
    });

    post = mapDynamicValues(userId, post);

    return { post };
  }

  async delete(id: string): Promise<void> {
    await this.prisma.post.delete({ where: { id } });
  }

  async views(id: string): Promise<PostInterface> {
    const post = await this.prisma.post.update({
      where: { id },
      data: {
        viewCount: {
          increment: 1,
        },
      },
    });

    return { post };
  }

  async publish(userId: string, id: string): Promise<PostInterface> {
    const postData = await this.prisma.post.findUnique({
      where: { id },
      select: {
        published: true,
      },
    });

    let post: any = await this.prisma.post.update({
      where: { id },
      data: { published: !postData?.published },
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

    const posts = await this.prisma.post.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    const postsCount = await this.prisma.post.count({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return { posts, postsCount };
  }
}
