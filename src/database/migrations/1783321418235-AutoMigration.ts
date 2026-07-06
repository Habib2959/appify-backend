import { MigrationInterface, QueryRunner } from "typeorm";

export class AutoMigration1783321418235 implements MigrationInterface {
    name = 'AutoMigration1783321418235'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_users_email"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "refreshTokenHash" character varying(255)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "refreshTokenHash"`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_users_email" ON "users" USING btree ("email") `);
    }

}
