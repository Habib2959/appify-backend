import {
  Body,
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
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CreateReplyDto } from './dto/create-reply.dto';
import { GetCommentLikersDto } from './dto/get-comment-likers.dto';
import { GetCommentsDto } from './dto/get-comments.dto';

@UseGuards(AuthGuard)
@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post()
  createComment(
    @Req() request: AuthenticatedRequest,
    @Body() dto: CreateCommentDto,
  ) {
    return this.commentsService.createComment(request.user.id, dto);
  }

  @Post(':parentCommentId/replies')
  createReply(
    @Req() request: AuthenticatedRequest,
    @Param('parentCommentId') parentCommentId: string,
    @Body() dto: CreateReplyDto,
  ) {
    return this.commentsService.createReply(
      request.user.id,
      parentCommentId,
      dto,
    );
  }

  @Get('posts/:postId')
  getPostComments(
    @Req() request: AuthenticatedRequest,
    @Param('postId') postId: string,
    @Query() query: GetCommentsDto,
  ) {
    return this.commentsService.getPostComments(request.user.id, postId, query);
  }

  @Get(':commentId/replies')
  getReplies(
    @Req() request: AuthenticatedRequest,
    @Param('commentId') commentId: string,
    @Query() query: GetCommentsDto,
  ) {
    return this.commentsService.getReplies(request.user.id, commentId, query);
  }

  @Post(':commentId/like')
  likeComment(
    @Req() request: AuthenticatedRequest,
    @Param('commentId') commentId: string,
  ) {
    return this.commentsService.likeComment(request.user.id, commentId);
  }

  @Delete(':commentId/like')
  unlikeComment(
    @Req() request: AuthenticatedRequest,
    @Param('commentId') commentId: string,
  ) {
    return this.commentsService.unlikeComment(request.user.id, commentId);
  }

  @Get(':commentId/likers')
  getCommentLikers(
    @Req() request: AuthenticatedRequest,
    @Param('commentId') commentId: string,
    @Query() query: GetCommentLikersDto,
  ) {
    return this.commentsService.getCommentLikers(
      request.user.id,
      commentId,
      query,
    );
  }
}
