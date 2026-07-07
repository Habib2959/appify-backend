import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateReplyDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500, { message: 'Content must be at most 500 characters long' })
  content!: string;
}
