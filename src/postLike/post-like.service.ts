import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Post } from '../feed/post.entity';
import { GetLikersDto } from './dto/get-likers.dto';
import { PostLikersResponseDto } from './dto/post-likers-response.dto';
import { PostLikeSummaryDto } from './dto/post-like-summary.dto';
import { PostLike } from './post-like.entity';

@Injectable()
export class PostLikeService {
  constructor(
    @InjectRepository(PostLike)
    private readonly postLikeRepository: Repository<PostLike>,
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    private readonly dataSource: DataSource,
  ) {}

  async likePost(userId: string, postId: string): Promise<PostLikeSummaryDto> {
    return this.dataSource.transaction(async (manager) => {
      const postRepository = manager.getRepository(Post);
      const postLikeRepository = manager.getRepository(PostLike);
      const post = await this.getAccessiblePostOrFail(
        postRepository,
        postId,
        userId,
      );

      const existingLike = await postLikeRepository.findOne({
        where: { postId, userId },
      });

      if (existingLike) {
        return {
          postId,
          likeCount: post.likeCount,
          likedByMe: true,
        };
      }

      await postLikeRepository.save(
        postLikeRepository.create({ postId, userId }),
      );
      await postRepository.increment({ id: postId }, 'likeCount', 1);

      return {
        postId,
        likeCount: post.likeCount + 1,
        likedByMe: true,
      };
    });
  }

  async unlikePost(
    userId: string,
    postId: string,
  ): Promise<PostLikeSummaryDto> {
    return this.dataSource.transaction(async (manager) => {
      const postRepository = manager.getRepository(Post);
      const postLikeRepository = manager.getRepository(PostLike);
      const post = await this.getAccessiblePostOrFail(
        postRepository,
        postId,
        userId,
      );

      const deleteResult = await postLikeRepository.delete({ postId, userId });

      if (deleteResult.affected) {
        await postRepository.decrement({ id: postId }, 'likeCount', 1);
      }

      return {
        postId,
        likeCount: deleteResult.affected
          ? Math.max(0, post.likeCount - 1)
          : post.likeCount,
        likedByMe: false,
      };
    });
  }

  async getLikers(
    userId: string,
    postId: string,
    query: GetLikersDto,
  ): Promise<PostLikersResponseDto> {
    await this.getAccessiblePostOrFail(this.postRepository, postId, userId);

    const offset = query.offset ?? 0;
    const limit = query.limit ?? 20;

    const [likes, total] = await this.postLikeRepository.findAndCount({
      where: { postId },
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

  async getPostLikeSummaries(
    postIds: string[],
    userId: string,
  ): Promise<Map<string, PostLikeSummaryDto>> {
    if (!postIds.length) {
      return new Map();
    }

    const [posts, likedRows] = await Promise.all([
      this.postRepository.find({
        select: {
          id: true,
          likeCount: true,
        },
        where: postIds.map((id) => ({ id })),
      }),
      this.postLikeRepository
        .createQueryBuilder('postLike')
        .select('postLike.postId', 'postId')
        .where('postLike.postId IN (:...postIds)', { postIds })
        .andWhere('postLike.userId = :userId', { userId })
        .getRawMany<{ postId: string }>(),
    ]);

    const likedPostIds = new Set(likedRows.map((row) => row.postId));
    const likeCountMap = new Map(
      posts.map((post) => [post.id, post.likeCount]),
    );

    return new Map(
      postIds.map((postId) => [
        postId,
        {
          postId,
          likeCount: likeCountMap.get(postId) ?? 0,
          likedByMe: likedPostIds.has(postId),
        },
      ]),
    );
  }

  private async getPostLikeSummary(
    postId: string,
    userId: string,
  ): Promise<PostLikeSummaryDto> {
    const post = await this.getAccessiblePostOrFail(
      this.postRepository,
      postId,
      userId,
    );
    const likedByMe = await this.postLikeRepository.exists({
      where: { postId, userId },
    });

    return {
      postId,
      likeCount: post.likeCount,
      likedByMe,
    };
  }

  private async getAccessiblePostOrFail(
    postRepository: Repository<Post>,
    postId: string,
    userId: string,
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
}
