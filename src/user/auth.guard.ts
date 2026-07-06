import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthTokenService } from './auth-token.service';
import { User } from './user.entity';
import { UserService } from './user.service';

export type AuthenticatedRequest = Request & {
  user: User;
  cookies?: Record<string, string>;
};

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly authTokenService: AuthTokenService,
    private readonly userService: UserService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.extractAccessToken(request);
    const payload = await this.authTokenService.verifyAccessToken(token);
    const user = await this.userService.findById(payload.sub);

    if (!user) {
      throw new UnauthorizedException('User no longer exists');
    }

    request.user = user;
    return true;
  }

  private extractAccessToken(request: AuthenticatedRequest): string {
    const cookies = request.cookies as Record<string, string> | undefined;
    const cookieToken = cookies?.access_token;

    if (cookieToken) {
      return cookieToken;
    }

    const authorization = request.headers.authorization;

    if (!authorization) {
      throw new UnauthorizedException('Missing authentication token');
    }

    const [scheme, token] = authorization.split(' ');

    if (scheme !== 'Bearer' || !token) {
      throw new UnauthorizedException(
        'Authorization header must use Bearer token',
      );
    }

    return token;
  }
}
