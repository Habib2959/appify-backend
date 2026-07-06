import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { Repository } from 'typeorm';
import { AuthTokenService } from './auth-token.service';
import { AuthResponseDto } from './dto/auth-response.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { User } from './user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly authTokenService: AuthTokenService,
  ) {}

  async register(createUserDto: CreateUserDto): Promise<AuthResponseDto> {
    const firstName = createUserDto.firstName.trim();
    const lastName = createUserDto.lastName.trim();
    const email = createUserDto.email.trim().toLowerCase();

    const existingUser = await this.userRepository.findOne({
      where: { email },
    });
    if (existingUser) {
      throw new ConflictException('Email is already registered');
    }

    const user = this.userRepository.create({
      firstName,
      lastName,
      email,
      passwordHash: this.hashPassword(createUserDto.password),
      refreshTokenHash: null,
    });

    const savedUser = await this.userRepository.save(user);

    return this.issueTokens(savedUser);
  }

  async login(loginUserDto: LoginUserDto): Promise<AuthResponseDto> {
    const email = loginUserDto.email.trim().toLowerCase();
    const user = await this.userRepository.findOne({ where: { email } });

    if (
      !user ||
      !this.verifyPassword(loginUserDto.password, user.passwordHash)
    ) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return this.issueTokens(user);
  }

  async refresh(refreshToken: string): Promise<AuthResponseDto> {
    const payload =
      await this.authTokenService.verifyRefreshToken(refreshToken);
    const user = await this.userRepository.findOne({
      where: { id: payload.sub },
    });

    if (
      !user ||
      !this.authTokenService.verifyHashedToken(
        refreshToken,
        user.refreshTokenHash,
      )
    ) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    return this.issueTokens(user);
  }

  async logout(userId: string): Promise<{ success: true }> {
    await this.userRepository.update(
      { id: userId },
      { refreshTokenHash: null },
    );
    return { success: true };
  }

  async findById(id: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  toUserResponseDto(user: User): UserResponseDto {
    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  private async issueTokens(user: User): Promise<AuthResponseDto> {
    const { accessToken, refreshToken } =
      await this.authTokenService.generateTokenPair(user);

    await this.userRepository.update(
      { id: user.id },
      { refreshTokenHash: this.authTokenService.hashToken(refreshToken) },
    );

    const freshUser = await this.userRepository.findOneOrFail({
      where: { id: user.id },
    });

    return {
      user: this.toUserResponseDto(freshUser),
      accessToken,
      refreshToken,
    };
  }

  private hashPassword(password: string): string {
    const salt = randomBytes(16).toString('hex');
    const hash = scryptSync(password, salt, 64).toString('hex');
    return `${salt}:${hash}`;
  }

  private verifyPassword(password: string, passwordHash: string): boolean {
    const [salt, storedHash] = passwordHash.split(':');

    if (!salt || !storedHash) {
      return false;
    }

    const computedHash = scryptSync(password, salt, 64);
    const storedHashBuffer = Buffer.from(storedHash, 'hex');

    if (computedHash.length !== storedHashBuffer.length) {
      return false;
    }

    return timingSafeEqual(computedHash, storedHashBuffer);
  }
}
