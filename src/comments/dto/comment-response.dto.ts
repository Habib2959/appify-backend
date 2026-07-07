export class CommentAuthorDto {
  id!: string;
  firstName!: string;
  lastName!: string;
}

export class CommentResponseDto {
  id!: string;
  postId!: string;
  authorId!: string;
  author!: CommentAuthorDto;
  content!: string;
  parentCommentId!: string | null;
  rootCommentId!: string | null;
  likeCount!: number;
  replyCount!: number;
  likedByMe!: boolean;
  createdAt!: Date;
  updatedAt!: Date;
}

export class PaginatedCommentsResponseDto {
  items!: CommentResponseDto[];
  pagination!: {
    offset: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}
