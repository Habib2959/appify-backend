import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../user/auth.guard';
import type { AuthenticatedRequest } from '../user/auth.guard';
import { FeedService } from './feed.service';
import { CreatePostDto } from './dto/create-post.dto';
import { GetFeedDto } from './dto/get-feed.dto';

@UseGuards(AuthGuard)
@Controller('feed')
export class FeedController {
  constructor(private readonly feedService: FeedService) {}

  @Post('posts')
  createPost(@Req() request: AuthenticatedRequest, @Body() dto: CreatePostDto) {
    return this.feedService.createPost(request.user.id, dto);
  }

  @Get()
  getFeed(@Req() request: AuthenticatedRequest, @Query() query: GetFeedDto) {
    return this.feedService.getFeed(request.user.id, query);
  }
}
