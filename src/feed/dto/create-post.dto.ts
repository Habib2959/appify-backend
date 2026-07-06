import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePostMediaDto {
  @IsString()
  @MaxLength(500)
  url!: string;

  @IsIn(['image', 'video'])
  type!: 'image' | 'video';
}

export class CreatePostDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500, { message: 'Content must be at most 500 characters long' })
  content!: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @ValidateNested({ each: true })
  @Type(() => CreatePostMediaDto)
  media?: CreatePostMediaDto[];

  @IsNotEmpty()
  @IsBoolean()
  isPublic!: boolean;
}
