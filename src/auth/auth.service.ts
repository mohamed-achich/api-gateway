import { Injectable, UnauthorizedException, ConflictException, Inject, OnModuleInit, InternalServerErrorException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RedisService } from './services/redis.service';
import { ConfigService } from '@nestjs/config';
import { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { TokenPayload, Tokens } from './interfaces/token.interface';
import { UsersServiceClient, CreateUserRequest, User } from '../protos/users';
import { status } from '@grpc/grpc-js';
import { RpcException } from '@nestjs/microservices';

@Injectable()
export class AuthService implements OnModuleInit {
  private usersService: UsersServiceClient;

  constructor(
    private jwtService: JwtService,
    private redisService: RedisService,
    private configService: ConfigService,
    @Inject('USERS_SERVICE') private usersClient: ClientGrpc
  ) {}

  onModuleInit() {
    console.log('Initializing Users Service client...');
    this.usersService = this.usersClient.getService<UsersServiceClient>('UsersService');
    console.log('Users Service client initialized');
  }

  async validateUser(username: string, password: string): Promise<any> {
    try {
      if (!this.usersService) {
        throw new InternalServerErrorException('Users service not initialized');
      }
      
      const response = await firstValueFrom(
        this.usersService.validateCredentials({ username, password })
      );
      
      if (response.isValid) {
        return response.user;
      }
      return null;
    } catch (error) {
      if (error.code === status.UNAVAILABLE) {
        throw new InternalServerErrorException('Users service is unavailable');
      }
      throw new RpcException(error);
    }
  }

  async register(createUserDto: CreateUserRequest): Promise<Tokens> {
    try {
      if (!this.usersService) {
        throw new InternalServerErrorException('Users service not initialized');
      }

      const user = await firstValueFrom(
        this.usersService.create(createUserDto)
      );

      const tokens = await this.generateTokens(user);
      await this.redisService.saveRefreshToken(user.id, tokens.refresh_token);
      return tokens;
    } catch (error) {
      if (error.code === status.ALREADY_EXISTS) {
        throw new RpcException(error);
      }
      if (error.code === status.UNAVAILABLE) {
        throw new InternalServerErrorException('Users service is unavailable');
      }
      throw new RpcException(error);
    }
  }

  async login(user: User): Promise<Tokens> {
    try {
      const tokens = await this.generateTokens(user);
      await this.redisService.saveRefreshToken(user.id, tokens.refresh_token);
      return tokens;
    } catch (error) {
      throw new RpcException(error);
    }
  }

  private async generateTokens(user: User): Promise<Tokens> {
    const payload: TokenPayload = { username: user.username, sub: user.id };
    
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        expiresIn: '15m',
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
      }),
      this.jwtService.signAsync(payload, {
        expiresIn: '7d',
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      }),
    ]);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }

  async refreshTokens(refreshToken: string): Promise<Tokens> {
    try {
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      const storedToken = await this.redisService.getRefreshToken(payload.sub);
      if (!storedToken || storedToken !== refreshToken) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const user = await firstValueFrom(
        this.usersService.findOne({ id: payload.sub })
      );

      const tokens = await this.generateTokens(user);
      await this.redisService.saveRefreshToken(user.id, tokens.refresh_token);
      return tokens;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new RpcException(error);
    }
  }

  async logout(userId: string): Promise<void> {
    try {
      await this.redisService.removeRefreshToken(userId);
    } catch (error) {
      throw new RpcException(error);
    }
  }
}
