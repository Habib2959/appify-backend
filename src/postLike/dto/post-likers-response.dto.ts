export class PostLikerDto {
  id!: string;
  firstName!: string;
  lastName!: string;
}

export class PostLikersResponseDto {
  items!: PostLikerDto[];
  pagination!: {
    offset: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}
