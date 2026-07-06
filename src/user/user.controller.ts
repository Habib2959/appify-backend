import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from './auth.guard';
import type { AuthenticatedRequest } from './auth.guard';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { UserService } from './user.service';

type CookieRequest = Request & {
  cookies?: Record<string, string>;
};

@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly configService: ConfigService,
  ) {}

  @Post('register')
  async register(
    @Body() createUserDto: CreateUserDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const authResponse = await this.userService.register(createUserDto);
    this.setAuthCookies(
      response,
      authResponse.accessToken,
      authResponse.refreshToken,
    );
    return { user: authResponse.user };
  }

  @Post('login')
  async login(
    @Body() loginUserDto: LoginUserDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const authResponse = await this.userService.login(loginUserDto);
    this.setAuthCookies(
      response,
      authResponse.accessToken,
      authResponse.refreshToken,
    );
    return { user: authResponse.user };
  }

  @Post('refresh')
  async refresh(
    @Req() request: CookieRequest,
    @Res({ passthrough: true }) response: Response,
  ) {
    const cookies = request.cookies as Record<string, string> | undefined;
    const refreshToken = cookies?.refresh_token;

    if (!refreshToken) {
      throw new UnauthorizedException('Missing refresh token cookie');
    }

    const authResponse = await this.userService.refresh(refreshToken);
    this.setAuthCookies(
      response,
      authResponse.accessToken,
      authResponse.refreshToken,
    );
    return { user: authResponse.user };
  }

  @UseGuards(AuthGuard)
  @Post('logout')
  async logout(
    @Req() request: AuthenticatedRequest,
    @Res({ passthrough: true }) response: Response,
  ) {
    this.clearAuthCookies(response);
    return this.userService.logout(request.user.id);
  }

  @UseGuards(AuthGuard)
  @Get('me')
  getMe(@Req() request: AuthenticatedRequest) {
    return this.userService.toUserResponseDto(request.user);
  }

  private setAuthCookies(
    response: Response,
    accessToken: string,
    refreshToken: string,
  ) {
    response.cookie('access_token', accessToken, {
      ...this.getBaseCookieOptions(),
      maxAge: this.getAccessTokenMaxAge(),
    });
    response.cookie('refresh_token', refreshToken, {
      ...this.getBaseCookieOptions(),
      maxAge: this.getRefreshTokenMaxAge(),
    });
  }

  private clearAuthCookies(response: Response) {
    const options = this.getBaseCookieOptions();
    response.clearCookie('access_token', options);
    response.clearCookie('refresh_token', options);
  }

  private getBaseCookieOptions() {
    const isProduction =
      this.configService.get<string>('NODE_ENV') === 'production';

    return {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax' as const,
      path: '/',
    };
  }

  private getAccessTokenMaxAge(): number {
    const expiresInSeconds = Number(
      this.configService.get<string>('JWT_EXPIRES_IN_SECONDS') ?? '3600',
    );
    return expiresInSeconds * 1000;
  }

  private getRefreshTokenMaxAge(): number {
    const expiresInSeconds = Number(
      this.configService.get<string>('JWT_REFRESH_EXPIRES_IN_SECONDS') ??
        String(60 * 60 * 24 * 7),
    );
    return expiresInSeconds * 1000;
  }
}
