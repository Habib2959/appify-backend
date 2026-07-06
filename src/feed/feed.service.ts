import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Post } from './post.entity';
import { Repository } from 'typeorm';
import { CreatePostDto } from './dto/create-post.dto';
import { GetFeedDto } from './dto/get-feed.dto';
import { FeedPostResponseDto } from './dto/feed-post-response.dto';

@Injectable()
export class FeedService {
  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
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

    return this.toFeedPostResponseDto(postWithAuthor);
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

    return {
      items: posts.map((post) => this.toFeedPostResponseDto(post)),
      pagination: {
        offset,
        limit,
        total,
        hasMore: offset + posts.length < total,
      },
    };
  }

  private toFeedPostResponseDto(post: Post): FeedPostResponseDto {
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
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
    };
  }
}
