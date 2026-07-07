import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCommentsTables1783572000000 implements MigrationInterface {
  name = 'CreateCommentsTables1783572000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "comments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "postId" uuid NOT NULL, "authorId" uuid NOT NULL, "content" text NOT NULL, "parentCommentId" uuid, "rootCommentId" uuid, "likeCount" integer NOT NULL DEFAULT '0', "replyCount" integer NOT NULL DEFAULT '0', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_5a7a02c20412299d198e097a8fe" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_58d2f0f9407fd15e54f8485155" ON "comments" ("postId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_6e3b8f7bb1c76952c55ae7d4ce" ON "comments" ("authorId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_2dbf81f4acc14d8f78411fdb4d" ON "comments" ("parentCommentId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_cb335d4fb13dc505a568b8d055" ON "comments" ("rootCommentId") `,
    );
    await queryRunner.query(
      `CREATE TABLE "comment_likes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "commentId" uuid NOT NULL, "userId" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_08657c3b09a9f6b29185fdbf8c4" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_7a7e6a183336400cd6f75fdf24" ON "comment_likes" ("commentId", "userId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ee4408f642f0d7f0e0a77f24ff" ON "comment_likes" ("userId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "comments" ADD CONSTRAINT "FK_e44ddaaa53c9eccc4ddafe4ef8b" FOREIGN KEY ("postId") REFERENCES "post"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "comments" ADD CONSTRAINT "FK_7b4ee7e7db1d71febb59f9b06c8" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "comments" ADD CONSTRAINT "FK_dd4c0ff57e2f62ec210f920814b" FOREIGN KEY ("parentCommentId") REFERENCES "comments"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "comments" ADD CONSTRAINT "FK_67d86fbdc3814f3ce7ef5cb0ee9" FOREIGN KEY ("rootCommentId") REFERENCES "comments"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "comment_likes" ADD CONSTRAINT "FK_59a9b08183ae0a6f6ec2c31b8d6" FOREIGN KEY ("commentId") REFERENCES "comments"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "comment_likes" ADD CONSTRAINT "FK_e6c9629775a4c87712a46fdb22d" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "comment_likes" DROP CONSTRAINT "FK_e6c9629775a4c87712a46fdb22d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "comment_likes" DROP CONSTRAINT "FK_59a9b08183ae0a6f6ec2c31b8d6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "comments" DROP CONSTRAINT "FK_67d86fbdc3814f3ce7ef5cb0ee9"`,
    );
    await queryRunner.query(
      `ALTER TABLE "comments" DROP CONSTRAINT "FK_dd4c0ff57e2f62ec210f920814b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "comments" DROP CONSTRAINT "FK_7b4ee7e7db1d71febb59f9b06c8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "comments" DROP CONSTRAINT "FK_e44ddaaa53c9eccc4ddafe4ef8b"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_ee4408f642f0d7f0e0a77f24ff"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_7a7e6a183336400cd6f75fdf24"`);
    await queryRunner.query(`DROP TABLE "comment_likes"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_cb335d4fb13dc505a568b8d055"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_2dbf81f4acc14d8f78411fdb4d"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_6e3b8f7bb1c76952c55ae7d4ce"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_58d2f0f9407fd15e54f8485155"`);
    await queryRunner.query(`DROP TABLE "comments"`);
  }
}
