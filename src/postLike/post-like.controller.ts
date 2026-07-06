import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../user/auth.guard';
import type { AuthenticatedRequest } from '../user/auth.guard';
import { GetLikersDto } from './dto/get-likers.dto';
import { PostLikeService } from './post-like.service';

@UseGuards(AuthGuard)
@Controller('post-likes')
export class PostLikeController {
  constructor(private readonly postLikeService: PostLikeService) {}

  @Post('posts/:postId')
  likePost(
    @Req() request: AuthenticatedRequest,
    @Param('postId') postId: string,
  ) {
    return this.postLikeService.likePost(request.user.id, postId);
  }

  @Delete('posts/:postId')
  unlikePost(
    @Req() request: AuthenticatedRequest,
    @Param('postId') postId: string,
  ) {
    return this.postLikeService.unlikePost(request.user.id, postId);
  }

  @Get('posts/:postId/likers')
  getLikers(
    @Req() request: AuthenticatedRequest,
    @Param('postId') postId: string,
    @Query() query: GetLikersDto,
  ) {
    return this.postLikeService.getLikers(request.user.id, postId, query);
  }
}
