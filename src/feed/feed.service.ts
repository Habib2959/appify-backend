import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Post } from './post.entity';
import { Repository } from 'typeorm';
import { CreatePostDto } from './dto/create-post.dto';

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
    return this.postRepository.save(post);
  }

  async getFeed(userId: string) {
    return this.postRepository.find({
      where: [{ isPublic: true }, { authorId: userId }],
      order: { createdAt: 'DESC' },
      relations: {
        author: true,
      },
    });
  }
}
