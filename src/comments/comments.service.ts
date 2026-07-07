import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, IsNull, Repository } from 'typeorm';
import { Post } from '../feed/post.entity';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CreateReplyDto } from './dto/create-reply.dto';
import { CommentLikeSummaryDto } from './dto/comment-like-summary.dto';
import { CommentLikersResponseDto } from './dto/comment-likers-response.dto';
import {
  CommentResponseDto,
  PaginatedCommentsResponseDto,
} from './dto/comment-response.dto';
import { GetCommentLikersDto } from './dto/get-comment-likers.dto';
import { GetCommentsDto } from './dto/get-comments.dto';
import { CommentLike } from './comment-likes.entity';
import { Comment } from './comment.entity';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
    @InjectRepository(CommentLike)
    private readonly commentLikeRepository: Repository<CommentLike>,
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    private readonly dataSource: DataSource,
  ) {}

  async createComment(
    userId: string,
    dto: CreateCommentDto,
  ): Promise<CommentResponseDto> {
    return this.dataSource.transaction(async (manager) => {
      const commentRepository = manager.getRepository(Comment);
      const postRepository = manager.getRepository(Post);

      await this.getAccessiblePostOrFail(dto.postId, userId, postRepository);

      const comment = commentRepository.create({
        postId: dto.postId,
        authorId: userId,
        content: dto.content.trim(),
        parentCommentId: null,
        rootCommentId: null,
      });

      const savedComment = await commentRepository.save(comment);
      await postRepository.increment({ id: dto.postId }, 'commentCount', 1);

      const commentWithAuthor = await commentRepository.findOneOrFail({
        where: { id: savedComment.id },
        relations: {
          author: true,
        },
      });

      return this.toCommentResponseDto(commentWithAuthor, false);
    });
  }

  async createReply(
    userId: string,
    parentCommentId: string,
    dto: CreateReplyDto,
  ): Promise<CommentResponseDto> {
    return this.dataSource.transaction(async (manager) => {
      const commentRepository = manager.getRepository(Comment);
      const postRepository = manager.getRepository(Post);
      const parentComment = await commentRepository.findOne({
        where: { id: parentCommentId },
      });

      if (!parentComment) {
        throw new NotFoundException('Parent comment not found');
      }

      await this.getAccessiblePostOrFail(
        parentComment.postId,
        userId,
        postRepository,
      );

      const rootCommentId = parentComment.rootCommentId ?? parentComment.id;
      const reply = commentRepository.create({
        postId: parentComment.postId,
        authorId: userId,
        content: dto.content.trim(),
        parentCommentId: parentComment.id,
        rootCommentId,
      });

      const savedReply = await commentRepository.save(reply);
      await commentRepository.increment({ id: parentComment.id }, 'replyCount', 1);

      const replyWithAuthor = await commentRepository.findOneOrFail({
        where: { id: savedReply.id },
        relations: {
          author: true,
        },
      });

      return this.toCommentResponseDto(replyWithAuthor, false);
    });
  }

  async getPostComments(
    userId: string,
    postId: string,
    query: GetCommentsDto,
  ): Promise<PaginatedCommentsResponseDto> {
    await this.getAccessiblePostOrFail(postId, userId);

    const offset = query.offset ?? 0;
    const limit = query.limit ?? 20;

    const [comments, total] = await this.commentRepository.findAndCount({
      where: {
        postId,
        parentCommentId: IsNull(),
      },
      relations: {
        author: true,
      },
      order: {
        createdAt: 'DESC',
      },
      skip: offset,
      take: limit,
    });

    return this.toPaginatedCommentsResponse(comments, total, offset, limit, userId);
  }

  async getReplies(
    userId: string,
    commentId: string,
    query: GetCommentsDto,
  ): Promise<PaginatedCommentsResponseDto> {
    const parentComment = await this.getAccessibleCommentOrFail(commentId, userId);
    const offset = query.offset ?? 0;
    const limit = query.limit ?? 20;

    const [comments, total] = await this.commentRepository.findAndCount({
      where: {
        parentCommentId: parentComment.id,
      },
      relations: {
        author: true,
      },
      order: {
        createdAt: 'ASC',
      },
      skip: offset,
      take: limit,
    });

    return this.toPaginatedCommentsResponse(comments, total, offset, limit, userId);
  }

  async likeComment(
    userId: string,
    commentId: string,
  ): Promise<CommentLikeSummaryDto> {
    return this.dataSource.transaction(async (manager) => {
      const commentRepository = manager.getRepository(Comment);
      const commentLikeRepository = manager.getRepository(CommentLike);
      const comment = await this.getAccessibleCommentOrFail(
        commentId,
        userId,
        commentRepository,
      );

      const existingLike = await commentLikeRepository.findOne({
        where: { commentId, userId },
      });

      if (existingLike) {
        return {
          commentId,
          likeCount: comment.likeCount,
          likedByMe: true,
        };
      }

      await commentLikeRepository.save(
        commentLikeRepository.create({ commentId, userId }),
      );
      await commentRepository.increment({ id: commentId }, 'likeCount', 1);

      return {
        commentId,
        likeCount: comment.likeCount + 1,
        likedByMe: true,
      };
    });
  }

  async unlikeComment(
    userId: string,
    commentId: string,
  ): Promise<CommentLikeSummaryDto> {
    return this.dataSource.transaction(async (manager) => {
      const commentRepository = manager.getRepository(Comment);
      const commentLikeRepository = manager.getRepository(CommentLike);
      const comment = await this.getAccessibleCommentOrFail(
        commentId,
        userId,
        commentRepository,
      );

      const deleteResult = await commentLikeRepository.delete({ commentId, userId });

      if (deleteResult.affected) {
        await commentRepository.decrement({ id: commentId }, 'likeCount', 1);
      }

      return {
        commentId,
        likeCount: deleteResult.affected
          ? Math.max(0, comment.likeCount - 1)
          : comment.likeCount,
        likedByMe: false,
      };
    });
  }

  async getCommentLikers(
    userId: string,
    commentId: string,
    query: GetCommentLikersDto,
  ): Promise<CommentLikersResponseDto> {
    await this.getAccessibleCommentOrFail(commentId, userId);

    const offset = query.offset ?? 0;
    const limit = query.limit ?? 20;

    const [likes, total] = await this.commentLikeRepository.findAndCount({
      where: { commentId },
      relations: {
        user: true,
      },
      order: {
        createdAt: 'DESC',
      },
      skip: offset,
      take: limit,
    });

    return {
      items: likes.map((like) => ({
        id: like.user.id,
        firstName: like.user.firstName,
        lastName: like.user.lastName,
      })),
      pagination: {
        offset,
        limit,
        total,
        hasMore: offset + likes.length < total,
      },
    };
  }

  private async toPaginatedCommentsResponse(
    comments: Comment[],
    total: number,
    offset: number,
    limit: number,
    userId: string,
  ): Promise<PaginatedCommentsResponseDto> {
    const likedCommentIds = await this.getLikedCommentIds(
      comments.map((comment) => comment.id),
      userId,
    );

    return {
      items: comments.map((comment) =>
        this.toCommentResponseDto(comment, likedCommentIds.has(comment.id)),
      ),
      pagination: {
        offset,
        limit,
        total,
        hasMore: offset + comments.length < total,
      },
    };
  }

  private async getLikedCommentIds(
    commentIds: string[],
    userId: string,
  ): Promise<Set<string>> {
    if (!commentIds.length) {
      return new Set();
    }

    const rows = await this.commentLikeRepository
      .createQueryBuilder('commentLike')
      .select('commentLike.commentId', 'commentId')
      .where('commentLike.commentId IN (:...commentIds)', { commentIds })
      .andWhere('commentLike.userId = :userId', { userId })
      .getRawMany<{ commentId: string }>();

    return new Set(rows.map((row) => row.commentId));
  }

  private toCommentResponseDto(
    comment: Comment,
    likedByMe: boolean,
  ): CommentResponseDto {
    return {
      id: comment.id,
      postId: comment.postId,
      authorId: comment.authorId,
      author: {
        id: comment.author.id,
        firstName: comment.author.firstName,
        lastName: comment.author.lastName,
      },
      content: comment.content,
      parentCommentId: comment.parentCommentId ?? null,
      rootCommentId: comment.rootCommentId ?? null,
      likeCount: comment.likeCount,
      replyCount: comment.replyCount,
      likedByMe,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
    };
  }

  private async getAccessiblePostOrFail(
    postId: string,
    userId: string,
    postRepository: Repository<Post> = this.postRepository,
  ): Promise<Post> {
    const post = await postRepository.findOne({
      where: [
        { id: postId, isPublic: true },
        { id: postId, authorId: userId },
      ],
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    return post;
  }

  private async getAccessibleCommentOrFail(
    commentId: string,
    userId: string,
    commentRepository: Repository<Comment> = this.commentRepository,
  ): Promise<Comment> {
    const comment = await commentRepository.findOne({
      where: { id: commentId },
      relations: {
        author: true,
      },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    await this.getAccessiblePostOrFail(comment.postId, userId);

    return comment;
  }
}
