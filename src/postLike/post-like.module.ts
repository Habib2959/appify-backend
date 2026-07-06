import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Post } from '../feed/post.entity';
import { UserModule } from '../user/user.module';
import { PostLikeController } from './post-like.controller';
import { PostLikeService } from './post-like.service';
import { PostLike } from './post-like.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Post, PostLike]), UserModule],
  controllers: [PostLikeController],
  providers: [PostLikeService],
  exports: [PostLikeService],
})
export class PostLikeModule {}
