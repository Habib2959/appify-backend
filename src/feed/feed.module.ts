import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostLike } from '../postLike/post-like.entity';
import { UserModule } from '../user/user.module';
import { Post } from './post.entity';
import { FeedController } from './feed.controller';
import { FeedService } from './feed.service';

@Module({
  imports: [TypeOrmModule.forFeature([Post, PostLike]), UserModule],
  controllers: [FeedController],
  providers: [FeedService],
})
export class FeedModule {}
