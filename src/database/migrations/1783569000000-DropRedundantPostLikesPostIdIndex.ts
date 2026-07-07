import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropRedundantPostLikesPostIdIndex1783569000000
  implements MigrationInterface
{
  name = 'DropRedundantPostLikesPostIdIndex1783569000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_post_likes_post_id"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX "IDX_post_likes_post_id" ON "post_likes" ("postId")`,
    );
  }
}
