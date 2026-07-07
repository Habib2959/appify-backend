import { MigrationInterface, QueryRunner } from 'typeorm';

export class ReplaceCreatedAtIndexes1783568000000
  implements MigrationInterface
{
  name = 'ReplaceCreatedAtIndexes1783568000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_post_likes_user_id_created_at"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_post_likes_post_id_created_at"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_post_author_id_created_at"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_post_is_public_created_at"`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_post_is_public" ON "post" ("isPublic")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_post_author_id" ON "post" ("authorId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_post_likes_post_id" ON "post_likes" ("postId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_post_likes_user_id" ON "post_likes" ("userId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_post_likes_user_id"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_post_likes_post_id"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_post_author_id"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_post_is_public"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_post_is_public_created_at" ON "post" ("isPublic", "createdAt")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_post_author_id_created_at" ON "post" ("authorId", "createdAt")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_post_likes_post_id_created_at" ON "post_likes" ("postId", "createdAt")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_post_likes_user_id_created_at" ON "post_likes" ("userId", "createdAt")`,
    );
  }
}
