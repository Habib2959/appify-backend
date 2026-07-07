import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPostCommentCount1783575000000 implements MigrationInterface {
  name = 'AddPostCommentCount1783575000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "post" ADD "commentCount" integer NOT NULL DEFAULT 0`,
    );
    await queryRunner.query(`
      UPDATE "post"
      SET "commentCount" = counts."commentCount"
      FROM (
        SELECT "postId", COUNT(*)::int AS "commentCount"
        FROM "comments"
        WHERE "parentCommentId" IS NULL
        GROUP BY "postId"
      ) AS counts
      WHERE "post"."id" = counts."postId"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "post" DROP COLUMN "commentCount"`);
  }
}
