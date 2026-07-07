import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPostLikeCountAndIndexes1783565000000
  implements MigrationInterface
{
  name = 'AddPostLikeCountAndIndexes1783565000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "post" ADD "likeCount" integer NOT NULL DEFAULT 0`,
    );
    await queryRunner.query(`
      UPDATE "post"
      SET "likeCount" = counts."likeCount"
      FROM (
        SELECT "postId", COUNT(*)::int AS "likeCount"
        FROM "post_likes"
        GROUP BY "postId"
      ) AS counts
      WHERE "post"."id" = counts."postId"
    `);
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

  public async down(queryRunner: QueryRunner): Promise<void> {
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
    await queryRunner.query(`ALTER TABLE "post" DROP COLUMN "likeCount"`);
  }
}
