import { Comment, Post } from '@prisma/client';

export interface PostsInterface {
  posts: Post[];
  postsCount: number;
}

export interface PostInterface {
  post: Post;
}

export interface CommentsInterface {
  comments: Comment[];
}

export interface CommentInterface {
  comment: Comment;
}
