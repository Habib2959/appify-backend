export class FeedAuthorDto {
  id!: string;
  firstName!: string;
  lastName!: string;
}

export class FeedPostResponseDto {
  id!: string;
  authorId!: string;
  author!: FeedAuthorDto;
  content!: string;
  media!: Array<{ url: string; type: 'image' | 'video' }> | null;
  isPublic!: boolean;
  likeCount!: number;
  commentCount!: number;
  likedByMe!: boolean;
  createdAt!: Date;
  updatedAt!: Date;
}
