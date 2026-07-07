import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Post } from './post.entity';
import { Repository } from 'typeorm';
import { CreatePostDto } from './dto/create-post.dto';
import { GetFeedDto } from './dto/get-feed.dto';
import { FeedPostResponseDto } from './dto/feed-post-response.dto';
import { PostLike } from '../postLike/post-like.entity';

@Injectable()
export class FeedService {
  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    @InjectRepository(PostLike)
    private readonly postLikeRepository: Repository<PostLike>,
  ) {}

  async createPost(userId: string, dto: CreatePostDto) {
    const post = this.postRepository.create({
      authorId: userId,
      content: dto.content.trim(),
      media: dto.media?.length ? dto.media : null,
      isPublic: dto.isPublic,
    });
    const savedPost = await this.postRepository.save(post);

    const postWithAuthor = await this.postRepository.findOneOrFail({
      where: { id: savedPost.id },
      relations: {
        author: true,
      },
    });

    return this.toFeedPostResponseDto(postWithAuthor, {
      likeCount: 0,
      likedByMe: false,
    });
  }

  async getFeed(userId: string, query: GetFeedDto) {
    const offset = query.offset ?? 0;
    const limit = query.limit ?? 10;

    const [posts, total] = await this.postRepository.findAndCount({
      where: [{ isPublic: true }, { authorId: userId }],
      order: { createdAt: 'DESC' },
      relations: {
        author: true,
      },
      skip: offset,
      take: limit,
    });

    const postIds = posts.map((post) => post.id);
    const likeSummaries = await this.getPostLikeSummaries(postIds, userId);

    return {
      items: posts.map((post) =>
        this.toFeedPostResponseDto(
          post,
          likeSummaries.get(post.id) ?? { likeCount: 0, likedByMe: false },
        ),
      ),
      pagination: {
        offset,
        limit,
        total,
        hasMore: offset + posts.length < total,
      },
    };
  }

  private toFeedPostResponseDto(
    post: Post,
    likeSummary: { likeCount: number; likedByMe: boolean },
  ): FeedPostResponseDto {
    return {
      id: post.id,
      authorId: post.authorId,
      author: {
        id: post.author.id,
        firstName: post.author.firstName,
        lastName: post.author.lastName,
      },
      content: post.content,
      media: post.media ?? null,
      isPublic: post.isPublic,
      likeCount: likeSummary.likeCount,
      likedByMe: likeSummary.likedByMe,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
    };
  }

  private async getPostLikeSummaries(
    postIds: string[],
    userId: string,
  ): Promise<Map<string, { likeCount: number; likedByMe: boolean }>> {
    if (!postIds.length) {
      return new Map();
    }

    const likedRows = await this.postLikeRepository
      .createQueryBuilder('postLike')
      .select('postLike.postId', 'postId')
      .where('postLike.postId IN (:...postIds)', { postIds })
      .andWhere('postLike.userId = :userId', { userId })
      .getRawMany<{ postId: string }>();

    const likedPostIds = new Set(likedRows.map((row) => row.postId));
    const posts = await this.postRepository.find({
      select: {
        id: true,
        likeCount: true,
      },
      where: postIds.map((id) => ({ id })),
    });
    const likeCountMap = new Map(
      posts.map((post) => [post.id, post.likeCount]),
    );

    return new Map(
      postIds.map((postId) => [
        postId,
        {
          likeCount: likeCountMap.get(postId) ?? 0,
          likedByMe: likedPostIds.has(postId),
        },
      ]),
    );
  }
}
