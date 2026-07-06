import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { User } from './user.entity';

export type AuthTokenPayload = {
  sub: string;
  email: string;
  type: 'access' | 'refresh';
};

@Injectable()
export class AuthTokenService {
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  async generateTokenPair(user: User) {
    const payloadBase = {
      sub: user.id,
      email: user.email,
    };

    const accessToken = await this.jwtService.signAsync(
      { ...payloadBase, type: 'access' },
      {
        secret: this.getAccessSecret(),
        expiresIn: this.getAccessExpiresIn(),
      },
    );

    const refreshToken = await this.jwtService.signAsync(
      { ...payloadBase, type: 'refresh' },
      {
        secret: this.getRefreshSecret(),
        expiresIn: this.getRefreshExpiresIn(),
      },
    );

    return {
      accessToken,
      refreshToken,
    };
  }

  async verifyAccessToken(token: string): Promise<AuthTokenPayload> {
    return this.verifyToken(token, 'access', this.getAccessSecret());
  }

  async verifyRefreshToken(token: string): Promise<AuthTokenPayload> {
    return this.verifyToken(token, 'refresh', this.getRefreshSecret());
  }

  hashToken(token: string): string {
    const salt = randomBytes(16).toString('hex');
    const hash = scryptSync(token, salt, 64).toString('hex');
    return `${salt}:${hash}`;
  }

  verifyHashedToken(token: string, tokenHash: string | null): boolean {
    if (!tokenHash) {
      return false;
    }

    const [salt, storedHash] = tokenHash.split(':');

    if (!salt || !storedHash) {
      return false;
    }

    const computedHash = scryptSync(token, salt, 64);
    const storedHashBuffer = Buffer.from(storedHash, 'hex');

    if (computedHash.length !== storedHashBuffer.length) {
      return false;
    }

    return timingSafeEqual(computedHash, storedHashBuffer);
  }

  private async verifyToken(
    token: string,
    expectedType: AuthTokenPayload['type'],
    secret: string,
  ): Promise<AuthTokenPayload> {
    try {
      const payload = await this.jwtService.verifyAsync<AuthTokenPayload>(
        token,
        {
          secret,
        },
      );

      if (payload.type !== expectedType) {
        throw new UnauthorizedException('Invalid token type');
      }

      return payload;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  private getAccessSecret(): string {
    return this.configService.get<string>('JWT_SECRET') ?? 'appifySEcret1234';
  }

  private getRefreshSecret(): string {
    return (
      this.configService.get<string>('JWT_REFRESH_SECRET') ??
      this.configService.get<string>('JWT_SECRET') ??
      'appifyRefreshSecret1234'
    );
  }

  private getAccessExpiresIn(): number {
    return Number(
      this.configService.get<string>('JWT_EXPIRES_IN_SECONDS') ?? '3600',
    );
  }

  private getRefreshExpiresIn(): number {
    return Number(
      this.configService.get<string>('JWT_REFRESH_EXPIRES_IN_SECONDS') ??
        String(60 * 60 * 24 * 7),
    );
  }
}
