import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreatePostDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500, { message: 'Content must be at most 500 characters long' })
  content!: string;

  @IsOptional()
  @IsString()
  imageUrl?: string | null;

  @IsNotEmpty()
  isPublic!: boolean;
}
