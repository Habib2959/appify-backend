import 'dotenv/config';
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Post } from '../feed/post.entity';
import { PostLike } from '../postLike/post-like.entity';
import { User } from '../user/user.entity';

const dataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
  entities: [User, Post, PostLike],
  migrations: ['src/database/migrations/*.ts'],
  synchronize: false,
});

export default dataSource;
