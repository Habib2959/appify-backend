export class CommentLikerDto {
  id!: string;
  firstName!: string;
  lastName!: string;
}

export class CommentLikersResponseDto {
  items!: CommentLikerDto[];
  pagination!: {
    offset: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}
