import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Post } from '../feed/post.entity';
import { Repository } from 'typeorm';
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
  ) {}

  async likePost(userId: string, postId: string): Promise<PostLikeSummaryDto> {
    await this.getAccessiblePostOrFail(postId, userId);

    const existingLike = await this.postLikeRepository.findOne({
      where: { postId, userId },
    });

    if (!existingLike) {
      const postLike = this.postLikeRepository.create({ postId, userId });
      await this.postLikeRepository.save(postLike);
    }

    return this.getPostLikeSummary(postId, userId);
  }

  async unlikePost(
    userId: string,
    postId: string,
  ): Promise<PostLikeSummaryDto> {
    await this.getAccessiblePostOrFail(postId, userId);

    await this.postLikeRepository.delete({ postId, userId });

    return this.getPostLikeSummary(postId, userId);
  }

  async getLikers(
    userId: string,
    postId: string,
    query: GetLikersDto,
  ): Promise<PostLikersResponseDto> {
    await this.getAccessiblePostOrFail(postId, userId);

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

    const [countRows, likedRows] = await Promise.all([
      this.postLikeRepository
        .createQueryBuilder('postLike')
        .select('postLike.postId', 'postId')
        .addSelect('COUNT(postLike.id)', 'likeCount')
        .where('postLike.postId IN (:...postIds)', { postIds })
        .groupBy('postLike.postId')
        .getRawMany<{ postId: string; likeCount: string }>(),
      this.postLikeRepository
        .createQueryBuilder('postLike')
        .select('postLike.postId', 'postId')
        .where('postLike.postId IN (:...postIds)', { postIds })
        .andWhere('postLike.userId = :userId', { userId })
        .getRawMany<{ postId: string }>(),
    ]);

    const likedPostIds = new Set(likedRows.map((row) => row.postId));
    const likeCountMap = new Map(
      countRows.map((row) => [row.postId, Number(row.likeCount)]),
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
    const summaries = await this.getPostLikeSummaries([postId], userId);
    const summary = summaries.get(postId);

    if (!summary) {
      throw new NotFoundException('Post not found');
    }

    return summary;
  }

  private async getAccessiblePostOrFail(
    postId: string,
    userId: string,
  ): Promise<Post> {
    const post = await this.postRepository.findOne({
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
